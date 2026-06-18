'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Categoria } from '../page'

const COLORS = ['#F4C400', '#00D7A7', '#FF4D4D', '#3B82F6', '#8B5CF6', '#F97316', '#EC4899', '#6B7280']

type Props = {
  categoria: Categoria | null
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

export default function CategoriaModal({ categoria, empresaId, onClose, onSaved }: Props) {
  const isEditing = categoria !== null

  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [icono, setIcono] = useState(categoria?.icono ?? '📦')
  const [color, setColor] = useState(categoria?.color ?? '#F4C400')
  const [activo, setActivo] = useState(categoria?.activo ?? true)
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<'idle' | 'checking' | 'confirming' | 'deleting'>('idle')
  const [productCount, setProductCount] = useState(0)

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    if (isEditing) {
      const { error: err } = await supabase
        .from('categorias')
        .update({ nombre: nombre.trim(), icono, color, activo, descripcion: descripcion || null })
        .eq('id', categoria.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase
        .from('categorias')
        .insert({ empresa_id: empresaId, nombre: nombre.trim(), icono, color, activo, descripcion: descripcion || null })
      if (err) { setError(err.message); setSaving(false); return }
    }

    setSaving(false)
    onSaved()
  }

  async function handleDeleteStart() {
    setDeleteState('checking')
    const supabase = createClient()
    const { count } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', categoria!.id)
    setProductCount(count ?? 0)
    setDeleteState('confirming')
  }

  async function handleDeleteConfirm() {
    setDeleteState('deleting')
    const supabase = createClient()
    await supabase.from('categorias').delete().eq('id', categoria!.id)
    onSaved()
  }

  async function handleDeactivate() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('categorias').update({ activo: false }).eq('id', categoria!.id)
    onSaved()
  }

  return (
    <div
      onClick={onClose}
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
            {isEditing ? 'Editar categoría' : 'Nueva categoría'}
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
          {/* Preview + emoji */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0,
              background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px',
            }}>
              {icono || '📦'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>EMOJI / ÍCONO</p>
              <input
                value={icono}
                onChange={e => setIcono(e.target.value)}
                placeholder="📦"
                style={{ ...inputStyle, maxWidth: '90px', textAlign: 'center', fontSize: '22px', padding: '8px 10px' }}
              />
            </div>
          </div>

          {/* Color */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>COLOR</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: c, cursor: 'pointer', flexShrink: 0,
                    border: color === c ? '3px solid #111111' : '3px solid transparent',
                    outline: color === c ? '2px solid #FFFFFF' : 'none',
                    outlineOffset: '-5px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>NOMBRE *</p>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Lácteos, Electrónica..."
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
            marginBottom: '8px',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>Categoría activa</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                {activo ? 'Visible en el inventario' : 'Oculta del inventario'}
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

          {/* Confirmación de eliminación */}
          {deleteState === 'confirming' && (
            <div style={{
              marginTop: '16px', padding: '16px', borderRadius: '12px',
              background: '#FFF0F0', border: '1px solid #FFCCCC',
            }}>
              {productCount > 0 ? (
                <p style={{ fontSize: '14px', color: '#111111', margin: '0 0 12px', lineHeight: '1.5' }}>
                  Esta categoría tiene <strong>{productCount} producto{productCount !== 1 ? 's' : ''}</strong>. Al eliminarla, quedarán sin categoría. ¿Continuar?
                </p>
              ) : (
                <p style={{ fontSize: '14px', color: '#111111', margin: '0 0 12px' }}>
                  ¿Eliminar esta categoría? Esta acción no se puede deshacer.
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                {productCount > 0 ? (
                  <button
                    onClick={handleDeactivate}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '10px',
                      background: '#FFFFFF', border: '1.5px solid #E8E8E8',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#111111',
                      fontFamily: 'inherit',
                    }}
                  >
                    Desactivar en su lugar
                  </button>
                ) : (
                  <button
                    onClick={() => setDeleteState('idle')}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '10px',
                      background: '#FFFFFF', border: '1.5px solid #E8E8E8',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#111111',
                      fontFamily: 'inherit',
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteState === 'deleting'}
                  style={{
                    flex: 1, padding: '9px', borderRadius: '10px',
                    background: '#FF4D4D', border: 'none',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#FFFFFF',
                    fontFamily: 'inherit',
                  }}
                >
                  {deleteState === 'deleting' ? 'Eliminando...' : productCount > 0 ? 'Eliminar de todas formas' : 'Eliminar'}
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
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar categoría'}
            </button>
          </div>

          {isEditing && deleteState === 'idle' && (
            <button
              onClick={handleDeleteStart}
              disabled={deleteState === 'checking'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#FF4D4D', fontSize: '14px', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '4px', fontFamily: 'inherit',
              }}
            >
              <Trash2 size={14} />
              {deleteState === 'checking' ? 'Verificando...' : 'Eliminar categoría'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
