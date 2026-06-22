# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript type check without emitting files
```

No test suite exists yet. Validate logic manually against the dev server.

---

## Architecture

### App structure

```
app/
  page.tsx                        # Redirects / → /dashboard
  login/page.tsx                  # Auth (Client Component)
  dashboard/
    layout.tsx                    # Auth guard + Sidebar + BottomNav (Server Component)
    page.tsx                      # Resumen: productos críticos + actividad del día
    components/
      Sidebar.tsx                 # Desktop nav, hidden md:flex
      BottomNav.tsx               # Mobile nav, flex md:hidden
      ProductList.tsx             # Client: search, filters, KPIs, ordenamiento — shared con /inventario
      StockModal.tsx              # Client: +/- stock via RPC
    productos/
      components/ProductoForm.tsx # Shared create/edit form (Client)
      nuevo/page.tsx
      [id]/editar/page.tsx        # params is Promise<{id}> — must await
    movimientos/
      page.tsx
      components/MovimientosList.tsx
      components/MovimientoDetalle.tsx
  inventario/
    layout.tsx                    # Auth guard (comparte estructura con dashboard)
    page.tsx                      # Lista de productos — importa ProductList de dashboard/components
    [id]/
      page.tsx                    # Detalle de producto: stock por almacén + movimientos
      components/
        AccionesProducto.tsx      # Botones Entrada / Salida / Transferir
        TransferirModal.tsx       # Modal de transferencia entre almacenes (RPC transferir_stock)
lib/
  utils.ts    # formatFecha, formatFechaCorta, formatHora, getSaludo, getEstadoStock
  design.ts   # Tokens de colores, badges, radius, shadows
  supabase/
    server.ts    # createClient() — async, uses cookies(), for Server Components
    client.ts    # createClient() — sync, createBrowserClient(), for Client Components
    session.ts   # getSession() — centralizado: { supabase, user, empresaId, nombre, rol }
proxy.ts      # Route protection (renamed from middleware.ts in Next.js 16)
```

### Next.js 16 breaking changes in this project

- **Middleware is `proxy.ts`**, not `middleware.ts`. The export is named `proxy`, not `middleware`.
- **Dynamic route `params` is a `Promise`**: always `await params` before destructuring.
  ```typescript
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  ```

### Supabase patterns

**Server Component** (fetches data, passes to Client):
```typescript
const supabase = await createClient()  // async
const { data: { user } } = await supabase.auth.getUser()
```

**Client Component** (mutations, RPC):
```typescript
const supabase = createClient()  // sync
await supabase.rpc('registrar_movimiento', { ... })
```

**FK joins return objects, not arrays.** TypeScript infers them as arrays but Supabase returns a single object at runtime:
```typescript
// Type must be: categorias: { nombre: string } | null
// Access as:    producto.categorias?.nombre   ✓
// NOT as:       produto.categorias?.[0]?.nombre  ✗
```
Cast query results with `as unknown as MyType[]` to override the inferred type.

**Named FK aliases** (when two FKs point to the same table):
```typescript
.select(`
  almacenes!movimientos_almacen_id_fkey ( nombre ),
  almacenes_destino:almacenes!movimientos_almacen_destino_id_fkey ( nombre )
`)
// Results arrive as: row.almacenes and row.almacenes_destino
```

**env vars**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not ANON_KEY).  
`ANTHROPIC_API_KEY` (server-only, used by `/api/ia/procesar-documento`). If absent, the route returns `{ modo: 'sin_api_key' }` and the UI allows manual entry.

### Stock is always mutated via RPC

```typescript
supabase.rpc('registrar_movimiento', {
  p_producto_id, p_almacen_id, p_tipo,  // 'ingreso'|'retiro'|'transferencia'|'ajuste'
  p_cantidad, p_nota, p_foto            // p_foto optional
})
```
Never update `productos.stock_actual` or `stock_por_almacen` directly from client code.

### Styling rules

- **Colors and layout**: inline `style={{}}` props.
- **Responsive display only**: Tailwind classes (`hidden md:flex`, `flex md:hidden`). Never put `display` in an inline style on a responsive element — inline styles override Tailwind classes due to CSS specificity.
- **Tailwind v4**: `@import "tailwindcss"` in globals.css, `@tailwindcss/postcss` plugin. Custom colors go in `@theme inline {}` block.
- **Shared style constant objects** must be typed `as CSSProperties` (`import type { CSSProperties } from 'react'`) to avoid TS errors on properties like `resize` or `boxSizing`.

### Design system (KIPUX)

| Token | Value | Usage |
|-------|-------|-------|
| primary | `#F4C400` | Buttons, active states, highlights |
| background | `#F8F6EA` | Page background (warm cream) |
| surface | `#FFFFFF` | Cards, modals, inputs |
| text | `#111111` | Primary text |
| textSecondary | `#6B6B6B` | Labels, metadata |
| ai / healthy | `#00D7A7` | Stock healthy, ingresos |
| danger | `#FF4D4D` | Errors, stock agotado, retiros |
| border | `#E8E8E8` | Dividers |
| yellow-muted | `#F4C400` | Transferencias, bajo stock |
| gray-muted | `#6B6B6B` | Ajustes |

Icons: Lucide React only.

### Data architecture constraints (do not change)

- `movimientos` table is **append-only** — only INSERT, never UPDATE/DELETE.
- All tables are **multi-tenant** via `empresa_id` with Postgres RLS. `auth_empresa_id()` RPC returns the user's empresa.
- Products have an `activo` boolean — soft delete, never hard delete.
- `empresa_id` is read from `perfiles` (not from auth metadata). Pattern in every Server Component page:
  ```typescript
  const { data: perfil } = await supabase.from('perfiles').select('empresa_id').eq('id', user.id).single()
  const empresaId = perfil.empresa_id as string
  ```

### Storage (Supabase)

Bucket: `productos` (must be created manually in Supabase dashboard as public).  
Path convention: `{empresaId}/{productoId}/foto.{ext}`.  
Use `crypto.randomUUID()` to pre-generate the product ID before insert so the storage path is known before the DB row exists.

---

## Progreso completado

- ✅ Layout responsive (Sidebar desktop + BottomNav móvil)
- ✅ Historial de movimientos
- ✅ Gestión de categorías
- ✅ Gestión de almacenes con filtro de inventario por almacén
- ✅ Gestión de empleados con creación de usuarios vía API
- ✅ Configuración con tasa BCV y alertas email
- ✅ Modo Auditoría completo con Realtime y panel trabajador
- ✅ Cámara + IA (leer facturas) — HubCaptura, EscanerFactura, ConfirmacionIA, Route Handler Claude API
- ✅ Dashboard separado de Inventario (/dashboard y /inventario)
- ✅ Pantalla de detalle de producto (/inventario/[id])
- ✅ Filtros múltiples en inventario (estado, categoría, almacén, ordenamiento)
- ✅ Transferencia entre almacenes (RPC transferir_stock + TransferirModal)
- ✅ Sidebar con degradado amarillo #F4C400 → #D4A800
- ✅ KPIs en inventario (total productos, valor, bajo stock, agotados)
- ✅ Botones Entrada/Salida en lista de productos y detalle
- ✅ Panel de acciones en BottomNav móvil
- ✅ Carga masiva (botón que navega a /dashboard/camara)
- ✅ Centralización: getSession() en lib/supabase/session.ts, lib/utils.ts, lib/design.ts
- ✅ Desplegado en Vercel (kipux-ashen.vercel.app)
- ✅ RPC transferir_stock con UNIQUE constraint en stock_por_almacen
