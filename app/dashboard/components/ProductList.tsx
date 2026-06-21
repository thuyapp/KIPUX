'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Search, Camera, Plus, Package, Edit2, Warehouse, X, Scan } from 'lucide-react'
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
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])
  const [almacenesSeleccionados, setAlmacenesSeleccionados] = useState<string[]>([])
  const [almacenesDB, setAlmacenesDB] = useState<{ id: string; nombre: string }[]>([])
  const [modal, setModal] = useState<ModalState>(null)
  const [mostrarPanelAcciones, setMostrarPanelAcciones] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('almacenes').select('id, nombre').eq('activo', true).then(({ data }) => {
      if (data) setAlmacenesDB(data)
    })

    function handleAbrirPanel() { setMostrarPanelAcciones(true) }
    window.addEventListener('abrir-panel-acciones', handleAbrirPanel)
    return () => window.removeEventListener('abrir-panel-acciones', handleAbrirPanel)
  }, [])

  const efectivoAlmacen: AlmacenRef = almacenFiltro
    ? { id: almacenFiltro, nombre: almacenNombreFiltro ?? '' }
    : almacenDefault

  const totalProductos = productos.length
  const valorInventario = productos.reduce((sum, p) => sum + p.stock_actual * p.costo_usd, 0)
  const stockBajoCount = productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
  const agotadosCount = productos.filter(p => p.stock_actual === 0).length

  const categoriasUnicas = Array.from(
    new Set(
      productos.map(p => p.categorias?.nombre).filter((c): c is string => !!c)
    )
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

  const estadoPills: { key: FiltroEstado; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'saludable', label: 'Saludable' },
    { key: 'bajo', label: 'Bajo stock' },
    { key: 'agotado', label: 'Agotado' },
  ]

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
    border: active ? 'none' : '1px solid #E8E8E8',
    background: active ? '#111111' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#111111',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>Inventario</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push('/dashboard/camara')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
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
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
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

        {/* Filtros */}
        <div style={{ marginBottom: '20px' }}>
          {/* Estado pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', marginBottom: '8px' }}>
            {estadoPills.map(pill => (
              <button
                key={pill.key}
                onClick={() => setFiltroEstado(pill.key)}
                style={chipStyle(filtroEstado === pill.key)}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Categoría chips */}
          {categoriasUnicas.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', marginBottom: '8px' }}>
              {categoriasUnicas.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategoria(cat)}
                  style={chipStyle(categoriasSeleccionadas.includes(cat))}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Almacén chips */}
          {almacenesDB.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {almacenesDB.map(alm => (
                <button
                  key={alm.id}
                  onClick={() => toggleAlmacen(alm.id)}
                  style={chipStyle(almacenesSeleccionados.includes(alm.id))}
                >
                  {alm.nombre}
                </button>
              ))}
            </div>
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
                        background: '#F4C400', color: '#111111',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '22px',
                      }}>
                        {producto.nombre[0].toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600, color: '#111111', margin: '0 0 2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {producto.nombre}
                      </p>
                      <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 6px' }}>
                        {producto.categorias?.nombre ?? 'Sin categoría'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111111' }}>
                          {producto.stock_actual} {producto.unidad}
                        </span>
                        <span style={{
                          background: badge.bg, color: badge.color,
                          fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '100px',
                        }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Botones Entrada / Salida / Editar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={e => { e.stopPropagation(); e.preventDefault(); setModal({ producto, tipo: 'ingreso' }) }}
                        style={{
                          padding: '6px 14px', borderRadius: '999px', border: 'none',
                          background: '#00D7A7', color: '#FFFFFF',
                          fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Entrada
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); e.preventDefault(); setModal({ producto, tipo: 'retiro' }) }}
                        style={{
                          padding: '6px 14px', borderRadius: '999px', border: 'none',
                          background: '#FF4D4D', color: '#FFFFFF',
                          fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Salida
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); e.preventDefault(); router.push(`/dashboard/productos/${producto.id}/editar`) }}
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          border: '1px solid #E8E8E8', background: '#FFFFFF',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#6B6B6B',
                        }}
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB cámara */}
      <button
        onClick={() => router.push('/dashboard/camara')}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 40,
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#F4C400', border: 'none', color: '#111111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(244,196,0,0.4)',
        }}
      >
        <Camera size={26} />
      </button>

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
            <button
              onClick={() => { setMostrarPanelAcciones(false); router.push('/dashboard/camara') }}
              style={{
                display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                padding: '16px', borderRadius: '12px', border: 'none',
                background: '#111111', color: '#FFFFFF',
                cursor: 'pointer', marginBottom: '8px', fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Scan size={20} />
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Carga masiva</span>
              </div>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', paddingLeft: '30px' }}>
                Sube una factura y la IA carga los productos
              </span>
            </button>
            <button
              onClick={() => { setMostrarPanelAcciones(false); router.push('/dashboard/productos/nuevo') }}
              style={{
                display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                padding: '16px', borderRadius: '12px', border: 'none',
                background: '#F4C400', color: '#111111',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Plus size={20} />
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Nuevo producto</span>
              </div>
              <span style={{ fontSize: '13px', color: 'rgba(17,17,17,0.6)', paddingLeft: '30px' }}>
                Agrega un producto manualmente
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
