'use client'

import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Auditoria, EmpleadoRef } from '../page'

type AuditoriaItem = {
  id: string
  usuario_asignado: string | null
  estado: 'pendiente' | 'contado'
}

type Props = {
  auditoriaActiva: Auditoria | null
  empleados: EmpleadoRef[]
  onFinalizada: () => void
  onCancelada: () => void
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MonitoreoAuditoria({ auditoriaActiva, empleados, onFinalizada, onCancelada }: Props) {
  const [items, setItems] = useState<AuditoriaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const empleadoMap = Object.fromEntries(empleados.map(e => [e.id, e]))

  useEffect(() => {
    if (!auditoriaActiva) return
    const supabase = createClient()
    setLoading(true)

    supabase
      .from('auditoria_items')
      .select('id, usuario_asignado, estado')
      .eq('auditoria_id', auditoriaActiva.id)
      .then(({ data }) => {
        setItems((data ?? []) as AuditoriaItem[])
        setLoading(false)
      })

    const channel = supabase
      .channel('monitoreo-' + auditoriaActiva.id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auditoria_items',
        filter: `auditoria_id=eq.${auditoriaActiva.id}`,
      }, (payload) => {
        const updated = payload.new as AuditoriaItem
        setItems(prev => prev.map(item => item.id === updated.id ? { ...item, estado: updated.estado } : item))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [auditoriaActiva?.id])

  if (!auditoriaActiva) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '60px 20px', textAlign: 'center',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#F0EDD8', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '16px',
        }}>
          <Activity size={30} color="#6B6B6B" />
        </div>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 6px' }}>
          No hay auditoría activa
        </p>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
          Crea una nueva auditoría desde el tab &quot;Nueva auditoría&quot;.
        </p>
      </div>
    )
  }

  // Group items by usuario_asignado
  const participantIds = [...new Set(items.map(i => i.usuario_asignado).filter(Boolean))] as string[]
  const totalItems = items.length
  const totalContados = items.filter(i => i.estado === 'contado').length
  const progressPct = totalItems > 0 ? Math.round((totalContados / totalItems) * 100) : 0
  const todosCompletos = participantIds.every(uid => {
    const myItems = items.filter(i => i.usuario_asignado === uid)
    return myItems.length > 0 && myItems.every(i => i.estado === 'contado')
  })

  async function handleFinalizar() {
    setFinalizing(true)
    const supabase = createClient()
    await supabase
      .from('auditorias')
      .update({ estado: 'finalizada', fecha_fin: new Date().toISOString() })
      .eq('id', auditoriaActiva!.id)
    setFinalizing(false)
    onFinalizada()
  }

  async function handleCancelar() {
    setCanceling(true)
    const supabase = createClient()
    await supabase
      .from('auditorias')
      .update({ estado: 'cancelada', fecha_fin: new Date().toISOString() })
      .eq('id', auditoriaActiva!.id)
    setCanceling(false)
    setConfirmCancel(false)
    onCancelada()
  }

  return (
    <div>
      {/* Header card */}
      <div style={{
        background: '#FFFFFF', borderRadius: '16px',
        padding: '20px 24px', border: '1px solid #E8E8E8',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 2px' }}>
              Iniciada: {formatFecha(auditoriaActiva.fecha_inicio)}
            </p>
            <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, textTransform: 'capitalize' }}>
              Alcance: {auditoriaActiva.alcance === 'todo' ? 'Todo el inventario' : auditoriaActiva.alcance}
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: '100px',
            background: '#FFF9E6', color: '#F4C400',
            fontSize: '12px', fontWeight: 600,
          }}>
            En progreso
          </span>
        </div>

        {/* Barra de progreso general */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>Progreso general</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111111' }}>
              {totalContados}/{totalItems} ({progressPct}%)
            </span>
          </div>
          <div style={{ height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              background: progressPct === 100 ? '#00D7A7' : '#F4C400',
              width: `${progressPct}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Por empleado */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6B6B6B', fontSize: '14px', padding: '20px 0' }}>Cargando...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {participantIds.map(uid => {
            const emp = empleadoMap[uid]
            const myItems = items.filter(i => i.usuario_asignado === uid)
            const myContados = myItems.filter(i => i.estado === 'contado').length
            const myTotal = myItems.length
            const myPct = myTotal > 0 ? Math.round((myContados / myTotal) * 100) : 0
            const completado = myContados === myTotal && myTotal > 0

            return (
              <div
                key={uid}
                style={{
                  background: '#FFFFFF', borderRadius: '12px',
                  padding: '14px 16px', border: '1px solid #E8E8E8',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: '#F4C400', color: '#111111',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '15px',
                  }}>
                    {emp?.nombre?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>
                      {emp?.nombre ?? uid}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                      {myContados} de {myTotal} productos
                    </p>
                  </div>
                  <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: completado ? '#00D7A7' : '#6B6B6B',
                  }}>
                    {completado ? 'Completado ✓' : `${myPct}%`}
                  </span>
                </div>
                <div style={{ height: '6px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    background: completado ? '#00D7A7' : '#F4C400',
                    width: `${myPct}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      {todosCompletos && (
        <button
          onClick={handleFinalizar}
          disabled={finalizing}
          style={{
            width: '100%', padding: '14px', borderRadius: '100px',
            background: '#111111', border: 'none',
            fontSize: '15px', fontWeight: 700,
            cursor: finalizing ? 'wait' : 'pointer', color: '#FFFFFF',
            fontFamily: 'inherit', marginBottom: '12px',
          }}
        >
          {finalizing ? 'Finalizando...' : 'Finalizar auditoría'}
        </button>
      )}

      {!confirmCancel ? (
        <button
          onClick={() => setConfirmCancel(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#FF4D4D', fontSize: '14px', fontWeight: 500,
            display: 'block', margin: '0 auto', padding: '8px',
            fontFamily: 'inherit',
          }}
        >
          Cancelar auditoría
        </button>
      ) : (
        <div style={{
          background: '#FFF0F0', border: '1px solid #FFCCCC',
          borderRadius: '12px', padding: '16px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: '#111111', margin: '0 0 12px' }}>
            ¿Cancelar la auditoría? Los datos de conteo se perderán.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => setConfirmCancel(false)}
              style={{
                padding: '9px 20px', borderRadius: '100px',
                background: '#FFFFFF', border: '1.5px solid #E8E8E8',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', color: '#111111',
              }}
            >
              No, mantener
            </button>
            <button
              onClick={handleCancelar}
              disabled={canceling}
              style={{
                padding: '9px 20px', borderRadius: '100px',
                background: '#FF4D4D', border: 'none',
                fontSize: '13px', fontWeight: 600, cursor: canceling ? 'wait' : 'pointer',
                fontFamily: 'inherit', color: '#FFFFFF',
              }}
            >
              {canceling ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
