'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, Search, Plus, Package, Edit2, Warehouse, X,
  Scan, ChevronDown, RotateCcw, Upload, PlusCircle, TrendingUp,
  DollarSign, AlertTriangle, ShoppingBag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StockModal from './StockModal'

export type Producto = {
  id: string
  nombre: string
  sku?: string | null
  foto_url: string | null
  stock_actual: number
  stock_minimo: number
  unidad: string
  costo_usd: number
  categorias: {
    nombre: string
    color?: string | null
    icono?: string | null
  } | null
  ultimoMovimiento?: {
    tipo: string
    cantidad: number
    created_at: string
  } | null
}

export type ProductoConMovimiento = Producto & {
  ultimoMovimiento: { tipo: string; cantidad: number; created_at: string } | null
}

type AlmacenRef = { id: string; nombre: string } | null
type FiltroEstado = 'todos' | 'saludable' | 'bajo' | 'agotado'
type ModalState = { producto: Producto; tipo: 'ingreso' | 'retiro' } | null

function getStockBadge(p: Producto) {
  if (p.stock_actual === 0) return { label: 'Agotado', bg: '#FF4D4D', color: '#FFFFFF' }
  if (p.stock_actual <= p.stock_minimo) return { label: 'Bajo stock', bg: '#F4C400', color: '#111111' }
  return { label: 'Saludable', bg: '#00D7A7', color: '#FFFFFF' }
}

function Tendencia({ mov }: { mov?: { tipo: string; cantidad: number } | null }) {
  if (!mov) return null
  const esIngreso = mov.tipo === 'ingreso'
  return (
    <span style={{
      fontSize: '12px', fontWeight: 600,
      color: esIngreso ? '#00D7A7' : '#FF4D4D',
    }}>
      {esIngreso ? '↑ +' : '↓ -'}{mov.cantidad}
    </span>
  )
}

