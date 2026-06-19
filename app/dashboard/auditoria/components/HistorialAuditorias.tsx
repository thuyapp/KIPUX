'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { EmpleadoRef } from '../page'

type AuditoriaHistorial = {
  id: string
  estado: 'en_proceso' | 'finalizada' | 'cancelada'
  alcance: 'todo' | 'categoria' | 'almacen'
  almacen_id: string | null
  categoria_id: string | null
  fecha_inicio: string
  fecha_fin: string | null
  ajustes_aplicados: boolean
  almacenes: { nombre: string } | null
  categorias: { nombre: string } | null
  auditoria_items: {
    id: string
    estado: string
    conteo_fisico: number | null
    stock_sistema_inicial: number
    usuario_asignado: string | null
  }[]
}

type Props = {
  empresaId: string
  empleados: EmpleadoRef[]
  onNuevaAuditoria: () => void
  onVerReporte: (auditoriaId: string) => void
}

const estadoBadge: Record<string, { label: string; bg: string; color: string }> = {
  en_proceso: { label: 'En progreso', bg: '#FFF9E6', color: '#F4C400' },
  finalizada: { label: 'Finalizada', bg: '#E6FDF8', color: '#00D7A7' },
  cancelada: { label: 'Cancelada', bg: '#FFF0F0', color: '#FF4D4D' },
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function alcanceText(a: AuditoriaHistorial): string {
  if (a.alcance === 'todo') return 'Todo el inventario'
  if (a.alcance === 'categoria') return `Categoría: ${a.categorias?.nombre ?? '—'}`
  return `Almacén: ${a.almacenes?.nombre ?? '—'}`
}

export default function HistorialAuditorias({ empresaId, empleados, onNuevaAuditoria, onVerReporte }: Props) {
  const [auditorias, setAuditorias] = useState<AuditoriaHistorial[]>([])
  const [loading, setLoading] = useState(true)

  const empleadoMap = Object.fromEntries(empleados.map(e => [e.id, e]))

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('auditorias')
      .select(`
        id, estado, alcance, almacen_id, categoria_id, fecha_inicio, fecha_fin, ajustes_aplicados,
        almacenes ( nombre ),
        categorias ( nombre ),
        auditoria_items ( id, estado, conteo_fisico, stock_sistema_inicial, usuario_asignado )
      `)
      .eq('empresa_id', empresaId)
      .order('fecha_inicio', { ascending: false })
      .then(({ data }) => {
        setAuditorias((data ?? []) as unknown as AuditoriaHistorial[])
        setLoading(false)
      })
  }, [empresaId])

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#6B6B6B', fontSize: '14px' }}>
        Cargando historial...
      </div>
    )
  }

  if (auditorias.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '60px 20px', textAlign: 'center',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#F0EDD8', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '20px',
        }}>
          <ClipboardList size={36} color="#6B6B6B" />
        </div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
          No hay auditorías registradas
        </p>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 24px' }}>
          Crea la primera auditoría para comenzar el conteo de inventario.
        </p>
        <button
          onClick={onNuevaAuditoria}
          style={{
            padding: '12px 24px', borderRadius: '100px',
            background: '#F4C400', border: 'none',
            fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', color: '#111111', fontFamily: 'inherit',
          }}
        >
          Crear primera auditoría
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {auditorias.map(a => {
        const items = a.auditoria_items ?? []
        const total = items.length
        const contados = items.filter(i => i.estado === 'contado').length
        const difs = items.filter(i => i.estado === 'contado' && i.conteo_fisico !== null && i.conteo_fisico !== i.stock_sistema_inicial).length
        const badge = estadoBadge[a.estado] ?? estadoBadge.cancelada

        // Unique participants
        const participantIds = [...new Set(items.map(i => i.usuario_asignado).filter(Boolean))] as string[]

        return (
          <div
            key={a.id}
            style={{
              background: '#FFFFFF', borderRadius: '16px',
              padding: '18px 20px', border: '1px solid #E8E8E8',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Top row: fecha + estado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
                    {formatFecha(a.fecha_inicio)}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '100px',
                    background: badge.bg, color: badge.color,
                    fontSize: '12px', fontWeight: 600,
                  }}>
                    {badge.label}
                  </span>
                </div>

                {/* Alcance */}
                <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 10px' }}>
                  {alcanceText(a)}
                </p>

                {/* Participantes + stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Avatares */}
                  {participantIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {participantIds.slice(0, 4).map((uid, idx) => {
                        const emp = empleadoMap[uid]
                        const initial = emp?.nombre?.[0]?.toUpperCase() ?? '?'
                        return (
                          <div
                            key={uid}
                            title={emp?.nombre ?? uid}
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: '#F4C400', color: '#111111',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 700,
                              border: '2px solid #FFFFFF',
                              marginLeft: idx === 0 ? 0 : '-8px',
                              zIndex: 10 - idx,
                              position: 'relative',
                            }}
                          >
                            {initial}
                          </div>
                        )
                      })}
                      {participantIds.length > 4 && (
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: '#E8E8E8', color: '#6B6B6B',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 600,
                          border: '2px solid #FFFFFF', marginLeft: '-8px',
                        }}>
                          +{participantIds.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progreso */}
                  <span style={{ fontSize: '12px', color: '#6B6B6B' }}>
                    {contados}/{total} contados
                  </span>

                  {/* Diferencias (solo si finalizada) */}
                  {a.estado === 'finalizada' && (
                    <span style={{
                      fontSize: '12px', fontWeight: 600,
                      color: difs > 0 ? '#FF4D4D' : '#00D7A7',
                    }}>
                      {difs > 0 ? `${difs} diferencia${difs !== 1 ? 's' : ''}` : 'Sin diferencias'}
                    </span>
                  )}
                </div>
              </div>

              {/* Ver reporte */}
              {(a.estado === 'finalizada' || a.estado === 'cancelada') && (
                <button
                  onClick={() => onVerReporte(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                    padding: '8px 14px', borderRadius: '100px',
                    background: '#F8F6EA', border: '1px solid #E8E8E8',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    color: '#111111', fontFamily: 'inherit',
                  }}
                >
                  Ver reporte
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
