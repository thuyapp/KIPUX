# AUDITORÍA DE ESTADO — LOGISMART / KIPUX

**Fecha:** 2026-06-22  
**Proyecto:** logismart-app (Next.js 16 + Supabase + Claude AI)  
**Alcance:** Estado actual tras Sprint 2 — refactoring, nuevas rutas y features

---

## 1. ESTRUCTURA DE ARCHIVOS

### Nuevos / modificados en Sprint 2

```
app/
  inventario/
    layout.tsx                          ← Auth guard compartido con dashboard layout
    page.tsx                            ← Lista de productos (separada de /dashboard)
    [id]/
      page.tsx                          ← Detalle de producto con stock por almacén
      components/
        AccionesProducto.tsx            ← Botones Entrada / Salida / Transferir
        TransferirModal.tsx             ← Modal de transferencia entre almacenes

  dashboard/
    page.tsx                            ← Ahora es el resumen (atención requerida + actividad del día)
    components/
      Sidebar.tsx                       ← Degradado #F4C400 → #D4A800
      ProductList.tsx                   ← Lista con filtros múltiples, KPIs, ordenamiento
                                           (shared: importado también por /inventario)

lib/
  utils.ts                              ← formatFecha, formatFechaCorta, formatHora, getSaludo, getEstadoStock
  design.ts                             ← Tokens de colores, badges, radius, shadows
  supabase/
    session.ts                          ← getSession() centralizado: { supabase, user, empresaId, nombre, rol }
```

### Estructura completa relevante

```
logismart-app/
├── proxy.ts                            ← middleware (Next.js 16, export named proxy)
├── app/
│   ├── layout.tsx                      ← Root layout (fuentes Geist)
│   ├── page.tsx                        ← Redirect / → /dashboard
│   ├── login/page.tsx
│   ├── auditoria/                      ← Zona trabajador (layout propio, sin Sidebar/BottomNav)
│   ├── dashboard/
│   │   ├── layout.tsx                  ← Auth guard + Sidebar + BottomNav
│   │   ├── page.tsx                    ← Resumen: atención requerida + actividad hoy
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── ProductList.tsx         ← Usado por /inventario y /inventario?almacen=
│   │   │   └── StockModal.tsx
│   │   ├── almacenes/, categorias/, empleados/, movimientos/
│   │   ├── configuracion/, auditoria/, camara/
│   │   └── productos/nuevo/, productos/[id]/editar/
│   ├── inventario/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── components/
│   │           ├── AccionesProducto.tsx
│   │           └── TransferirModal.tsx
│   └── api/
│       ├── empleados/route.ts
│       └── ia/procesar-documento/route.ts
└── lib/
    ├── utils.ts
    ├── design.ts
    └── supabase/
        ├── server.ts
        ├── client.ts
        └── session.ts
```

---

## 2. RUTAS Y NAVEGACIÓN

| Ruta | Qué hace | Obs. |
|------|----------|------|
| `/` | Redirect → `/dashboard` | |
| `/login` | Formulario auth | |
| `/dashboard` | Resumen: productos críticos + actividad del día | Separado de inventario |
| `/inventario` | Lista de productos con filtros, KPIs, ordenamiento | Nueva ruta |
| `/inventario?almacen=<id>` | Lista filtrada por almacén | Desde AlmacenesList |
| `/inventario?estado=bajo\|agotado` | Lista filtrada por estado | Desde KPI cards |
| `/inventario/[id]` | Detalle de producto: stock por almacén y movimientos | Nueva ruta |
| `/dashboard/movimientos` | Historial con filtros | |
| `/dashboard/camara` | Captura de documentos + IA | |
| `/dashboard/categorias` | CRUD categorías | |
| `/dashboard/almacenes` | CRUD almacenes | |
| `/dashboard/empleados` | CRUD empleados | |
| `/dashboard/auditoria` | Panel admin de auditoría | |
| `/dashboard/configuracion` | Config empresa, tasa BCV, alertas email | |
| `/dashboard/productos/nuevo` | Crear producto | |
| `/dashboard/productos/[id]/editar` | Editar producto | |
| `/auditoria` | Panel del trabajador (conteo físico) | Sin Sidebar/BottomNav |

---

## 3. FUNCIONES RPC EN SUPABASE

