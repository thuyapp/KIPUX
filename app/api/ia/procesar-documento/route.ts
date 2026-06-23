import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MAX_BASE64_BYTES = 10 * 1024 * 1024 // 10 MB encoded limit

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20 // requests por hora por usuario
const WINDOW_MS = 60 * 60 * 1000 // 1 hora

const PROMPT = `Analiza esta imagen de factura o lista de inventario. Extrae TODOS los productos y sus cantidades.
Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin bloques de código:
{
  "productos": [
    {"nombre": "nombre del producto", "cantidad": número_entero, "accion": "ingreso"}
  ],
  "moneda": "USD" o "VES" o "EUR",
  "confianza": número_entre_0_y_100
}
Si no puedes leer el documento responde: {"error": "No se pudo leer el documento", "productos": [], "moneda": "USD", "confianza": 0}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', user.id)
    .single()
  if (!perfil) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = Date.now()
  const userLimit = rateLimitMap.get(user.id)
  if (userLimit && now < userLimit.resetAt) {
    if (userLimit.count >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Límite de requests alcanzado. Intenta en 1 hora.' },
        { status: 429 }
      )
    }
    rateLimitMap.set(user.id, { count: userLimit.count + 1, resetAt: userLimit.resetAt })
  } else {
    rateLimitMap.set(user.id, { count: 1, resetAt: now + WINDOW_MS })
  }

  const body = await req.json()
  const { base64, mediaType, tipo } = body

  if (typeof base64 === 'string' && base64.length > MAX_BASE64_BYTES) {
    return NextResponse.json({ error: 'Archivo demasiado grande (máx 10 MB)' }, { status: 413 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ modo: 'sin_api_key', productos: [], moneda: 'USD', confianza: 0 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contenido: any[]

  if (tipo === 'pdf') {
    contenido = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      },
      { type: 'text', text: PROMPT },
    ]
  } else {
    const safeMediaType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)
      ? mediaType
      : 'image/jpeg'
    contenido = [
      {
        type: 'image',
        source: { type: 'base64', media_type: safeMediaType, data: base64 },
      },
      { type: 'text', text: PROMPT },
    ]
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: contenido }],
    })

    const texto = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(texto.trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({
      error: 'No se pudo procesar el documento',
      productos: [],
      moneda: 'USD',
      confianza: 0,
    })
  }
}
