# AUDITORÍA DE ESTADO — LOGISMART / KIPUX

**Fecha:** 2026-06-19  
**Proyecto:** logismart-app (Next.js 16 + Supabase + Claude AI)  
**Alcance:** Código fuente completo en `app/`, `lib/`, archivos de config raíz

---

## 1. ESTRUCTURA DE ARCHIVOS

```
logismart-app/
├── package.json
├── tsconfig.json
├── next.config.ts          ← vacío (sin configuración)
├── postcss.config.mjs
├── eslint.config.mjs
├── proxy.ts                ← middleware (nombrado así por Next.js 16)
├── .env.local
├── CLAUDE.md
├── AUDITORIA_ESTADO.md     ← este archivo
│
├── app/
│   ├── layout.tsx          ← Root layout (fuentes Geist)
│   ├── page.tsx            ← Redirect / → /dashboard
│   ├── globals.css
│   │
│   ├── login/
│   │   └── page.tsx        ← Formulario de login (client)
│   │
│   ├── auditoria/          ← ZONA TRABAJADOR (layout propio, sin Sidebar/BottomNav)
│   │   ├── layout.tsx      ← Auth guard → solo rol 'trabajador'
│   │   ├── page.tsx        ← Carga auditoría activa del trabajador
│   │   └── components/
│   │       ├── ConteoProductos.tsx
│   │       └── ProductoNoListado.tsx
│   │
│   ├── dashboard/
│   │   ├── layout.tsx      ← Auth guard + carga nombre/rol → Sidebar + BottomNav
│   │   ├── page.tsx        ← Inventario principal (server, con filtro ?almacen=)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── StockModal.tsx
│   │   ├── almacenes/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── AlmacenesList.tsx
│   │   │       └── AlmacenModal.tsx
│   │   ├── categorias/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── CategoriasList.tsx
│   │   │       └── CategoriaModal.tsx
│   │   ├── empleados/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── EmpleadosList.tsx
│   │   │       └── EmpleadoModal.tsx
│   │   ├── movimientos/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── MovimientosList.tsx
│   │   │       └── MovimientoDetalle.tsx
│   │   ├── configuracion/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── ConfiguracionForm.tsx
│   │   ├── auditoria/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── AuditoriaAdminPanel.tsx
│   │   │       ├── HistorialAuditorias.tsx
│   │   │       ├── NuevaAuditoria.tsx
│   │   │       ├── MonitoreoAuditoria.tsx
│   │   │       └── ReporteDiscrepancias.tsx
│   │   ├── camara/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── HubCaptura.tsx
│   │   │       ├── EscanerFactura.tsx
│   │   │       └── ConfirmacionIA.tsx
│   │   └── productos/
│   │       ├── nuevo/
│   │       │   └── page.tsx
│   │       ├── [id]/editar/
│   │       │   └── page.tsx
│   │       └── components/
│   │           └── ProductoForm.tsx
│   │
│   └── api/
│       ├── empleados/
│       │   └── route.ts    ← POST/PATCH con supabaseAdmin
│       └── ia/
│           └── procesar-documento/
│               └── route.ts ← POST → Claude claude-sonnet-4-6
│
└── lib/
    └── supabase/
        ├── server.ts       ← createServerClient (async, cookies)
        └── client.ts       ← createBrowserClient (sync)
```

---

## 2. RUTAS Y NAVEGACIÓN

| Ruta | Qué hace | Acceso desde UI | Obs. |
|------|----------|-----------------|------|
| `/` | Redirect → `/dashboard` | — | |
| `/login` | Formulario auth | Redirect automático si no hay sesión | |
| `/dashboard` | Lista de inventario, filtro por almacén | Sidebar "Inicio" + "Inventario", BottomNav "Inicio" + "Inventario" | ⚠ Ambas entradas nav apuntan a la misma URL |
| `/dashboard/movimientos` | Historial de movimientos con filtros | Sidebar "Movimientos", BottomNav "Movimientos" | |
| `/dashboard/camara` | Captura de documentos con IA | Sidebar "Cámara IA", BottomNav "Más > Cámara IA" | |
| `/dashboard/categorias` | CRUD categorías | Sidebar "Categorías", BottomNav "Más > Categorías" | |
| `/dashboard/almacenes` | CRUD almacenes | Sidebar "Almacenes", BottomNav "Más > Almacenes" | |
| `/dashboard/empleados` | CRUD empleados | Sidebar "Empleados", BottomNav "Más > Empleados" | |
| `/dashboard/auditoria` | Panel admin de auditoría | Sidebar "Auditoría", BottomNav "Más > Auditoría" | |
| `/dashboard/configuracion` | Config empresa, tasa BCV, alertas | Sidebar "Configuración", BottomNav "Más > Configuración" | |
| `/dashboard/productos/nuevo` | Crear producto | BottomNav FAB "+", ProductList botón "Nuevo producto" | |
| `/dashboard/productos/[id]/editar` | Editar producto | ProductList botón de edición por producto | |
| `/auditoria` | Panel del trabajador (conteo físico) | Redirect automático si rol === 'trabajador' | Sin Sidebar/BottomNav |

