'use client'

import { useState } from 'react'
import { ClipboardList, PlusCircle, Activity, AlertTriangle } from 'lucide-react'
import type { Auditoria, EmpleadoRef, CategoriaRef, AlmacenRef } from '../page'
import HistorialAuditorias from './HistorialAuditorias'
import NuevaAuditoria from './NuevaAuditoria'
import MonitoreoAuditoria from './MonitoreoAuditoria'
import ReporteDiscrepancias from './ReporteDiscrepancias'

type Tab = 'historial' | 'nueva' | 'monitoreo' | 'discrepancias'

type Props = {
  empresaId: string
  userId: string
  empleados: EmpleadoRef[]
  categorias: CategoriaRef[]
  almacenes: AlmacenRef[]
  auditoriaActiva: Auditoria | null
}

export default function AuditoriaAdminPanel({ empresaId, userId, empleados, categorias, almacenes, auditoriaActiva: initialActiva }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialActiva ? 'monitoreo' : 'historial')
  const [auditoriaActiva, setAuditoriaActiva] = useState<Auditoria | null>(initialActiva)
  const [reporteAuditoriaId, setReporteAuditoriaId] = useState<string | null>(null)

  function handleAuditoriaCreada(auditoria: Auditoria) {
    setAuditoriaActiva(auditoria)
    setActiveTab('monitoreo')
  }

  function handleAuditoriaFinalizada() {
    setAuditoriaActiva(null)
    setActiveTab('historial')
  }

  function handleVerReporte(auditoriaId: string) {
    setReporteAuditoriaId(auditoriaId)
    setActiveTab('discrepancias')
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { key: 'historial', label: 'Historial', icon: <ClipboardList size={15} /> },
    { key: 'nueva', label: 'Nueva auditoría', icon: <PlusCircle size={15} /> },
    { key: 'monitoreo', label: 'Monitoreo', icon: <Activity size={15} />, badge: !!auditoriaActiva },
    { key: 'discrepancias', label: 'Discrepancias', icon: <AlertTriangle size={15} /> },
  ]

  return (
    <div style={{
      padding: '24px 20px 80px', maxWidth: '900px', margin: '0 auto',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111111', margin: '0 0 24px' }}>
        Auditoría
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', position: 'relative',
              padding: '9px 16px', borderRadius: '100px', flexShrink: 0,
              border: activeTab === t.key ? 'none' : '1px solid #E8E8E8',
              background: activeTab === t.key ? '#F4C400' : '#FFFFFF',
              color: '#111111', fontWeight: activeTab === t.key ? 600 : 400,
              cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
            }}
          >
            {t.icon}
            {t.label}
            {t.badge && (
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#00D7A7', border: '2px solid #F4C400',
              }} />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'historial' && (
        <HistorialAuditorias
          empresaId={empresaId}
          empleados={empleados}
          onNuevaAuditoria={() => setActiveTab('nueva')}
          onVerReporte={handleVerReporte}
        />
      )}
      {activeTab === 'nueva' && (
        <NuevaAuditoria
          empresaId={empresaId}
          userId={userId}
          empleados={empleados}
          categorias={categorias}
          almacenes={almacenes}
          auditoriaActiva={auditoriaActiva}
          onCreada={handleAuditoriaCreada}
        />
      )}
      {activeTab === 'monitoreo' && (
        <MonitoreoAuditoria
          auditoriaActiva={auditoriaActiva}
          empleados={empleados}
          onFinalizada={handleAuditoriaFinalizada}
          onCancelada={handleAuditoriaFinalizada}
        />
      )}
      {activeTab === 'discrepancias' && (
        <ReporteDiscrepancias
          empresaId={empresaId}
          initialAuditoriaId={reporteAuditoriaId}
        />
      )}
    </div>
  )
}
