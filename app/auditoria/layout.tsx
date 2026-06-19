import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuditoriaWorkerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()
  if (!perfil) redirect('/login')
  if (perfil.rol !== 'trabajador') redirect('/dashboard/auditoria')

  return (
    <div style={{
      background: '#F8F6EA', minHeight: '100vh',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      <header style={{
        background: '#111111', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'sticky', top: 0, zIndex: 20,
        padding: '0 20px',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#F4C400', letterSpacing: '-0.5px' }}>
          KIPUX
        </span>
        <span style={{
          position: 'absolute', right: '20px',
          fontSize: '13px', color: '#A0A0A0', fontWeight: 500,
        }}>
          {perfil.nombre}
        </span>
      </header>
      <main>{children}</main>
    </div>
  )
}