**Rutas sin acceso directo desde la UI:**
- `/dashboard` vía `?almacen=<id>` (filtro por almacén): se llega solo desde AlmacenesList botón "Ver inventario". No hay link visible en el nav.

---

## 3. TABLAS DE SUPABASE USADAS

| Tabla | Archivos que la consultan | Columnas referenciadas |
|-------|--------------------------|----------------------|
| `perfiles` | layout.tsx, todas las pages, empleados/route.ts | `id, nombre, rol, empresa_id, activo, almacen_id` |
| `productos` | dashboard/page, ProductoForm, ProductList, ConfirmacionIA, auditoria/* | `id, nombre, sku, descripcion, categoria_id, unidad, stock_minimo, stock_actual, costo_usd, activo, foto_url` |
| `stock_por_almacen` | dashboard/page, ProductoForm, AlmacenModal | `empresa_id, producto_id, almacen_id, stock_actual, ubicacion` |
| `almacenes` | dashboard/page, almacenes/*, movimientos/*, auditoria/*, camara/page | `id, nombre, descripcion, ubicacion, es_default, activo, empresa_id` |
| `categorias` | categorias/*, productos/*, auditoria/* | `id, nombre, color, icono, descripcion, activo, empresa_id` |
| `movimientos` | movimientos/* | `id, tipo, cantidad, nota, foto_evidencia_url, created_at, almacen_id, almacen_destino_id` + joins `productos, perfiles, almacenes` |
| `auditorias` | auditoria/* (admin + worker) | `id, estado, alcance, almacen_id, categoria_id, notas, fecha_inicio, fecha_fin, creada_por, ajustes_aplicados, empresa_id` |
| `auditoria_items` | auditoria/* (admin + worker) | `id, auditoria_id, producto_id, conteo_fisico, estado, fecha_conteo, usuario_asignado, stock_sistema_inicial, almacen_id` |
| `auditoria_productos_extra` | ReporteDiscrepancias, ProductoNoListado | `auditoria_id, nombre_producto, cantidad, nota, foto_url` ⚠ ver abajo |
| `empresas` | configuracion/* | `id, nombre, ruc, direccion, telefono, correo_contacto` |
| `tasas_cambio` | configuracion/* | `id, fecha, usd_ves, eur_ves, fuente, empresa_id` |
| `configuracion_empresa` | configuracion/* | `id, alertas_activas, correo_alertas, umbral_alerta, empresa_id` |

**Columnas potencialmente inexistentes:**

| Archivo | Columna usada | Riesgo |
|---------|--------------|--------|
| `ReporteDiscrepancias.tsx` | `auditoria_productos_extra.nombre_producto` | El campo en ProductoNoListado.tsx se llama `nombre` al insertar pero se lee como `nombre_producto`. **Inconsistencia real.** Verificar esquema. |
| `MovimientosList.tsx` | `movimientos.foto_evidencia_url` | El RPC `registrar_movimiento` recibe `p_foto` pero el nombre de la columna resultante no está garantizado en el código frontend. Si la columna se llama distinto, el campo aparecerá `null` siempre. |

---

## 4. FUNCIONES RPC

Todas las llamadas a `supabase.rpc()` son a `registrar_movimiento`:

| Archivo | `p_tipo` usado | `p_foto` | Observaciones |
|---------|---------------|---------|--------------|
| `StockModal.tsx` | `'ingreso'` ó `'retiro'` | ✓ (opcional, sube a Storage primero) | |
| `ProductoForm.tsx` | `'ingreso'` | ✗ | Solo si stockInicial > 0 |
| `ReporteDiscrepancias.tsx` | `'ingreso'` ó `'retiro'` (calculado por diff) | ✗ | Loop secuencial — ver sección 8 |
| `ConfirmacionIA.tsx` | `fila.accion` (`'ingreso'` ó `'retiro'`) | ✗ | Loop secuencial — ver sección 8 |

**Nota:** CLAUDE.md documenta `p_tipo: 'ingreso'|'retiro'|'transferencia'|'ajuste'`. El código nunca usa `'transferencia'` ni `'ajuste'` directamente desde el frontend. Si existen flujos de transferencia, no están implementados en la UI actual.

---

## 5. DUPLICACIÓN E INCONSISTENCIAS

### 5.1 Función `formatFecha` — duplicada en 3 archivos

Implementación casi idéntica (misma lógica, mismo locale `'es-ES'`) repetida en:
- `MonitoreoAuditoria.tsx` (línea 21)
- `ReporteDiscrepancias.tsx` (línea 40)
- `ConteoProductos.tsx` (línea 15)

Debería estar en `lib/utils.ts` o similar.

### 5.2 Patrón obtención de `empresaId` — duplicado en 10 páginas

Este bloque idéntico aparece en **cada** `page.tsx` de `app/dashboard/`:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
const { data: perfil } = await supabase
  .from('perfiles')
  .select('empresa_id')
  .eq('id', user.id)
  .single()
const empresaId = perfil?.empresa_id as string
```

Afecta: `almacenes/page`, `categorias/page`, `empleados/page`, `movimientos/page`, `configuracion/page`, `auditoria/page`, `camara/page`, `productos/nuevo/page`, `productos/[id]/editar/page`, `auditoria worker/page`.

Cada página hace al menos **2 queries a Supabase** solo para identificar al usuario. Podría centralizarse en una función `getSession()` en `lib/supabase/server.ts` que devuelva `{ user, empresaId, rol }`.

### 5.3 Sistema de "toast" — implementado 2 veces de forma distinta

| Implementación | Archivo | Comportamiento |
|---------------|---------|---------------|
| `showToast(msg)` | `ConfiguracionForm.tsx` | Tiene estado `toast: {msg, type}`, setTimeout 3s, componente flotante |
| `showToast(msg, type)` | `ReporteDiscrepancias.tsx` | Mismo patrón pero con `type: 'ok'|'error'` y colores distintos |

No existe un componente `<Toast>` reutilizable. Los demás componentes usan `setError()` con texto en rojo estático.

### 5.4 Colores y estilos — hardcodeados en cada archivo

Los colores del sistema KIPUX (`#F4C400`, `#111111`, `#F8F6EA`, `#00D7A7`, `#FF4D4D`, `#E8E8E8`) están escritos **literalmente** en cada componente. No hay un archivo de tokens ni constantes centralizadas (excepto en `ProductoForm.tsx` que define `inputStyle`, `labelStyle`, `cardStyle` — esto es el único archivo bien organizado en este aspecto).

Impacto: cambiar un color requiere buscar y reemplazar en ~20 archivos.

### 5.5 Navegación duplicada: "Inicio" e "Inventario"

En `Sidebar.tsx` y `BottomNav.tsx`:
- "Inicio" → `/dashboard`
- "Inventario" → `/dashboard`

Ambos apuntan exactamente a la misma ruta. Uno de los dos no tiene función real.

### 5.6 Patrones de error inconsistentes

| Componente | Cómo muestra errores |
|-----------|---------------------|
| `StockModal`, `CategoriaModal`, `AlmacenModal`, `EmpleadoModal` | `setError(string)` → texto rojo inline |
| `ProductoForm` | `setErrors(Record<string, string>)` → errores por campo |
| `ConfiguracionForm` | `showToast(msg)` → toast flotante |
| `ReporteDiscrepancias` | `showToast(msg, 'error')` → toast flotante con color diferente |
| `NuevaAuditoria` | `setError(string)` → texto rojo |

Cinco patrones distintos para comunicar errores al usuario.

---

## 6. MANEJO DE ERRORES

### Lo que falla silenciosamente

| Código | Qué pasa si falla | Archivo |
|--------|-------------------|---------|
| `uploadFoto()` en `ProductoForm.tsx` | Devuelve `null`, el producto se crea sin foto. El usuario no recibe feedback. | `ProductoForm.tsx:132` |
| `uploadFoto()` en `StockModal.tsx` | El movimiento se registra sin `p_foto`. El usuario no sabe que la foto falló. | `StockModal.tsx:46` |
| Llamada RPC en `ConfirmacionIA.tsx` | No hay manejo de error por fila; si una falla, las demás siguen y `exitoso` se pone en `true` de todos modos. | `ConfirmacionIA.tsx:guardarMovimientos` |
| `getUser()` en el worker layout | Si falla la sesión, redirige a `/login`. Correcto. | OK |
| `supabase.from('perfiles').single()` | En varias páginas se hace `perfil?.empresa_id as string` sin verificar si `perfil` es null. Si es null, `empresaId` sería `undefined as string`, causando queries sin filtro de empresa. | Múltiples pages |

### Pantallas sin estado de carga (loading)

- `HistorialAuditorias.tsx`: tiene `loading` pero no lo aplica a la UI de forma visible.
- `MovimientosList.tsx`: no tiene estado de loading; si la query es lenta, la pantalla aparece vacía sin indicador.
- `ProductList.tsx`: recibe datos del servidor, no tiene loading state (correcto por ser server component).

### Sin error boundary global

No existe `app/error.tsx` ni `app/global-error.tsx`. Si un Server Component lanza una excepción no capturada, Next.js mostrará su pantalla de error genérica sin estilos del sistema KIPUX.

---

## 7. SEGURIDAD

### 🔴 CRÍTICO: `/api/ia/procesar-documento` sin autenticación

```typescript
// app/api/ia/procesar-documento/route.ts
export async function POST(req: NextRequest) {
  const { base64, mediaType, tipo } = await req.json()
  // ← NO hay verificación de sesión de Supabase aquí
  if (!process.env.ANTHROPIC_API_KEY) { ... }
  const anthropic = new Anthropic(...)
  // llama a Claude con el base64 recibido del body
```

**Problema:** Cualquier persona en internet puede hacer `POST /api/ia/procesar-documento` con cualquier base64 y consumir créditos de Anthropic indefinidamente. No hay rate limiting, no hay auth check, no hay validación de tamaño del payload.

**Solución mínima:** Agregar `const supabase = await createServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })`.

---

### 🔴 CRÍTICO: `console.log` con información de secreto en producción

```typescript
// app/api/empleados/route.ts, líneas 5-6
console.log('Secret key present:', !!process.env.SUPABASE_SECRET_KEY)
console.log('Secret key starts with:', process.env.SUPABASE_SECRET_KEY?.substring(0, 15))
```

Estos son logs de debug que quedaron del desarrollo. En producción (Vercel, Railway, etc.) aparecen en los logs del servidor. El substring imprime los primeros 15 caracteres de la secret key — suficiente para identificar el proyecto o reducir el espacio de ataque. **Eliminar inmediatamente.**

---

### ⚠ MEDIO: Queries sin `empresa_id` explícito que dependen solo del RLS

Los siguientes UPDATE/DELETE solo filtran por `id`, confiando en que el RLS de Supabase bloquee accesos cross-tenant:

| Operación | Archivo | Columna de filtro |
|-----------|---------|------------------|
| `UPDATE auditorias SET estado='finalizada'` | `MonitoreoAuditoria.tsx:105` | Solo `id` |
| `UPDATE auditorias SET estado='cancelada'` | `MonitoreoAuditoria.tsx:116` | Solo `id` |
| `UPDATE productos SET activo=false` | `ProductoForm.tsx:241` | Solo `id` |

Si el RLS está correctamente configurado en Supabase, esto es seguro. Si alguna vez se deshabilita el RLS para mantenimiento o migración, estas operaciones serían cross-tenant.

**Recomendación:** Agregar `.eq('empresa_id', empresaId)` como doble verificación de defensa en profundidad.

---

### ⚠ MEDIO: Storage paths inconsistentes

| Contexto | Path en Storage |
|---------|----------------|
| Foto de producto | `{empresaId}/{productoId}/foto.{ext}` |
| Foto de evidencia (StockModal) | `{productoId}/evidencias/{timestamp}.{ext}` ← sin empresaId |

La foto de evidencia del StockModal no tiene el prefijo `empresaId`. Si dos empresas tienen un producto con el mismo UUID (imposible con UUID v4, pero es mala práctica), podrían sobrescribirse. Además, las URLs de evidencias no están organizadas por empresa, dificultando auditorías de storage y políticas de acceso.

---

### ✅ LO QUE SÍ ESTÁ BIEN

- Todas las queries a tablas multi-tenant tienen `.eq('empresa_id', empresaId)`.
- El route handler `/api/empleados` verifica que el `userId` objetivo pertenezca a la misma empresa antes de actualizarlo (línea 83).
- Nunca se escribe directamente en `productos.stock_actual` ni `stock_por_almacen` desde el cliente (siempre vía RPC).
- `supabase.auth.admin.createUser()` solo se usa en el Route Handler (servidor), nunca en client components.
- No hay SQL strings dinámicos (no hay riesgo de SQL injection desde el frontend).

---

## 8. RENDIMIENTO

### N+1 en loops de RPC — 2 casos

**Caso 1: `ReporteDiscrepancias.tsx:126`**
```typescript
for (const item of itemsConDif) {       // ← loop secuencial
  await supabase.rpc('registrar_movimiento', { ... })
}
```
Si hay 50 discrepancias, hace 50 llamadas RPC secuenciales (cada una espera a la anterior). Tiempo ≈ 50 × ~200ms = ~10 segundos.

**Caso 2: `ConfirmacionIA.tsx:guardarMovimientos`**
```typescript
for (const fila of filasValidas) {       // ← loop secuencial
  await supabase.rpc('registrar_movimiento', { ... })
}
```
Mismo problema. Con 20 productos en una factura, el usuario espera ~4 segundos.

**Solución:** Usar `Promise.all(filasValidas.map(fila => supabase.rpc(...)))` para ejecutar en paralelo. El RPC `registrar_movimiento` debería ser idempotente y seguro de paralelizar.

---

### Query N+1 en matching de productos — `ConfirmacionIA.tsx:useEffect`

```typescript
Promise.all(
  filas.map(async fila => {
    const { data } = await supabase.from('productos').select('id')
      .eq('empresa_id', empresaId).ilike('nombre', `%${fila.nombre}%`).limit(1).single()
    ...
  })
)
```
Esto hace N queries paralelas (una por producto). Con `Promise.all` ya está paralelizado, pero una sola query con `OR` sería más eficiente. Aceptable para uso normal (pocas filas).

---

### Queries que traen más datos de los necesarios

**`NuevaAuditoria.tsx` — alcance 'todo':**
```typescript
supabase.from('productos').select('id, stock_actual').eq('empresa_id', empresaId).eq('activo', true)
```
Si la empresa tiene 5,000 productos, trae todos a memoria del cliente para construir `auditoria_items`. En volúmenes grandes esto puede agotar la memoria del navegador o superar el límite de payload de Supabase.

**`HistorialAuditorias.tsx`:**
```typescript
supabase.from('auditorias').select(`
  ...,
  auditoria_items(id, estado, usuario_asignado)
`).eq('empresa_id', empresaId).order('fecha_inicio', { ascending: false })
```
Trae todos los items de todas las auditorías históricas. Con 100 auditorías de 500 items c/u = 50,000 items traídos en un solo query sin paginación.

---

### Sin debounce en búsquedas

Los campos de búsqueda en `ProductList.tsx`, `CategoriasList.tsx`, `EmpleadosList.tsx` y `MovimientosList.tsx` filtran en memoria (no hacen queries adicionales), por lo que el impacto es bajo. Sin embargo, `MovimientosList` recarga datos del servidor al hacer router.refresh(), y sin debounce cada tecla dispara un ciclo de filtrado.

---

## 9. CÓDIGO MUERTO

### 🔴 Foto de evidencia en `ConteoProductos.tsx` — funcionalidad inexistente

```typescript
// Línea 271-284
<button onClick={() => fotoRef.current?.click()}>
  Foto de evidencia (opcional)
</button>
<input
  ref={fotoRef}
  type="file"
  accept="image/*"
  capture="environment"
  style={{ display: 'none' }}
  // ← SIN onChange handler
/>
```

El trabajador puede tocar el botón, seleccionar una foto de la cámara, pero **la foto nunca se lee, nunca se sube y nunca se guarda**. El input no tiene `onChange`. Es UX engañosa: el trabajador cree que adjuntó evidencia fotográfica cuando en realidad se descartó silenciosamente.

---

### Imports no utilizados potenciales

- `Camera` importado en `ConteoProductos.tsx` — se usa en el botón, pero dado que el botón no hace nada útil, es funcionalmente dead code.
- `useRef` en `ConteoProductos.tsx` — usado solo para el foto input sin funcionalidad.

---

## 10. TODO / FIXME / CÓDIGO TEMPORAL

### Ningún TODO/FIXME en el código fuente.

Sin embargo, hay equivalentes funcionales:

| Problema | Archivo | Descripción |
|---------|---------|-------------|
| Debug logs en producción | `api/empleados/route.ts:5-6` | `console.log` de la secret key que debería haberse eliminado tras debug |
| Metadata placeholder | `app/layout.tsx:10-13` | `title: "Create Next App"` y `description: "Generated by create next app"` — nunca fueron actualizados |
| `lang="en"` en app en español | `app/layout.tsx:26` | El HTML se declara en inglés pero toda la UI está en español. Afecta SEO y accesibilidad |
| Foto auditoría sin implementar | `ConteoProductos.tsx:271-284` | Botón que captura foto pero no la procesa (detallado en sección 9) |
| `next.config.ts` vacío | `next.config.ts` | Sin configuración de imágenes remotas, lo que puede causar errores con `next/image` si se adopta en el futuro |

---

## RESUMEN EJECUTIVO

### Críticos (requieren acción inmediata)

1. **`/api/ia/procesar-documento` sin auth** — cualquier usuario puede consumir créditos de Anthropic de la cuenta del negocio.
2. **`console.log` de SUPABASE_SECRET_KEY** en `api/empleados/route.ts` — eliminar líneas 5-6.

### Altos (deuda técnica significativa)

3. **Metadata de la app es placeholder** — `title`, `description` y `lang` nunca se personalizaron.
4. **Foto de evidencia en auditoría es código muerto** — el botón en `ConteoProductos.tsx` no procesa la foto. Es UX engañosa.
5. **N+1 loops de RPC** en `ReporteDiscrepancias.tsx` y `ConfirmacionIA.tsx` — reemplazar con `Promise.all()`.
6. **Posible bug de esquema** — `auditoria_productos_extra` se inserta con `nombre` pero se lee con `nombre_producto`. Verificar columna real en Supabase.

### Medios (mejoras de calidad)

7. **`formatFecha` duplicada** en 3 archivos — extraer a `lib/utils.ts`.
8. **Patrón empresa_id repetido** en 10 páginas — extraer a función `getSession()` en lib.
9. **Toast implementado 2 veces** de forma diferente — unificar en un componente o hook.
10. **"Inicio" e "Inventario" en nav apuntan a la misma ruta** — una de las dos entradas sobra.
11. **Path de storage inconsistente** — foto de evidencia en StockModal no incluye `empresaId`.
12. **5 patrones distintos de manejo de errores** — unificar.
13. **Colores hardcodeados en ~20 archivos** — extraer tokens a `lib/design.ts`.
14. **Sin error boundary global** — agregar `app/error.tsx`.
15. **Queries sin paginación** en `HistorialAuditorias` (puede traer 50,000 items).

### Bajos (buenas prácticas)

16. Validación de email solo a nivel HTML (sin validación en servidor).
17. `perfil?.empresa_id as string` sin verificar null puede causar queries sin filtro si perfil es null.
18. Sin tests unitarios ni de integración.
19. `next.config.ts` vacío — sin `images.remotePatterns` para las fotos de Supabase Storage.

### Lo que está bien hecho

- ✅ Todas las queries filtran por `empresa_id`.
- ✅ Ningún `select('*')` — todos los selects especifican columnas.
- ✅ El stock siempre se muta vía RPC, nunca con UPDATE directo.
- ✅ `supabase.auth.admin` solo se usa en Route Handlers (server-side).
- ✅ TypeScript strict mode activo con 0 errores de compilación.
- ✅ Separación clara Server Components (pages que cargan datos) / Client Components (interactividad).
- ✅ El Route Handler de empleados verifica que el usuario target pertenezca a la misma empresa.
- ✅ `ProductoForm.tsx` es el único componente que centraliza sus estilos correctamente (`inputStyle`, `labelStyle`, `cardStyle` como constantes).
- ✅ La zona de auditoría de trabajadores tiene su propio layout separado del dashboard admin.
