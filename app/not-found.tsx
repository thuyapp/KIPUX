import { PackageSearch } from 'lucide-react'

export default function NotFound() {
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
          background: '#F0F0F0', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <PackageSearch size={32} color="#6B6B6B" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
          Página no encontrada
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 32px', lineHeight: 1.6 }}>
          La página que buscas no existe o fue movida.
        </p>
        <a
          href="/dashboard"
          style={{
            background: '#F4C400', color: '#111111',
            borderRadius: '999px', padding: '12px 24px',
            fontSize: '14px', fontWeight: 600,
            textDecoration: 'none', display: 'inline-block'
          }}
        >
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
