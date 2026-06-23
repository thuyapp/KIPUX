'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConteoProductos from './components/ConteoProductos'
import { ClipboardList, LogOut } from 'lucide-react'

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

type Estado = 'cargando' | 'sin_auditoria' | 'sin_items' | 'listo'

export default function AuditoriaWorkerPage() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [auditoria, setAuditoria] = useState<AuditoriaActivaTrabajador | null>(null)
  const [items, setItems] = useState<AuditoriaItemTrabajador[]>([])
  const [userId, setUserId] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, rol, empresa_id')
        .eq('id', user.id)
        .single()
      if (!perfil || perfil.rol !== 'trabajador') { router.push('/login'); return }

      setUserId(user.id)
      setEmpresaId(perfil.empresa_id as string)

      const { data: auditoriaActiva } = await supabase
        .from('auditorias')
        .select('id, fecha_inicio, notas')
        .eq('empresa_id', perfil.empresa_id)
        .eq('estado', 'en_proceso')
        .maybeSingle()

      if (!auditoriaActiva) {
        setEstado('sin_auditoria')
        return
      }

      setAuditoria(auditoriaActiva as AuditoriaActivaTrabajador)

      const { data: itemsRaw } = await supabase
        .from('auditoria_items')
        .select(`
          id, auditoria_id, producto_id, conteo_fisico, estado, fecha_conteo,
          productos ( nombre, foto_url, categorias ( nombre ) )
        `)
        .eq('auditoria_id', auditoriaActiva.id)
        .eq('usuario_asignado', user.id)
        .order('id')

      const fetchedItems = (itemsRaw ?? []) as unknown as AuditoriaItemTrabajador[]
      setItems(fetchedItems)
      setEstado(fetchedItems.length === 0 ? 'sin_items' : 'listo')
    }
    cargar()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (estado === 'cargando') {
    return (
      <div style={{
        minHeight: '100vh', background: '#F8F6EA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#6B6B6B', fontSize: '14px' }}>Cargando...</p>
      </div>
    )
  }

  if (estado === 'sin_auditoria') {
    return (
      <div style={{
        minHeight: '100vh', background: '#F8F6EA',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '24px', left: '0', right: '0',
          display: 'flex', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#111111' }}>KIPUX</span>
        </div>

        <div style={{
          width: '80px', height: '80px', borderRadius: '20px',
          background: '#FFFFFF', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <ClipboardList size={40} color="#F4C400" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
          Sin auditorías activas
        </h2>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 8px', maxWidth: '320px', lineHeight: 1.6 }}>
          Tu administrador iniciará el conteo cuando sea necesario.
        </p>
        <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0' }}>
          Mantente atento.
        </p>

        <button onClick={handleLogout} style={{
          marginTop: '48px', display: 'flex', alignItems: 'center', gap: '8px',
          background: 'transparent', border: '1px solid #E8E8E8',
          borderRadius: '999px', padding: '10px 20px',
          fontSize: '13px', color: '#6B6B6B', cursor: 'pointer',
        }}>
          <LogOut size={14} color="#6B6B6B" />
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (estado === 'sin_items') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 56px)',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 10px' }}>
          Sin productos asignados
        </h1>
        <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: '1.6', maxWidth: '300px', margin: 0 }}>
          Hay una auditoría activa pero aún no tienes productos asignados. Espera a que el administrador distribuya el trabajo.
        </p>
      </div>
    )
  }

  if (!auditoria) return null

  return (
    <ConteoProductos
      auditoria={auditoria}
      items={items}
      userId={userId}
      empresaId={empresaId}
    />
  )
}
