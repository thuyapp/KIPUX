'use client'

import { useState, useRef } from 'react'
import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Almacen } from '../page'

type Props = {
  almacen: Almacen | null
  empresaId: string
  onClose: () => void
  onSaved: () => void
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1.5px solid #E8E8E8', fontSize: '15px', color: '#111111',
  background: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const textareaStyle: CSSProperties = { ...inputStyle, resize: 'none' }

export default function AlmacenModal({ almacen, empresaId, onClose, onSaved }: Props) {
  const isEditing = almacen !== null

  const [nombre, setNombre] = useState(almacen?.nombre ?? '')
  const [ubicacion, setUbicacion] = useState(almacen?.ubicacion ?? '')
  const [descripcion, setDescripcion] = useState(almacen?.descripcion ?? '')
  const [activo, setActivo] = useState(almacen?.activo ?? true)
  const [esDefault, setEsDefault] = useState(almacen?.es_default ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deactivateState, setDeactivateState] = useState<'idle' | 'checking' | 'confirming'>('idle')
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [stockCount, setStockCount] = useState(0)
  const mouseDownOnOverlay = useRef(false)

  const showDefaultToggle = isEditing && !almacen!.es_default

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    if (isEditing) {
      if (esDefault && !almacen!.es_default) {
        await supabase
          .from('almacenes')
          .update({ es_default: false })
          .eq('empresa_id', empresaId)
          .neq('id', almacen!.id)
      }
      const { error: err } = await supabase
        .from('almacenes')
        .update({
          nombre: nombre.trim(),
          ubicacion: ubicacion.trim() || null,
          descripcion: descripcion.trim() || null,
          activo,
          es_default: esDefault || almacen!.es_default,
        })
        .eq('id', almacen!.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase
        .from('almacenes')
        .insert({
          empresa_id: empresaId,
          nombre: nombre.trim(),
          ubicacion: ubicacion.trim() || null,
          descripcion: descripcion.trim() || null,
          activo,
        })
      if (err) { setError(err.message); setSaving(false); return }
    }

    setSaving(false)
    onSaved()
  }

  async function handleDeactivateStart() {
    setDeactivateState('checking')
    const supabase = createClient()
    const { data: rows } = await supabase
      .from('stock_por_almacen')
      .select('stock_actual')
      .eq('almacen_id', almacen!.id)
      .gt('stock_actual', 0)
    setStockCount(rows?.length ?? 0)
    setDeactivateState('confirming')
  }

  async function handleDeactivateConfirm() {
    setIsDeactivating(true)
    const supabase = createClient()
    await supabase.from('almacenes').update({ activo: false }).eq('id', almacen!.id)
    onSaved()
  }

  return (
    <div
      onMouseDown={(e) => { mouseDownOnOverlay.current = e.target === e.currentTarget }}
      onMouseUp={(e) => { if (mouseDownOnOverlay.current && e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(17,17,17,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '460px',
          background: '#FFFFFF', borderRadius: '24px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '20px 24px 0',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111111', margin: 0 }}>
            {isEditing ? 'Editar almacén' : 'Nuevo almacén'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px 8px' }}>
          {/* Nombre */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>NOMBRE *</p>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Almacén Central, Bodega Norte..."
              style={inputStyle}
            />
          </div>

          {/* Ubicación */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>UBICACIÓN</p>
            <input
              value={ubicacion}
              onChange={e => setUbicacion(e.target.value)}
              placeholder="Ej: Calle Principal 123, Cúa"
              style={inputStyle}
            />
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>DESCRIPCIÓN</p>
              <span style={{ fontSize: '11px', color: descripcion.length > 100 ? '#FF4D4D' : '#6B6B6B' }}>
                {descripcion.length}/120
              </span>
            </div>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value.slice(0, 120))}
              placeholder="Descripción opcional..."
              rows={3}
              style={textareaStyle}
            />
          </div>

          {/* Toggle activo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px', background: '#F8F6EA', borderRadius: '12px',
            marginBottom: showDefaultToggle ? '12px' : '8px',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>Almacén activo</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                {activo ? 'Disponible para movimientos' : 'No disponible para movimientos'}
              </p>
            </div>
            <button
              onClick={() => setActivo(!activo)}
              style={{
                width: '48px', height: '28px', borderRadius: '14px',
                background: activo ? '#00D7A7' : '#E8E8E8',
                border: 'none', cursor: 'pointer', padding: '3px',
                display: 'flex', alignItems: 'center',
                justifyContent: activo ? 'flex-end' : 'flex-start',
                flexShrink: 0,
              }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF' }} />
            </button>
          </div>

          {/* Toggle predeterminado (solo editar, si no es ya el default) */}
          {showDefaultToggle && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px', background: '#F8F6EA', borderRadius: '12px',
              marginBottom: '8px',
            }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>Almacén predeterminado</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                  Se usará por defecto al registrar movimientos
                </p>
              </div>
              <button
                onClick={() => setEsDefault(!esDefault)}
                style={{
                  width: '48px', height: '28px', borderRadius: '14px',
                  background: esDefault ? '#F4C400' : '#E8E8E8',
                  border: 'none', cursor: 'pointer', padding: '3px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: esDefault ? 'flex-end' : 'flex-start',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF' }} />
              </button>
            </div>
          )}

          {/* Confirmación de desactivar */}
          {deactivateState === 'confirming' && (
            <div style={{
              marginTop: '16px', padding: '16px', borderRadius: '12px',
              background: '#FFF0F0', border: '1px solid #FFCCCC',
            }}>
              {stockCount > 0 ? (
                <p style={{ fontSize: '14px', color: '#111111', margin: '0 0 12px', lineHeight: '1.5' }}>
                  Este almacén tiene <strong>{stockCount} producto{stockCount !== 1 ? 's' : ''} con stock</strong>. Si lo desactivas, no podrá usarse para movimientos. ¿Continuar?
                </p>
              ) : (
                <p style={{ fontSize: '14px', color: '#111111', margin: '0 0 12px' }}>
                  ¿Desactivar este almacén? No podrá usarse para movimientos.
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setDeactivateState('idle')}
                  style={{
                    flex: 1, padding: '9px', borderRadius: '10px',
                    background: '#FFFFFF', border: '1.5px solid #E8E8E8',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#111111',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeactivateConfirm}
                  disabled={isDeactivating}
                  style={{
                    flex: 1, padding: '9px', borderRadius: '10px',
                    background: '#FF4D4D', border: 'none',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#FFFFFF',
                    fontFamily: 'inherit',
                  }}
                >
                  {isDeactivating ? 'Desactivando...' : 'Desactivar'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p style={{ fontSize: '13px', color: '#FF4D4D', margin: '12px 0 0' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, padding: '16px 24px 24px',
          borderTop: '1px solid #E8E8E8',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', borderRadius: '100px',
                background: '#111111', border: 'none',
                fontSize: '15px', fontWeight: 600, cursor: 'pointer', color: '#FFFFFF',
                fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2, padding: '12px', borderRadius: '100px',
                background: '#F4C400', border: 'none',
                fontSize: '15px', fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer', color: '#111111',
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar almacén'}
            </button>
          </div>

          {isEditing && almacen!.activo && deactivateState === 'idle' && (
            <button
              onClick={handleDeactivateStart}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#FF4D4D', fontSize: '14px', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '4px', fontFamily: 'inherit',
              }}
            >
              Desactivar almacén
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
