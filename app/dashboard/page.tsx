import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductList from './components/ProductList'
import type { Producto } from './components/ProductList'

type StockRow = {
  stock_actual: number
  productos: {
    id: string
    nombre: string
    foto_url: string | null
    stock_minimo: number
    unidad: string
    costo_usd: number
    activo: boolean
    categorias: { nombre: string } | null
  } | null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ almacen?: string }>
}) {
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
  const { almacen: almacenFiltro } = await searchParams

  if (almacenFiltro) {
    const [{ data: stockRaw }, { data: almacenInfo }] = await Promise.all([
      supabase
        .from('stock_por_almacen')
        .select(`
          stock_actual,
          productos (
            id, nombre, foto_url, stock_minimo, unidad, costo_usd, activo,
            categorias ( nombre )
          )
        `)
        .eq('almacen_id', almacenFiltro)
        .eq('empresa_id', empresaId),
      supabase
        .from('almacenes')
        .select('id, nombre')
        .eq('id', almacenFiltro)
        .single(),
    ])

    const productos = ((stockRaw ?? []) as unknown as StockRow[])
      .filter(row => row.productos?.activo)
      .map(row => ({
        ...row.productos!,
        stock_actual: row.stock_actual,
      })) as unknown as Producto[]

    return (
      <ProductList
        productos={productos}
        almacenDefault={almacenInfo ?? null}
        nombreUsuario={perfil.nombre ?? 'Admin'}
        almacenFiltro={almacenFiltro}
        almacenNombreFiltro={almacenInfo?.nombre}
      />
    )
  }

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
