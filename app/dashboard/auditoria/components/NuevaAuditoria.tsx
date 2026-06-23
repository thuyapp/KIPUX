'use client'

import { useState } from 'react'
import { Package, Tag, Warehouse, CheckSquare, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Auditoria, EmpleadoRef, CategoriaRef, AlmacenRef } from '../page'

type Alcance = 'todo' | 'categoria' | 'almacen'

type Props = {
  empresaId: string
  userId: string
  empleados: EmpleadoRef[]
  categorias: CategoriaRef[]
  almacenes: AlmacenRef[]
  auditoriaActiva: Auditoria | null
  onCreada: (a: Auditoria) => void
}

export default function NuevaAuditoria({ empresaId, userId, empleados, categorias, almacenes, auditoriaActiva, onCreada }: Props) {
  const [alcance, setAlcance] = useState<Alcance>('todo')
  const [categoriaId, setCategoriaId] = useState('')
  const [almacenId, setAlmacenId] = useState('')
  const [selectedEmpleados, setSelectedEmpleados] = useState<string[]>([])
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleEmpleado(id: string) {
    setSelectedEmpleados(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  async function handleIniciar() {
    if (selectedEmpleados.length === 0) {
      setError('Selecciona al menos un empleado')
      return
    }
    if (alcance === 'categoria' && !categoriaId) {
      setError('Selecciona una categoría')
      return
    }
    if (alcance === 'almacen' && !almacenId) {
      setError('Selecciona un almacén')
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()

    // 1. Insert auditoria
    const { data: auditoriaData, error: auditoriaErr } = await supabase
      .from('auditorias')
      .insert({
        empresa_id: empresaId,
        creada_por: userId,
        estado: 'en_proceso',
        alcance,
        almacen_id: alcance === 'almacen' ? almacenId : null,
        categoria_id: alcance === 'categoria' ? categoriaId : null,
        notas: notas.trim() || null,
        ajustes_aplicados: false,
      })
      .select('id, estado, alcance, almacen_id, categoria_id, notas, fecha_inicio, fecha_fin, creada_por, ajustes_aplicados')
      .single()

    if (auditoriaErr || !auditoriaData) {
      setError(auditoriaErr?.message ?? 'Error al crear la auditoría')
      setLoading(false)
      return
    }

    // 2. Fetch products based on scope
    let productos: { id: string; stock_actual: number }[] = []

    if (alcance === 'almacen') {
      const { data: spRaw } = await supabase
        .from('stock_por_almacen')
        .select('producto_id, stock_actual')
        .eq('almacen_id', almacenId)
      productos = (spRaw ?? []).map((r: { producto_id: string; stock_actual: number }) => ({ id: r.producto_id, stock_actual: r.stock_actual }))
    } else {
      let q = supabase.from('productos').select('id, stock_actual').eq('activo', true)
      if (alcance === 'categoria') q = q.eq('categoria_id', categoriaId)
      const { data: pRaw } = await q
      productos = (pRaw ?? []) as { id: string; stock_actual: number }[]
    }

    if (productos.length === 0) {
      // Rollback: delete the audit
      await supabase.from('auditorias').delete().eq('id', auditoriaData.id)
      setError('No se encontraron productos para el alcance seleccionado')
      setLoading(false)
      return
    }

    // 3. Create items distributed cyclically among employees
    const items = productos.map((p, idx) => ({
      auditoria_id: auditoriaData.id,
      producto_id: p.id,
      stock_sistema_inicial: p.stock_actual,
      estado: 'pendiente',
      usuario_asignado: selectedEmpleados[idx % selectedEmpleados.length],
      almacen_id: alcance === 'almacen' ? almacenId : null,
    }))

    // Insert in batches of 500 to avoid request size limits
    for (let i = 0; i < items.length; i += 500) {
      const { error: itemsErr } = await supabase
        .from('auditoria_items')
        .insert(items.slice(i, i + 500))
      if (itemsErr) {
        await supabase.from('auditorias').delete().eq('id', auditoriaData.id)
        setError(itemsErr.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onCreada(auditoriaData as Auditoria)
  }

  const alcanceOptions: { key: Alcance; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'todo', label: 'Todo el inventario', desc: 'Contar todos los productos activos', icon: <Package size={22} /> },
    { key: 'categoria', label: 'Por categoría', desc: 'Solo una categoría específica', icon: <Tag size={22} /> },
    { key: 'almacen', label: 'Por almacén', desc: 'Solo productos de un almacén', icon: <Warehouse size={22} /> },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #E8E8E8', fontSize: '14px', color: '#111111',
    background: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', borderRadius: '16px',
    padding: '22px 24px', border: '1px solid #E8E8E8',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    marginBottom: '16px',
  }

  if (auditoriaActiva) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 8px' }}>
          Ya hay una auditoría en progreso
        </p>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
          Finaliza o cancela la auditoría activa antes de crear una nueva.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Alcance */}
      <div style={cardStyle}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111111', margin: '0 0 16px' }}>
          1. Alcance
        </p>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          {alcanceOptions.map(opt => {
            const selected = alcance === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => { setAlcance(opt.key); setCategoriaId(''); setAlmacenId('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '12px', textAlign: 'left',
                  border: selected ? '2px solid #F4C400' : '1.5px solid #E8E8E8',
                  background: selected ? '#FFFBE6' : '#FFFFFF',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  background: selected ? '#F4C400' : '#F8F6EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {opt.icon}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>{opt.label}</p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {alcance === 'categoria' && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, margin: '0 0 6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              SELECCIONAR CATEGORÍA *
            </p>
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={inputStyle}>
              <option value="">— Elige una categoría —</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {alcance === 'almacen' && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, margin: '0 0 6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              SELECCIONAR ALMACÉN *
            </p>
            <select value={almacenId} onChange={e => setAlmacenId(e.target.value)} style={inputStyle}>
              <option value="">— Elige un almacén —</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Empleados */}
      <div style={cardStyle}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>
          2. Asignar empleados
        </p>
        <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 16px' }}>
          Los productos se repartirán cíclicamente entre los seleccionados.
        </p>

        {empleados.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6B6B6B', textAlign: 'center', padding: '20px 0' }}>
            No hay empleados con rol trabajador registrados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {empleados.map(emp => {
              const checked = selectedEmpleados.includes(emp.id)
              return (
                <button
                  key={emp.id}
                  onClick={() => toggleEmpleado(emp.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px', textAlign: 'left',
                    border: checked ? '1.5px solid #F4C400' : '1.5px solid #E8E8E8',
                    background: checked ? '#FFFBE6' : '#FFFFFF',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {checked
                    ? <CheckSquare size={18} color="#F4C400" />
                    : <Square size={18} color="#CCCCCC" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>{emp.nombre}</p>
                    {emp.almacenes && (
                      <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '1px 0 0' }}>{emp.almacenes.nombre}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Notas */}
      <div style={cardStyle}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111111', margin: '0 0 12px' }}>
          3. Notas para los empleados
        </p>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Instrucciones adicionales para el conteo (opcional)..."
          rows={3}
          style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
        />
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#FF4D4D', margin: '0 0 16px' }}>{error}</p>
      )}

      <button
        onClick={handleIniciar}
        disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: '100px',
          background: '#F4C400', border: 'none',
          fontSize: '16px', fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer', color: '#111111',
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Iniciando auditoría...' : 'Iniciar auditoría'}
      </button>
    </div>
  )
}
