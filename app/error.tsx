'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F6EA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: '#FFE8E8', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <AlertTriangle size={32} color="#FF4D4D" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
          Algo salió mal
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 32px', lineHeight: 1.6 }}>
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#F4C400', color: '#111111',
              border: 'none', borderRadius: '999px',
              padding: '12px 24px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Intentar de nuevo
          </button>
          <a
            href="/dashboard"
            style={{
              background: '#111111', color: '#FFFFFF',
              borderRadius: '999px', padding: '12px 24px',
              fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', display: 'inline-block'
            }}
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
