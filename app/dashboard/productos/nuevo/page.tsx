import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductoForm from '../components/ProductoForm'

export default async function NuevoProductoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol, empresa_id')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const empresaId = perfil.empresa_id as string

  const [{ data: categorias }, { data: almacenes }] = await Promise.all([
    supabase
      .from('categorias')
      .select('id, nombre')
      .eq('empresa_id', empresaId)
      .order('nombre'),
    supabase
      .from('almacenes')
      .select('id, nombre, es_default')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre'),
  ])

  return (
    <ProductoForm
      modo="crear"
      empresaId={empresaId}
      categorias={categorias ?? []}
      almacenes={(almacenes ?? []) as { id: string; nombre: string; es_default: boolean }[]}
    />
  )
}
