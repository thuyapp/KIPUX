'use client'

import { useState, useRef, useEffect } from 'react'
import { Warehouse, MoreHorizontal, Plus, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AlmacenModal from './AlmacenModal'
import type { Almacen } from '../page'

type Props = {
  almacenes: Almacen[]
  empresaId: string
}

function getProductCount(almacen: Almacen): number {
  return almacen.stock_por_almacen?.length ?? 0
}

function getValorTotal(almacen: Almacen): number {
  return (almacen.stock_por_almacen ?? []).reduce((sum, row) => {
    const costo = (row.productos as { costo_usd: number } | null)?.costo_usd ?? 0
    return sum + row.stock_actual * costo
  }, 0)
}

export default function AlmacenesList({ almacenes, empresaId }: Props) {
  const router = useRouter()
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editAlmacen, setEditAlmacen] = useState<Almacen | null>(null)

  const total = almacenes.length
  const activos = almacenes.filter(a => a.activo).length
  const inactivos = almacenes.filter(a => !a.activo).length

  function openCreate() {
    setEditAlmacen(null)
    setModalOpen(true)
  }

  function openEdit(almacen: Almacen) {
    setEditAlmacen(almacen)
    setMenuOpenId(null)
    setModalOpen(true)
  }

  function handleSaved() {
    setModalOpen(false)
    router.refresh()
  }

  async function handleToggleActivo(almacen: Almacen) {
    setMenuOpenId(null)
    const supabase = createClient()
    await supabase.from('almacenes').update({ activo: !almacen.activo }).eq('id', almacen.id)
    router.refresh()
  }

  return (
    <div style={{
      padding: '24px 20px', maxWidth: '700px', margin: '0 auto',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>Almacenes</h1>
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
          Nuevo almacén
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

      {/* Lista */}
      {almacenes.length === 0 ? (
        <EmptyState onNew={openCreate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {almacenes.map(almacen => (
            <AlmacenCard
              key={almacen.id}
              almacen={almacen}
              count={getProductCount(almacen)}
              valor={getValorTotal(almacen)}
              menuOpen={menuOpenId === almacen.id}
              onMenuToggle={() => setMenuOpenId(menuOpenId === almacen.id ? null : almacen.id)}
              onEdit={() => openEdit(almacen)}
              onToggleActivo={() => handleToggleActivo(almacen)}
              onCloseMenu={() => setMenuOpenId(null)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <AlmacenModal
          almacen={editAlmacen}
          empresaId={empresaId}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

type CardProps = {
  almacen: Almacen
  count: number
  valor: number
  menuOpen: boolean
  onMenuToggle: () => void
  onEdit: () => void
  onToggleActivo: () => void
  onCloseMenu: () => void
}

function AlmacenCard({ almacen, count, valor, menuOpen, onMenuToggle, onEdit, onToggleActivo, onCloseMenu }: CardProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
      background: '#FFFFFF', borderRadius: '18px',
      padding: '18px 18px 16px', border: '1px solid #E8E8E8',
    }}>
      {/* Fila superior */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Ícono */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
          background: almacen.activo ? '#F4C400' : '#E8E8E8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Warehouse size={24} color={almacen.activo ? '#111111' : '#6B6B6B'} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <p style={{
              fontSize: '16px', fontWeight: 700, color: '#111111', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {almacen.nombre}
            </p>
            {almacen.es_default && (
              <span style={{
                padding: '2px 8px', borderRadius: '100px', flexShrink: 0,
                background: '#F4C400', color: '#111111',
                fontSize: '11px', fontWeight: 700,
              }}>
                Principal
              </span>
            )}
          </div>
          {almacen.ubicacion && (
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 4px' }}>
              {almacen.ubicacion}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>
              {count} producto{count !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>•</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
              ${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Badge + menú */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            padding: '4px 10px', borderRadius: '100px',
            background: almacen.activo ? '#E6FDF8' : '#FFF0F0',
            color: almacen.activo ? '#00D7A7' : '#FF4D4D',
            fontSize: '12px', fontWeight: 600,
          }}>
            {almacen.activo ? 'Activo' : 'Inactivo'}
          </div>

          <div style={{ position: 'relative' }} ref={menuRef}>
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
                minWidth: '160px', zIndex: 10, overflow: 'hidden',
              }}>
                <button onClick={onEdit} style={menuItemStyle}>
                  Editar
                </button>
                <div style={{ height: '1px', background: '#F0F0F0' }} />
                <button onClick={onToggleActivo} style={menuItemStyle}>
                  {almacen.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón Ver inventario */}
      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F0F0F0' }}>
        <button
          onClick={() => router.push(`/dashboard?almacen=${almacen.id}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '100px',
            background: '#F4C400', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#111111',
            fontFamily: 'inherit',
          }}
        >
          Ver inventario
          <ArrowRight size={14} />
        </button>
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
        <Warehouse size={28} color="#6B6B6B" />
      </div>
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: 0 }}>
        No hay almacenes aún
      </p>
      <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
        Crea tu primer almacén para empezar a gestionar el inventario
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
        Crear primer almacén
      </button>
    </div>
  )
}
