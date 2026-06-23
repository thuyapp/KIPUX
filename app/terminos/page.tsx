import Link from 'next/link'

export default function TerminosPage() {
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
          Términos y Condiciones de Uso de KIPUX
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 40px' }}>
          Última actualización: [fecha de hoy]
        </p>

        <h2 style={sectionTitle}>1. Aceptación de los términos</h2>
        <p style={p}>
          Al registrarte y usar KIPUX (en adelante "la Aplicación" o "el Servicio"), aceptas estos Términos y
          Condiciones en su totalidad. Si no estás de acuerdo, no debes usar el Servicio. El Servicio es operado
          por Wilman [Apellido], como persona natural, con domicilio en Venezuela (en adelante "el Operador").
        </p>

        <h2 style={sectionTitle}>2. Descripción del servicio</h2>
        <p style={p}>
          KIPUX es una aplicación web de gestión de inventario que permite a micro, pequeñas y medianas empresas
          controlar su stock, movimientos, almacenes, categorías y auditorías. El Servicio se ofrece "tal cual"
          y "según disponibilidad".
        </p>

        <h2 style={sectionTitle}>3. Registro de cuenta</h2>
        <p style={p}>
          Para usar el Servicio debes crear una cuenta con información veraz y actualizada. Eres responsable de
          mantener la confidencialidad de tu contraseña y de toda actividad que ocurra bajo tu cuenta. Debes
          notificar al Operador inmediatamente sobre cualquier uso no autorizado.
        </p>

        <h2 style={sectionTitle}>4. Uso aceptable</h2>
        <p style={p}>
          Te comprometes a usar el Servicio solo para fines legales y conforme a estos Términos. No debes:
          (a) usar el Servicio para actividades ilegales; (b) intentar acceder a cuentas o datos de otros
          usuarios; (c) interferir con la seguridad o el funcionamiento del Servicio; (d) realizar ingeniería
          inversa del Servicio; (e) usar el Servicio para almacenar contenido ilegal o que infrinja derechos
          de terceros.
        </p>

        <h2 style={sectionTitle}>5. Tus datos y contenido</h2>
        <p style={p}>
          Conservas todos los derechos sobre los datos que ingresas en el Servicio (productos, inventarios,
          movimientos, etc.). Al usar el Servicio, otorgas al Operador una licencia limitada para almacenar
          y procesar esos datos con el único fin de prestarte el Servicio. El Operador no venderá ni
          compartirá tus datos comerciales con terceros, salvo lo descrito en la Política de Privacidad.
        </p>

        <h2 style={sectionTitle}>6. Disponibilidad y cambios</h2>
        <p style={p}>
          El Operador hará esfuerzos razonables para mantener el Servicio disponible, pero no garantiza
          disponibilidad ininterrumpida. El Servicio puede sufrir interrupciones por mantenimiento, fallas
          técnicas o causas fuera de control del Operador. El Operador puede modificar, suspender o
          discontinuar el Servicio en cualquier momento, notificando con antelación razonable cuando sea posible.
        </p>

        <h2 style={sectionTitle}>7. Limitación de responsabilidad</h2>
        <p style={p}>
          El Servicio se proporciona "tal cual", sin garantías de ningún tipo. En la máxima medida permitida
          por la ley, el Operador no será responsable por daños indirectos, incidentales o consecuentes
          derivados del uso o imposibilidad de uso del Servicio, incluyendo pérdida de datos, lucro cesante
          o interrupción de negocio. Eres responsable de mantener tus propios respaldos de información crítica.
        </p>

        <h2 style={sectionTitle}>8. Precios y pagos</h2>
        <p style={p}>
          Durante la fase actual, el Servicio puede ofrecerse de forma gratuita. El Operador se reserva el
          derecho de introducir planes de pago en el futuro, notificando con antelación. El uso continuado
          tras la introducción de un plan de pago implica la aceptación de los nuevos términos comerciales.
        </p>

        <h2 style={sectionTitle}>9. Terminación</h2>
        <p style={p}>
          Puedes dejar de usar el Servicio y solicitar la eliminación de tu cuenta en cualquier momento.
          El Operador puede suspender o terminar tu acceso si incumples estos Términos.
        </p>

        <h2 style={sectionTitle}>10. Ley aplicable</h2>
        <p style={p}>
          Estos Términos se rigen por las leyes de la República Bolivariana de Venezuela. Para usuarios fuera
          de Venezuela, aplicarán adicionalmente las normas imperativas de protección al consumidor de su
          jurisdicción cuando corresponda.
        </p>

        <h2 style={sectionTitle}>11. Contacto</h2>
        <p style={p}>
          Para cualquier consulta sobre estos Términos, puedes contactar al Operador en: [tu correo de contacto].
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
