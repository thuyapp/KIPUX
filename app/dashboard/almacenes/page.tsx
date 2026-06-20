import { getSession } from '@/lib/supabase/session'
import AlmacenesList from './components/AlmacenesList'

export type Almacen = {
  id: string
  nombre: string
  descripcion: string | null
  ubicacion: string | null
  es_default: boolean
  activo: boolean
  created_at: string
  stock_por_almacen: {
    stock_actual: number
    productos: { costo_usd: number } | null
  }[] | null
}

export default async function AlmacenesPage() {
  const { supabase, empresaId } = await getSession()

  const { data: almacenesRaw } = await supabase
    .from('almacenes')
    .select(`
      id, nombre, descripcion, ubicacion, es_default, activo, created_at,
      stock_por_almacen (
        stock_actual,
        productos ( costo_usd )
      )
    `)
    .eq('empresa_id', empresaId)
    .order('es_default', { ascending: false })
    .order('nombre')

  return (
    <AlmacenesList
      almacenes={(almacenesRaw ?? []) as unknown as Almacen[]}
      empresaId={empresaId}
    />
  )
}
