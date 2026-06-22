'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ArrowLeftRight, Tag, Warehouse, Users, Settings, ClipboardList, Sparkles } from 'lucide-react'

const navItems = [
  { label: 'Inicio', href: '/dashboard', icon: Home },
  { label: 'Inventario', href: '/inventario', icon: Package },
  { label: 'Movimientos', href: '/dashboard/movimientos', icon: ArrowLeftRight },
  { label: 'Categorías', href: '/dashboard/categorias', icon: Tag },
  { label: 'Almacenes', href: '/dashboard/almacenes', icon: Warehouse },
  { label: 'Empleados', href: '/dashboard/empleados', icon: Users },
  { label: 'Auditoría', href: '/dashboard/auditoria', icon: ClipboardList },
  { label: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

type Props = {
  nombreUsuario: string
  rol: string
}

export default function Sidebar({ nombreUsuario, rol }: Props) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/inventario') return pathname === '/inventario' || pathname.startsWith('/inventario/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className="hidden md:flex md:flex-col"
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '240px', height: '100vh',
        background: '#F4C400', zIndex: 30,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, color: '#111111', letterSpacing: '-0.5px', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
          KIPUX
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                marginBottom: '2px',
                textDecoration: 'none',
                color: active ? '#FFFFFF' : '#111111',
                background: active ? '#111111' : 'transparent',
                fontSize: '14px',
                fontWeight: active ? 600 : 500,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={18} color={active ? '#FFFFFF' : '#111111'} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Cuadro decorativo */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', padding: '16px' }}>
          <Sparkles size={20} color="#111111" style={{ marginBottom: '8px' }} />
          <p style={{ fontWeight: 700, fontSize: '13px', color: '#111111', margin: '0 0 4px' }}>
            Mantén tu inventario al día
          </p>
          <p style={{ fontSize: '11px', color: '#111111', opacity: 0.7, margin: 0, lineHeight: 1.4 }}>
            Registra tus movimientos a tiempo para tener datos precisos.
          </p>
        </div>
      </div>

      {/* Usuario */}
      <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: '#FFFFFF', color: '#111111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '15px',
          }}>
            {nombreUsuario[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#111111', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nombreUsuario}
            </p>
            <p style={{ color: '#111111', fontSize: '11px', margin: 0, textTransform: 'capitalize', opacity: 0.6 }}>
              {rol}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
