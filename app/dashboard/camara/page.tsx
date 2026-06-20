import { getSession } from '@/lib/supabase/session'
import HubCaptura from './components/HubCaptura'

export default async function CamaraPage() {
  const { supabase, empresaId } = await getSession()

  const { data: almacenes } = await supabase
    .from('almacenes')
    .select('id, nombre, es_default')
    .eq('empresa_id', empresaId)
    .eq('activo', true)
    .order('es_default', { ascending: false })
    .order('nombre')

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6EA' }}>
      <HubCaptura empresaId={empresaId} almacenes={almacenes ?? []} />
    </div>
  )
}