| RPC | Estado | Archivos que la usan |
|-----|--------|---------------------|
| `registrar_movimiento` | Existente | StockModal, ProductoForm, ReporteDiscrepancias, ConfirmacionIA |
| `transferir_stock` | Nueva (Sprint 2) | TransferirModal — operación atómica con UNIQUE constraint en `stock_por_almacen` |

---

## 4. SEGURIDAD

| Issue | Estado | Detalle |
|-------|--------|---------|
| `/api/ia/procesar-documento` sin auth | ✅ Resuelto | Verifica sesión con `createClient().auth.getUser()` y valida perfil de empresa antes de llamar a Claude. |
| `console.log` de SUPABASE_SECRET_KEY | ✅ Resuelto (Sprint 1) | Eliminado de `api/empleados/route.ts` |
| ANTHROPIC_API_KEY en producción | ⚠ Sin fondos activos | La key no está configurada; la UI cae en modo `sin_api_key` y permite entrada manual |
| Trabajadores accediendo a rutas `/dashboard/*` | ✅ Resuelto | `dashboard/layout.tsx` redirige a `/auditoria` si `perfil.rol === 'trabajador'` |
| Validación de rol en PATCH `/api/empleados` | ✅ Resuelto | Whitelist `['admin', 'trabajador']` — retorna 400 si el rol no es válido |
| Sin rate limiting en endpoint de IA | ✅ Resuelto | In-memory rate limit: 20 req/hora por usuario via `Map<userId, {count, resetAt}>` en `/api/ia/procesar-documento` |
| Path de evidencias sin `empresa_id` en StockModal | ✅ Resuelto | Path corregido a `${empresaId}/evidencias/${producto.id}/...` — cargado desde `perfiles` en `useEffect` |
| Proxy redirigía rutas `/api/*` a `/login` | ✅ Resuelto | Early return `NextResponse.next()` para rutas `/api/` antes de verificar sesión |
| RLS ausente en tabla `empresas` | ✅ Resuelto | Políticas aplicadas en Supabase para aislar datos por empresa |
| Bucket `productos` sin políticas de Storage | ✅ Resuelto | Políticas aplicadas para que cada empresa solo acceda a su carpeta |

---

## 5. DEUDA TÉCNICA PENDIENTE

| Problema | Archivo(s) | Severidad |
|---------|-----------|-----------|
| Filtro de almacén en inventario no funciona | `ProductList.tsx` filtro de almacenesSeleccionados | Alta — la lógica siempre retorna `true` (.filter(() => almacenesSeleccionados.length === 0)) |
| Foto de evidencia en auditoría | `ConteoProductos.tsx` | ✅ Resuelto — `onChange` implementado, preview visual, upload a Storage y `foto_url` guardado en `auditoria_items` |
| Sin error boundary global | `app/error.tsx` (no existe) | Media |
| Metadata placeholder | `app/layout.tsx` | Media — title "Create Next App", lang="en" en app en español |
| Categoría no se asigna en Carga masiva | `ConfirmacionIA.tsx` | Media |
| N+1 loops de RPC secuenciales | `ReporteDiscrepancias.tsx`, `ConfirmacionIA.tsx` | Media — reemplazar bucle con `Promise.all()` |
| Toast implementado 2 veces diferente | `ConfiguracionForm.tsx`, `ReporteDiscrepancias.tsx` | Baja |
| `lib/design.ts` no adoptado en todos los archivos | ~20 componentes | Baja — tokens existen pero colores siguen hardcodeados en la mayoría |

---

## 6. LO QUE ESTÁ BIEN

- ✅ `getSession()` centralizado en `lib/supabase/session.ts` — usado en 10+ páginas
- ✅ `formatFecha` y helpers centralizados en `lib/utils.ts`
- ✅ Tokens de diseño disponibles en `lib/design.ts`
- ✅ Stock siempre mutado via RPC (`registrar_movimiento`, `transferir_stock`), nunca UPDATE directo
- ✅ Multi-tenant con `empresa_id` en todas las queries + RLS en Supabase
- ✅ Transferencias atómicas via RPC `transferir_stock` con UNIQUE constraint en `stock_por_almacen`
- ✅ `supabase.auth.admin` solo en Route Handlers (server-side), nunca en Client Components
- ✅ Separación clara Server Components (data fetching) / Client Components (interactividad)
- ✅ Dashboard separado de Inventario — `/dashboard` y `/inventario` con roles distintos
- ✅ Desplegado en Vercel: kipux-ashen.vercel.app
