import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfiguracionForm from './components/ConfiguracionForm'

export type EmpresaConfig = {
  id: string
  nombre: string
  ruc: string | null
  direccion: string | null
  telefono: string | null
  correo_contacto: string | null
}

export type TasaCambio = {
  id: string
  fecha: string
  usd_ves: number
  eur_ves: number | null
  fuente: string
}

export type ConfigAlertas = {
  id: string
  alertas_activas: boolean
  correo_alertas: string | null
  umbral_alerta: number
}

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol, empresa_id')
    .eq('id', user.id)
    .single()
  if (!perfil) redirect('/login')
  if (perfil.rol !== 'admin') redirect('/dashboard')

  const empresaId = perfil.empresa_id as string

  const [
    { data: empresaRaw },
    { data: tasaRaw },
    { data: configRaw },
  ] = await Promise.all([
    supabase
      .from('empresas')
      .select('id, nombre, ruc, direccion, telefono, correo_contacto')
      .eq('id', empresaId)
      .single(),
    supabase
      .from('tasas_cambio')
      .select('id, fecha, usd_ves, eur_ves, fuente')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('configuracion_empresa')
      .select('id, alertas_activas, correo_alertas, umbral_alerta')
      .eq('empresa_id', empresaId)
      .maybeSingle(),
  ])

  const empresa: EmpresaConfig = {
    id: empresaId,
    nombre: (empresaRaw as EmpresaConfig | null)?.nombre ?? '',
    ruc: (empresaRaw as EmpresaConfig | null)?.ruc ?? null,
    direccion: (empresaRaw as EmpresaConfig | null)?.direccion ?? null,
    telefono: (empresaRaw as EmpresaConfig | null)?.telefono ?? null,
    correo_contacto: (empresaRaw as EmpresaConfig | null)?.correo_contacto ?? null,
  }

  return (
    <ConfiguracionForm
      empresa={empresa}
      tasaActual={tasaRaw as TasaCambio | null}
      configAlertas={configRaw as ConfigAlertas | null}
      empresaId={empresaId}
      userEmail={user.email ?? ''}
    />
  )
}
