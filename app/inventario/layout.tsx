import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/app/dashboard/components/Sidebar'
import BottomNav from '@/app/dashboard/components/BottomNav'

export default async function InventarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  const nombreUsuario = perfil?.nombre ?? 'Admin'
  const rol = perfil?.rol ?? 'admin'

  return (
    <div style={{ background: '#F8F6EA', minHeight: '100vh' }}>
      <Sidebar nombreUsuario={nombreUsuario} rol={rol} />
      <BottomNav />
      <main className="md:ml-[240px] pb-16 md:pb-0">
        {children}
      </main>
    </div>
  )
}
