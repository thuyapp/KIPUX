import { getSession } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import ProductList from '@/app/dashboard/components/ProductList'
import type { Producto } from '@/app/dashboard/components/ProductList'

type Movimiento = { tipo: string; cantidad: number; created_at: string }

type StockRow = {
  stock_actual: number
  productos: {
    id: string; nombre: string; sku?: string | null; foto_url: string | null
    stock_minimo: number; unidad: string; costo_usd: number; activo: boolean
    categorias: { nombre: string; color: string | null; icono: string | null } | null
    movimientos: Movimiento[] | null
  } | null
}

function latestMovimiento(movs: Movimiento[] | null | undefined): Movimiento | null {
  if (!movs?.length) return null
  return [...movs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ almacen?: string; estado?: string; panel?: string }>
}) {
  const { supabase, empresaId, nombre, rol } = await getSession()
  if (rol === 'trabajador') redirect('/auditoria')

  const { almacen: almacenFiltro, estado, panel } = await searchParams

  if (almacenFiltro) {
    const [{ data: stockRaw }, { data: almacenInfo }] = await Promise.all([
      supabase
        .from('stock_por_almacen')
        .select(`
          stock_actual,
          productos (
            id, nombre, sku, foto_url, stock_minimo, unidad, costo_usd, activo,
            categorias ( nombre, color, icono ),
            movimientos ( tipo, cantidad, created_at )
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
        ultimoMovimiento: latestMovimiento(row.productos?.movimientos),
      })) as unknown as Producto[]

    const valorTotal = productos.reduce((sum, p) => sum + p.costo_usd * p.stock_actual, 0)
    const stockBajoCount = productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
    const agotadosCount = productos.filter(p => p.stock_actual === 0).length

    return (
      <ProductList
        productos={productos}
        almacenDefault={almacenInfo ?? null}
        nombreUsuario={nombre ?? 'Admin'}
        almacenFiltro={almacenFiltro}
        almacenNombreFiltro={almacenInfo?.nombre}
        filtroEstadoInicial={estado}
        panelAbierto={panel === 'true'}
        kpis={{ valorTotal, stockBajoCount, agotadosCount, nuevosEstaSemana: 0 }}
      />
    )
  }

  const inicioSemana = new Date()
  inicioSemana.setDate(inicioSemana.getDate() - 7)
  inicioSemana.setHours(0, 0, 0, 0)

  const [{ data: productosRaw }, { data: almacenDefault }, { count: nuevosEstaSemana }] =
    await Promise.all([
      supabase
        .from('productos')
        .select(`
          id, nombre, sku, unidad, stock_actual, stock_minimo, costo_usd, foto_url, activo,
          categorias ( nombre, color, icono ),
          movimientos ( tipo, cantidad, created_at )
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
      supabase
        .from('productos')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .gte('created_at', inicioSemana.toISOString()),
    ])

  const productos = ((productosRaw ?? []) as any[]).map(p => ({
    ...p,
    ultimoMovimiento: latestMovimiento(p.movimientos as Movimiento[]),
  })) as unknown as Producto[]

  const valorTotal = productos.reduce((sum, p) => sum + p.costo_usd * p.stock_actual, 0)
  const stockBajoCount = productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
  const agotadosCount = productos.filter(p => p.stock_actual === 0).length

  return (
    <ProductList
      productos={productos}
      almacenDefault={almacenDefault ?? null}
      nombreUsuario={nombre ?? 'Admin'}
      filtroEstadoInicial={estado}
      panelAbierto={panel === 'true'}
      kpis={{ valorTotal, stockBajoCount, agotadosCount, nuevosEstaSemana: nuevosEstaSemana ?? 0 }}
    />
  )
}
