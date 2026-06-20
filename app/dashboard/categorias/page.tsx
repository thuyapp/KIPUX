import { getSession } from '@/lib/supabase/session'
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
  const { supabase, empresaId } = await getSession()

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
