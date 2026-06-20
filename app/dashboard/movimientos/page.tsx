import { getSession } from '@/lib/supabase/session'
import MovimientosList from './components/MovimientosList'
import type { Movimiento } from './components/MovimientosList'

export default async function MovimientosPage() {
  const { supabase, empresaId } = await getSession()

  const [{ data: movimientosRaw }, { data: almacenes }] = await Promise.all([
    supabase
      .from('movimientos')
      .select(`
        id, tipo, cantidad, nota, foto_evidencia_url, created_at,
        almacen_id, almacen_destino_id,
        productos ( nombre, foto_url ),
        perfiles ( nombre ),
        almacenes!movimientos_almacen_id_fkey ( nombre ),
        almacenes_destino:almacenes!movimientos_almacen_destino_id_fkey ( nombre )
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('almacenes')
      .select('id, nombre')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre'),
  ])

  return (
    <MovimientosList
      movimientos={(movimientosRaw ?? []) as unknown as Movimiento[]}
      almacenes={almacenes ?? []}
    />
  )
}
