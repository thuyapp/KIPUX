import { getSession } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import ProductList from '@/app/dashboard/components/ProductList'
import type { Producto } from '@/app/dashboard/components/ProductList'

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

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ almacen?: string }>
}) {
  const { supabase, empresaId, nombre, rol } = await getSession()
  if (rol === 'trabajador') redirect('/auditoria')

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
        nombreUsuario={nombre ?? 'Admin'}
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
      nombreUsuario={nombre ?? 'Admin'}
    />
  )
}