export default function ProductList({
  productos,
  almacenDefault,
  nombreUsuario,
  almacenFiltro,
  almacenNombreFiltro,
  filtroEstadoInicial,
  panelAbierto,
  kpis,
}: {
  productos: Producto[]
  almacenDefault: AlmacenRef
  nombreUsuario: string
  almacenFiltro?: string
  almacenNombreFiltro?: string
  filtroEstadoInicial?: string
  panelAbierto?: boolean
  kpis?: {
    valorTotal?: number
    stockBajoCount?: number
    agotadosCount?: number
    nuevosEstaSemana?: number
  }
}) {
  const router = useRouter()

  const validEstados: FiltroEstado[] = ['todos', 'saludable', 'bajo', 'agotado']
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>(
    validEstados.includes(filtroEstadoInicial as FiltroEstado)
      ? (filtroEstadoInicial as FiltroEstado)
      : 'todos'
  )
  const [busqueda, setBusqueda] = useState('')
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])
  const [almacenesSeleccionados, setAlmacenesSeleccionados] = useState<string[]>([])
  const [almacenesDB, setAlmacenesDB] = useState<{ id: string; nombre: string }[]>([])
  const [modal, setModal] = useState<ModalState>(null)
  const [mostrarPanelAcciones, setMostrarPanelAcciones] = useState(false)
  const [mostrarDropCategoria, setMostrarDropCategoria] = useState(false)
  const [mostrarDropAlmacen, setMostrarDropAlmacen] = useState(false)

  const dropCatRef = useRef<HTMLDivElement>(null)
  const dropAlmRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('almacenes').select('id, nombre').eq('activo', true).then(({ data }) => {
      if (data) setAlmacenesDB(data)
    })
  }, [])

  // Abrir panel si llegó como prop desde URL (?panel=true)
  useEffect(() => {
    if (panelAbierto) {
      setMostrarPanelAcciones(true)
      router.replace('/inventario')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (!dropCatRef.current?.contains(target)) setMostrarDropCategoria(false)
      if (!dropAlmRef.current?.contains(target)) setMostrarDropAlmacen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const efectivoAlmacen: AlmacenRef = almacenFiltro
    ? { id: almacenFiltro, nombre: almacenNombreFiltro ?? '' }
    : almacenDefault

  // KPI values — use server-passed kpis if available, else compute from productos
  const totalProductos = productos.length
  const valorTotal = kpis?.valorTotal ?? productos.reduce((sum, p) => sum + p.costo_usd * p.stock_actual, 0)
  const stockBajoCount = kpis?.stockBajoCount ?? productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
  const agotadosCount = kpis?.agotadosCount ?? productos.filter(p => p.stock_actual === 0).length
  const nuevosEstaSemana = kpis?.nuevosEstaSemana ?? 0

  const categoriasUnicas = Array.from(
    new Set(productos.map(p => p.categorias?.nombre).filter((c): c is string => !!c))
  ).sort()

  const productosFiltrados = productos
    .filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter(p => {
      if (filtroEstado === 'saludable') return p.stock_actual > p.stock_minimo
      if (filtroEstado === 'bajo') return p.stock_actual > 0 && p.stock_actual <= p.stock_minimo
      if (filtroEstado === 'agotado') return p.stock_actual === 0
      return true
    })
    .filter(p => categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(p.categorias?.nombre ?? ''))
    .filter(() => almacenesSeleccionados.length === 0)

  const hayFiltrosActivos =
    filtroEstado !== 'todos' || categoriasSeleccionadas.length > 0 || almacenesSeleccionados.length > 0

  function limpiarFiltros() {
    setFiltroEstado('todos')
    setCategoriasSeleccionadas([])
    setAlmacenesSeleccionados([])
  }

  function handleSuccess() {
    setModal(null)
    router.refresh()
  }

  function toggleCategoria(cat: string) {
    setCategoriasSeleccionadas(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function toggleAlmacen(id: string) {
    setAlmacenesSeleccionados(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const estadoPills: { key: FiltroEstado; label: string; dot?: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'saludable', label: 'Saludable', dot: '#00D7A7' },
    { key: 'bajo', label: 'Bajo stock', dot: '#F4C400' },
    { key: 'agotado', label: 'Agotado', dot: '#FF4D4D' },
  ]

  const pillStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '999px', whiteSpace: 'nowrap',
    border: active ? 'none' : '1px solid #E8E8E8',
    background: active ? '#111111' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#111111',
    fontWeight: active ? 600 : 400,
    fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
  })

  const dropTriggerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px',
    border: '1px solid #E8E8E8', background: '#FFFFFF',
    color: '#111111', fontSize: '13px',
    cursor: 'pointer', fontFamily: 'inherit',
    whiteSpace: 'nowrap', flexShrink: 0,
  }

  const dropPanelStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
    background: '#FFFFFF', borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    padding: '8px', minWidth: '180px',
  }

  const dropItemStyle = (selected: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
    background: selected ? '#F8F6EA' : 'transparent',
    fontSize: '13px', color: '#111111',
  })

  return (
    <div style={{ background: '#F8F6EA', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '28px 16px 100px' }}>

        {/* Saludo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>
              Hola, {nombreUsuario} 👋
            </h1>
            <p style={{ fontSize: '15px', color: '#6B6B6B', margin: 0 }}>
              Tu inventario está bajo control.
            </p>
          </div>
          <button style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #E8E8E8', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flexShrink: 0 }}>
            <Bell size={18} />
          </button>
        </div>

        {/* KPI cards — rediseñadas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
          {/* Total productos */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Package size={20} color="#6366F1" />
            </div>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 4px' }}>Total productos</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#111111', margin: '0 0 4px', lineHeight: 1 }}>{totalProductos}</p>
            <p style={{ fontSize: '13px', color: '#00A67E', margin: 0 }}>↑ {nuevosEstaSemana} nuevos esta semana</p>
          </div>
          {/* Valor inventario */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <DollarSign size={20} color="#EAB308" />
            </div>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 4px' }}>Valor inventario</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#111111', margin: '0 0 4px', lineHeight: 1 }}>
              ${valorTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>en stock actual</p>
          </div>
          {/* Bajo stock */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <AlertTriangle size={20} color="#EF4444" />
            </div>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 4px' }}>Bajo stock</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#EF4444', margin: '0 0 4px', lineHeight: 1 }}>{stockBajoCount}</p>
            <Link href="/inventario?estado=bajo" style={{ fontSize: '13px', color: '#EF4444', textDecoration: 'none' }}>Ver productos →</Link>
          </div>
          {/* Agotados */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <ShoppingBag size={20} color="#EF4444" />
            </div>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 4px' }}>Agotados</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#EF4444', margin: '0 0 4px', lineHeight: 1 }}>{agotadosCount}</p>
            <Link href="/inventario?estado=agotado" style={{ fontSize: '13px', color: '#EF4444', textDecoration: 'none' }}>Ver productos →</Link>
          </div>
        </div>

        {/* Header inventario */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>Inventario</h2>
          <div className="flex w-full md:w-auto" style={{ gap: '8px' }}>
            <button
              onClick={() => router.push('/dashboard/camara')}
              className="flex-1 md:flex-none"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 18px', borderRadius: '999px', border: 'none', background: '#111111', color: '#FFFFFF', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Scan size={16} />
              Carga masiva
            </button>
            <button
              onClick={() => router.push('/dashboard/productos/nuevo')}
              className="flex-1 md:flex-none"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 18px', borderRadius: '999px', border: 'none', background: '#F4C400', color: '#111111', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Nuevo producto
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '16px', padding: '12px 16px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Search size={18} style={{ color: '#6B6B6B', flexShrink: 0 }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            style={{ border: 'none', outline: 'none', background: 'transparent', color: '#111111', fontSize: '15px', width: '100%', fontFamily: 'inherit' }}
          />
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', paddingRight: '16px', marginBottom: '20px', alignItems: 'center' }}>
          {estadoPills.map(pill => (
            <button key={pill.key} onClick={() => setFiltroEstado(pill.key)} style={pillStyle(filtroEstado === pill.key)}>
              {pill.dot && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: filtroEstado === pill.key ? '#FFFFFF' : pill.dot, flexShrink: 0, display: 'inline-block' }} />
              )}
              {pill.label}
            </button>
          ))}

          {/* Dropdown categorías */}
          <div ref={dropCatRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => { setMostrarDropCategoria(v => !v); setMostrarDropAlmacen(false) }} style={dropTriggerStyle}>
              {categoriasSeleccionadas.length > 0 ? `Categorías (${categoriasSeleccionadas.length})` : 'Categorías'}
              <ChevronDown size={14} />
            </button>
            {mostrarDropCategoria && categoriasUnicas.length > 0 && (
              <div style={dropPanelStyle}>
                {categoriasUnicas.map(cat => (
                  <div key={cat} onClick={() => toggleCategoria(cat)} style={dropItemStyle(categoriasSeleccionadas.includes(cat))}>
                    <input type="checkbox" readOnly checked={categoriasSeleccionadas.includes(cat)} style={{ accentColor: '#111111', cursor: 'pointer', flexShrink: 0 }} />
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown almacenes */}
          <div ref={dropAlmRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => { setMostrarDropAlmacen(v => !v); setMostrarDropCategoria(false) }} style={dropTriggerStyle}>
              {almacenesSeleccionados.length > 0 ? `Almacenes (${almacenesSeleccionados.length})` : 'Almacenes'}
              <ChevronDown size={14} />
            </button>
            {mostrarDropAlmacen && almacenesDB.length > 0 && (
              <div style={dropPanelStyle}>
                {almacenesDB.map(alm => (
                  <div key={alm.id} onClick={() => toggleAlmacen(alm.id)} style={dropItemStyle(almacenesSeleccionados.includes(alm.id))}>
                    <input type="checkbox" readOnly checked={almacenesSeleccionados.includes(alm.id)} style={{ accentColor: '#111111', cursor: 'pointer', flexShrink: 0 }} />
                    {alm.nombre}
                  </div>
                ))}
              </div>
            )}
          </div>

          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#6B6B6B', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <RotateCcw size={13} />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Banner almacén filtrado */}
        {almacenFiltro && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244,196,0,0.12)', border: '1.5px solid #F4C400', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Warehouse size={18} color="#111111" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>
                Inventario de: {almacenNombreFiltro ?? 'Almacén'}
              </span>
            </div>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111111', padding: '4px', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Lista de productos */}
        {productosFiltrados.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '12px' }}>
            <Package size={48} style={{ color: '#E8E8E8' }} />
            <p style={{ color: '#6B6B6B', fontSize: '15px', textAlign: 'center', margin: 0 }}>
              {busqueda ? 'No hay productos que coincidan con la búsqueda.' : almacenFiltro ? 'Este almacén no tiene productos en stock.' : 'No hay productos en esta categoría.'}
            </p>
          </div>
        ) : (
          <>
            {/* ── MÓVIL: tarjetas ── */}
            <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {productosFiltrados.map(producto => {
                const badge = getStockBadge(producto)
                const valorTotalP = (producto.costo_usd * producto.stock_actual).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                const precioU = producto.costo_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                return (
                  <Link key={producto.id} href={`/inventario/${producto.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                      {/* Foto */}
                      {producto.foto_url ? (
                        <img src={producto.foto_url} alt={producto.nombre} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', flexShrink: 0, background: '#F0F0F0', color: '#6B6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '22px' }}>
                          {producto.nombre[0].toUpperCase()}
                        </div>
                      )}
                      {/* Centro */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: '#111111', margin: '0 0 3px', lineHeight: 1.3 }}>{producto.nombre}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: '#6B6B6B' }}>{producto.categorias?.nombre ?? 'Sin categoría'}</span>
                          <span style={{ background: badge.bg, color: badge.color, fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '100px', flexShrink: 0 }}>{badge.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>{producto.stock_actual} {producto.unidad}</p>
                          <Tendencia mov={producto.ultimoMovimiento} />
                        </div>
                      </div>
                      {/* Derecha */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: '#111111', margin: 0 }}>${valorTotalP}</p>
                        <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '0 0 6px' }}>${precioU} c/u</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={e => { e.stopPropagation(); e.preventDefault(); setModal({ producto, tipo: 'ingreso' }) }} style={{ padding: '6px 16px', borderRadius: '999px', border: 'none', background: '#111111', color: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Entrada</button>
                          <button onClick={e => { e.stopPropagation(); e.preventDefault(); setModal({ producto, tipo: 'retiro' }) }} style={{ padding: '6px 16px', borderRadius: '999px', border: 'none', background: '#FF4D4D', color: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Salida</button>
                          <button onClick={e => { e.stopPropagation(); e.preventDefault(); router.push(`/dashboard/productos/${producto.id}/editar`) }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E8E8E8', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B', flexShrink: 0 }}><Edit2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* ── DESKTOP: tabla ── */}
            <div className="hidden md:block" style={{ background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E8E8E8' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8F6EA' }}>
                    {['Producto', 'Categoría', 'Stock', 'Estado', 'Valor', 'Acciones'].map(col => (
                      <th key={col} style={{ padding: '10px 16px', textAlign: col === 'Valor' || col === 'Acciones' ? 'right' : 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map(producto => {
                    const badge = getStockBadge(producto)
                    const valorTotalP = (producto.costo_usd * producto.stock_actual).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    const precioU = producto.costo_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return (
                      <tr
                        key={producto.id}
                        onClick={() => router.push(`/inventario/${producto.id}`)}
                        style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        {/* Producto */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {producto.foto_url ? (
                              <img src={producto.foto_url} alt={producto.nombre} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#6B6B6B', flexShrink: 0 }}>
                                {producto.nombre[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '14px', color: '#111111', margin: '0 0 2px' }}>{producto.nombre}</p>
                              {producto.sku && <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>{producto.sku}</p>}
                            </div>
                          </div>
                        </td>
                        {/* Categoría */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {producto.categorias?.icono && <span>{producto.categorias.icono}</span>}
                            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>{producto.categorias?.nombre ?? '—'}</span>
                          </div>
                        </td>
                        {/* Stock */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#111111' }}>{producto.stock_actual} {producto.unidad}</span>
                            <Tendencia mov={producto.ultimoMovimiento} />
                          </div>
                        </td>
                        {/* Estado */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: badge.bg, color: badge.color, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px' }}>{badge.label}</span>
                        </td>
                        {/* Valor */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <p style={{ fontWeight: 700, fontSize: '14px', color: '#111111', margin: '0 0 2px' }}>${valorTotalP}</p>
                          <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>${precioU} c/u</p>
                        </td>
                        {/* Acciones */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button onClick={e => { e.stopPropagation(); setModal({ producto, tipo: 'ingreso' }) }} style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', background: '#111111', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Entrada</button>
                            <button onClick={e => { e.stopPropagation(); setModal({ producto, tipo: 'retiro' }) }} style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', background: '#FF4D4D', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Salida</button>
                            <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/productos/${producto.id}/editar`) }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E8E8E8', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B' }}><Edit2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de stock */}
      {modal && efectivoAlmacen && (
        <StockModal producto={modal.producto} almacenId={efectivoAlmacen.id} almacenNombre={efectivoAlmacen.nombre} tipo={modal.tipo} onClose={() => setModal(null)} onSuccess={handleSuccess} />
      )}

      {/* Sin almacén */}
      {modal && !efectivoAlmacen && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(17,17,17,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <p style={{ color: '#FF4D4D', fontWeight: 600, marginBottom: '16px' }}>No hay ningún almacén configurado. Crea uno primero.</p>
            <button onClick={() => setModal(null)} style={{ background: '#111111', color: '#FFFFFF', border: 'none', borderRadius: '100px', padding: '12px 24px', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>Entendido</button>
          </div>
        </div>
      )}

      {/* Panel de acciones */}
      {mostrarPanelAcciones && (
        <>
          <div onClick={() => setMostrarPanelAcciones(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51, background: '#FFFFFF', borderRadius: '20px 20px 0 0', padding: '24px', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
            <p style={{ fontWeight: 700, fontSize: '16px', color: '#111111', margin: '0 0 16px' }}>¿Qué quieres hacer?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Escanear', icon: <Scan size={22} color="#F4C400" />, bg: 'rgba(244,196,0,0.15)', action: () => { setMostrarPanelAcciones(false); router.push('/dashboard/camara') } },
                { label: 'Subir archivo', icon: <Upload size={22} color="#A78BFA" />, bg: 'rgba(167,139,250,0.15)', action: () => { setMostrarPanelAcciones(false); router.push('/dashboard/camara') } },
                { label: 'Nuevo producto', icon: <PlusCircle size={22} color="#00D7A7" />, bg: 'rgba(0,215,167,0.15)', action: () => { setMostrarPanelAcciones(false); router.push('/dashboard/productos/nuevo') } },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#111111' }}>{item.label}</span>
                </button>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#FAFAFA', gap: '10px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={22} color="#3B82F6" /></div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: '#6B6B6B', margin: '0 0 2px' }}>Ver reportes</p>
                  <p style={{ fontSize: '11px', color: '#AAAAAA', margin: 0 }}>Próximamente</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
