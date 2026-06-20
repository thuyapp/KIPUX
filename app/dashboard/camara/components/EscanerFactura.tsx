'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Upload, Camera, X, Sparkles } from 'lucide-react'

type ResultadoIA = {
  modo?: 'sin_api_key'
  productos: Array<{ nombre: string; cantidad: number; accion: string }>
  moneda: string
  confianza: number
  error?: string
}

type Props = {
  modo: 'camara' | 'galeria' | 'pdf'
  onResultado: (resultado: ResultadoIA, base64: string, mediaType: string) => void
  onBack: () => void
}

export default function EscanerFactura({ modo, onResultado, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [streamActivo, setStreamActivo] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)

  const detenerStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setStreamActivo(false)
  }, [])

  useEffect(() => {
    if (modo !== 'camara') return
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setStreamActivo(true)
      })
      .catch(() => setStreamActivo(false))
    return () => detenerStream()
  }, [modo, detenerStream])

  async function llamarIA(base64: string, mediaType: string, tipo: 'imagen' | 'pdf') {
    setProcesando(true)
    setProgreso(0)
    const interval = setInterval(() => setProgreso(p => Math.min(p + 4, 70)), 150)
    try {
      const res = await fetch('/api/ia/procesar-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType, tipo }),
      })
      const data = await res.json()
      clearInterval(interval)
      setProgreso(100)
      setTimeout(() => {
        setProcesando(false)
        onResultado(data, base64, mediaType)
      }, 400)
    } catch {
      clearInterval(interval)
      setProcesando(false)
      onResultado({ productos: [], moneda: 'USD', confianza: 0, error: 'Error de conexión' }, base64, mediaType)
    }
  }

  function leerYEnviar(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      llamarIA(base64, file.type || 'image/jpeg', modo === 'pdf' ? 'pdf' : 'imagen')
    }
    reader.readAsDataURL(file)
  }

  function capturarFoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1]
    detenerStream()
    llamarIA(base64, 'image/jpeg', 'imagen')
  }

  function manejarArchivo(file: File) {
    setErrorArchivo(null)
    if (modo === 'pdf') {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setErrorArchivo('Solo se aceptan archivos PDF.')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorArchivo('El archivo supera el límite de 20 MB.')
        return
      }
      setArchivoSeleccionado(file)
    } else {
      setArchivoSeleccionado(file)
      const reader = new FileReader()
      reader.onload = e => setImagenPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // ── MODO CÁMARA ──────────────────────────────────────────────────────────────
  if (modo === 'camara') {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#000' }}>
        <button
          onClick={() => { detenerStream(); onBack() }}
          style={{
            position: 'absolute', top: '16px', left: '16px', zIndex: 10,
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF',
          }}
        >
          <ArrowLeft size={20} />
        </button>

        {streamActivo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100vh', objectFit: 'cover' }}
            />
            {/* Overlay guía */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '75%', height: '48%', border: '2px dashed rgba(255,255,255,0.7)', borderRadius: '16px' }} />
            </div>
            {/* Controles */}
            <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '36px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}
              >
                <Upload size={20} />
              </button>
              <button
                onClick={capturarFoto}
                style={{ background: '#FFF', border: '4px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: '72px', height: '72px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Camera size={28} color="#111" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) { detenerStream(); leerYEnviar(f) }
              }}
            />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
            <p style={{ color: '#FFF', fontSize: '15px', textAlign: 'center', padding: '0 24px' }}>
              Cámara no disponible. Usa la galería.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '12px 28px', background: '#F4C400', border: 'none', borderRadius: '100px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit' }}
            >
              Abrir galería
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) leerYEnviar(f) }} />
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {procesando && <OverlayProcesando progreso={progreso} />}
      </div>
    )
  }

  // ── MODO GALERÍA ──────────────────────────────────────────────────────────────
  if (modo === 'galeria') {
    return (
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
        <BtnVolver onClick={onBack} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: '0 0 20px' }}>Seleccionar imagen</h2>

        {imagenPreview ? (
          <>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <img
                src={imagenPreview}
                alt="Preview"
                style={{ width: '100%', borderRadius: '16px', maxHeight: '380px', objectFit: 'contain', background: '#F8F6EA' }}
              />
              <button
                onClick={() => { setImagenPreview(null); setArchivoSeleccionado(null) }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}
              >
                <X size={16} />
              </button>
            </div>
            <button
              onClick={() => archivoSeleccionado && leerYEnviar(archivoSeleccionado)}
              style={{ width: '100%', padding: '14px', background: '#F4C400', border: 'none', borderRadius: '100px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Usar imagen
            </button>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', padding: '48px 20px', background: '#FFF', border: '2px dashed #E8E8E8', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', fontFamily: 'inherit' }}
          >
            <Upload size={32} color="#6B6B6B" />
            <span style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>Seleccionar imagen</span>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>JPG, PNG, HEIC...</span>
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) manejarArchivo(f) }} />
        {procesando && <OverlayProcesando progreso={progreso} />}
      </div>
    )
  }

  // ── MODO PDF ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <BtnVolver onClick={onBack} />
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: '0 0 20px' }}>Subir PDF</h2>

      {archivoSeleccionado ? (
        <>
          <div style={{ padding: '16px', background: '#FFF', border: '1px solid #E8E8E8', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{archivoSeleccionado.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B6B6B' }}>{(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => { setArchivoSeleccionado(null); setErrorArchivo(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', padding: '4px', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
          {errorArchivo && <p style={{ color: '#FF4D4D', fontSize: '13px', margin: '6px 0 0' }}>{errorArchivo}</p>}
          <button
            onClick={() => leerYEnviar(archivoSeleccionado)}
            style={{ width: '100%', padding: '14px', background: '#F4C400', border: 'none', borderRadius: '100px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginTop: '16px', fontFamily: 'inherit' }}
          >
            Subir archivo
          </button>
        </>
      ) : (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) manejarArchivo(f) }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '52px 24px', background: dragging ? '#FFF9E6' : '#FFF',
              border: `2px dashed ${dragging ? '#F4C400' : '#E8E8E8'}`, borderRadius: '16px',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <Upload size={32} color="#FF4D4D" />
            <span style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>Arrastra tu PDF aquí</span>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>o haz clic para seleccionar · máx. 20 MB</span>
          </div>
          {errorArchivo && <p style={{ color: '#FF4D4D', fontSize: '13px', marginTop: '8px' }}>{errorArchivo}</p>}
          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#FFF9E6', borderRadius: '12px', fontSize: '13px', color: '#6B6B6B', lineHeight: '1.5' }}>
            ¿Tienes un archivo Excel? Expórtalo como PDF desde tu programa y súbelo aquí.
          </div>
        </>
      )}

      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) manejarArchivo(f) }} />
      {procesando && <OverlayProcesando progreso={progreso} />}
    </div>
  )
}

function BtnVolver({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontSize: '14px', marginBottom: '20px', padding: 0, fontFamily: 'inherit' }}
    >
      <ArrowLeft size={16} /> Volver
    </button>
  )
}

function OverlayProcesando({ progreso }: { progreso: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.88)', zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '24px',
    }}>
      <style>{`@keyframes ia-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.25);opacity:0.75}}`}</style>
      <div style={{ animation: 'ia-pulse 1.4s ease-in-out infinite', color: '#00D7A7' }}>
        <Sparkles size={44} />
      </div>
      <p style={{ color: '#FFF', fontSize: '20px', fontWeight: 700, margin: 0 }}>IA procesando...</p>
      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', textAlign: 'center', margin: 0, maxWidth: '260px' }}>
        Estamos leyendo tu documento y extrayendo la información.
      </p>
      <div style={{ width: '240px', height: '6px', background: 'rgba(255,255,255,0.18)', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
        <div style={{ height: '100%', background: '#00D7A7', borderRadius: '3px', width: `${progreso}%`, transition: 'width 0.2s ease' }} />
      </div>
    </div>
  )
}
