'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [mostrar, setMostrar] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [])

  const handleReset = async () => {
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setExito(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6EA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '48px 40px', maxWidth: '420px', width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#F4C400', marginBottom: '24px' }}>KIPUX</div>
        {exito ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>¡Contraseña actualizada!</h2>
            <p style={{ color: '#6B6B6B', margin: '0 0 24px' }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <a href="/login" style={{ background: '#F4C400', color: '#111111', borderRadius: '999px', padding: '12px 24px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
              Ir al login
            </a>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>Nueva contraseña</h2>
            <p style={{ color: '#6B6B6B', fontSize: '14px', margin: '0 0 24px' }}>Elige una contraseña segura para tu cuenta.</p>
            {error && <div style={{ background: '#FFE8E8', borderRadius: '10px', padding: '12px', color: '#FF4D4D', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nueva contraseña</label>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type={mostrar ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: '10px', border: '1px solid #E8E8E8', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <button onClick={() => setMostrar(!mostrar)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {mostrar ? <EyeOff size={16} color="#6B6B6B" /> : <Eye size={16} color="#6B6B6B" />}
              </button>
            </div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="Repite tu contraseña"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E8E8E8', fontSize: '14px', marginBottom: '24px', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleReset}
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '999px', background: '#F4C400', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
