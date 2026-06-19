import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditoriaAdminPanel from './components/AuditoriaAdminPanel'

export type Auditoria = {
  id: string
  estado: 'en_proceso' | 'finalizada' | 'cancelada'
  alcance: 'todo' | 'categoria' | 'almacen'
  almacen_id: string | null
  categoria_id: string | null
  notas: string | null
  fecha_inicio: string
  fecha_fin: string | null
  creada_por: string
  ajustes_aplicados: boolean
}

export type EmpleadoRef = {
  id: string
  nombre: string
  almacenes: { nombre: string } | null
}

export type CategoriaRef = {
  id: string
  nombre: string
  icono: string
}

export type AlmacenRef = {
  id: string
  nombre: string
}

export default async function AuditoriaAdminPage() {
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

  const [
    { data: empleadosRaw },
    { data: categoriasRaw },
    { data: almacenesRaw },
    { data: auditoriaActivaRaw },
  ] = await Promise.all([
    supabase
      .from('perfiles')
      .select('id, nombre, almacenes(nombre)')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .eq('rol', 'trabajador')
      .order('nombre'),
    supabase
      .from('categorias')
      .select('id, nombre, icono')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('almacenes')
      .select('id, nombre')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('auditorias')
      .select('id, estado, alcance, almacen_id, categoria_id, notas, fecha_inicio, fecha_fin, creada_por, ajustes_aplicados')
      .eq('empresa_id', empresaId)
      .eq('estado', 'en_proceso')
      .maybeSingle(),
  ])

  return (
    <AuditoriaAdminPanel
      empresaId={empresaId}
      userId={user.id}
      empleados={(empleadosRaw ?? []) as unknown as EmpleadoRef[]}
      categorias={(categoriasRaw ?? []) as CategoriaRef[]}
      almacenes={(almacenesRaw ?? []) as AlmacenRef[]}
      auditoriaActiva={auditoriaActivaRaw as Auditoria | null}
    />
  )
}
