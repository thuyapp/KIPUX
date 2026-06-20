'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

type Almacen = { id: string; nombre: string; es_default: boolean }

type FilaProducto = {
  uid: string
  nombre: string
  cantidad: number
  accion: 'ingreso' | 'retiro'
  productoId: string | null
}

type ResultadoIA = {
  modo?: 'sin_api_key'
  productos: Array<{ nombre: string; cantidad: number; accion: string }>
  moneda: string
  confianza: number
  error?: string
}

type Props = {
  resultado: ResultadoIA
  documentoBase64: string
  documentoMediaType: string
  almacenes: Almacen[]
  empresaId: string
  onBack: () => void
}

export default function ConfirmacionIA({ resultado, documentoBase64, documentoMediaType, almacenes, empresaId, onBack }: Props) {
  const [filas, setFilas] = useState<FilaProducto[]>(() =>
    resultado.productos.map((p, i) => ({
      uid: String(i),
      nombre: p.nombre ?? '',
      cantidad: Math.max(1, Number(p.cantidad) || 1),
      accion: p.accion === 'retiro' ? 'retiro' : 'ingreso',
      productoId: null,
    }))
  )
  const [moneda, setMoneda] = useState(resultado.moneda || 'USD')
  const [nota, setNota] = useState('')
  const [almacenId, setAlmacenId] = useState(() => {
    const def = almacenes.find(a => a.es_default)
    return def?.id ?? almacenes[0]?.id ?? ''
  })
  const [guardando, setGuardando] = useState(false)
  const [faltantes, setFaltantes] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [exitoso, setExitoso] = useState(false)

  // Fetch product ID matches on mount
  useEffect(() => {
    if (filas.length === 0) return
    const supabase = createClient()
    Promise.all(
      filas.map(async fila => {
        const { data } = await supabase
          .from('productos')
          .select('id')
          .eq('empresa_id', empresaId)
          .ilike('nombre', `%${fila.nombre}%`)
          .limit(1)
          .single()
        return { uid: fila.uid, productoId: data?.id ?? null }
      })
    ).then(results => {
      setFilas(prev =>
        prev.map(f => {
          const m = results.find(r => r.uid === f.uid)
          return m ? { ...f, productoId: m.productoId } : f
        })
      )
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function actualizarFila(uid: string, cambios: Partial<FilaProducto>) {
    setFilas(prev => prev.map(f => (f.uid === uid ? { ...f, ...cambios } : f)))
  }

  function agregarFila() {
    setFilas(prev => [...prev, { uid: Date.now().toString(), nombre: '', cantidad: 1, accion: 'ingreso', productoId: null }])
  }

  async function handleConfirmar() {
    const validas = filas.filter(f => f.nombre.trim() && f.cantidad > 0)
    if (validas.length === 0) return

    const supabase = createClient()
    const sinMatch: string[] = []

    const resueltas = await Promise.all(
      validas.map(async fila => {
        if (fila.productoId) return fila
        const { data } = await supabase
          .from('productos')
          .select('id')
          .eq('empresa_id', empresaId)
          .ilike('nombre', `%${fila.nombre}%`)
          .limit(1)
          .single()
        return data?.id ? { ...fila, productoId: data.id } : fila
      })
    )

    for (const f of resueltas) {
      if (!f.productoId) sinMatch.push(f.nombre)
    }

    if (sinMatch.length > 0) {
      setFaltantes(sinMatch)
      setShowModal(true)
      return
    }

    await guardarMovimientos(resueltas)
  }

  async function guardarMovimientos(filasValidas: FilaProducto[]) {
    setShowModal(false)
    setGuardando(true)
    const supabase = createClient()
    const notaFinal = nota.trim() || `Importado vía IA · ${moneda}`
    for (const fila of filasValidas) {
      if (!fila.productoId) continue
      await supabase.rpc('registrar_movimiento', {
        p_producto_id: fila.productoId,
        p_almacen_id: almacenId,
        p_tipo: fila.accion,
        p_cantidad: fila.cantidad,
        p_nota: notaFinal,
      })
    }
    setGuardando(false)
    setExitoso(true)
  }

  const confianzaColor =
    resultado.confianza >= 80 ? '#00D7A7' : resultado.confianza >= 50 ? '#F4C400' : '#FF4D4D'

  if (exitoso) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px', textAlign: 'center', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
        <div style={{ width: '64px', height: '64px', background: '#00D7A7', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={32} color="#FFF" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 8px', color: '#111' }}>¡Guardado exitosamente!</h2>
        <p style={{ color: '#6B6B6B', fontSize: '14px', margin: '0 0 32px' }}>
          Los movimientos fueron registrados en el inventario.
        </p>
        <button
          onClick={onBack}
          style={{ padding: '13px 36px', background: '#111', border: 'none', borderRadius: '100px', color: '#FFF', fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontSize: '14px', marginBottom: '20px', padding: 0, fontFamily: 'inherit' }}
      >
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Header */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}>
        {documentoBase64 && documentoMediaType !== 'application/pdf' ? (
          <img
            src={`data:${documentoMediaType};base64,${documentoBase64}`}
            alt="Documento"
            style={{ width: '68px', height: '68px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E8E8E8' }}
          />
        ) : documentoBase64 ? (
          <div style={{ width: '68px', height: '68px', borderRadius: '12px', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #E8E8E8', fontSize: '28px' }}>
            📄
          </div>
        ) : null}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: '#111' }}>Confirmar extracción</h2>
          {resultado.confianza > 0 && (
            <span style={{ display: 'inline-block', padding: '3px 10px', background: confianzaColor + '22', color: confianzaColor, borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
              Confianza: {resultado.confianza}%
            </span>
          )}
        </div>
      </div>

      {resultado.modo === 'sin_api_key' && (
        <div style={{ padding: '12px 16px', background: '#FFF9E6', border: '1px solid #F4C400', borderRadius: '10px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <AlertCircle size={16} color="#F4C400" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#111' }}>
            La IA no está configurada. Ingresa los datos manualmente.
          </p>
        </div>
      )}

      {/* Moneda */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6B6B6B', marginBottom: '6px' }}>Moneda detectada</label>
        <select
          value={moneda}
          onChange={e => setMoneda(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E8E8E8', borderRadius: '10px', fontSize: '14px', color: '#111', background: '#FFF', fontFamily: 'inherit', outline: 'none' }}
        >
          <option value="USD">USD – Dólar</option>
          <option value="VES">VES – Bolívares</option>
          <option value="EUR">EUR – Euro</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E8E8E8', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 104px 36px', gap: '8px', padding: '10px 14px', background: '#F8F6EA', borderBottom: '1px solid #E8E8E8' }}>
          {['PRODUCTO', 'CANT.', 'ACCIÓN', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textAlign: i === 1 || i === 2 ? 'center' : 'left' }}>{h}</span>
          ))}
        </div>

        {filas.map(fila => (
          <div key={fila.uid} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 104px 36px', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #F0F0F0', alignItems: 'center' }}>
            <div>
              <input
                value={fila.nombre}
                onChange={e => actualizarFila(fila.uid, { nombre: e.target.value, productoId: null })}
                placeholder="Nombre del producto"
                style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '14px', color: '#111', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
              />
              {fila.nombre && (
                <span style={{ fontSize: '11px', color: fila.productoId ? '#00D7A7' : '#F4C400', display: 'block', marginTop: '1px' }}>
                  {fila.productoId ? '✓ Encontrado' : '⚠ Sin coincidencia'}
                </span>
              )}
            </div>
            <input
              type="number"
              min={1}
              value={fila.cantidad}
              onChange={e => actualizarFila(fila.uid, { cantidad: Math.max(1, Number(e.target.value)) })}
              style={{ width: '100%', border: '1px solid #E8E8E8', borderRadius: '8px', padding: '6px 6px', textAlign: 'center', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
            />
            <select
              value={fila.accion}
              onChange={e => actualizarFila(fila.uid, { accion: e.target.value as 'ingreso' | 'retiro' })}
              style={{ width: '100%', border: '1px solid #E8E8E8', borderRadius: '8px', padding: '6px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, background: '#FFF', color: '#111' }}
            >
              <option value="ingreso">Ingreso</option>
              <option value="retiro">Retiro</option>
            </select>
            <button
              onClick={() => setFilas(prev => prev.filter(f => f.uid !== fila.uid))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF4D4D', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <button
          onClick={agregarFila}
          style={{ width: '100%', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6B6B6B', fontSize: '14px', fontFamily: 'inherit' }}
        >
          <Plus size={16} /> Agregar producto
        </button>
      </div>

      {/* Nota */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6B6B6B', marginBottom: '6px' }}>Nota (opcional)</label>
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Ej: Compra a proveedor ABC, entrega en almacén norte..."
          rows={2}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E8E8E8', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' as const, color: '#111' }}
        />
      </div>

      {/* Almacén */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6B6B6B', marginBottom: '6px' }}>Almacén destino</label>
        <select
          value={almacenId}
          onChange={e => setAlmacenId(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E8E8E8', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, background: '#FFF', color: '#111' }}
        >
          {almacenes.map(a => (
            <option key={a.id} value={a.id}>
              {a.nombre}{a.es_default ? ' (Principal)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{ flex: 1, padding: '13px', borderRadius: '100px', border: 'none', background: '#111', color: '#FFF', fontWeight: 500, cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmar}
          disabled={guardando}
          style={{ flex: 2, padding: '13px', borderRadius: '100px', border: 'none', background: '#F4C400', color: '#111', fontWeight: 600, fontSize: '15px', cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1, fontFamily: 'inherit' }}
        >
          {guardando ? 'Guardando...' : 'Confirmar y guardar'}
        </button>
      </div>

      {/* Modal productos faltantes */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FFF', borderRadius: '20px', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 24px 64px rgba(17,17,17,0.16)' }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px', color: '#111' }}>Productos no encontrados</h3>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 12px' }}>
              Estos nombres no coinciden con tu inventario:
            </p>
            <ul style={{ margin: '0 0 16px', padding: '0 0 0 18px' }}>
              {faltantes.map(n => (
                <li key={n} style={{ fontSize: '14px', color: '#111', marginBottom: '4px' }}>{n}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => guardarMovimientos(filas.filter(f => f.productoId !== null && f.nombre.trim() && f.cantidad > 0))}
                style={{ flex: 1, padding: '12px', borderRadius: '100px', border: '1px solid #E8E8E8', background: '#FFF', color: '#111', fontWeight: 500, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              >
                Ignorar
              </button>
              <button
                onClick={() => { setShowModal(false); window.open('/dashboard/productos/nuevo', '_blank') }}
                style={{ flex: 1, padding: '12px', borderRadius: '100px', border: 'none', background: '#F4C400', color: '#111', fontWeight: 600, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              >
                Crear producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
