'use client'

import { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { Building2, DollarSign, Bell, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { EmpresaConfig, TasaCambio, ConfigAlertas } from '../page'

type Tab = 'negocio' | 'tasa' | 'alertas'

type Props = {
  empresa: EmpresaConfig
  tasaActual: TasaCambio | null
  configAlertas: ConfigAlertas | null
  empresaId: string
  userEmail: string
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1.5px solid #E8E8E8', fontSize: '15px', color: '#111111',
  background: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const cardStyle: CSSProperties = {
  background: '#FFFFFF', borderRadius: '16px',
  padding: '22px 24px', border: '1px solid #E8E8E8',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', color: '#6B6B6B', margin: '0 0 6px',
      fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
    }}>
      {children}
    </p>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '48px', height: '28px', borderRadius: '14px',
        background: value ? '#00D7A7' : '#E8E8E8',
        border: 'none', cursor: 'pointer', padding: '3px',
        display: 'flex', alignItems: 'center',
        justifyContent: value ? 'flex-end' : 'flex-start',
        flexShrink: 0,
      }}
    >
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF' }} />
    </button>
  )
}

function SaveButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '11px 24px', borderRadius: '100px',
        background: '#F4C400', border: 'none',
        fontSize: '14px', fontWeight: 700,
        cursor: loading ? 'wait' : 'pointer', color: '#111111',
        fontFamily: 'inherit',
      }}
    >
      {loading ? 'Guardando...' : label}
    </button>
  )
}

