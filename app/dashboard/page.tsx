import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol === 'trabajador') {
    redirect('/auditoria')
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Panel de Administrador</h1>
      <p>Bienvenido, {perfil?.nombre ?? 'Admin'} 👋</p>
    </div>
  )
}