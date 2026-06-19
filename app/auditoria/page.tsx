import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConteoProductos from './components/ConteoProductos'
import { Clock } from 'lucide-react'

export type AuditoriaItemTrabajador = {
  id: string
  auditoria_id: string
  producto_id: string
  conteo_fisico: number | null
  estado: 'pendiente' | 'contado'
  fecha_conteo: string | null
  productos: {
    nombre: string
    foto_url: string | null
    categorias: { nombre: string } | null
  } | null
}

export type AuditoriaActivaTrabajador = {
  id: string
  fecha_inicio: string
  notas: string | null
}

export default async function AuditoriaWorkerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol, empresa_id')
    .eq('id', user.id)
    .single()
  if (!perfil || perfil.rol !== 'trabajador') redirect('/login')

  const { data: auditoriaActiva } = await supabase
    .from('auditorias')
    .select('id, fecha_inicio, notas')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'en_proceso')
    .maybeSingle()

  if (!auditoriaActiva) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 56px)',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#F0EDD8', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '20px',
        }}>
          <Clock size={36} color="#6B6B6B" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 10px' }}>
          Esperando auditoría...
        </h1>
        <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: '1.6', maxWidth: '300px', margin: 0 }}>
          Tu administrador iniciará el conteo. Mantente atento.
        </p>
      </div>
    )
  }

  const { data: itemsRaw } = await supabase
    .from('auditoria_items')
    .select(`
      id, auditoria_id, producto_id, conteo_fisico, estado, fecha_conteo,
      productos ( nombre, foto_url, categorias ( nombre ) )
    `)
    .eq('auditoria_id', auditoriaActiva.id)
    .eq('usuario_asignado', user.id)
    .order('id')

  const items = (itemsRaw ?? []) as unknown as AuditoriaItemTrabajador[]

  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 56px)',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#F0EDD8', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '20px',
        }}>
          <Clock size={36} color="#6B6B6B" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 10px' }}>
          Sin productos asignados
        </h1>
        <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: '1.6', maxWidth: '300px', margin: 0 }}>
          Hay una auditoría activa pero aún no tienes productos asignados. Espera a que el administrador distribuya el trabajo.
        </p>
      </div>
    )
  }

  return (
    <ConteoProductos
      auditoria={auditoriaActiva as AuditoriaActivaTrabajador}
      items={items}
      userId={user.id}
    />
  )
}