export default function ConfiguracionForm({ empresa, tasaActual, configAlertas, empresaId, userEmail }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('negocio')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── Sección 1: Negocio ──────────────────────────────────────
  const [nombre, setNombre] = useState(empresa.nombre)
  const [ruc, setRuc] = useState(empresa.ruc ?? '')
  const [direccion, setDireccion] = useState(empresa.direccion ?? '')
  const [telefono, setTelefono] = useState(empresa.telefono ?? '')
  const [correoContacto, setCorreoContacto] = useState(empresa.correo_contacto ?? '')
  const [savingNegocio, setSavingNegocio] = useState(false)
  const [errorNegocio, setErrorNegocio] = useState<string | null>(null)

  async function handleSaveNegocio() {
    if (!nombre.trim()) { setErrorNegocio('El nombre es requerido'); return }
    setSavingNegocio(true); setErrorNegocio(null)
    const { error } = await createClient()
      .from('empresas')
      .update({
        nombre: nombre.trim(),
        ruc: ruc.trim() || null,
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        correo_contacto: correoContacto.trim() || null,
      })
      .eq('id', empresaId)
    setSavingNegocio(false)
    if (error) { setErrorNegocio(error.message); return }
    showToast('Datos del negocio guardados ✓')
  }

  // ── Sección 2: Tasa de cambio ───────────────────────────────
  const [usdVes, setUsdVes] = useState<number | null>(tasaActual?.usd_ves ?? null)
  const [eurVes, setEurVes] = useState<number | null>(tasaActual?.eur_ves ?? null)
  const [tasaFecha, setTasaFecha] = useState<string | null>(tasaActual?.fecha ?? null)
  const [tasaFuente, setTasaFuente] = useState<string | null>(tasaActual?.fuente ?? null)
  const [bcvLoading, setBcvLoading] = useState(false)
  const [bcvError, setBcvError] = useState<string | null>(null)
  const [usarManual, setUsarManual] = useState(false)
  const [usdManual, setUsdManual] = useState(tasaActual?.usd_ves?.toString() ?? '')
  const [eurManual, setEurManual] = useState(tasaActual?.eur_ves?.toString() ?? '')
  const [savingTasa, setSavingTasa] = useState(false)

  async function handleActualizarBcv() {
    setBcvLoading(true); setBcvError(null)
    try {
      const [usdRes, eurRes] = await Promise.allSettled([
        fetch('https://pydolarve.org/api/v2/dollar?monitor=bcv').then(r => r.json()),
        fetch('https://pydolarve.org/api/v2/euro?monitor=bcv').then(r => r.json()),
      ])
      const usdData = usdRes.status === 'fulfilled' ? usdRes.value : null
      const eurData = eurRes.status === 'fulfilled' ? eurRes.value : null

      const newUsd = usdData?.price != null ? Number(usdData.price) : null
      const newEur = eurData?.price != null ? Number(eurData.price) : null

      if (!newUsd || isNaN(newUsd)) {
        setBcvError('No se pudo obtener la tasa del BCV. La API puede estar temporalmente no disponible.')
        setBcvLoading(false)
        return
      }

      const fecha = new Date().toISOString().split('T')[0]
      setUsdVes(newUsd)
      setEurVes(!newEur || isNaN(newEur) ? null : newEur)
      setTasaFecha(fecha)
      setTasaFuente('bcv_api')

      await createClient().from('tasas_cambio').insert({
        empresa_id: empresaId,
        fecha,
        usd_ves: newUsd,
        eur_ves: !newEur || isNaN(newEur) ? null : newEur,
        fuente: 'bcv_api',
      })
      showToast('Tasa BCV actualizada ✓')
    } catch {
      setBcvError('Error de conexión con la API del BCV.')
    }
    setBcvLoading(false)
  }

  async function handleSaveTasaManual() {
    const usd = parseFloat(usdManual.replace(',', '.'))
    const eur = parseFloat(eurManual.replace(',', '.'))
    if (isNaN(usd) || usd <= 0) { showToast('Ingresa una tasa USD/VES válida'); return }
    setSavingTasa(true)
    const fecha = new Date().toISOString().split('T')[0]
    await createClient().from('tasas_cambio').insert({
      empresa_id: empresaId,
      fecha,
      usd_ves: usd,
      eur_ves: isNaN(eur) || eur <= 0 ? null : eur,
      fuente: 'manual',
    })
    setUsdVes(usd)
    setEurVes(isNaN(eur) || eur <= 0 ? null : eur)
    setTasaFecha(fecha)
    setTasaFuente('manual')
    setSavingTasa(false)
    showToast('Tasa manual guardada ✓')
  }

  // ── Sección 3: Alertas ──────────────────────────────────────
  const [correoAlertas, setCorreoAlertas] = useState(configAlertas?.correo_alertas ?? userEmail)
  const [alertasActivas, setAlertasActivas] = useState(configAlertas?.alertas_activas ?? true)
  const [umbral, setUmbral] = useState(configAlertas?.umbral_alerta ?? 100)
  const [savingAlertas, setSavingAlertas] = useState(false)
  const [errorAlertas, setErrorAlertas] = useState<string | null>(null)

  async function handleSaveAlertas() {
    if (!correoAlertas.trim()) { setErrorAlertas('El correo es requerido'); return }
    setSavingAlertas(true); setErrorAlertas(null)
    const { error } = await createClient()
      .from('configuracion_empresa')
      .upsert({
        empresa_id: empresaId,
        alertas_activas: alertasActivas,
        correo_alertas: correoAlertas.trim(),
        umbral_alerta: umbral,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'empresa_id' })
    setSavingAlertas(false)
    if (error) { setErrorAlertas(error.message); return }
    showToast('Configuración de alertas guardada ✓')
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'negocio', label: 'Negocio', icon: <Building2 size={15} /> },
    { key: 'tasa', label: 'Tasa de cambio', icon: <DollarSign size={15} /> },
    { key: 'alertas', label: 'Alertas', icon: <Bell size={15} /> },
  ]

  return (
    <div style={{
      padding: '24px 20px 80px', maxWidth: '700px', margin: '0 auto',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#00D7A7', color: '#111111',
          padding: '11px 20px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 100, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 24px' }}>
        Configuración
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '100px',
              border: activeTab === t.key ? 'none' : '1px solid #E8E8E8',
              background: activeTab === t.key ? '#F4C400' : '#FFFFFF',
              color: '#111111', fontWeight: activeTab === t.key ? 600 : 400,
              cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── NEGOCIO ──────────────────────────────────────────── */}
      {activeTab === 'negocio' && (
        <div style={cardStyle}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#111111', margin: '0 0 20px' }}>
            Datos del negocio
          </p>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel>NOMBRE DE LA EMPRESA *</FieldLabel>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Distribuidora Central" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel>IDENTIFICACIÓN FISCAL / RUC</FieldLabel>
            <input value={ruc} onChange={e => setRuc(e.target.value)} placeholder="J-12345678-9" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel>DIRECCIÓN</FieldLabel>
            <input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle Principal, Caracas" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <FieldLabel>TELÉFONO</FieldLabel>
            <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+58 412 000 0000" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <FieldLabel>CORREO DE CONTACTO</FieldLabel>
            <input value={correoContacto} onChange={e => setCorreoContacto(e.target.value)} type="email" placeholder="contacto@empresa.com" style={inputStyle} />
          </div>

          {errorNegocio && (
            <p style={{ fontSize: '13px', color: '#FF4D4D', margin: '0 0 12px' }}>{errorNegocio}</p>
          )}
          <SaveButton onClick={handleSaveNegocio} loading={savingNegocio} label="Guardar datos" />
        </div>
      )}

      {/* ── TASA DE CAMBIO ───────────────────────────────────── */}
      {activeTab === 'tasa' && (
        <div style={cardStyle}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#111111', margin: '0 0 20px' }}>
            Tasa de cambio
          </p>

          {/* Rates display */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'USD / VES', value: usdVes },
              { label: 'EUR / VES', value: eurVes },
            ].map(rate => (
              <div key={rate.label} style={{
                flex: 1, background: '#F8F6EA', borderRadius: '14px',
                padding: '16px', border: '1px solid #E8E8E8',
              }}>
                <p style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {rate.label}
                </p>
                <p style={{ fontSize: '26px', fontWeight: 800, color: '#111111', margin: '0 0 4px' }}>
                  {rate.value !== null
                    ? rate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '—'}
                </p>
                <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0 }}>
                  {tasaFecha
                    ? `${tasaFuente === 'bcv_api' ? 'BCV' : 'Manual'} · ${tasaFecha}`
                    : 'Sin datos guardados'}
                </p>
              </div>
            ))}
          </div>

          {/* BCV button */}
          <button
            onClick={handleActualizarBcv}
            disabled={bcvLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '100px',
              background: '#111111', border: 'none',
              fontSize: '14px', fontWeight: 600,
              cursor: bcvLoading ? 'wait' : 'pointer',
              color: '#FFFFFF', fontFamily: 'inherit',
              marginBottom: bcvError ? '12px' : '20px',
            }}
          >
            <RefreshCw size={15} />
            {bcvLoading ? 'Actualizando...' : 'Actualizar desde BCV'}
          </button>

          {bcvError && (
            <p style={{ fontSize: '13px', color: '#FF4D4D', margin: '0 0 16px' }}>{bcvError}</p>
          )}

          <div style={{ height: '1px', background: '#F0F0F0', margin: '4px 0 20px' }} />

          {/* Toggle manual */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px', background: '#F8F6EA', borderRadius: '12px',
            marginBottom: usarManual ? '20px' : '0',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>Usar tasa manual</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>Ingresar las tasas manualmente</p>
            </div>
            <Toggle value={usarManual} onChange={setUsarManual} />
          </div>

          {usarManual && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>TASA USD / VES</FieldLabel>
                  <input
                    value={usdManual}
                    onChange={e => setUsdManual(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 36.50"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>TASA EUR / VES</FieldLabel>
                  <input
                    value={eurManual}
                    onChange={e => setEurManual(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 40.20"
                    style={inputStyle}
                  />
                </div>
              </div>
              <SaveButton onClick={handleSaveTasaManual} loading={savingTasa} label="Guardar tasa manual" />
            </>
          )}
        </div>
      )}

      {/* ── ALERTAS ──────────────────────────────────────────── */}
      {activeTab === 'alertas' && (
        <div style={cardStyle}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#111111', margin: '0 0 20px' }}>
            Alertas por email
          </p>

          <div style={{ marginBottom: '20px' }}>
            <FieldLabel>CORREO DESTINATARIO *</FieldLabel>
            <input
              value={correoAlertas}
              onChange={e => setCorreoAlertas(e.target.value)}
              type="email"
              placeholder="admin@empresa.com"
              style={inputStyle}
            />
          </div>

          {/* Toggle alertas activas */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px', background: '#F8F6EA', borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>Alertas activas</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '2px 0 0' }}>
                {alertasActivas ? 'Recibirás emails cuando el stock esté bajo' : 'Las alertas están desactivadas'}
              </p>
            </div>
            <Toggle value={alertasActivas} onChange={setAlertasActivas} />
          </div>

          {/* Umbral */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <FieldLabel>UMBRAL DE ALERTA</FieldLabel>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#F4C400' }}>{umbral}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={umbral}
              onChange={e => setUmbral(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#F4C400', display: 'block' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#6B6B6B' }}>50%</span>
              <span style={{ fontSize: '11px', color: '#6B6B6B' }}>100% (mínimo)</span>
              <span style={{ fontSize: '11px', color: '#6B6B6B' }}>200%</span>
            </div>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '14px 0 0', lineHeight: '1.6' }}>
              Recibirás un email cuando el stock de un producto llegue a{' '}
              <strong style={{ color: '#111111' }}>{umbral}%</strong> de su stock mínimo.
              {umbral > 100 && (
                <> Alertará antes de llegar al límite.</>
              )}
              {umbral === 100 && (
                <> Alertará exactamente al llegar al mínimo.</>
              )}
              {umbral < 100 && (
                <> Alertará solo cuando esté por debajo del mínimo.</>
              )}
            </p>
          </div>

          {errorAlertas && (
            <p style={{ fontSize: '13px', color: '#FF4D4D', margin: '0 0 12px' }}>{errorAlertas}</p>
          )}
          <SaveButton onClick={handleSaveAlertas} loading={savingAlertas} label="Guardar configuración de alertas" />
        </div>
      )}
    </div>
  )
}
