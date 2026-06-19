'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Warehouse, MoreHorizontal, Plus, Search } from 'lucide-react'
import EmpleadoModal from './EmpleadoModal'
import type { Empleado, AlmacenRef } from '../page'

type Props = {
  empleados: Empleado[]
  almacenes: AlmacenRef[]
  empresaId: string
  currentUserId: string
}

type TabFiltro = 'todos' | 'activos' | 'inactivos'

export default function EmpleadosList({ empleados, almacenes, empresaId, currentUserId }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [tab, setTab] = useState<TabFiltro>('todos')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmpleado, setEditEmpleado] = useState<Empleado | null>(null)

  const total = empleados.length
  const activos = empleados.filter(e => e.activo).length
  const inactivos = empleados.filter(e => !e.activo).length

  const sorted = [...empleados].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    return a.nombre.localeCompare(b.nombre)
  })

  const filtered = sorted
    .filter(e =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.email.toLowerCase().includes(busqueda.toLowerCase())
    )
    .filter(e => {
      if (tab === 'activos') return e.activo
      if (tab === 'inactivos') return !e.activo
      return true
    })

  function openCreate() {
    setEditEmpleado(null)
    setModalOpen(true)
  }

  function openEdit(emp: Empleado) {
    setEditEmpleado(emp)
    setMenuOpenId(null)
    setModalOpen(true)
  }

  function handleSaved() {
    setModalOpen(false)
    router.refresh()
  }

  async function handleToggleActivo(emp: Empleado) {
    setMenuOpenId(null)
    await fetch('/api/empleados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: emp.id,
        nombre: emp.nombre,
        rol: emp.rol,
        activo: !emp.activo,
        almacen_id: emp.almacen_id,
      }),
    })
    router.refresh()
  }

  const tabs: { key: TabFiltro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'activos', label: 'Activos' },
    { key: 'inactivos', label: 'Inactivos' },
  ]

  return (
    <div style={{
      padding: '24px 20px', maxWidth: '700px', margin: '0 auto',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>Empleados</h1>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', borderRadius: '100px',
            background: '#F4C400', border: 'none',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#111111',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={15} />
          Nuevo empleado
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: total },
          { label: 'Activos', value: activos },
          { label: 'Inactivos', value: inactivos },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: '#FFFFFF', borderRadius: '14px',
            padding: '14px 16px', border: '1px solid #E8E8E8',
          }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#111111', margin: 0 }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: '#FFFFFF', border: '1px solid #E8E8E8',
        borderRadius: '16px', padding: '12px 16px',
        marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <Search size={18} style={{ color: '#6B6B6B', flexShrink: 0 }} />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar empleado..."
          style={{
            border: 'none', outline: 'none',
            background: 'transparent', color: '#111111',
            fontSize: '15px', width: '100%', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: '100px',
              border: tab === t.key ? 'none' : '1px solid #E8E8E8',
              background: tab === t.key ? '#F4C400' : '#FFFFFF',
              color: '#111111', fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState onNew={openCreate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(emp => (
            <EmpleadoCard
              key={emp.id}
              empleado={emp}
              isCurrentUser={emp.id === currentUserId}
              menuOpen={menuOpenId === emp.id}
              onMenuToggle={() => setMenuOpenId(menuOpenId === emp.id ? null : emp.id)}
              onEdit={() => openEdit(emp)}
              onToggleActivo={() => handleToggleActivo(emp)}
              onCloseMenu={() => setMenuOpenId(null)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <EmpleadoModal
          empleado={editEmpleado}
          almacenes={almacenes}
          currentUserId={currentUserId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

type CardProps = {
  empleado: Empleado
  isCurrentUser: boolean
  menuOpen: boolean
  onMenuToggle: () => void
  onEdit: () => void
  onToggleActivo: () => void
  onCloseMenu: () => void
}

function EmpleadoCard({ empleado, isCurrentUser, menuOpen, onMenuToggle, onEdit, onToggleActivo, onCloseMenu }: CardProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseMenu()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen, onCloseMenu])

  const menuItemStyle: React.CSSProperties = {
    display: 'flex', width: '100%', alignItems: 'center',
    padding: '11px 16px', background: 'none', border: 'none',
    fontSize: '14px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    color: '#111111',
  }

  const inicial = (empleado.nombre[0] ?? '?').toUpperCase()
  const almacenNombre = (empleado.almacenes as { nombre: string } | null)?.nombre

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '18px',
      padding: '16px 18px', border: '1px solid #E8E8E8',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      {/* Avatar */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
        background: '#F4C400', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', fontWeight: 700, color: '#111111',
      }}>
        {inicial}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
          <p style={{
            fontSize: '15px', fontWeight: 700, color: '#111111', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {empleado.nombre}
          </p>
          {isCurrentUser && (
            <span style={{
              padding: '1px 7px', borderRadius: '100px', flexShrink: 0,
              background: '#F4C400', color: '#111111',
              fontSize: '11px', fontWeight: 700,
            }}>
              Tú
            </span>
          )}
        </div>
        {empleado.email && (
          <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 6px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {empleado.email}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
            background: empleado.rol === 'admin' ? '#111111' : '#EFF6FF',
            color: empleado.rol === 'admin' ? '#FFFFFF' : '#3B82F6',
          }}>
            {empleado.rol === 'admin' ? 'Admin' : 'Trabajador'}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
            background: empleado.activo ? '#E6FDF8' : '#FFF0F0',
            color: empleado.activo ? '#00D7A7' : '#FF4D4D',
          }}>
            {empleado.activo ? 'Activo' : 'Inactivo'}
          </span>
          {almacenNombre && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B6B6B' }}>
              <Warehouse size={11} />
              {almacenNombre}
            </span>
          )}
        </div>
      </div>

      {/* Menú 3 puntos */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
        <button
          onClick={onMenuToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B6B6B', padding: '4px', display: 'flex', alignItems: 'center',
          }}
        >
          <MoreHorizontal size={18} />
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: '4px',
            background: '#FFFFFF', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #E8E8E8',
            minWidth: '140px', zIndex: 10, overflow: 'hidden',
          }}>
            <button onClick={onEdit} style={menuItemStyle}>
              Editar
            </button>
            {!isCurrentUser && (
              <>
                <div style={{ height: '1px', background: '#F0F0F0' }} />
                <button onClick={onToggleActivo} style={menuItemStyle}>
                  {empleado.activo ? 'Desactivar' : 'Activar'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px', gap: '12px', textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '20px',
        background: '#F8F6EA', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Users size={28} color="#6B6B6B" />
      </div>
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: 0 }}>
        No hay empleados aún
      </p>
      <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
        Crea el primer empleado para dar acceso al sistema
      </p>
      <button
        onClick={onNew}
        style={{
          marginTop: '8px', padding: '10px 20px', borderRadius: '100px',
          background: '#F4C400', border: 'none',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#111111',
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        Crear primer empleado
      </button>
    </div>
  )
}
