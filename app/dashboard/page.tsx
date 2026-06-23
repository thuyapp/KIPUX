import { getSession } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CheckCircle,
  ClipboardList,
} from 'lucide-react'

type ProductoCritico = {
  id: string
  nombre: string
  stock_actual: number
  stock_minimo: number
  foto_url: string | null
}

type MovimientoHoy = {
  id: string
  tipo: 'ingreso' | 'retiro' | 'transferencia' | 'ajuste'
  cantidad: number
  created_at: string
  productos: { nombre: string } | null
  perfiles: { nombre: string } | null
}

type AuditoriaActiva = {
  id: string
  estado: string
  notas: string | null
  auditoria_items: { id: string; estado: string }[]
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default async function DashboardPage() {
  const { supabase, empresaId, nombre: nombreUsuario, rol } = await getSession()
  if (rol === 'trabajador') redirect('/auditoria')

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [
    { data: productosCriticosRaw },
    { data: movimientosRaw },
    { data: auditoriaRaw },
    { count: totalProductos },
  ] = await Promise.all([
    supabase
      .from('productos')
      .select('id, nombre, stock_actual, stock_minimo, foto_url')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .or('stock_actual.eq.0,stock_actual.lte.stock_minimo')
      .order('stock_actual', { ascending: true })
      .limit(6),
    supabase
      .from('movimientos')
      .select('id, tipo, cantidad, created_at, productos(nombre), perfiles(nombre)')
      .eq('empresa_id', empresaId)
      .gte('created_at', hoy.toISOString())
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('auditorias')
      .select('id, estado, notas, auditoria_items(id, estado)')
      .eq('empresa_id', empresaId)
      .eq('estado', 'activa')
      .limit(1)
      .single(),
    supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .eq('activo', true),
  ])

  const productosCriticos = (productosCriticosRaw ?? []) as ProductoCritico[]
  const movimientos = (movimientosRaw ?? []) as unknown as MovimientoHoy[]
  const auditoria = auditoriaRaw as unknown as AuditoriaActiva | null
  const esEmpresaNueva = !totalProductos || totalProductos === 0

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días,' : 'Buenas tardes,'

  const totalItems = auditoria?.auditoria_items?.length ?? 0
  const contadosItems = auditoria?.auditoria_items?.filter(i => i.estado !== 'pendiente').length ?? 0
  const progPct = totalItems > 0 ? Math.round((contadosItems / totalItems) * 100) : 0

  return (
    <div
      className="px-4 md:px-8"
      style={{
        paddingTop: '28px',
        paddingBottom: '100px',
        fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
      }}
    >
      {esEmpresaNueva ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', textAlign: 'center', padding: '48px 24px',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: '#F4C400', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <Package size={40} color="#111111" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>
            ¡Bienvenido a KIPUX!
          </h2>
          <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '0 0 32px', maxWidth: '400px', lineHeight: 1.6 }}>
            Tu cuenta está lista. Empieza agregando tus primeros productos para controlar tu inventario.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/dashboard/productos/nuevo" style={{
              background: '#F4C400', color: '#111111',
              borderRadius: '999px', padding: '14px 28px',
              fontSize: '15px', fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
            }}>
              + Agregar primer producto
            </a>
            <a href="/dashboard/categorias" style={{
              background: '#111111', color: '#FFFFFF',
              borderRadius: '999px', padding: '14px 28px',
              fontSize: '15px', fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
            }}>
              Crear categorías
            </a>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px', marginTop: '48px', maxWidth: '600px', width: '100%',
          }}>
            {[
              { icon: '📦', titulo: 'Agrega productos', desc: 'Crea tu catálogo con fotos, precios y stock mínimo' },
              { icon: '🏪', titulo: 'Configura almacenes', desc: 'Organiza tu inventario por ubicación o sucursal' },
              { icon: '📊', titulo: 'Registra movimientos', desc: 'Controla entradas y salidas con historial completo' },
            ].map((paso, i) => (
              <div key={i} style={{
                background: '#FFFFFF', borderRadius: '16px',
                padding: '20px', textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{paso.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#111111', marginBottom: '4px' }}>{paso.titulo}</div>
                <div style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5 }}>{paso.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 4px' }}>{saludo}</p>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>
          {nombreUsuario}
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
          Aquí tienes el resumen de tu inventario
        </p>
      </div>

      {/* Sección 1 — Atención requerida */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{
          fontSize: '16px', fontWeight: 600, color: '#111111',
          margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {productosCriticos.length > 0 && (
            <span style={{ color: '#FF4D4D', fontSize: '12px', lineHeight: 1 }}>●</span>
          )}
          Atención requerida
        </p>

        {productosCriticos.length === 0 ? (
          <div style={{
            background: '#E8FBF5', borderRadius: '16px', padding: '20px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <CheckCircle size={24} color="#00A67E" />
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#00A67E' }}>
              Todo el inventario está saludable
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {productosCriticos.map(p => {
              const agotado = p.stock_actual === 0
              return (
                <Link key={p.id} href="/inventario" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#FFFFFF', borderRadius: '16px',
                    padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    {p.foto_url ? (
                      <img
                        src={p.foto_url}
                        alt={p.nombre}
                        style={{
                          width: '48px', height: '48px', borderRadius: '8px',
                          objectFit: 'cover', flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '8px',
                        background: '#F0F0F0', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Package size={20} color="#AAAAAA" />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginBottom: '4px', flexWrap: 'wrap',
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>
                          {p.nombre}
                        </span>
                        {agotado ? (
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: '100px', background: '#FFE8E8', color: '#FF4D4D',
                          }}>
                            Agotado
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: '100px', background: '#FFF8E0', color: '#B8860B',
                          }}>
                            Bajo stock
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>
                        Stock: {p.stock_actual} unidades · Mínimo: {p.stock_minimo} unidades
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Sección 2 — Actividad de hoy */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 12px' }}>
          Actividad de hoy
        </p>

        <div style={{
          background: '#FFFFFF', borderRadius: '16px',
          padding: '4px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {movimientos.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6B6B6B', padding: '20px 16px', margin: 0 }}>
              Sin movimientos registrados hoy
            </p>
          ) : (
            movimientos.map((m, idx) => {
              const isIngreso = m.tipo === 'ingreso'
              const isRetiro = m.tipo === 'retiro'

              const iconBg = isIngreso ? '#E8FBF5' : isRetiro ? '#FFE8E8' : '#FFF8E0'
              const iconColor = isIngreso ? '#00D7A7' : isRetiro ? '#FF4D4D' : '#F4C400'
              const cantidadColor = isIngreso ? '#00D7A7' : isRetiro ? '#FF4D4D' : '#F4C400'
              const cantidadPrefix = isIngreso ? '+' : isRetiro ? '-' : ''
              const IconMov = isIngreso ? ArrowDownLeft : isRetiro ? ArrowUpRight : ArrowLeftRight

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    borderTop: idx > 0 ? '1px solid #F5F5F5' : 'none',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: iconBg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconMov size={16} color={iconColor} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '14px', fontWeight: 600, color: '#111111',
                      margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {m.productos?.nombre ?? '—'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '2px 0 0' }}>
                      {m.perfiles?.nombre ?? 'Sistema'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: cantidadColor, margin: 0 }}>
                      {cantidadPrefix}{m.cantidad}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                      {formatHora(m.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Sección 3 — Auditoría en curso (solo si existe) */}
      {auditoria && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 12px' }}>
            Auditoría en curso
          </p>
          <div style={{
            background: '#F8F6EA', borderRadius: '16px', padding: '20px',
            borderLeft: '4px solid #F4C400',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ClipboardList size={20} color="#F4C400" />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#111111' }}>
                Auditoría activa
              </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#6B6B6B' }}>
                  {contadosItems} de {totalItems} productos contados
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
                  {progPct}%
                </span>
              </div>
              <div style={{ height: '6px', background: '#E8E8E8', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: '#F4C400', borderRadius: '3px',
                  width: `${progPct}%`,
                }} />
              </div>
            </div>

            <Link
              href="/dashboard/auditoria"
              style={{
                display: 'inline-block', marginTop: '10px',
                padding: '8px 18px', borderRadius: '999px',
                background: '#111111', color: '#FFFFFF',
                textDecoration: 'none', fontSize: '13px', fontWeight: 600,
              }}
            >
              Ver progreso
            </Link>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
