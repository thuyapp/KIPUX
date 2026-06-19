'use client'

import { useState, useRef } from 'react'
import { X, ArrowUp, ArrowDown, ArrowLeftRight, RotateCcw, MapPin, User, Calendar, MessageSquare, Image as ImageIcon } from 'lucide-react'
import type { Movimiento } from './MovimientosList'

type Props = {
  movimiento: Movimiento
  onClose: () => void
}

const tipoConfig = {
  ingreso: { label: 'Ingreso', bg: '#E6FDF8', color: '#00D7A7', Icon: ArrowUp },
  retiro: { label: 'Retiro', bg: '#FFF0F0', color: '#FF4D4D', Icon: ArrowDown },
  transferencia: { label: 'Transferencia', bg: '#FFF9E6', color: '#F4C400', Icon: ArrowLeftRight },
  ajuste: { label: 'Ajuste', bg: '#F5F5F5', color: '#6B6B6B', Icon: RotateCcw },
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  const datePart = date.toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${datePart} · ${timePart}`
}

function getQtyDisplay(tipo: Movimiento['tipo'], cantidad: number) {
  switch (tipo) {
    case 'ingreso': return { text: `+${cantidad}`, color: '#00D7A7' }
    case 'retiro': return { text: `-${cantidad}`, color: '#FF4D4D' }
    case 'transferencia': return { text: `-${cantidad}`, color: '#F4C400' }
    case 'ajuste': return { text: `${cantidad >= 0 ? '+' : ''}${cantidad}`, color: '#6B6B6B' }
  }
}

export default function MovimientoDetalle({ movimiento: m, onClose }: Props) {
  const [showEvidencia, setShowEvidencia] = useState(false)
  const mouseDownOnOverlay = useRef(false)
  const config = tipoConfig[m.tipo]
  const { Icon } = config
  const qty = getQtyDisplay(m.tipo, m.cantidad)
  const productoNombre = m.productos?.nombre ?? 'Producto eliminado'
  const productoFoto = m.productos?.foto_url ?? null
  const empleadoNombre = m.perfiles?.nombre ?? 'Usuario desconocido'
  const almacenNombre = m.almacenes?.nombre ?? '-'
  const almacenDestinoNombre = m.almacenes_destino?.nombre ?? null

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
          width: '100%',
          maxWidth: '500px',
          background: '#FFFFFF',
          borderRadius: '24px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        {/* Header fijo con botón X */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6B6B6B', padding: '4px', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 32px' }}>
          {/* Product photo + name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            {productoFoto ? (
              <img
                src={productoFoto}
                alt={productoNombre}
                style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '80px', height: '80px', borderRadius: '16px',
                background: '#F4C400', color: '#111111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '32px', flexShrink: 0,
              }}>
                {productoNombre[0].toUpperCase()}
              </div>
            )}
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111111', textAlign: 'center', margin: 0 }}>
              {productoNombre}
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: config.bg, color: config.color,
              padding: '5px 14px', borderRadius: '100px',
              fontSize: '13px', fontWeight: 600,
            }}>
              <Icon size={13} />
              {config.label}
            </div>
          </div>

          {/* Big quantity */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: qty.color, lineHeight: 1 }}>
              {qty.text}
            </div>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '4px 0 0' }}>unidades</p>
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <InfoRow icon={<Calendar size={15} color="#6B6B6B" />} label="Fecha y hora">
              <span style={{ textTransform: 'capitalize' }}>{formatDateTime(m.created_at)}</span>
            </InfoRow>

            <InfoRow icon={<User size={15} color="#6B6B6B" />} label="Registrado por">
              {empleadoNombre}
            </InfoRow>

            <InfoRow
              icon={<MapPin size={15} color="#6B6B6B" />}
              label={m.tipo === 'transferencia' ? 'Origen' : 'Almacén'}
            >
              {almacenNombre}
            </InfoRow>

            {m.tipo === 'transferencia' && almacenDestinoNombre && (
              <InfoRow icon={<MapPin size={15} color="#F4C400" />} label="Destino">
                {almacenDestinoNombre}
              </InfoRow>
            )}

            {m.nota && (
              <InfoRow icon={<MessageSquare size={15} color="#6B6B6B" />} label="Nota">
                <span style={{ lineHeight: '1.5' }}>{m.nota}</span>
              </InfoRow>
            )}

            {m.foto_evidencia_url && (
              <InfoRow icon={<ImageIcon size={15} color="#6B6B6B" />} label="Foto evidencia">
                <img
                  src={m.foto_evidencia_url}
                  alt="Evidencia"
                  onClick={() => setShowEvidencia(true)}
                  style={{
                    width: '72px', height: '72px', borderRadius: '12px',
                    objectFit: 'cover', cursor: 'pointer',
                    border: '2px solid #E8E8E8', display: 'block', marginTop: '4px',
                  }}
                />
              </InfoRow>
            )}
          </div>
        </div>
      </div>

      {/* Evidence fullscreen viewer */}
      {showEvidencia && m.foto_evidencia_url && (
        <div
          onClick={() => setShowEvidencia(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(17,17,17,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <img
            src={m.foto_evidencia_url}
            alt="Evidencia completa"
            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '10px',
        background: '#F8F6EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: '14px', color: '#111111', margin: 0 }}>{children}</p>
      </div>
    </div>
  )
}
