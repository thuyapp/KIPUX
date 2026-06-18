import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProductoForm from '../../components/ProductoForm'
import type { ProductoExistente } from '../../components/ProductoForm'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  const [{ data: categorias }, { data: almacenes }, { data: productoRaw }] = await Promise.all([
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
    supabase
      .from('productos')
      .select('id, nombre, sku, descripcion, categoria_id, unidad, stock_minimo, costo_usd, activo, foto_url')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single(),
  ])

  if (!productoRaw) notFound()

  return (
    <ProductoForm
      modo="editar"
      empresaId={empresaId}
      categorias={categorias ?? []}
      almacenes={(almacenes ?? []) as { id: string; nombre: string; es_default: boolean }[]}
      producto={productoRaw as unknown as ProductoExistente}
    />
  )
}
