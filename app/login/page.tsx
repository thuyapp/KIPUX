'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, TrendingUp, Shield, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [negocio, setNegocio] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const router = useRouter()

  function resetForm() {
    setEmail('')
    setPassword('')
    setNombre('')
    setNegocio('')
    setAceptaTerminos(false)
    setError('')
    setMensaje('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Correo o contraseña incorrectos')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!aceptaTerminos) {
      setError('Debes aceptar los Términos y Política de Privacidad')
      return
    }
    if (!nombre || !email || !password) {
      setError('Todos los campos son requeridos')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, negocio, email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta')

      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) throw loginError

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  function inputStyle(field: string): React.CSSProperties {
    return {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${focusedField === field ? '#F4C400' : '#E8E8E8'}`,
      background: '#FFFFFF',
      fontSize: '14px',
      color: '#111111',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      outline: 'none',
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#111111',
    marginBottom: '6px',
  }

  const fieldWrap: React.CSSProperties = { marginBottom: '16px' }

  const bullets = [
    { Icon: Package, text: 'Controla tu stock en tiempo real' },
    { Icon: TrendingUp, text: 'Historial de movimientos completo' },
    { Icon: Shield, text: 'Seguro y multiusuario' },
  ]

  const isSubmitDisabled = loading || (modo === 'registro' && !aceptaTerminos)

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        display: 'flex',
      }}
    >
      {/* Columna izquierda — solo desktop */}
      <div
        className="hidden md:flex"
        style={{
          width: '45%',
          background: 'linear-gradient(135deg, #F4C400 0%, #D4A800 100%)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <div style={{ maxWidth: '320px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#111111', margin: '0 0 8px' }}>
            KIPUX
          </h1>
          <p style={{ fontSize: '16px', color: '#111111', opacity: 0.7, margin: '0 0 40px' }}>
            Inventario Inteligente
          </p>
          {bullets.map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
              <Icon size={18} color="#111111" />
              <span style={{ fontSize: '14px', color: '#111111' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Columna derecha */}
      <div
        style={{
          flex: 1,
          background: '#F8F6EA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Logo móvil */}
          <div
            className="flex md:hidden"
            style={{ justifyContent: 'center', marginBottom: '32px' }}
          >
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#F4C400' }}>KIPUX</span>
          </div>

          {modoRecuperar ? (
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
                Recuperar contraseña
              </h2>
              <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 24px' }}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              {emailEnviado ? (
                <div style={{ background: '#E8FFF6', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ color: '#00A67E', fontWeight: 600, margin: 0 }}>
                    ✓ Correo enviado. Revisa tu bandeja de entrada.
                  </p>
                </div>
              ) : (
                <>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#111111', display: 'block', marginBottom: '6px' }}>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E8E8E8', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={async () => {
                      setLoading(true)
                      const supabase = createClient()
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      })
                      if (error) setError(error.message)
                      else setEmailEnviado(true)
                      setLoading(false)
                    }}
                    style={{ width: '100%', padding: '14px', borderRadius: '999px', background: '#F4C400', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {loading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </>
              )}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#FFE8E8', borderRadius: '10px', padding: '12px',
                  marginTop: '12px',
                }}>
                  <AlertCircle size={16} color="#FF4D4D" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#FF4D4D' }}>{error}</span>
                </div>
              )}
              <button
                onClick={() => { setModoRecuperar(false); setEmailEnviado(false); setError('') }}
                style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: '#F4C400', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Volver al login
              </button>
            </div>
          ) : (
            <>
          {/* Título */}
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111111', margin: '0 0 6px' }}>
            {modo === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 28px' }}>
            Ingresa tus datos para continuar
          </p>

          {/* Formulario */}
          <form onSubmit={modo === 'login' ? handleLogin : handleRegister}>

            {modo === 'registro' && (
              <>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Nombre completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onFocus={() => setFocusedField('nombre')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Tu nombre"
                    required
                    style={inputStyle('nombre')}
                  />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Nombre del negocio</label>
                  <input
                    type="text"
                    value={negocio}
                    onChange={e => setNegocio(e.target.value)}
                    onFocus={() => setFocusedField('negocio')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Mi Empresa S.A."
                    style={inputStyle('negocio')}
                  />
                </div>
              </>
            )}

            <div style={fieldWrap}>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="tu@correo.com"
                required
                style={inputStyle('email')}
              />
            </div>

            <div style={{ marginBottom: modo === 'login' ? '8px' : '16px' }}>
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                required
                style={inputStyle('password')}
              />
            </div>

            {modo === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setModoRecuperar(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#F4C400', fontSize: '13px', fontWeight: 500,
                    fontFamily: 'inherit', padding: 0,
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {modo === 'registro' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                marginBottom: '16px', fontSize: '13px', color: '#6B6B6B',
              }}>
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={e => setAceptaTerminos(e.target.checked)}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <span>
                  Acepto los{' '}
                  <a href="/terminos" target="_blank" style={{ color: '#F4C400', textDecoration: 'none', fontWeight: 600 }}>
                    Términos y Condiciones
                  </a>
                  {' '}y la{' '}
                  <a href="/privacidad" target="_blank" style={{ color: '#F4C400', textDecoration: 'none', fontWeight: 600 }}>
                    Política de Privacidad
                  </a>
                </span>
              </div>
            )}

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#FFE8E8', borderRadius: '10px', padding: '12px',
                marginBottom: '16px',
              }}>
                <AlertCircle size={16} color="#FF4D4D" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#FF4D4D' }}>{error}</span>
              </div>
            )}

            {mensaje && (
              <div style={{
                background: '#F0FFF9', borderRadius: '10px', padding: '12px',
                marginBottom: '16px', fontSize: '13px', color: '#00D7A7',
              }}>
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '999px',
                border: 'none',
                background: '#F4C400',
                color: '#111111',
                fontWeight: 700,
                fontSize: '15px',
                fontFamily: 'inherit',
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                opacity: isSubmitDisabled ? 0.5 : 1,
              }}
            >
              {loading ? 'Cargando...' : (modo === 'login' ? 'Entrar' : 'Registrarse')}
            </button>
          </form>

          {/* Separador */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '24px 0', color: '#6B6B6B', fontSize: '13px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E8E8E8' }} />
            <span>o</span>
            <div style={{ flex: 1, height: '1px', background: '#E8E8E8' }} />
          </div>

          {/* Cambio de modo */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); resetForm() }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#F4C400', fontWeight: 600, fontSize: '14px',
                fontFamily: 'inherit',
              }}
            >
              {modo === 'login'
                ? '¿No tienes cuenta? Crear cuenta gratis →'
                : '¿Ya tienes cuenta? Iniciar sesión'}
            </button>
          </div>

          {/* Pie */}
          <p style={{
            fontSize: '12px', color: '#6B6B6B', textAlign: 'center',
            marginTop: '32px', lineHeight: 1.6,
          }}>
            Al continuar aceptas nuestros{' '}
            <a href="/terminos" target="_blank" style={{ color: '#F4C400', textDecoration: 'none' }}>
              Términos y Condiciones
            </a>
            {' '}y{' '}
            <a href="/privacidad" target="_blank" style={{ color: '#F4C400', textDecoration: 'none' }}>
              Política de Privacidad
            </a>
          </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
