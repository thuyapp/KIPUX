import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductList from './components/ProductList'
import type { Producto } from './components/ProductList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol, empresa_id')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (perfil.rol === 'trabajador') redirect('/auditoria')

  const empresaId = perfil.empresa_id as string

  const [{ data: productosRaw }, { data: almacenDefault }] = await Promise.all([
    supabase
      .from('productos')
      .select(`
        id, nombre, foto_url, stock_actual, stock_minimo, unidad, costo_usd,
        categorias ( nombre )
      `)
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('almacenes')
      .select('id, nombre')
      .eq('empresa_id', empresaId)
      .eq('es_default', true)
      .single(),
  ])

  return (
    <ProductList
      productos={(productosRaw ?? []) as unknown as Producto[]}
      almacenDefault={almacenDefault ?? null}
      nombreUsuario={perfil.nombre ?? 'Admin'}
    />
  )
}
