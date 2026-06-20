'use client'

import { useState } from 'react'
import { Camera, Image, FileText, Info } from 'lucide-react'
import EscanerFactura from './EscanerFactura'
import ConfirmacionIA from './ConfirmacionIA'

type Almacen = { id: string; nombre: string; es_default: boolean }

type ResultadoIA = {
  modo?: 'sin_api_key'
  productos: Array<{ nombre: string; cantidad: number; accion: string }>
  moneda: string
  confianza: number
  error?: string
}

type Modo = 'camara' | 'galeria' | 'pdf'
type Etapa = 'hub' | 'escaner' | 'confirmacion'

type Props = {
  empresaId: string
  almacenes: Almacen[]
}

export default function HubCaptura({ empresaId, almacenes }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('hub')
  const [modo, setModo] = useState<Modo | null>(null)
  const [resultadoIA, setResultadoIA] = useState<ResultadoIA | null>(null)
  const [documentoBase64, setDocumentoBase64] = useState('')
  const [documentoMediaType, setDocumentoMediaType] = useState('')

  function seleccionar(m: Modo) {
    setModo(m)
    setEtapa('escaner')
  }

  function onResultado(resultado: ResultadoIA, base64: string, mediaType: string) {
    setResultadoIA(resultado)
    setDocumentoBase64(base64)
    setDocumentoMediaType(mediaType)
    setEtapa('confirmacion')
  }

  function volver() {
    setEtapa('hub')
    setModo(null)
    setResultadoIA(null)
    setDocumentoBase64('')
    setDocumentoMediaType('')
  }

  if (etapa === 'escaner' && modo) {
    return <EscanerFactura modo={modo} onResultado={onResultado} onBack={volver} />
  }

  if (etapa === 'confirmacion' && resultadoIA) {
    return (
      <ConfirmacionIA
        resultado={resultadoIA}
        documentoBase64={documentoBase64}
        documentoMediaType={documentoMediaType}
        almacenes={almacenes}
        empresaId={empresaId}
        onBack={volver}
      />
    )
  }

  const opciones = [
    { modo: 'camara' as Modo, icon: Camera, titulo: 'Cámara', desc: 'Toma una foto en el momento', color: '#F4C400' },
    { modo: 'galeria' as Modo, icon: Image, titulo: 'Galería', desc: 'Selecciona una imagen existente', color: '#00D7A7' },
    { modo: 'pdf' as Modo, icon: FileText, titulo: 'Subir PDF', desc: 'Facturas digitales o listas exportadas', color: '#FF4D4D' },
  ]

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 16px', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
        Capturar o subir documento
      </h1>
      <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 28px' }}>
        Elige cómo deseas cargar tu documento.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {opciones.map(op => {
          const Icon = op.icon
          return (
            <button
              key={op.modo}
              onClick={() => seleccionar(op.modo)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: '#FFF', border: '1px solid #E8E8E8', borderRadius: '16px',
                padding: '18px 20px', cursor: 'pointer', textAlign: 'left', width: '100%',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: op.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={op.color} />
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 600, color: '#111' }}>{op.titulo}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6B6B6B' }}>{op.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px', padding: '14px 16px', background: '#EEF6FF', borderRadius: '12px', alignItems: 'flex-start' }}>
        <Info size={15} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0, fontSize: '13px', color: '#1D4ED8', lineHeight: '1.5' }}>
          ¿Tienes un archivo Excel? Expórtalo como PDF desde tu programa y súbelo aquí.
        </p>
      </div>
    </div>
  )
}
