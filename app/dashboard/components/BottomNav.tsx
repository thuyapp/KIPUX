'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Package, Plus, ArrowLeftRight, Menu, Tag, Warehouse, Users, Settings, ClipboardList } from 'lucide-react'

const moreItems = [
  { label: 'Categorías', href: '/dashboard/categorias', icon: Tag },
  { label: 'Almacenes', href: '/dashboard/almacenes', icon: Warehouse },
  { label: 'Empleados', href: '/dashboard/empleados', icon: Users },
  { label: 'Auditoría', href: '/dashboard/auditoria', icon: ClipboardList },
  { label: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/inventario') return pathname === '/inventario' || pathname.startsWith('/inventario/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  function tabColor(href: string) {
    return isActive(href) ? '#F4C400' : '#6B6B6B'
  }

  return (
    <>
      {/* Panel "Más" */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(17,17,17,0.4)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: '64px', left: 0, right: 0,
              background: '#FFFFFF', borderRadius: '20px 20px 0 0',
              padding: '8px 0 8px', boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
              fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
            }}
          >
            <div style={{ width: '32px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '8px auto 14px' }} />
            {moreItems.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 24px', color: '#111111', textDecoration: 'none',
                    fontSize: '15px', fontWeight: 500,
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Barra inferior — visible solo en móvil vía Tailwind (sin display en inline style) */}
      <div
        className="flex md:hidden items-center justify-around"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '64px', background: '#FFFFFF',
          borderTop: '1px solid #E8E8E8', zIndex: 30,
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        {/* Inicio */}
        <Link href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: tabColor('/dashboard'), textDecoration: 'none', flex: 1, padding: '8px 0' }}>
          <Home size={22} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Inicio</span>
        </Link>

        {/* Inventario */}
        <Link href="/inventario" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: tabColor('/inventario'), textDecoration: 'none', flex: 1, padding: '8px 0' }}>
          <Package size={22} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Inventario</span>
        </Link>

        {/* Botón central + */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/inventario?panel=true')}
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#F4C400', color: '#111111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', marginBottom: '10px',
              boxShadow: '0 2px 10px rgba(244,196,0,0.45)',
            }}
          >
            <Plus size={22} />
          </button>
        </div>

        {/* Movimientos */}
        <Link href="/dashboard/movimientos" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: tabColor('/dashboard/movimientos'), textDecoration: 'none', flex: 1, padding: '8px 0' }}>
          <ArrowLeftRight size={22} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Movimientos</span>
        </Link>

        {/* Más */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            color: '#6B6B6B', border: 'none', background: 'none',
            flex: 1, padding: '8px 0', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Menu size={22} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Más</span>
        </button>
      </div>
    </>
  )
}
