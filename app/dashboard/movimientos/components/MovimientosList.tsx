'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, Search, X, Clock, ArrowUp, ArrowDown, ArrowLeftRight, RotateCcw } from 'lucide-react'
import MovimientoDetalle from './MovimientoDetalle'

export type Movimiento = {
  id: string
  tipo: 'ingreso' | 'retiro' | 'transferencia' | 'ajuste' | 'ajuste_auditoria'
  cantidad: number
  nota: string | null
  foto_evidencia_url: string | null
  created_at: string
  almacen_id: string
  almacen_destino_id: string | null
  productos: { nombre: string; foto_url: string | null } | null
  perfiles: { nombre: string } | null
  almacenes: { nombre: string } | null
  almacenes_destino: { nombre: string } | null
}

type Almacen = {
  id: string
  nombre: string
}

type Props = {
  movimientos: Movimiento[]
  almacenes: Almacen[]
}

type TabTipo = 'todos' | 'ingreso' | 'retiro' | 'transferencia'

const tipoConfig = {
  ingreso: { label: 'Ingreso', bg: '#E6FDF8', color: '#00D7A7', Icon: ArrowUp },
  retiro: { label: 'Retiro', bg: '#FFF0F0', color: '#FF4D4D', Icon: ArrowDown },
  transferencia: { label: 'Transferencia', bg: '#FFF9E6', color: '#F4C400', Icon: ArrowLeftRight },
  ajuste: { label: 'Ajuste', bg: '#F5F5F5', color: '#6B6B6B', Icon: RotateCcw },
  ajuste_auditoria: { label: 'Ajuste', bg: '#F5F5F5', color: '#6B6B6B', Icon: RotateCcw },
}

const tabs: { key: TabTipo; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ingreso', label: 'Entradas' },
  { key: 'retiro', label: 'Salidas' },
  { key: 'transferencia', label: 'Transferencias' },
]

function localDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayKey(): string {
  return localDateKey(new Date().toISOString())
}

