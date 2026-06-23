import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const empresaId = formData.get('empresaId') as string | null
  const productoId = formData.get('productoId') as string | null

  if (!file || !empresaId || !productoId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  if (empresaId !== perfil.empresa_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const path = `${empresaId}/${productoId}/foto.png`
  await supabaseAdmin.storage.from('productos').remove([path])

  const bytes = await file.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from('productos')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from('productos').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
