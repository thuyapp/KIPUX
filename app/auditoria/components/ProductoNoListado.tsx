'use client'

import { useState, useRef } from 'react'
import { X, Minus, Plus, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  auditoriaId: string
  userId: string
  onClose: () => void
}

export default function ProductoNoListado({ auditoriaId, userId, onClose }: Props) {
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)
  const mouseDownOnOverlay = useRef(false)

  async function handleReportar() {
    if (!nombre.trim()) { setError('El nombre del producto es requerido'); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('auditoria_productos_extra')
      .insert({
        auditoria_id: auditoriaId,
        usuario_id: userId,
        nombre_producto: nombre.trim(),
        cantidad,
        nota: nota.trim() || null,
      })
    setSaving(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #E8E8E8', fontSize: '15px', color: '#111111',
    background: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div
      onMouseDown={e => { mouseDownOnOverlay.current = e.target === e.currentTarget }}
      onMouseUp={e => { if (mouseDownOnOverlay.current && e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(17,17,17,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '500px',
          background: '#FFFFFF', borderRadius: '24px 24px 0 0',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        {/* Handle */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E8E8E8' }} />
        </div>

        {/* Header */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '12px 24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111111', margin: 0 }}>
            Producto no listado
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', padding: '4px', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 32px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#E6FDF8', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px',
                fontSize: '28px',
              }}>✓</div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
                Producto reportado
              </p>
              <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 24px' }}>
                El administrador revisará este producto durante el análisis de discrepancias.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 28px', borderRadius: '100px',
                  background: '#F4C400', border: 'none',
                  fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', color: '#111111', fontFamily: 'inherit',
                }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 20px', lineHeight: '1.5' }}>
                Encontraste un producto que no está en tu lista de conteo. Repórtalo aquí.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, margin: '0 0 6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  NOMBRE DEL PRODUCTO *
                </p>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Aceite de oliva 500ml"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, margin: '0 0 12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  CANTIDAD ENCONTRADA
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#111111', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <Minus size={18} color="#FFFFFF" />
                  </button>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#111111', minWidth: '60px', textAlign: 'center' }}>
                    {cantidad}
                  </span>
                  <button
                    onClick={() => setCantidad(prev => prev + 1)}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#F4C400', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <Plus size={18} color="#111111" />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, margin: '0 0 6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  NOTA
                </p>
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Descripción adicional (opcional)..."
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
                />
              </div>

              <button
                onClick={() => fotoRef.current?.click()}
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px',
                  border: '1.5px dashed #E8E8E8', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: 'pointer', color: '#6B6B6B', fontSize: '13px',
                  fontFamily: 'inherit', marginBottom: '20px',
                }}
              >
                <Camera size={16} />
                Adjuntar foto (opcional)
              </button>
              <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} />

              {error && (
                <p style={{ fontSize: '13px', color: '#FF4D4D', margin: '0 0 12px' }}>{error}</p>
              )}

              <button
                onClick={handleReportar}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px', borderRadius: '100px',
                  background: '#F4C400', border: 'none',
                  fontSize: '15px', fontWeight: 700,
                  cursor: saving ? 'wait' : 'pointer',
                  color: '#111111', fontFamily: 'inherit',
                }}
              >
                {saving ? 'Reportando...' : 'Reportar producto'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
