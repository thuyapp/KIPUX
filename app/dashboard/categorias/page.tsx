import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoriasList from './components/CategoriasList'

export type Categoria = {
  id: string
  nombre: string
  color: string | null
  icono: string | null
  activo: boolean
  descripcion: string | null
  created_at: string
  productos: { count: number }[] | null
}

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', user.id)
    .single()
  if (!perfil) redirect('/login')

  const empresaId = perfil.empresa_id as string

  const { data: categoriasRaw } = await supabase
    .from('categorias')
    .select(`
      id, nombre, color, icono, activo, descripcion, created_at,
      productos ( count )
    `)
    .eq('empresa_id', empresaId)
    .order('nombre')

  return (
    <CategoriasList
      categorias={(categoriasRaw ?? []) as unknown as Categoria[]}
      empresaId={empresaId}
    />
  )
}
