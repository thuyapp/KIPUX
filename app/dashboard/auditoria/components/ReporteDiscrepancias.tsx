'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatFecha } from '@/lib/utils'

type AuditoriaOption = {
  id: string
  fecha_inicio: string
  estado: string
  ajustes_aplicados: boolean
}

type ItemReporte = {
  id: string
  producto_id: string
  stock_sistema_inicial: number
  conteo_fisico: number | null
  estado: string
  almacen_id: string | null
  productos: {
    nombre: string
    foto_url: string | null
    costo_usd: number | null
  } | null
}

type ProductoExtra = {
  id: string
  nombre_producto: string
  cantidad: number
  nota: string | null
  foto_url: string | null
}

type Props = {
  empresaId: string
  initialAuditoriaId: string | null
}

export default function ReporteDiscrepancias({ empresaId, initialAuditoriaId }: Props) {
  const [auditorias, setAuditorias] = useState<AuditoriaOption[]>([])
  const [selectedId, setSelectedId] = useState<string>(initialAuditoriaId ?? '')
  const [items, setItems] = useState<ItemReporte[]>([])
  const [extras, setExtras] = useState<ProductoExtra[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [applyingAjustes, setApplyingAjustes] = useState(false)
  const [ajustesAplicados, setAjustesAplicados] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'error' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('auditorias')
      .select('id, fecha_inicio, estado, ajustes_aplicados')
      .eq('empresa_id', empresaId)
      .in('estado', ['finalizada', 'cancelada'])
      .order('fecha_inicio', { ascending: false })
      .then(({ data }) => {
        const opts = (data ?? []) as AuditoriaOption[]
        setAuditorias(opts)
        if (initialAuditoriaId && opts.find(o => o.id === initialAuditoriaId)) {
          setSelectedId(initialAuditoriaId)
        } else if (opts.length > 0 && !initialAuditoriaId) {
          setSelectedId(opts[0].id)
        }
      })
  }, [empresaId, initialAuditoriaId])

  useEffect(() => {
    if (!selectedId) return
    setLoadingItems(true)
    const supabase = createClient()

    Promise.all([
      supabase
        .from('auditoria_items')
        .select('id, producto_id, stock_sistema_inicial, conteo_fisico, estado, almacen_id, productos(nombre, foto_url, costo_usd)')
        .eq('auditoria_id', selectedId),
      supabase
        .from('auditoria_productos_extra')
        .select('id, nombre_producto, cantidad, nota, foto_url')
        .eq('auditoria_id', selectedId),
    ]).then(([itemsRes, extrasRes]) => {
      setItems((itemsRes.data ?? []) as unknown as ItemReporte[])
      setExtras((extrasRes.data ?? []) as ProductoExtra[])
      const auditoria = auditorias.find(a => a.id === selectedId)
      setAjustesAplicados(auditoria?.ajustes_aplicados ?? false)
      setLoadingItems(false)
    })
  }, [selectedId, auditorias])

  async function handleAplicarAjustes() {
    const itemsConDif = items.filter(i => i.conteo_fisico !== null && i.conteo_fisico !== i.stock_sistema_inicial)
    if (itemsConDif.length === 0) {
      showToast('No hay diferencias que ajustar')
      return
    }

    setApplyingAjustes(true)
    const supabase = createClient()

    // Get default almacen for items without one
    let defaultAlmacenId: string | null = null
    const { data: defAlmacen } = await supabase
      .from('almacenes')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('es_default', { ascending: false })
      .limit(1)
      .maybeSingle()
    defaultAlmacenId = defAlmacen?.id ?? null

    let errorOccurred = false
    for (const item of itemsConDif) {
      const diff = (item.conteo_fisico ?? 0) - item.stock_sistema_inicial
      const cantidad = Math.abs(diff)
      const tipo = diff > 0 ? 'ingreso' : 'retiro'
      const almacenIdToUse = item.almacen_id ?? defaultAlmacenId

      if (!almacenIdToUse) continue

      const auditoria = auditorias.find(a => a.id === selectedId)
      const nota = `Ajuste por auditoría del ${formatFecha(auditoria?.fecha_inicio ?? '')}`

      const { error } = await supabase.rpc('registrar_movimiento', {
        p_producto_id: item.producto_id,
        p_almacen_id: almacenIdToUse,
        p_tipo: tipo,
        p_cantidad: cantidad,
        p_nota: nota,
      })

      if (error) {
        showToast(`Error en ajuste: ${error.message}`, 'error')
        errorOccurred = true
        break
      }
    }

    if (!errorOccurred) {
      await supabase.from('auditorias').update({ ajustes_aplicados: true }).eq('id', selectedId)
      setAjustesAplicados(true)
      setAuditorias(prev => prev.map(a => a.id === selectedId ? { ...a, ajustes_aplicados: true } : a))
      showToast(`${itemsConDif.length} ajuste${itemsConDif.length !== 1 ? 's' : ''} aplicado${itemsConDif.length !== 1 ? 's' : ''} al inventario ✓`)
    }
    setApplyingAjustes(false)
  }

  const itemsContados = items.filter(i => i.estado === 'contado')
  const itemsConDif = itemsContados.filter(i => i.conteo_fisico !== null && i.conteo_fisico !== i.stock_sistema_inicial)

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'ok' ? '#00D7A7' : '#FF4D4D',
          color: toast.type === 'ok' ? '#111111' : '#FFFFFF',
          padding: '11px 20px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 100, whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Selector */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, margin: '0 0 6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          AUDITORÍA
        </p>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            border: '1.5px solid #E8E8E8', fontSize: '14px', color: '#111111',
            background: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
          }}
        >
          <option value="">— Seleccionar auditoría —</option>
          {auditorias.map(a => (
            <option key={a.id} value={a.id}>
              {formatFecha(a.fecha_inicio)} — {a.estado === 'finalizada' ? 'Finalizada' : 'Cancelada'}
              {a.ajustes_aplicados ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </div>

      {!selectedId && (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          color: '#6B6B6B', fontSize: '14px',
        }}>
          Selecciona una auditoría finalizada para ver el reporte.
        </div>
      )}

      {selectedId && loadingItems && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6B6B6B', fontSize: '14px' }}>
          Cargando reporte...
        </div>
      )}

      {selectedId && !loadingItems && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              {
                label: 'Productos contados',
                value: `${itemsContados.length} / ${items.length}`,
                color: '#111111',
              },
              {
                label: 'Diferencias encontradas',
                value: itemsConDif.length.toString(),
                color: itemsConDif.length > 0 ? '#FF4D4D' : '#00D7A7',
              },
            ].map(card => (
              <div
                key={card.label}
                style={{
                  flex: 1, minWidth: '140px',
                  background: '#FFFFFF', borderRadius: '14px',
                  padding: '14px 16px', border: '1px solid #E8E8E8',
                }}
              >
                <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: card.color, margin: 0 }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div style={{
              background: '#FFFFFF', borderRadius: '16px',
              border: '1px solid #E8E8E8', overflow: 'hidden', marginBottom: '16px',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E8E8' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111111', margin: 0 }}>
                  Detalle de productos
                </p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8F6EA' }}>
                      {['Producto', 'Sistema', 'Físico', 'Diferencia', 'Valor USD'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: 'left',
                          color: '#6B6B6B', fontWeight: 600, fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const diff = item.conteo_fisico !== null
                        ? item.conteo_fisico - item.stock_sistema_inicial
                        : null
                      const costo = item.productos?.costo_usd ?? 0
                      const valor = diff !== null ? Math.abs(diff) * costo : null
                      const hasDiff = diff !== null && diff !== 0

                      return (
                        <tr
                          key={item.id}
                          style={{ borderTop: idx > 0 ? '1px solid #F0F0F0' : 'none' }}
                        >
                          <td style={{ padding: '12px 16px', color: '#111111', fontWeight: 500 }}>
                            {item.productos?.nombre ?? '—'}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6B6B6B' }}>
                            {item.stock_sistema_inicial}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6B6B6B' }}>
                            {item.conteo_fisico ?? '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                            {diff === null ? (
                              <span style={{ color: '#6B6B6B' }}>Sin contar</span>
                            ) : diff === 0 ? (
                              <span style={{ color: '#6B6B6B' }}>Sin diferencia</span>
                            ) : (
                              <span style={{ color: diff > 0 ? '#00D7A7' : '#FF4D4D' }}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: hasDiff ? 600 : 400 }}>
                            {valor !== null && hasDiff ? (
                              <span style={{ color: diff! > 0 ? '#00D7A7' : '#FF4D4D' }}>
                                {diff! > 0 ? '+' : '-'}${valor.toFixed(2)}
                              </span>
                            ) : (
                              <span style={{ color: '#6B6B6B' }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Extras */}
          {extras.length > 0 && (
            <div style={{
              background: '#FFFFFF', borderRadius: '16px',
              border: '1px solid #E8E8E8', overflow: 'hidden', marginBottom: '20px',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8E8E8' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111111', margin: '0 0 2px' }}>
                  Productos encontrados no registrados
                </p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>
                  {extras.length} producto{extras.length !== 1 ? 's' : ''} reportado{extras.length !== 1 ? 's' : ''} por los empleados
                </p>
              </div>
              <div style={{ padding: '8px 0' }}>
                {extras.map(e => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 20px',
                  }}>
                    {e.foto_url ? (
                      <img src={e.foto_url} alt={e.nombre_producto} style={{
                        width: '40px', height: '40px', borderRadius: '8px',
                        objectFit: 'cover', flexShrink: 0,
                      }} />
                    ) : (
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '8px',
                        background: '#F8F6EA', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px',
                      }}>📦</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>{e.nombre_producto}</p>
                      {e.nota && <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>{e.nota}</p>}
                    </div>
                    <span style={{
                      fontSize: '15px', fontWeight: 700, color: '#111111',
                      background: '#F8F6EA', padding: '4px 10px', borderRadius: '8px',
                    }}>
                      ×{e.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {itemsConDif.length > 0 && (
            <button
              onClick={handleAplicarAjustes}
              disabled={applyingAjustes || ajustesAplicados}
              style={{
                width: '100%', padding: '14px', borderRadius: '100px',
                background: ajustesAplicados ? '#E8E8E8' : '#F4C400',
                border: 'none', fontSize: '15px', fontWeight: 700,
                cursor: ajustesAplicados || applyingAjustes ? 'default' : 'pointer',
                color: ajustesAplicados ? '#6B6B6B' : '#111111',
                fontFamily: 'inherit',
              }}
            >
              {ajustesAplicados
                ? 'Ajustes ya aplicados ✓'
                : applyingAjustes
                ? 'Aplicando ajustes...'
                : `Aplicar ajustes al inventario (${itemsConDif.length})`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
