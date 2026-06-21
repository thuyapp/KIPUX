'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Bell, Search, Plus, Package, Edit2, Warehouse, X, Scan, ChevronDown, RotateCcw, Upload, PlusCircle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StockModal from './StockModal'

export type Producto = {
  id: string
  nombre: string
  foto_url: string | null
  stock_actual: number
  stock_minimo: number
  unidad: string
  costo_usd: number
  categorias: { nombre: string } | null
}

type AlmacenRef = { id: string; nombre: string } | null
type FiltroEstado = 'todos' | 'saludable' | 'bajo' | 'agotado'
type ModalState = { producto: Producto; tipo: 'ingreso' | 'retiro' } | null

function getStockBadge(p: Producto) {
  if (p.stock_actual === 0) return { label: 'Agotado', bg: '#FF4D4D', color: '#FFFFFF' }
  if (p.stock_actual <= p.stock_minimo) return { label: 'Bajo stock', bg: '#F4C400', color: '#111111' }
  return { label: 'Saludable', bg: '#00D7A7', color: '#FFFFFF' }
}

export default function ProductList({
  productos,
  almacenDefault,
  nombreUsuario,
  almacenFiltro,
  almacenNombreFiltro,
}: {
  productos: Producto[]
  almacenDefault: AlmacenRef
  nombreUsuario: string
  almacenFiltro?: string
  almacenNombreFiltro?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
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

  useEffect(() => {
    if (searchParams.get('panel') === 'true') {
      setMostrarPanelAcciones(true)
      router.replace('/inventario')
    }
  }, [searchParams, router])

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

  const totalProductos = productos.length
  const valorInventario = productos.reduce((sum, p) => sum + p.stock_actual * p.costo_usd, 0)
  const stockBajoCount = productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
  const agotadosCount = productos.filter(p => p.stock_actual === 0).length

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

  const summaryCards = [
    { label: 'Total productos', value: String(totalProductos) },
    { label: 'Valor inventario', value: `$${valorInventario.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Bajo stock', value: String(stockBajoCount) },
    { label: 'Agotados', value: String(agotadosCount) },
  ]

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
          <button
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              border: '1px solid #E8E8E8', background: '#FFFFFF',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#111111', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flexShrink: 0,
            }}
          >
            <Bell size={18} />
          </button>
        </div>

        {/* Tarjetas de resumen */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {summaryCards.map(card => (
            <div
              key={card.label}
              style={{
                background: '#FFFFFF', border: '1px solid #E8E8E8',
                borderRadius: '16px', padding: '16px',
                minWidth: '130px', flex: '1',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '0 0 6px' }}>{card.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Header inventario */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>Inventario</h2>
          <div className="flex w-full md:w-auto" style={{ gap: '8px' }}>
            <button
              onClick={() => router.push('/dashboard/camara')}
              className="flex-1 md:flex-none"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '999px', border: 'none',
                background: '#111111', color: '#FFFFFF',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Scan size={16} />
              Carga masiva
            </button>
            <button
              onClick={() => router.push('/dashboard/productos/nuevo')}
              className="flex-1 md:flex-none"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '999px', border: 'none',
                background: '#F4C400', color: '#111111',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + Nuevo producto
            </button>
          </div>
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
            placeholder="Buscar producto..."
            style={{
              border: 'none', outline: 'none',
              background: 'transparent', color: '#111111',
              fontSize: '15px', width: '100%', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Filtros — una sola fila con scroll horizontal */}
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto',
          paddingBottom: '4px', paddingRight: '16px',
          marginBottom: '20px', alignItems: 'center',
        }}>
          {/* Estado pills con punto de color */}
          {estadoPills.map(pill => (
            <button
              key={pill.key}
              onClick={() => setFiltroEstado(pill.key)}
              style={pillStyle(filtroEstado === pill.key)}
            >
              {pill.dot && (
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: filtroEstado === pill.key ? '#FFFFFF' : pill.dot,
                  flexShrink: 0, display: 'inline-block',
                }} />
              )}
              {pill.label}
            </button>
          ))}

          {/* Dropdown categorías */}
          <div ref={dropCatRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { setMostrarDropCategoria(v => !v); setMostrarDropAlmacen(false) }}
              style={dropTriggerStyle}
            >
              {categoriasSeleccionadas.length > 0
                ? `Categorías (${categoriasSeleccionadas.length})`
                : 'Categorías'}
              <ChevronDown size={14} />
            </button>
            {mostrarDropCategoria && categoriasUnicas.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                padding: '8px', minWidth: '180px',
              }}>
                {categoriasUnicas.map(cat => (
                  <div
                    key={cat}
                    onClick={() => toggleCategoria(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                      background: categoriasSeleccionadas.includes(cat) ? '#F8F6EA' : 'transparent',
                      fontSize: '13px', color: '#111111',
                    }}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={categoriasSeleccionadas.includes(cat)}
                      style={{ accentColor: '#111111', cursor: 'pointer', flexShrink: 0 }}
                    />
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown almacenes */}
          <div ref={dropAlmRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { setMostrarDropAlmacen(v => !v); setMostrarDropCategoria(false) }}
              style={dropTriggerStyle}
            >
              {almacenesSeleccionados.length > 0
                ? `Almacenes (${almacenesSeleccionados.length})`
                : 'Almacenes'}
              <ChevronDown size={14} />
            </button>
            {mostrarDropAlmacen && almacenesDB.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                background: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                padding: '8px', minWidth: '180px',
              }}>
                {almacenesDB.map(alm => (
                  <div
                    key={alm.id}
                    onClick={() => toggleAlmacen(alm.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                      background: almacenesSeleccionados.includes(alm.id) ? '#F8F6EA' : 'transparent',
                      fontSize: '13px', color: '#111111',
                    }}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={almacenesSeleccionados.includes(alm.id)}
                      style={{ accentColor: '#111111', cursor: 'pointer', flexShrink: 0 }}
                    />
                    {alm.nombre}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Limpiar filtros */}
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 12px', borderRadius: '8px', border: 'none',
                background: 'transparent', color: '#6B6B6B',
                fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <RotateCcw size={13} />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Banner de almacén filtrado */}
        {almacenFiltro && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(244,196,0,0.12)', border: '1.5px solid #F4C400',
            borderRadius: '14px', padding: '12px 16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Warehouse size={18} color="#111111" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>
                Inventario de: {almacenNombreFiltro ?? 'Almacén'}
              </span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111111', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Lista de productos */}
        {productosFiltrados.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '64px 0', gap: '12px',
          }}>
            <Package size={48} style={{ color: '#E8E8E8' }} />
            <p style={{ color: '#6B6B6B', fontSize: '15px', textAlign: 'center', margin: 0 }}>
              {busqueda
                ? 'No hay productos que coincidan con la búsqueda.'
                : almacenFiltro
                  ? 'Este almacén no tiene productos en stock.'
                  : 'No hay productos en esta categoría.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {productosFiltrados.map(producto => {
              const badge = getStockBadge(producto)
              const valorTotal = (producto.costo_usd * producto.stock_actual).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              const precioUnitario = producto.costo_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              return (
                <Link
                  key={producto.id}
                  href={`/inventario/${producto.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      background: '#FFFFFF', border: '1px solid #E8E8E8',
                      borderRadius: '16px', padding: '16px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Foto / Placeholder */}
                    {producto.foto_url ? (
                      <img
                        src={producto.foto_url}
                        alt={producto.nombre}
                        style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '12px', flexShrink: 0,
                        background: '#F0F0F0', color: '#6B6B6B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '22px',
                      }}>
                        {producto.nombre[0].toUpperCase()}
                      </div>
                    )}

                    {/* Centro: nombre, categoría+badge, stock */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#111111', margin: '0 0 3px', lineHeight: 1.3 }}>
                        {producto.nombre}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#6B6B6B' }}>
                          {producto.categorias?.nombre ?? 'Sin categoría'}
                        </span>
                        <span style={{
                          background: badge.bg, color: badge.color,
                          fontSize: '10px', fontWeight: 600,
                          padding: '1px 7px', borderRadius: '100px', flexShrink: 0,
                        }}>
                          {badge.label}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>
                        {producto.stock_actual} {producto.unidad}
                      </p>
                    </div>

                    {/* Derecha: valor, precio unitario, botones */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#111111', margin: 0 }}>
                        ${valorTotal}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '0 0 6px' }}>
                        ${precioUnitario} c/u
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); e.preventDefault(); setModal({ producto, tipo: 'ingreso' }) }}
                          style={{
                            padding: '6px 16px', borderRadius: '999px', border: 'none',
                            background: '#111111', color: '#FFFFFF',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Entrada
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); e.preventDefault(); setModal({ producto, tipo: 'retiro' }) }}
                          style={{
                            padding: '6px 16px', borderRadius: '999px', border: 'none',
                            background: '#FF4D4D', color: '#FFFFFF',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Salida
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); e.preventDefault(); router.push(`/dashboard/productos/${producto.id}/editar`) }}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: '1px solid #E8E8E8', background: '#FFFFFF',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#6B6B6B', flexShrink: 0,
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de stock */}
      {modal && efectivoAlmacen && (
        <StockModal
          producto={modal.producto}
          almacenId={efectivoAlmacen.id}
          almacenNombre={efectivoAlmacen.nombre}
          tipo={modal.tipo}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Sin almacén configurado */}
      {modal && !efectivoAlmacen && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(17,17,17,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <p style={{ color: '#FF4D4D', fontWeight: 600, marginBottom: '16px' }}>
              No hay ningún almacén configurado. Crea uno primero.
            </p>
            <button
              onClick={() => setModal(null)}
              style={{
                background: '#111111', color: '#FFFFFF', border: 'none',
                borderRadius: '100px', padding: '12px 24px',
                cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Panel de acciones */}
      {mostrarPanelAcciones && (
        <>
          <div
            onClick={() => setMostrarPanelAcciones(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
            background: '#FFFFFF', borderRadius: '20px 20px 0 0',
            padding: '24px',
            fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
          }}>
            <p style={{ fontWeight: 700, fontSize: '16px', color: '#111111', margin: '0 0 16px' }}>
              ¿Qué quieres hacer?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Escanear */}
              <button
                onClick={() => { setMostrarPanelAcciones(false); router.push('/dashboard/camara') }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px', borderRadius: '12px', border: '1px solid #E8E8E8',
                  background: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', gap: '10px',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(244,196,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scan size={22} color="#F4C400" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#111111' }}>Escanear</span>
              </button>

              {/* Subir archivo */}
              <button
                onClick={() => { setMostrarPanelAcciones(false); router.push('/dashboard/camara') }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px', borderRadius: '12px', border: '1px solid #E8E8E8',
                  background: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', gap: '10px',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={22} color="#A78BFA" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#111111' }}>Subir archivo</span>
              </button>

              {/* Nuevo producto */}
              <button
                onClick={() => { setMostrarPanelAcciones(false); router.push('/dashboard/productos/nuevo') }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px', borderRadius: '12px', border: '1px solid #E8E8E8',
                  background: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', gap: '10px',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,215,167,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={22} color="#00D7A7" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#111111' }}>Nuevo producto</span>
              </button>

              {/* Ver reportes — deshabilitado */}
              <div
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px', borderRadius: '12px', border: '1px solid #E8E8E8',
                  background: '#FAFAFA', gap: '10px',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} color="#3B82F6" />
                </div>
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
