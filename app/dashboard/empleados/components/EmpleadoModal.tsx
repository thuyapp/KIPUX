'use client'

import { useState, useRef } from 'react'
import type { CSSProperties } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import type { Empleado, AlmacenRef } from '../page'

type Props = {
  empleado: Empleado | null
  almacenes: AlmacenRef[]
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1.5px solid #E8E8E8', fontSize: '15px', color: '#111111',
  background: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

type Rol = 'admin' | 'trabajador'

export default function EmpleadoModal({ empleado, almacenes, currentUserId, onClose, onSaved }: Props) {
  const isEditing = empleado !== null
  const isCurrentUser = isEditing && empleado!.id === currentUserId

  const [nombre, setNombre] = useState(empleado?.nombre ?? '')
  const [email, setEmail] = useState(empleado?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rol, setRol] = useState<Rol>((empleado?.rol as Rol) ?? 'trabajador')
  const [almacenId, setAlmacenId] = useState(empleado?.almacen_id ?? '')
  const [activo, setActivo] = useState(empleado?.activo ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mouseDownOnOverlay = useRef(false)

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    if (!isEditing && !email.trim()) { setError('El correo es requerido'); return }
    if (!isEditing && password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (isEditing && password && password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }

    setSaving(true)
    setError(null)

    const res = await fetch('/api/empleados', {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isEditing
          ? { userId: empleado!.id, nombre, rol, activo, almacen_id: almacenId || null, password: password || undefined }
          : { nombre, email, password, rol, almacen_id: almacenId || null, activo }
      ),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error ?? 'Error al guardar')
      setSaving(false)
      return
    }
    onSaved()
  }

  async function handleDeactivate() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/empleados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: empleado!.id,
        nombre: empleado!.nombre,
        rol: empleado!.rol,
        activo: false,
        almacen_id: empleado!.almacen_id,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      setError(data.error ?? 'Error al desactivar')
      setSaving(false)
      return
    }
    onSaved()
  }

  const roles: { key: Rol; label: string; desc: string }[] = [
    { key: 'admin', label: 'Administrador', desc: 'Acceso total al sistema' },
    { key: 'trabajador', label: 'Trabajador', desc: 'Solo acceso al Modo Auditoría' },
  ]

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
            {isEditing ? 'Editar empleado' : 'Nuevo empleado'}
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
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>NOMBRE COMPLETO *</p>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: María González"
              style={inputStyle}
            />
          </div>

          {/* Correo */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              CORREO ELECTRÓNICO {!isEditing && '*'}
            </p>
            {isEditing ? (
              <div style={{ ...inputStyle, background: '#F8F6EA', color: '#6B6B6B' }}>
                {email || '—'}
              </div>
            ) : (
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="empleado@empresa.com"
                type="email"
                style={inputStyle}
              />
            )}
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {isEditing ? 'NUEVA CONTRASEÑA' : 'CONTRASEÑA INICIAL *'}
            </p>
            <div style={{ position: 'relative' }}>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                style={{ ...inputStyle, paddingRight: '44px' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                type="button"
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6B6B6B', padding: '4px', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Rol */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>ROL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roles.map(r => (
                <button
                  key={r.key}
                  onClick={() => !isCurrentUser && setRol(r.key)}
                  disabled={isCurrentUser}
                  style={{
                    padding: '12px 14px', borderRadius: '12px', textAlign: 'left',
                    cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                    border: rol === r.key ? '2px solid #F4C400' : '1.5px solid #E8E8E8',
                    background: rol === r.key ? 'rgba(244,196,0,0.08)' : '#FFFFFF',
                    fontFamily: 'inherit', opacity: isCurrentUser ? 0.6 : 1,
                  }}
                >
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>{r.label}</p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>{r.desc}</p>
                </button>
              ))}
            </div>
            {isCurrentUser && (
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '6px 0 0' }}>No puedes cambiar tu propio rol.</p>
            )}
          </div>

          {/* Almacén asignado */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>ALMACÉN ASIGNADO</p>
            <select
              value={almacenId}
              onChange={e => setAlmacenId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Sin asignación</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          {/* Toggle activo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px', background: '#F8F6EA', borderRadius: '12px',
            marginBottom: '8px',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>Empleado activo</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                {activo ? 'Puede acceder al sistema' : 'Sin acceso al sistema'}
              </p>
            </div>
            <button
              onClick={() => !isCurrentUser && setActivo(!activo)}
              disabled={isCurrentUser}
              style={{
                width: '48px', height: '28px', borderRadius: '14px',
                background: activo ? '#00D7A7' : '#E8E8E8',
                border: 'none', cursor: isCurrentUser ? 'not-allowed' : 'pointer', padding: '3px',
                display: 'flex', alignItems: 'center',
                justifyContent: activo ? 'flex-end' : 'flex-start',
                flexShrink: 0, opacity: isCurrentUser ? 0.6 : 1,
              }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF' }} />
            </button>
          </div>

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
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear empleado'}
            </button>
          </div>

          {isEditing && !isCurrentUser && (
            <button
              onClick={handleDeactivate}
              disabled={saving}
              style={{
                background: 'none', border: 'none', cursor: saving ? 'wait' : 'pointer',
                color: '#FF4D4D', fontSize: '14px', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', fontFamily: 'inherit',
              }}
            >
              Desactivar empleado
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