function getDateLabel(dateKey: string): string {
  const today = todayKey()
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const yesterday = localDateKey(d.toISOString())

  if (dateKey === today) return 'Hoy'
  if (dateKey === yesterday) return 'Ayer'
  const [y, mo, dy] = dateKey.split('-').map(Number)
  return new Date(y, mo - 1, dy).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function getQtyDisplay(tipo: Movimiento['tipo'], cantidad: number) {
  switch (tipo) {
    case 'ingreso': return { text: `+${cantidad}`, color: '#00D7A7' }
    case 'retiro': return { text: `-${cantidad}`, color: '#FF4D4D' }
    case 'transferencia': return { text: `-${cantidad}`, color: '#F4C400' }
    case 'ajuste': return { text: `${cantidad >= 0 ? '+' : ''}${cantidad}`, color: '#6B6B6B' }
    case 'ajuste_auditoria': return { text: `${cantidad >= 0 ? '+' : ''}${cantidad}`, color: '#6B6B6B' }
  }
}

export default function MovimientosList({ movimientos, almacenes }: Props) {
  const [activeTab, setActiveTab] = useState<TabTipo>('todos')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterAlmacen, setFilterAlmacen] = useState('')
  const [filterDesde, setFilterDesde] = useState('')
  const [filterHasta, setFilterHasta] = useState('')
  const [selected, setSelected] = useState<Movimiento | null>(null)

  const stats = useMemo(() => {
    const key = todayKey()
    const hoy = movimientos.filter(m => localDateKey(m.created_at) === key)
    return {
      entradas: hoy.filter(m => m.tipo === 'ingreso').length,
      salidas: hoy.filter(m => m.tipo === 'retiro').length,
      transferencias: hoy.filter(m => m.tipo === 'transferencia').length,
    }
  }, [movimientos])

  const filtered = useMemo(() => {
    return movimientos.filter(m => {
      if (activeTab !== 'todos' && m.tipo !== activeTab) return false
      if (search) {
        const nombre = m.productos?.nombre?.toLowerCase() ?? ''
        if (!nombre.includes(search.toLowerCase())) return false
      }
      if (filterAlmacen && m.almacen_id !== filterAlmacen) return false
      if (filterDesde && localDateKey(m.created_at) < filterDesde) return false
      if (filterHasta && localDateKey(m.created_at) > filterHasta) return false
      return true
    })
  }, [movimientos, activeTab, search, filterAlmacen, filterDesde, filterHasta])

  const grouped = useMemo(() => {
    const map = new Map<string, Movimiento[]>()
    for (const m of filtered) {
      const key = localDateKey(m.created_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      label: getDateLabel(key),
      items,
    }))
  }, [filtered])

  const hasFilters = Boolean(filterAlmacen || filterDesde || filterHasta)

  function clearFilters() {
    setFilterAlmacen('')
    setFilterDesde('')
    setFilterHasta('')
  }

  return (
    <div style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', minHeight: '100vh', background: '#F8F6EA' }}>

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#F8F6EA',
        padding: '20px 20px 12px',
        borderBottom: '1px solid #E8E8E8',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>Movimientos</h1>
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '100px',
              background: hasFilters ? '#F4C400' : '#FFFFFF',
              border: `1px solid ${hasFilters ? '#F4C400' : '#E8E8E8'}`,
              color: '#111111', fontWeight: 500, fontSize: '14px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <SlidersHorizontal size={15} />
            Filtrar
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
            <Search size={15} color="#6B6B6B" />
          </div>
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 36px 10px 36px',
              border: '1px solid #E8E8E8', borderRadius: '100px',
              fontSize: '14px', color: '#111111', background: '#FFFFFF',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B',
                display: 'flex', alignItems: 'center', padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E8E8', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>Filtros</span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{ fontSize: '13px', color: '#FF4D4D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                Limpiar
              </button>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Almacén</label>
            <select
              value={filterAlmacen}
              onChange={e => setFilterAlmacen(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #E8E8E8', borderRadius: '10px',
                fontSize: '14px', color: '#111111', background: '#FFFFFF',
                outline: 'none', fontFamily: 'inherit',
              }}
            >
              <option value="">Todos los almacenes</option>
              {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Desde</label>
              <input
                type="date"
                value={filterDesde}
                onChange={e => setFilterDesde(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1px solid #E8E8E8', borderRadius: '10px',
                  fontSize: '14px', color: '#111111', background: '#FFFFFF',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}>Hasta</label>
              <input
                type="date"
                value={filterHasta}
                onChange={e => setFilterHasta(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1px solid #E8E8E8', borderRadius: '10px',
                  fontSize: '14px', color: '#111111', background: '#FFFFFF',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Entradas hoy', value: stats.entradas, color: '#00D7A7', bg: '#E6FDF8' },
            { label: 'Salidas hoy', value: stats.salidas, color: '#FF4D4D', bg: '#FFF0F0' },
            { label: 'Transf. hoy', value: stats.transferencias, color: '#F4C400', bg: '#FFF9E6' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '12px 10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '4px', lineHeight: '1.3' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '2px' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 16px', borderRadius: '100px', border: 'none',
                background: activeTab === tab.key ? '#F4C400' : '#FFFFFF',
                color: '#111111',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <Clock size={48} color="#CCCCCC" />
            </div>
            <p style={{ color: '#6B6B6B', fontSize: '15px', margin: 0 }}>No hay movimientos registrados aún</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label} style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '12px', fontWeight: 600, color: '#6B6B6B',
                textTransform: 'capitalize', letterSpacing: '0.3px',
                marginBottom: '8px', paddingLeft: '2px',
              }}>
                {group.label}
              </div>

              <div style={{ background: '#E8E8E8', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {group.items.map(m => {
                  const cfg = tipoConfig[m.tipo]
                  const { Icon } = cfg
                  const qty = getQtyDisplay(m.tipo, m.cantidad)
                  const nombre = m.productos?.nombre ?? 'Producto eliminado'
                  const foto = m.productos?.foto_url ?? null
                  const empleado = m.perfiles?.nombre ?? '-'
                  const almacen = m.almacenes?.nombre ?? '-'

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelected(m)}
                      style={{
                        background: '#FFFFFF',
                        padding: '13px 14px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Time */}
                      <span style={{ fontSize: '11px', color: '#6B6B6B', width: '48px', flexShrink: 0, textAlign: 'right', lineHeight: '1.3' }}>
                        {formatTime(m.created_at)}
                      </span>

                      {/* Product photo */}
                      {foto ? (
                        <img
                          src={foto}
                          alt={nombre}
                          style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                          background: '#F4C400', color: '#111111',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '16px',
                        }}>
                          {nombre[0].toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px', fontWeight: 600, color: '#111111',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {nombre}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '3px',
                            background: cfg.bg, color: cfg.color,
                            padding: '2px 7px', borderRadius: '100px',
                            fontSize: '11px', fontWeight: 600, flexShrink: 0,
                          }}>
                            <Icon size={10} />
                            {cfg.label}
                          </div>
                          <span style={{
                            fontSize: '12px', color: '#6B6B6B',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {almacen} · {empleado}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <span style={{ fontSize: '16px', fontWeight: 700, color: qty.color, flexShrink: 0 }}>
                        {qty.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail bottom sheet */}
      {selected && (
        <MovimientoDetalle
          movimiento={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
