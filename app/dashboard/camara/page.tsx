import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HubCaptura from './components/HubCaptura'

export default async function CamaraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', user.id)
    .single()
  const empresaId = perfil?.empresa_id as string

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
