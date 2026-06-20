import { getSession } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  MapPin,
} from 'lucide-react'
import AccionesProducto from './components/AccionesProducto'

type Producto = {
  id: string
  nombre: string
  sku: string | null
  descripcion: string | null
  unidad: string
  stock_actual: number
  stock_minimo: number
  costo_usd: number | null
  foto_url: string | null
  activo: boolean
  categorias: { nombre: string; color: string | null; icono: string | null } | null
}

type StockAlmacen = {
  stock_actual: number
  ubicacion: string | null
  almacen_id: string
  almacenes: { nombre: string } | null
}

type Movimiento = {
  id: string
  tipo: 'ingreso' | 'retiro' | 'transferencia' | 'ajuste'
  cantidad: number
  nota: string | null
  created_at: string
  perfiles: { nombre: string } | null
  almacenes: { nombre: string } | null
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function formatMovFecha(iso: string) {
  const d = new Date(iso)
  const dia = d.getDate()
  const mes = d.toLocaleString('es-ES', { month: 'short' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${dia} ${mes} · ${hora}`
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { supabase, empresaId, rol } = await getSession()
  if (rol === 'trabajador') redirect('/auditoria')

  const { id } = await params

  const [
    { data: productoRaw },
    { data: stockRaw },
    { data: movimientosRaw },
  ] = await Promise.all([
    supabase
      .from('productos')
      .select(`
        id, nombre, sku, descripcion, unidad, stock_actual,
        stock_minimo, costo_usd, foto_url, activo,
        categorias(nombre, color, icono)
      `)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single(),
    supabase
      .from('stock_por_almacen')
      .select('stock_actual, ubicacion, almacen_id, almacenes(nombre)')
      .eq('producto_id', id)
      .eq('empresa_id', empresaId)
      .order('stock_actual', { ascending: false }),
    supabase
      .from('movimientos')
      .select('id, tipo, cantidad, nota, created_at, perfiles(nombre), almacenes(nombre)')
      .eq('producto_id', id)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!productoRaw) redirect('/inventario')

  const producto = productoRaw as unknown as Producto
  const stockPorAlmacen = (stockRaw ?? []) as unknown as StockAlmacen[]
  const movimientos = (movimientosRaw ?? []) as unknown as Movimiento[]

  const agotado = producto.stock_actual === 0
  const bajoStock = producto.stock_actual > 0 && producto.stock_actual <= producto.stock_minimo

  const badgeStock = agotado
    ? { label: 'Agotado', bg: '#FFE8E8', color: '#FF4D4D' }
    : bajoStock
    ? { label: 'Bajo stock', bg: '#FFF8E0', color: '#B8860B' }
    : { label: 'Saludable', bg: '#E8FBF5', color: '#00A67E' }

  const categoriaColor = producto.categorias?.color ?? '#6B6B6B'

  const almacenPrincipal = stockPorAlmacen[0] ?? null

  const font = 'var(--font-geist-sans, system-ui, sans-serif)'
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', borderRadius: '16px',
    padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '24px',
  }

  return (
    <div style={{ background: '#F8F6EA', minHeight: '100vh', fontFamily: font }}>

      {/* Header navegación */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid #E8E8E8',
        padding: '16px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link
          href="/inventario"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: '#111111', textDecoration: 'none',
            fontSize: '14px', fontWeight: 500,
          }}
        >
          ← Volver
        </Link>
        <Link
          href={`/dashboard/productos/${id}/editar`}
          style={{
            padding: '8px 18px', borderRadius: '999px',
            background: '#F4C400', color: '#111111',
            textDecoration: 'none', fontSize: '13px', fontWeight: 600,
          }}
        >
          Editar
        </Link>
      </div>

      {/* Contenido desplazable con espacio para barra inferior */}
      <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '100px' }}>

        {/* Hero imagen */}
        {producto.foto_url ? (
          <img
            src={producto.foto_url}
            alt={producto.nombre}
            style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '160px', background: '#F0F0F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package size={48} color="#CCCCCC" />
          </div>
        )}

        {/* Info del producto */}
        <div style={{ padding: '20px 24px 0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {/* Badge categoría */}
            {producto.categorias && (
              <span style={{
                fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px',
                background: hexToRgba(categoriaColor, 0.15),
                color: categoriaColor,
              }}>
                {producto.categorias.icono && `${producto.categorias.icono} `}
                {producto.categorias.nombre}
              </span>
            )}
            {/* Badge stock */}
            <span style={{
              fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px',
              background: badgeStock.bg, color: badgeStock.color,
            }}>
              {badgeStock.label}
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>
            {producto.nombre}
          </h1>
          {producto.sku && (
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 2px' }}>
              SKU: {producto.sku}
            </p>
          )}
          {producto.descripcion && (
            <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '8px 0 0', lineHeight: '1.5' }}>
              {producto.descripcion}
            </p>
          )}
        </div>

        <div style={{ padding: '0 24px' }}>

          {/* Sección stock por almacén */}
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 12px' }}>
            Stock por almacén
          </p>

          {stockPorAlmacen.length === 0 ? (
            <div style={{ ...cardStyle, color: '#6B6B6B', fontSize: '14px' }}>
              Sin registro de stock por almacén
            </div>
          ) : stockPorAlmacen.length === 1 ? (
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#111111', margin: '0 0 4px' }}>
                  {almacenPrincipal!.almacenes?.nombre ?? 'Almacén'}
                </p>
                {almacenPrincipal!.ubicacion && (
                  <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {almacenPrincipal!.ubicacion}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#111111' }}>
                {almacenPrincipal!.stock_actual}
              </span>
            </div>
          ) : (
            <div style={{ ...cardStyle, padding: '4px 0' }}>
              {stockPorAlmacen.map((s, idx) => (
                <div
                  key={`${s.almacen_id}-${idx}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: idx > 0 ? '1px solid #F5F5F5' : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: '0 0 2px' }}>
                      {s.almacenes?.nombre ?? 'Almacén'}
                    </p>
                    {s.ubicacion && (
                      <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {s.ubicacion}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#111111' }}>
                    {s.stock_actual}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sección información */}
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 12px' }}>
            Información
          </p>
          <div style={{
            ...cardStyle,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
          }}>
            {[
              { label: 'Unidad de medida', value: producto.unidad },
              producto.costo_usd != null
                ? { label: 'Costo unitario', value: `$ ${producto.costo_usd.toFixed(2)} USD` }
                : null,
              { label: 'Stock mínimo', value: `${producto.stock_minimo} unidades` },
              { label: 'Estado', value: producto.activo ? 'Activo' : 'Inactivo' },
            ]
              .filter(Boolean)
              .map(campo => (
                <div key={campo!.label}>
                  <p style={{
                    fontSize: '12px', color: '#6B6B6B', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 4px',
                  }}>
                    {campo!.label}
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>
                    {campo!.value}
                  </p>
                </div>
              ))}
          </div>

          {/* Sección últimos movimientos */}
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 12px' }}>
            Últimos movimientos
          </p>

          <div style={{ ...cardStyle, padding: '4px 0' }}>
            {movimientos.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#6B6B6B', padding: '16px', margin: 0 }}>
                Sin movimientos registrados
              </p>
            ) : (
              movimientos.map((m, idx) => {
                const isIngreso = m.tipo === 'ingreso'
                const isRetiro = m.tipo === 'retiro'
                const isTransferencia = m.tipo === 'transferencia'

                const iconBg = isIngreso ? '#E8FBF5' : isRetiro ? '#FFE8E8' : isTransferencia ? '#FFF8E0' : '#F0F0F0'
                const iconColor = isIngreso ? '#00D7A7' : isRetiro ? '#FF4D4D' : isTransferencia ? '#F4C400' : '#6B6B6B'
                const cantidadColor = isIngreso ? '#00D7A7' : isRetiro ? '#FF4D4D' : isTransferencia ? '#F4C400' : '#6B6B6B'
                const cantidadPrefix = isIngreso ? '+' : isRetiro ? '-' : ''
                const tipoLabel = m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)
                const IconMov = isIngreso ? ArrowDownLeft : isRetiro ? ArrowUpRight : ArrowLeftRight

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '12px 16px',
                      borderTop: idx > 0 ? '1px solid #F5F5F5' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: iconBg, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconMov size={16} color={iconColor} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>
                          {tipoLabel}
                        </p>
                        <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '2px 0 0' }}>
                          {m.almacenes?.nombre ?? '—'}
                          {m.perfiles?.nombre ? ` · ${m.perfiles.nombre}` : ''}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: cantidadColor, margin: 0 }}>
                          {cantidadPrefix}{m.cantidad}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                          {formatMovFecha(m.created_at)}
                        </p>
                      </div>
                    </div>

                    {m.nota && (
                      <p style={{
                        fontSize: '13px', color: '#6B6B6B', fontStyle: 'italic',
                        margin: '6px 0 0 48px',
                      }}>
                        {m.nota}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>

      {/* Acciones fijas al fondo */}
      {almacenPrincipal && (
        <AccionesProducto
          productoId={producto.id}
          productoNombre={producto.nombre}
          productoFotoUrl={producto.foto_url}
          stockActual={producto.stock_actual}
          unidad={producto.unidad}
          almacenId={almacenPrincipal.almacen_id}
          almacenNombre={almacenPrincipal.almacenes?.nombre ?? 'Almacén'}
        />
      )}
    </div>
  )
}
