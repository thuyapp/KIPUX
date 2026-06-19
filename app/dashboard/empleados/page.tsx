import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import EmpleadosList from './components/EmpleadosList'

export type Empleado = {
  id: string
  nombre: string
  rol: 'admin' | 'trabajador'
  activo: boolean
  almacen_id: string | null
  almacenes: { nombre: string } | null
  email: string
}

export type AlmacenRef = { id: string; nombre: string }

export default async function EmpleadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol, empresa_id')
    .eq('id', user.id)
    .single()
  if (!perfil) redirect('/login')
  if (perfil.rol !== 'admin') redirect('/dashboard')

  const empresaId = perfil.empresa_id as string

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  const [
    { data: empleadosRaw },
    { data: almacenesRaw },
    authResult,
  ] = await Promise.all([
    supabase
      .from('perfiles')
      .select('id, nombre, rol, activo, almacen_id, almacenes ( nombre )')
      .eq('empresa_id', empresaId)
      .order('nombre'),
    supabase
      .from('almacenes')
      .select('id, nombre')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre'),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap: Record<string, string> = {}
  for (const u of authResult.data?.users ?? []) {
    emailMap[u.id] = u.email ?? ''
  }

  const empleados: Empleado[] = ((empleadosRaw ?? []) as unknown as Omit<Empleado, 'email'>[]).map(e => ({
    ...e,
    email: emailMap[e.id] ?? '',
  }))

  return (
    <EmpleadosList
      empleados={empleados}
      almacenes={(almacenesRaw ?? []) as AlmacenRef[]}
      empresaId={empresaId}
      currentUserId={user.id}
    />
  )
}
