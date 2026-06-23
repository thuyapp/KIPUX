'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Minus, Plus, Camera, Trash2 } from 'lucide-react'

type ProductoModal = {
  id: string
  nombre: string
  foto_url: string | null
  stock_actual: number
  unidad: string
}

type Props = {
  producto: ProductoModal
  almacenId: string
  almacenNombre: string
  tipo: 'ingreso' | 'retiro'
  onClose: () => void
  onSuccess: () => void
}

export default function StockModal({ producto, almacenId, almacenNombre, tipo, onClose, onSuccess }: Props) {
  const [cantidad, setCantidad] = useState(1)
  const [justificacion, setJustificacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [empresaId, setEmpresaId] = useState('')
  const fotoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) return
      supabase.from('perfiles').select('empresa_id').eq('id', user.id).single().then(({ data }: { data: { empresa_id: string } | null }) => {
        if (data?.empresa_id) setEmpresaId(data.empresa_id)
      })
    })
  }, [])

  const nuevaCantidad = tipo === 'ingreso'
    ? producto.stock_actual + cantidad
    : producto.stock_actual - cantidad

  async function handleConfirmar() {
    if (justificacion.trim().length < 10) {
      setError('La justificación debe tener al menos 10 caracteres.')
      return
    }
    if (tipo === 'retiro' && cantidad > producto.stock_actual) {
      setError(`Stock insuficiente. Disponible: ${producto.stock_actual} ${producto.unidad}.`)
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()

    let fotoUrl: string | undefined
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop() ?? 'jpg'
      const path = `${empresaId || producto.id}/evidencias/${producto.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('productos')
        .upload(path, fotoFile, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('productos').getPublicUrl(path)
        fotoUrl = urlData.publicUrl
      }
    }

    const { error: rpcError } = await supabase.rpc('registrar_movimiento', {
      p_producto_id: producto.id,
      p_almacen_id: almacenId,
      p_tipo: tipo,
      p_cantidad: cantidad,
      p_nota: justificacion,
      ...(fotoUrl ? { p_foto: fotoUrl } : {}),
    })
    setLoading(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onSuccess()
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
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 64px rgba(17,17,17,0.16)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111111', margin: 0 }}>
            {tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar retiro'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Producto info */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'center',
          background: '#F8F6EA', borderRadius: '12px', padding: '12px', marginBottom: '20px',
        }}>
          {producto.foto_url ? (
            <img
              src={producto.foto_url}
              alt={producto.nombre}
              style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
              background: '#F4C400', color: '#111111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '20px',
            }}>
              {producto.nombre[0].toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 600, color: '#111111', margin: '0 0 2px' }}>{producto.nombre}</p>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>
              Stock actual: {producto.stock_actual} {producto.unidad}
            </p>
          </div>
        </div>

        {/* Almacén (solo lectura) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6B6B6B', marginBottom: '6px' }}>
            Almacén
          </label>
          <div style={{
            padding: '10px 14px', border: '1px solid #E8E8E8',
            borderRadius: '10px', fontSize: '14px', color: '#111111', background: '#F8F6EA',
          }}>
            {almacenNombre}
          </div>
        </div>

        {/* Cantidad */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#111111', marginBottom: '8px' }}>
            Cantidad
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setCantidad(c => Math.max(1, c - 1))}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '1px solid #E8E8E8', background: '#FFFFFF',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#111111', flexShrink: 0,
              }}
            >
              <Minus size={16} />
            </button>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#111111', minWidth: '32px', textAlign: 'center' }}>
              {cantidad}
            </span>
            <button
              onClick={() => setCantidad(c => c + 1)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: 'none', background: '#F4C400',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#111111', flexShrink: 0,
              }}
            >
              <Plus size={16} />
            </button>
            <span style={{ fontSize: '13px', color: '#6B6B6B', marginLeft: 'auto', textAlign: 'right' }}>
              Nueva cantidad:{' '}
              <strong style={{ color: nuevaCantidad < 0 ? '#FF4D4D' : '#111111' }}>
                {nuevaCantidad} {producto.unidad}
              </strong>
            </span>
          </div>
        </div>

        {/* Justificación */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#111111', marginBottom: '8px' }}>
            Justificación <span style={{ color: '#FF4D4D' }}>*</span>
          </label>
          <textarea
            value={justificacion}
            onChange={e => setJustificacion(e.target.value)}
            placeholder="Ej: Compra a proveedor ABC, factura #123..."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px',
              border: `1px solid ${justificacion.length > 0 && justificacion.length < 10 ? '#FF4D4D' : '#E8E8E8'}`,
              borderRadius: '10px', fontSize: '14px', color: '#111111',
              resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <p style={{ fontSize: '12px', color: justificacion.length >= 10 ? '#00D7A7' : '#6B6B6B', marginTop: '4px' }}>
            {justificacion.length} / mín. 10 caracteres
          </p>
        </div>

        {/* Foto de evidencia */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#111111', marginBottom: '8px' }}>
            Foto de evidencia <span style={{ color: '#6B6B6B', fontWeight: 400 }}>(opcional)</span>
          </label>
          {fotoPreview ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={fotoPreview}
                alt="Evidencia"
                style={{ width: '96px', height: '96px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E8E8E8', display: 'block' }}
              />
              <button
                onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: '#FF4D4D', border: 'none', borderRadius: '50%',
                  width: '22px', height: '22px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF',
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fotoInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 16px', border: '1px dashed #E8E8E8', borderRadius: '10px',
                background: '#F8F6EA', cursor: 'pointer', fontSize: '13px', color: '#6B6B6B',
                fontFamily: 'inherit',
              }}
            >
              <Camera size={16} /> Adjuntar foto
            </button>
          )}
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              setFotoFile(file)
              const reader = new FileReader()
              reader.onload = ev => setFotoPreview(ev.target?.result as string)
              reader.readAsDataURL(file)
            }}
          />
        </div>

        {error && (
          <p style={{
            color: '#FF4D4D', fontSize: '13px', marginBottom: '12px',
            padding: '8px 12px', background: '#FFF0F0', borderRadius: '8px',
          }}>
            {error}
          </p>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px', borderRadius: '100px',
              border: '1px solid #E8E8E8', background: '#FFFFFF', color: '#111111',
              fontWeight: 500, cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading}
            style={{
              flex: 1, padding: '13px', borderRadius: '100px', border: 'none',
              background: tipo === 'ingreso' ? '#F4C400' : '#111111',
              color: tipo === 'ingreso' ? '#111111' : '#FFFFFF',
              fontWeight: 600, fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
