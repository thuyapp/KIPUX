import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { nombre, negocio, email, password } = await req.json()

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // 1. Crear usuario con email ya confirmado
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, negocio },
    })

    if (authError) throw authError
    const userId = authData.user.id

    // 2. Crear empresa
    const { data: empresaData, error: empresaError } = await supabaseAdmin
      .from('empresas')
      .insert({ nombre: negocio || 'Mi Empresa' })
      .select('id')
      .single()

    if (empresaError) throw empresaError
    const empresaId = empresaData.id

    // 3. Crear perfil como admin
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id: userId,
        nombre,
        rol: 'admin',
        empresa_id: empresaId,
        activo: true,
      })

    if (perfilError) throw perfilError

    // 4. Crear almacén principal
    await supabaseAdmin
      .from('almacenes')
      .insert({
        nombre: 'Principal',
        empresa_id: empresaId,
        es_default: true,
        activo: true,
        descripcion: 'Almacén principal',
      })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Error en registro:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al crear la cuenta' },
      { status: 500 }
    )
  }
}
