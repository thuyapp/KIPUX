import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('categorias').select('*')

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Prueba de conexión a Supabase</h1>
      {error && (
        <p style={{ color: 'red' }}>Error: {error.message}</p>
      )}
      {!error && (
        <p style={{ color: 'green' }}>
          ✅ Conexión exitosa. Categorías encontradas: {data?.length ?? 0}
        </p>
      )}
    </div>
  )
}