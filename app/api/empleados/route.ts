import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function getAdminContext() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.rol !== 'admin') return null
  return { userId: user.id, empresaId: perfil.empresa_id as string }
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { nombre, email, password, rol, almacen_id, activo } = body

  if (!nombre?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Nombre, correo y contraseña son requeridos' }, { status: 400 })
  }

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Error al crear usuario' }, { status: 400 })
  }

  const { error: perfilErr } = await supabaseAdmin
    .from('perfiles')
    .insert({
      id: authData.user.id,
      empresa_id: ctx.empresaId,
      nombre: nombre.trim(),
      rol: rol ?? 'trabajador',
      activo: activo ?? true,
      almacen_id: almacen_id || null,
    })

  if (perfilErr) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: perfilErr.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { userId, nombre, rol, activo, almacen_id, password } = body

  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  if (rol && !['admin', 'trabajador'].includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const { data: targetPerfil } = await supabaseAdmin
    .from('perfiles')
    .select('empresa_id')
    .eq('id', userId)
    .single()

  if (!targetPerfil || targetPerfil.empresa_id !== ctx.empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { error: perfilErr } = await supabaseAdmin
    .from('perfiles')
    .update({
      nombre: nombre?.trim(),
      rol,
      activo,
      almacen_id: almacen_id || null,
    })
    .eq('id', userId)

  if (perfilErr) return NextResponse.json({ error: perfilErr.message }, { status: 400 })

  if (password) {
    const { error: passErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    if (passErr) return NextResponse.json({ error: passErr.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
