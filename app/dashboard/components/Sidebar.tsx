'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ArrowLeftRight, Tag, Warehouse, Users, Settings, ClipboardList } from 'lucide-react'

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
        background: '#111111', zIndex: 30,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, color: '#F4C400', letterSpacing: '-0.5px', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
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
                borderRadius: '10px',
                marginBottom: '2px',
                textDecoration: 'none',
                color: active ? '#F4C400' : '#A0A0A0',
                background: active ? 'rgba(244,196,0,0.10)' : 'transparent',
                borderLeft: active ? '3px solid #F4C400' : '3px solid transparent',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                transition: 'color 0.15s',
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: '#F4C400', color: '#111111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '15px',
          }}>
            {nombreUsuario[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nombreUsuario}
            </p>
            <p style={{ color: '#A0A0A0', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>
              {rol}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
