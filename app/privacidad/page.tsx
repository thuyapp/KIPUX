import Link from 'next/link'

export default function PrivacidadPage() {
  const sectionTitle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111111',
    margin: '36px 0 10px',
  }

  const p: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: 1.7,
    color: '#333333',
    margin: '0 0 12px',
  }

  return (
    <div style={{ background: '#F8F6EA', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>

        <Link
          href="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#6B6B6B', fontSize: '14px', textDecoration: 'none',
            marginBottom: '40px',
          }}
        >
          ← Volver
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111111', margin: '0 0 6px' }}>
          Política de Privacidad de KIPUX
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 40px' }}>
          Última actualización: 22 de junio de 2026
        </p>

        <h2 style={sectionTitle}>1. Introducción</h2>
        <p style={p}>
          Esta Política de Privacidad explica cómo KIPUX (operado por Wilman Mosqueda, persona natural
          domiciliada en Venezuela, en adelante "el Operador") recopila, usa y protege tu información cuando
          usas el Servicio. Respetamos tu privacidad y nos comprometemos a proteger tus datos personales.
        </p>

        <h2 style={sectionTitle}>2. Datos que recopilamos</h2>
        <p style={p}>
          Recopilamos: (a) Datos de cuenta: nombre, correo electrónico y contraseña (almacenada de forma
          cifrada). (b) Datos de tu empresa: nombre del negocio, datos de contacto que ingreses.
          (c) Datos operativos: productos, inventarios, movimientos, almacenes, categorías y demás
          información que ingreses para usar el Servicio. (d) Datos técnicos: información de uso necesaria
          para el funcionamiento del Servicio.
        </p>

        <h2 style={sectionTitle}>3. Cómo usamos tus datos</h2>
        <p style={p}>
          Usamos tus datos exclusivamente para: (a) prestarte el Servicio; (b) autenticar tu acceso;
          (c) mantener y mejorar el funcionamiento del Servicio; (d) comunicarnos contigo sobre asuntos
          relacionados con tu cuenta. No usamos tus datos comerciales para publicidad ni los vendemos
          a terceros.
        </p>

        <h2 style={sectionTitle}>4. Almacenamiento y procesamiento</h2>
        <p style={p}>
          Tus datos se almacenan en servidores de Supabase y se procesan en infraestructura de Vercel,
          proveedores de servicios en la nube que cumplen con estándares internacionales de seguridad.
          Cuando usas la función de lectura de documentos con inteligencia artificial, las imágenes que
          subes se procesan a través de la API de Anthropic con el único fin de extraer la información
          del documento.
        </p>

        <h2 style={sectionTitle}>5. Seguridad</h2>
        <p style={p}>
          Implementamos medidas de seguridad razonables para proteger tus datos, incluyendo cifrado de
          contraseñas, aislamiento de datos por empresa y control de acceso por roles. Sin embargo, ningún
          sistema es completamente infalible; no podemos garantizar seguridad absoluta.
        </p>

        <h2 style={sectionTitle}>6. Tus derechos</h2>
        <p style={p}>
          Tienes derecho a: (a) acceder a tus datos; (b) corregir datos inexactos; (c) solicitar la
          eliminación de tu cuenta y datos asociados; (d) exportar tus datos. Para ejercer estos derechos,
          contáctanos en el correo indicado abajo.
        </p>

        <h2 style={sectionTitle}>7. Retención de datos</h2>
        <p style={p}>
          Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta,
          eliminaremos tus datos personales en un plazo razonable, salvo aquellos que debamos conservar
          por obligación legal.
        </p>

        <h2 style={sectionTitle}>8. Datos de terceros (tus clientes y empleados)</h2>
        <p style={p}>
          Si ingresas datos de tus empleados (como nombres para gestión de usuarios), eres responsable de
          informarles sobre ello y de contar con su consentimiento cuando corresponda. El Operador procesa
          esos datos únicamente por instrucción tuya para prestarte el Servicio.
        </p>

        <h2 style={sectionTitle}>9. Menores de edad</h2>
        <p style={p}>
          El Servicio está dirigido a empresas y personas mayores de edad. No recopilamos intencionalmente
          datos de menores.
        </p>

        <h2 style={sectionTitle}>10. Cambios a esta política</h2>
        <p style={p}>
          Podemos actualizar esta Política de Privacidad. Te notificaremos sobre cambios significativos
          a través del Servicio o por correo electrónico.
        </p>

        <h2 style={sectionTitle}>11. Contacto</h2>
        <p style={p}>
          Para cualquier consulta sobre privacidad o para ejercer tus derechos, contáctanos en:
          wjmosqueda@gmail.com.
        </p>

        <div style={{ borderTop: '1px solid #E8E8E8', marginTop: '48px', paddingTop: '24px' }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: '#6B6B6B', fontSize: '14px', textDecoration: 'none',
            }}
          >
            ← Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  )
}
