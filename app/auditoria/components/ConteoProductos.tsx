'use client'

import { useState, useRef } from 'react'
import { Minus, Plus, Camera, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AuditoriaItemTrabajador, AuditoriaActivaTrabajador } from '../page'
import ProductoNoListado from './ProductoNoListado'

type Props = {
  auditoria: AuditoriaActivaTrabajador
  items: AuditoriaItemTrabajador[]
  userId: string
  empresaId: string
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ConteoProductos({ auditoria, items: initialItems, userId, empresaId }: Props) {
  const [items, setItems] = useState<AuditoriaItemTrabajador[]>(initialItems)
  const [selectedIdx, setSelectedIdx] = useState<number>(() => {
    const firstPending = initialItems.findIndex(i => i.estado === 'pendiente')
    return firstPending >= 0 ? firstPending : 0
  })
  const [cantidad, setCantidad] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showNoListado, setShowNoListado] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  const totalItems = items.length
  const contados = items.filter(i => i.estado === 'contado').length
  const progPct = totalItems > 0 ? Math.round((contados / totalItems) * 100) : 0
  const todosContados = contados === totalItems

  const currentItem = items[selectedIdx]

  function resetFoto() {
    setFotoFile(null)
    setFotoPreview(null)
    setUploadError(null)
    if (fotoRef.current) fotoRef.current.value = ''
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFotoFile(file)
    if (file) {
      setFotoPreview(URL.createObjectURL(file))
    } else {
      setFotoPreview(null)
    }
  }

  function handleSelect(idx: number) {
    setSelectedIdx(idx)
    const item = items[idx]
    setCantidad(item.estado === 'contado' && item.conteo_fisico !== null ? item.conteo_fisico : 0)
    resetFoto()
  }

  async function handleConfirmar() {
    if (!currentItem) return
    setSaving(true)
    const supabase = createClient()

    let fotoUrl: string | null = null
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop() ?? 'jpg'
      const storagePath = `${empresaId}/auditorias/${auditoria.id}/${Date.now()}_${currentItem.producto_id}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('productos')
        .upload(storagePath, fotoFile, { upsert: true })
      if (uploadErr) {
        setUploadError(`Error al subir foto: ${uploadErr.message}`)
        setSaving(false)
        return
      }
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('productos').getPublicUrl(storagePath)
        fotoUrl = urlData.publicUrl
      }
    }

    const updatePayload = {
      conteo_fisico: cantidad,
      estado: 'contado',
      fecha_conteo: new Date().toISOString(),
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
    }
    const { error } = await supabase
      .from('auditoria_items')
      .update(updatePayload)
      .eq('id', currentItem.id)
    if (error) {
      setUploadError(`Error al guardar: ${error.message} (code: ${error.code})`)
      setSaving(false)
      return
    }

    if (!error) {
      setItems(prev => prev.map((item, idx) =>
        idx === selectedIdx
          ? { ...item, conteo_fisico: cantidad, estado: 'contado', fecha_conteo: new Date().toISOString() }
          : item
      ))
      resetFoto()
      // Auto-advance to next pending
      const nextPending = items.findIndex((item, idx) => idx > selectedIdx && item.estado === 'pendiente')
      if (nextPending >= 0) {
        setSelectedIdx(nextPending)
        setCantidad(0)
      }
    }
    setSaving(false)
  }

  // Success screen
  if (todosContados) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 56px)',
        padding: '40px 24px', textAlign: 'center',
        fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#E6FDF8', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '20px',
        }}>
          <CheckCircle size={40} color="#00D7A7" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111111', margin: '0 0 8px' }}>
          ¡Excelente trabajo!
        </h1>
        <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '0 0 28px' }}>
          Has completado todos tus productos asignados.
        </p>
        <div style={{
          background: '#FFFFFF', borderRadius: '16px', padding: '20px 28px',
          border: '1px solid #E8E8E8', marginBottom: '28px',
          display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '300px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#6B6B6B' }}>Productos asignados</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111111' }}>{totalItems}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#6B6B6B' }}>Contados</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#00D7A7' }}>{contados}</span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#6B6B6B', maxWidth: '280px', lineHeight: '1.5' }}>
          Tu administrador revisará los resultados y aplicará los ajustes al inventario.
        </p>
      </div>
    )
  }

  const nextPendingIdx = items.findIndex((item, idx) => idx > selectedIdx && item.estado === 'pendiente')
  const nextItem = nextPendingIdx >= 0 ? items[nextPendingIdx] : null

  return (
    <div style={{
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
      minHeight: 'calc(100vh - 56px)',
      position: 'relative',
    }}>
      {/* Progress header */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid #E8E8E8',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
            Auditoría · {formatFecha(auditoria.fecha_inicio)}
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: '100px',
            background: '#FFF9E6', color: '#F4C400',
            fontSize: '11px', fontWeight: 600,
          }}>
            Conteo ciego
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '6px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#F4C400', borderRadius: '3px',
              width: `${progPct}%`, transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '12px', color: '#6B6B6B', whiteSpace: 'nowrap' }}>
            {contados}/{totalItems}
          </span>
        </div>
      </div>

      {/* Main layout: list + panel */}
      <div className="md:flex" style={{ minHeight: 'calc(100vh - 56px - 68px)' }}>

        {/* Left: product list */}
        <div
          className="md:w-72 md:border-r md:overflow-y-auto"
          style={{ borderColor: '#E8E8E8', background: '#FFFFFF' }}
        >
          {items.map((item, idx) => {
            const nombre = item.productos?.nombre ?? '—'
            const selected = idx === selectedIdx
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(idx)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '14px 16px',
                  background: selected ? '#FFFBE6' : 'transparent',
                  borderLeft: selected ? '3px solid #F4C400' : '3px solid transparent',
                  borderRight: 'none', borderTop: 'none',
                  borderBottom: '1px solid #F0F0F0',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
              >
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: item.estado === 'contado' ? '#00D7A7' : '#CCCCCC',
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13px', fontWeight: selected ? 600 : 400,
                    color: '#111111', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {nombre}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '2px 0 0' }}>
                    {item.estado === 'contado'
                      ? `✓ Contado (${item.conteo_fisico})`
                      : item.productos?.categorias?.nombre ?? 'Sin categoría'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: counting panel */}
        <div style={{ flex: 1, padding: '24px 20px' }}>
          {currentItem && (() => {
            const nombre = currentItem.productos?.nombre ?? '—'
            const categoria = currentItem.productos?.categorias?.nombre ?? 'Sin categoría'
            const foto = currentItem.productos?.foto_url ?? null

            return (
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                {/* Product photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                  {foto ? (
                    <img
                      src={foto}
                      alt={nombre}
                      style={{ width: '100px', height: '100px', borderRadius: '20px', objectFit: 'cover', marginBottom: '12px' }}
                    />
                  ) : (
                    <div style={{
                      width: '100px', height: '100px', borderRadius: '20px',
                      background: '#F4C400', color: '#111111',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '40px', fontWeight: 800, marginBottom: '12px',
                    }}>
                      {nombre[0]?.toUpperCase()}
                    </div>
                  )}
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111111', margin: '0 0 4px', textAlign: 'center' }}>
                    {nombre}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>{categoria}</p>
                </div>

                {/* Counter */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '24px', marginBottom: '28px',
                }}>
                  <button
                    onClick={() => setCantidad(prev => Math.max(0, prev - 1))}
                    style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: '#111111', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <Minus size={22} color="#FFFFFF" />
                  </button>
                  <span style={{ fontSize: '64px', fontWeight: 800, color: '#111111', minWidth: '100px', textAlign: 'center' }}>
                    {cantidad}
                  </span>
                  <button
                    onClick={() => setCantidad(prev => prev + 1)}
                    style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: '#F4C400', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <Plus size={22} color="#111111" />
                  </button>
                </div>

                {/* Photo button + preview */}
                {fotoPreview ? (
                  <div style={{ marginBottom: '12px', position: 'relative' }}>
                    <img
                      src={fotoPreview}
                      alt="Vista previa"
                      style={{
                        width: '100%', maxHeight: '160px', objectFit: 'cover',
                        borderRadius: '10px', border: '1.5px solid #E8E8E8',
                        display: 'block',
                      }}
                    />
                    <button
                      onClick={resetFoto}
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: 'rgba(17,17,17,0.7)', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        color: '#FFFFFF', fontSize: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fotoRef.current?.click()}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px',
                      border: '1.5px dashed #E8E8E8', background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      cursor: 'pointer', color: '#6B6B6B', fontSize: '13px',
                      fontFamily: 'inherit', marginBottom: '12px',
                    }}
                  >
                    <Camera size={16} />
                    Foto de evidencia (opcional)
                  </button>
                )}
                <input
                  ref={fotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleFotoChange}
                />

                {uploadError && (
                  <p style={{ fontSize: '12px', color: '#FF4D4D', margin: '0 0 10px', textAlign: 'center' }}>
                    {uploadError}
                  </p>
                )}

                {/* Confirm */}
                <button
                  onClick={handleConfirmar}
                  disabled={saving}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '100px',
                    background: '#F4C400', border: 'none',
                    fontSize: '16px', fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer',
                    color: '#111111', fontFamily: 'inherit',
                    marginBottom: '12px',
                  }}
                >
                  {saving ? 'Guardando...' : 'Confirmar y continuar'}
                </button>

                {nextItem && (
                  <p style={{ fontSize: '12px', color: '#6B6B6B', textAlign: 'center', margin: 0 }}>
                    Siguiente: <strong>{nextItem.productos?.nombre ?? '—'}</strong>
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setShowNoListado(true)}
        style={{
          position: 'fixed', bottom: '24px', left: '20px',
          padding: '12px 18px', borderRadius: '100px',
          background: '#111111', border: 'none',
          color: '#FFFFFF', fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}
      >
        ¿Algo no está en la lista?
      </button>

      {showNoListado && (
        <ProductoNoListado
          auditoriaId={auditoria.id}
          userId={userId}
          onClose={() => setShowNoListado(false)}
        />
      )}
    </div>
  )
}
