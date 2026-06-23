'use client'

import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Camera, Trash2 } from 'lucide-react'

export type ProductoExistente = {
  id: string
  nombre: string
  sku: string | null
  descripcion: string | null
  categoria_id: string | null
  unidad: string
  stock_minimo: number
  costo_usd: number
  activo: boolean
  foto_url: string | null
}

type Categoria = { id: string; nombre: string }
type Almacen = { id: string; nombre: string; es_default: boolean }

type Props = {
  modo: 'crear' | 'editar'
  empresaId: string
  categorias: Categoria[]
  almacenes: Almacen[]
  producto?: ProductoExistente
}

const UNIDADES = ['unidad', 'metro', 'kg', 'litro', 'caja', 'rollo', 'paquete']

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E8E8E8',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#111111',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#FFFFFF',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#111111',
  marginBottom: '6px',
}

const cardStyle: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E8E8E8',
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
}

const cardTitleStyle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#111111',
  margin: '0 0 16px',
}

export default function ProductoForm({ modo, empresaId, categorias, almacenes, producto }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultAlmacenId = almacenes.find(a => a.es_default)?.id ?? almacenes[0]?.id ?? ''

  // Campos del formulario
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [sku, setSku] = useState(producto?.sku ?? '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id ?? '')
  const [unidad, setUnidad] = useState(producto?.unidad ?? '')
  const [stockMinimo, setStockMinimo] = useState(String(producto?.stock_minimo ?? 0))
  const [costoUsd, setCostoUsd] = useState(producto?.costo_usd ? String(producto.costo_usd) : '')
  const [activo, setActivo] = useState(producto?.activo ?? true)

  // Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(producto?.foto_url ?? null)

  // Solo modo crear
  const [stockInicial, setStockInicial] = useState('0')
  const [almacenId, setAlmacenId] = useState(defaultAlmacenId)
  const [ubicacion, setUbicacion] = useState('')

  // Estado de UI
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, foto: 'La foto no puede superar los 5MB.' }))
      return
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrors(prev => ({ ...prev, foto: 'Solo se aceptan PNG, JPG o WebP.' }))
      return
    }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
    setErrors(prev => { const next = { ...prev }; delete next.foto; return next })
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = 'El nombre es requerido.'
    if (!categoriaId) e.categoriaId = 'Selecciona una categoría.'
    if (!unidad) e.unidad = 'Selecciona una unidad.'
    if (!costoUsd || parseFloat(costoUsd) <= 0) e.costoUsd = 'Ingresa un precio mayor a 0.'
    if (parseInt(stockMinimo) < 0) e.stockMinimo = 'El stock mínimo no puede ser negativo.'
    if (modo === 'crear') {
      if (!almacenId) e.almacenId = 'Selecciona un almacén.'
      if (parseInt(stockInicial) < 0) e.stockInicial = 'El stock inicial no puede ser negativo.'
    }
    return e
  }

  async function uploadFoto(productoId: string): Promise<string | null> {
    if (!fotoFile) return null
    const form = new FormData()
    form.append('file', fotoFile)
    form.append('empresaId', empresaId)
    form.append('productoId', productoId)
    const res = await fetch('/api/storage/upload-foto', { method: 'POST', body: form })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Error desconocido' }))
      setErrors(prev => ({ ...prev, foto: `Error al subir foto: ${body.error}` }))
      return null
    }
    const { url } = await res.json()
    return url
  }

  async function handleGuardar() {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setLoading(true)
    setErrors({})
    const supabase = createClient()

    if (modo === 'crear') {
      const productoId = crypto.randomUUID()
      const fotoUrl = await uploadFoto(productoId)

      const { error: insertError } = await supabase.from('productos').insert({
        id: productoId,
        empresa_id: empresaId,
        nombre: nombre.trim(),
        sku: sku.trim() || null,
        descripcion: descripcion.trim() || null,
        categoria_id: categoriaId || null,
        unidad,
        stock_minimo: parseInt(stockMinimo),
        costo_usd: parseFloat(costoUsd),
        activo,
        foto_url: fotoUrl,
      })

      if (insertError) {
        setErrors({ general: insertError.message })
        setLoading(false)
        return
      }

      const stockInicialNum = parseInt(stockInicial)

      const { error: stockError } = await supabase.from('stock_por_almacen').insert({
        empresa_id: empresaId,
        producto_id: productoId,
        almacen_id: almacenId,
        stock_actual: 0,
        ubicacion: ubicacion.trim() || null,
      })

      if (stockError) {
        setErrors({ general: stockError.message })
        setLoading(false)
        return
      }

      if (stockInicialNum > 0) {
        await supabase.rpc('registrar_movimiento', {
          p_producto_id: productoId,
          p_almacen_id: almacenId,
          p_tipo: 'ingreso',
          p_cantidad: stockInicialNum,
          p_nota: 'Stock inicial al crear producto',
        })
      }

      router.push('/dashboard')
    } else {
      const productoId = producto!.id
      let fotoUrlFinal = producto?.foto_url ?? null
      if (fotoFile) {
        const uploaded = await uploadFoto(productoId)
        if (uploaded) fotoUrlFinal = uploaded
      }

      const { error: updateError } = await supabase
        .from('productos')
        .update({
          nombre: nombre.trim(),
          sku: sku.trim() || null,
          descripcion: descripcion.trim() || null,
          categoria_id: categoriaId || null,
          unidad,
          stock_minimo: parseInt(stockMinimo),
          costo_usd: parseFloat(costoUsd),
          activo,
          foto_url: fotoUrlFinal,
        })
        .eq('id', productoId)

      if (updateError) {
        setErrors({ general: updateError.message })
        setLoading(false)
        return
      }

      router.push('/dashboard')
    }
  }

  async function handleDesactivar() {
    if (!producto) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('productos').update({ activo: false }).eq('id', producto.id)
    router.push('/dashboard')
  }

  return (
    <div style={{ background: '#F8F6EA', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #E8E8E8', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', flexShrink: 0 }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: 0 }}>
              {modo === 'crear' ? 'Nuevo producto' : 'Editar producto'}
            </h1>
            <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>
              {modo === 'crear' ? 'Completa los datos del producto' : 'Actualiza la información del producto'}
            </p>
          </div>
        </div>

        {/* Error general */}
        {errors.general && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FF4D4D', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
            <p style={{ color: '#FF4D4D', fontSize: '14px', margin: 0 }}>{errors.general}</p>
          </div>
        )}

        {/* Sección 1 — Foto */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Foto del producto</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '96px', height: '96px', borderRadius: '16px', cursor: 'pointer',
                border: `2px dashed ${errors.foto ? '#FF4D4D' : '#E8E8E8'}`,
                background: '#F8F6EA', position: 'relative', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}
            >
              {fotoPreview ? (
                <>
                  <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={22} color="#FFFFFF" />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <Camera size={22} style={{ color: '#6B6B6B' }} />
                  <span style={{ fontSize: '11px', color: '#6B6B6B', textAlign: 'center' as const }}>Agregar foto</span>
                </div>
              )}
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 8px' }}>PNG, JPG o WebP · Máx 5MB</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '8px 16px', borderRadius: '100px', border: '1px solid #E8E8E8', background: '#FFFFFF', color: '#111111', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {fotoPreview ? 'Cambiar foto' : 'Seleccionar foto'}
              </button>
            </div>
          </div>
          {errors.foto && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>{errors.foto}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={handleFotoChange}
          />
        </div>

        {/* Sección 2 — Información básica */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Información básica</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Nombre <span style={{ color: '#FF4D4D' }}>*</span></label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Cable HDMI 2m"
              style={{ ...inputStyle, borderColor: errors.nombre ? '#FF4D4D' : '#E8E8E8' }}
            />
            {errors.nombre && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.nombre}</p>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>SKU / Código <span style={{ color: '#6B6B6B', fontWeight: 400 }}>(opcional)</span></label>
            <input
              type="text"
              value={sku}
              onChange={e => setSku(e.target.value)}
              placeholder="Ej: CABLE-001"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Categoría <span style={{ color: '#FF4D4D' }}>*</span></label>
              <select
                value={categoriaId}
                onChange={e => setCategoriaId(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.categoriaId ? '#FF4D4D' : '#E8E8E8' }}
              >
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {errors.categoriaId && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.categoriaId}</p>}
            </div>
            <div>
              <label style={labelStyle}>Unidad <span style={{ color: '#FF4D4D' }}>*</span></label>
              <select
                value={unidad}
                onChange={e => setUnidad(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.unidad ? '#FF4D4D' : '#E8E8E8' }}
              >
                <option value="">Seleccionar...</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unidad && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.unidad}</p>}
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Descripción <span style={{ color: '#6B6B6B', fontWeight: 400 }}>(opcional)</span></label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value.slice(0, 200))}
              placeholder="Describe el producto brevemente..."
              rows={3}
              style={{ ...inputStyle, resize: 'none' as const }}
            />
            <p style={{ fontSize: '12px', color: descripcion.length >= 180 ? '#F4C400' : '#6B6B6B', marginTop: '4px' }}>
              {descripcion.length} / 200
            </p>
          </div>
        </div>

        {/* Sección 3 — Inventario */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Inventario</h3>

          {modo === 'crear' && (
            <>
              <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Stock inicial <span style={{ color: '#FF4D4D' }}>*</span></label>
                  <input
                    type="number"
                    min={0}
                    value={stockInicial}
                    onChange={e => setStockInicial(e.target.value)}
                    style={{ ...inputStyle, borderColor: errors.stockInicial ? '#FF4D4D' : '#E8E8E8' }}
                  />
                  {errors.stockInicial && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.stockInicial}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Stock mínimo <span style={{ color: '#FF4D4D' }}>*</span></label>
                  <input
                    type="number"
                    min={0}
                    value={stockMinimo}
                    onChange={e => setStockMinimo(e.target.value)}
                    style={{ ...inputStyle, borderColor: errors.stockMinimo ? '#FF4D4D' : '#E8E8E8' }}
                  />
                  {errors.stockMinimo && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.stockMinimo}</p>}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Almacén <span style={{ color: '#FF4D4D' }}>*</span></label>
                <select
                  value={almacenId}
                  onChange={e => setAlmacenId(e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.almacenId ? '#FF4D4D' : '#E8E8E8' }}
                >
                  <option value="">Seleccionar...</option>
                  {almacenes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}{a.es_default ? ' (predeterminado)' : ''}
                    </option>
                  ))}
                </select>
                {errors.almacenId && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.almacenId}</p>}
              </div>

              <div style={{ marginBottom: 0 }}>
                <label style={labelStyle}>Ubicación dentro del almacén <span style={{ color: '#6B6B6B', fontWeight: 400 }}>(opcional)</span></label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={e => setUbicacion(e.target.value)}
                  placeholder="Ej: Estante A - Pasillo 2"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {modo === 'editar' && (
            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Stock mínimo <span style={{ color: '#FF4D4D' }}>*</span></label>
              <input
                type="number"
                min={0}
                value={stockMinimo}
                onChange={e => setStockMinimo(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.stockMinimo ? '#FF4D4D' : '#E8E8E8' }}
              />
              {errors.stockMinimo && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.stockMinimo}</p>}
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '6px' }}>
                El stock actual se modifica desde el dashboard con los botones +/−.
              </p>
            </div>
          )}
        </div>

        {/* Sección 4 — Costos */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Costos</h3>
          <div>
            <label style={labelStyle}>Precio de compra (USD) <span style={{ color: '#FF4D4D' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6B6B6B', fontSize: '14px', pointerEvents: 'none' }}>$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={costoUsd}
                onChange={e => setCostoUsd(e.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, paddingLeft: '28px', borderColor: errors.costoUsd ? '#FF4D4D' : '#E8E8E8' }}
              />
            </div>
            {errors.costoUsd && <p style={{ color: '#FF4D4D', fontSize: '12px', marginTop: '4px' }}>{errors.costoUsd}</p>}
          </div>
        </div>

        {/* Sección 5 — Configuración */}
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3 style={cardTitleStyle}>Configuración</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              onClick={() => setActivo(v => !v)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', background: activo ? '#F4C400' : '#E8E8E8', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <div style={{ position: 'absolute', top: '2px', left: activo ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 500, color: '#111111', margin: 0, fontSize: '14px' }}>Producto activo</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>El producto aparecerá en el inventario</p>
            </div>
          </div>
        </div>

        {/* Confirmación desactivar */}
        {confirmDelete && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FF4D4D', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#111111', fontWeight: 600, margin: '0 0 12px', fontSize: '14px' }}>
              ¿Desactivar este producto? Ya no aparecerá en el inventario.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDesactivar}
                disabled={loading}
                style={{ padding: '10px 20px', borderRadius: '100px', border: 'none', background: '#FF4D4D', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              >
                Sí, desactivar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ padding: '10px 20px', borderRadius: '100px', border: '1px solid #E8E8E8', background: '#FFFFFF', color: '#111111', fontWeight: 500, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Botones principales */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {modo === 'editar' && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #E8E8E8', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4D4D', flexShrink: 0 }}
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            style={{ flex: 1, padding: '14px', borderRadius: '100px', border: 'none', background: '#111111', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            style={{ flex: 2, padding: '14px', borderRadius: '100px', border: 'none', background: '#F4C400', color: '#111111', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Guardando...' : modo === 'crear' ? 'Guardar producto' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}
