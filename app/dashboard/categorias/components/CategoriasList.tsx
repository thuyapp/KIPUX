'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CategoriaModal from './CategoriaModal'
import type { Categoria } from '../page'

type Tab = 'todas' | 'activas' | 'inactivas'

type Props = {
  categorias: Categoria[]
  empresaId: string
}

function getProductCount(cat: Categoria): number {
  const p = cat.productos
  if (!p) return 0
  if (Array.isArray(p)) return p[0]?.count ?? 0
  return (p as { count: number }).count ?? 0
}

export default function CategoriasList({ categorias, empresaId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('todas')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCategoria, setEditCategoria] = useState<Categoria | null>(null)

  const total = categorias.length
  const activas = categorias.filter(c => c.activo).length
  const inactivas = categorias.filter(c => !c.activo).length

  const filtered = categorias.filter(cat => {
    const matchSearch = cat.nombre.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'todas' ? true : tab === 'activas' ? cat.activo : !cat.activo
    return matchSearch && matchTab
  })

  function openCreate() {
    setEditCategoria(null)
    setModalOpen(true)
  }

  function openEdit(cat: Categoria) {
    setEditCategoria(cat)
    setMenuOpenId(null)
    setModalOpen(true)
  }

  function handleSaved() {
    setModalOpen(false)
    router.refresh()
  }

  async function handleToggleActivo(cat: Categoria) {
    setMenuOpenId(null)
    const supabase = createClient()
    await supabase.from('categorias').update({ activo: !cat.activo }).eq('id', cat.id)
    router.refresh()
  }

  return (
    <div style={{
      padding: '24px 20px', maxWidth: '700px', margin: '0 auto',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>Categorías</h1>
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
          Nueva categoría
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total', value: total },
          { label: 'Activas', value: activas },
          { label: 'Inactivas', value: inactivas },
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
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6B6B6B', pointerEvents: 'none' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar categoría..."
          style={{
            width: '100%', padding: '10px 14px 10px 40px',
            borderRadius: '12px', border: '1.5px solid #E8E8E8',
            fontSize: '14px', color: '#111111', background: '#FFFFFF',
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['todas', 'activas', 'inactivas'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 16px', borderRadius: '100px',
              border: tab === t ? 'none' : '1.5px solid #E8E8E8',
              background: tab === t ? '#F4C400' : '#FFFFFF',
              color: '#111111', fontSize: '13px', fontWeight: tab === t ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState onNew={openCreate} searching={search.length > 0 || tab !== 'todas'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(cat => (
            <CategoriaRow
              key={cat.id}
              cat={cat}
              count={getProductCount(cat)}
              menuOpen={menuOpenId === cat.id}
              onMenuToggle={() => setMenuOpenId(menuOpenId === cat.id ? null : cat.id)}
              onEdit={() => openEdit(cat)}
              onToggleActivo={() => handleToggleActivo(cat)}
              onCloseMenu={() => setMenuOpenId(null)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <CategoriaModal
          categoria={editCategoria}
          empresaId={empresaId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

type RowProps = {
  cat: Categoria
  count: number
  menuOpen: boolean
  onMenuToggle: () => void
  onEdit: () => void
  onToggleActivo: () => void
  onCloseMenu: () => void
}

function CategoriaRow({ cat, count, menuOpen, onMenuToggle, onEdit, onToggleActivo, onCloseMenu }: RowProps) {
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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      background: '#FFFFFF', borderRadius: '16px',
      padding: '14px 16px', border: '1px solid #E8E8E8',
    }}>
      {/* Círculo con emoji */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
        background: cat.color ?? '#E8E8E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px',
      }}>
        {cat.icono ?? '📦'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '15px', fontWeight: 600, color: '#111111', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {cat.nombre}
        </p>
        <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
          {count} producto{count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Badge */}
      <div style={{
        padding: '4px 10px', borderRadius: '100px', flexShrink: 0,
        background: cat.activo ? '#E6FDF8' : '#FFF0F0',
        color: cat.activo ? '#00D7A7' : '#FF4D4D',
        fontSize: '12px', fontWeight: 600,
      }}>
        {cat.activo ? 'Activa' : 'Inactiva'}
      </div>

      {/* Menú tres puntos */}
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
            minWidth: '170px', zIndex: 10, overflow: 'hidden',
          }}>
            <button onClick={onEdit} style={menuItemStyle}>
              Editar
            </button>
            <div style={{ height: '1px', background: '#F0F0F0' }} />
            <button onClick={onToggleActivo} style={menuItemStyle}>
              {cat.activo ? 'Desactivar' : 'Activar'}
            </button>
            <div style={{ height: '1px', background: '#F0F0F0' }} />
            <button onClick={onEdit} style={{ ...menuItemStyle, color: '#FF4D4D' }}>
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onNew, searching }: { onNew: () => void; searching: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px', gap: '12px', textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '20px',
        background: '#F8F6EA', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Tag size={28} color="#6B6B6B" />
      </div>
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: 0 }}>
        {searching ? 'Sin resultados' : 'No hay categorías aún'}
      </p>
      {searching ? (
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
          Intenta con otro término o cambia el filtro
        </p>
      ) : (
        <>
          <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
            Organiza tu inventario agrupando productos por categorías
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
            Crear primera categoría
          </button>
        </>
      )}
    </div>
  )
}
