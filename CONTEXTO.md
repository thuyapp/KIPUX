# KIPUX — Contexto del proyecto

## Qué es
App web (PWA) de inventario inteligente para microempresas y pymes. Elimina la transcripción manual usando IA (visión/OCR) y automatiza alertas vía Telegram.

Dos tipos de usuario:
- Administrador: gestiona inventario, historial, auditorías, almacenes y empleados.
- Trabajador: solo accede en Modo Auditoría cuando el admin lo activa.

Uso actual: personal, sin fines de lucro por ahora.

---

## Stack
- Frontend: Next.js (App Router, TypeScript, Tailwind CSS) — PWA, funciona en PC y teléfono.
- Backend / DB / Auth / Storage: Supabase (Postgres).
- Hosting: Vercel (plan Hobby).
- IA: API de Claude (Anthropic), pago por uso — lee facturas y notas manuscritas, devuelve JSON.
- Alertas: Telegram (gratis). WhatsApp = futuro.
- Moneda base: USD. Facturas en VES/USD/EUR se convierten a USD con tasa del día, que queda CONGELADA.
- Tasa de cambio: API pública BCV + respaldo manual.

---

## Sistema de diseño — KIPUX Brand Identity

Modo por defecto: CLARO. El modo oscuro existe pero la app carga en claro.

Paleta Modo Claro:
- primary: #F4C400 — botones principales, acciones, destacados
- black: #111111 — texto principal, navegación
- background: #F8F6EA — fondo general (crema cálido, NO blanco puro)
- surface: #FFFFFF — tarjetas, modales, inputs
- ai: #00D7A7 — todo lo relacionado con IA
- danger: #FF4D4D — errores, alertas, stock crítico, agotado
- border: #E8E8E8 — bordes, divisiones
- textSecondary: #6B6B6B — texto secundario, etiquetas

Paleta Modo Oscuro:
- background: #0A0A0A
- surface: #161616
- primary: #F4C400
- text: #FFFFFF
- textSecondary: #A0A0A0

Tipografía: Geist (ya instalada por defecto en el proyecto). Alternativas: Inter, Satoshi, Manrope.

Componentes:
- Botones: forma píldora. Primario: #F4C400. Secundario: #111111.
- Tarjetas: border-radius generoso, mucho padding, sombras suaves.
- Inputs: amplios, minimalistas, bordes suaves.
- Iconos: Lucide — líneas delgadas, moderno, geométrico.

Estados de stock:
- Saludable: #00D7A7 (stock > stock_mínimo)
- Bajo stock: #F4C400 (stock cerca del mínimo)
- Agotado: #FF4D4D (stock = 0)

Principios de UI: mucho espacio en blanco, jerarquía visual fuerte, simplicidad extrema. Referencias: Linear, Stripe, Apple Wallet, Notion. Sin glassmorphism, sin azul neón.

---

## Decisiones de arquitectura — NO cambiar sin consultar

1. Stock atómico: el stock NUNCA se actualiza directo desde el cliente. Solo vía RPC registrar_movimiento().
2. Movimientos = historial append-only: solo INSERT, nunca UPDATE ni DELETE.
3. Modo Auditoría (conteo ciego): trabajador NO ve el stock. Estado pendiente/contado por producto. Foto congelada al iniciar (stock_sistema_inicial). MVP: conteo fuera de horario de venta.
4. Multi-almacén (Opción B): stock separado por almacén en tabla stock_por_almacen. Campo ubicacion (texto libre: "Estante A") dentro de cada almacén. Almacén es_default=true para negocios con uno solo.
5. IA solo para extracción e interpretación, nunca para cálculos matemáticos.
6. Multi-tenant: todo aislado por empresa_id con RLS en todas las tablas.
7. Sin ventas ni utilidad bruta: solo inventario y costos en USD.
8. Campo activo en productos: para retirar sin borrar historial.

---

## Esquema de base de datos (ya aplicado en Supabase — NO recrear)

10 tablas: empresas, perfiles, categorias, productos (con activo), movimientos (con almacen_id), auditorias (con almacen_id), auditoria_items (con almacen_id), tasas_cambio, almacenes, stock_por_almacen (con ubicacion).

Funciones RPC:
- registrar_movimiento(p_producto_id, p_almacen_id, p_tipo, p_cantidad, p_nota, p_foto) — atómica, actualiza stock_por_almacen Y productos.stock_actual en la misma transacción.
- auth_empresa_id() — devuelve empresa del usuario logueado.

Datos de prueba existentes:
- Empresa KIPUX: empresa_id = fb56a544-5376-40e8-b663-20aebc1b4f43
- Usuario admin Wilman: user_id = 24ec9356-8ae9-4103-8b2d-2ccb5f63d94e
- Almacén "Principal": es_default = true

---

## Progreso completado

- ✅ Proyecto Next.js creado (TypeScript, Tailwind, App Router, Geist)
- ✅ Supabase conectado (lib/supabase/client.ts y lib/supabase/server.ts)
- ✅ Login funcional (app/login/page.tsx)
- ✅ Middleware de protección de rutas (middleware.ts)
- ✅ Dashboard con routing por rol (app/dashboard/page.tsx)
- ✅ Migración v2: almacenes, stock_por_almacen, campo activo, función actualizada
- ⚠️ Código actual usa estilos inline básicos — diseño KIPUX se aplica en Fase 2

---

## Inventario de pantallas del MVP (16 total)

Panel Admin:
1. Dashboard (lista productos + buscador + botones +/- + selector almacén)
2. Crear/editar producto (nombre, categoría, unidad, costo USD, stock mínimo, foto, activo)
3. Historial de movimientos
4. Cámara (escanear factura / foto de evidencia)
5. Confirmación de IA (tabla editable + moneda + nota)
6. Gestión de empleados
7. Gestión de categorías
8. Gestión de almacenes
9. Configuración (tasa manual, alertas Telegram, datos del negocio)
10. Auditoría — crear sesión
11. Auditoría — reporte de discrepancias

Trabajador:
12. Auditorías asignadas
13. Pantalla de conteo (stock oculto)
14. Confirmación de conteo enviado

Compartidas: Splash, Login

---

## Siguiente paso: FASE 2 — Inventario core

Orden de construcción:
1. Pantalla Crear/editar producto (con subida de foto a Supabase Storage)
2. Dashboard real: lista de productos + buscador + estados de stock
3. Modal +/- con justificación → RPC registrar_movimiento
4. Historial de movimientos
5. Gestión de categorías
6. Gestión de almacenes

---

## Reglas de trabajo

- Antes de tocar arquitectura ya decidida, preguntar primero.
- Código simple sobre código elegante — el founder es programador en aprendizaje.
- Al terminar cada pieza, decir qué probar y qué resultado esperar.
- Diseño visual sigue el sistema KIPUX — sin inventar colores ni fuentes.
- Una pieza a la vez, en el orden del plan.
- Nunca empezar una tarea nueva sin confirmación del founder.
