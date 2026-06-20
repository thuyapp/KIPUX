import { createClient } from './server'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('empresa_id, nombre, rol')
    .eq('id', user.id)
    .single()

  if (!perfil?.empresa_id) redirect('/login')

  return {
    supabase,
    user,
    empresaId: perfil.empresa_id as string,
    nombre: perfil.nombre as string,
    rol: perfil.rol as string,
  }
}
