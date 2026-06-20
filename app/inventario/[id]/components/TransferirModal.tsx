'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Almacen = { id: string; nombre: string }

type Props = {
  productoId: string
  productoNombre: string
  stockDisponible: number
  almacenOrigenId: string
  almacenOrigenNombre: string
  onClose: () => void
  onSuccess: () => void
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E8E8E8', borderRadius: '8px',
  padding: '10px 12px', width: '100%',
  fontSize: '14px', color: '#111111',
  fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', background: '#FFFFFF',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500,
  color: '#6B6B6B', marginBottom: '6px',
}

export default function TransferirModal({
  productoId,
  productoNombre,
  stockDisponible,
  almacenOrigenId,
  almacenOrigenNombre,
  onClose,
  onSuccess,
}: Props) {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [almacenDestinoId, setAlmacenDestinoId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('almacenes')
      .select('id, nombre')
      .eq('activo', true)
      .neq('id', almacenOrigenId)
      .then(({ data }) => setAlmacenes((data ?? []) as Almacen[]))
  }, [almacenOrigenId])

  async function handleTransferir() {
    if (!almacenDestinoId) {
      setError('Selecciona un almacén de destino.')
      return
    }
    if (cantidad < 1) {
      setError('La cantidad debe ser al menos 1.')
      return
    }
    if (cantidad > stockDisponible) {
      setError(`Stock insuficiente. Disponible: ${stockDisponible} unidades.`)
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('transferir_stock', {
      p_producto_id: productoId,
      p_almacen_origen_id: almacenOrigenId,
      p_almacen_destino_id: almacenDestinoId,
      p_cantidad: cantidad,
      p_nota: nota.trim() || null,
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
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: '20px', padding: '24px',
          width: '90%', maxWidth: '420px',
          boxShadow: '0 24px 64px rgba(17,17,17,0.16)',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111111', margin: 0 }}>
            Transferir stock
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6B6B6B', padding: '2px', display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 20px' }}>
          {productoNombre} · Disponible: {stockDisponible} unidades
        </p>

        {/* Origen (solo lectura) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Almacén origen</label>
          <div style={{ ...inputStyle, background: '#F8F6EA', color: '#6B6B6B' }}>
            {almacenOrigenNombre}
          </div>
        </div>

        {/* Destino */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Almacén destino</label>
          <select
            value={almacenDestinoId}
            onChange={e => { setAlmacenDestinoId(e.target.value); setError(null) }}
            style={inputStyle}
          >
            <option value="">— Seleccionar almacén —</option>
            {almacenes.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          {almacenes.length === 0 && (
            <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px' }}>
              No hay otros almacenes disponibles.
            </p>
          )}
        </div>

        {/* Cantidad */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Cantidad</label>
          <input
            type="number"
            min={1}
            max={stockDisponible}
            value={cantidad}
            onChange={e => { setCantidad(Number(e.target.value)); setError(null) }}
            style={inputStyle}
          />
        </div>

        {/* Nota */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Nota <span style={{ fontWeight: 400 }}>(opcional)</span></label>
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Motivo de la transferencia..."
            rows={3}
            style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
          />
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#FF4D4D', marginBottom: '14px', margin: '0 0 14px' }}>
            {error}
          </p>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px', borderRadius: '999px',
              background: '#F0F0F0', border: 'none',
              fontSize: '14px', fontWeight: 600, color: '#111111',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleTransferir}
            disabled={loading}
            style={{
              flex: 1, padding: '13px', borderRadius: '999px',
              background: '#F4C400', border: 'none',
              fontSize: '14px', fontWeight: 600, color: '#111111',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Transfiriendo...' : 'Transferir'}
          </button>
        </div>
      </div>
    </div>
  )
}
