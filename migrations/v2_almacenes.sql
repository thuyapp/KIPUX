-- KIPUX — Migración v1 → v2: Módulo de Almacenes
-- Ejecutar en el SQL Editor de Supabase en una pestaña nueva.
-- NO borra nada anterior — solo agrega tablas y columnas.

create table almacenes (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  nombre      text not null,
  descripcion text,
  es_default  boolean not null default false,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table stock_por_almacen (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  producto_id  uuid not null references productos(id) on delete cascade,
  almacen_id   uuid not null references almacenes(id) on delete cascade,
  stock_actual integer not null default 0,
  ubicacion    text,
  created_at   timestamptz not null default now(),
  unique (producto_id, almacen_id)
);

alter table productos add column if not exists activo boolean not null default true;
alter table movimientos add column if not exists almacen_id uuid references almacenes(id) on delete set null;
alter table auditorias add column if not exists almacen_id uuid references almacenes(id) on delete set null;
alter table auditoria_items add column if not exists almacen_id uuid references almacenes(id) on delete set null;

alter table almacenes enable row level security;
alter table stock_por_almacen enable row level security;

create policy "almacenes_misma_empresa" on almacenes
  for all using (empresa_id = auth_empresa_id())
  with check (empresa_id = auth_empresa_id());

create policy "stock_por_almacen_misma_empresa" on stock_por_almacen
  for all using (empresa_id = auth_empresa_id())
  with check (empresa_id = auth_empresa_id());

create or replace function registrar_movimiento(
  p_producto_id uuid,
  p_almacen_id  uuid,
  p_tipo        text,
  p_cantidad    integer,
  p_nota        text default null,
  p_foto        text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_empresa uuid;
  v_mov_id  uuid;
begin
  v_empresa := auth_empresa_id();
  perform 1 from stock_por_almacen
    where producto_id = p_producto_id and almacen_id = p_almacen_id
    for update;
  insert into movimientos (empresa_id, producto_id, almacen_id, usuario_id, tipo, cantidad, nota, foto_evidencia_url)
  values (v_empresa, p_producto_id, p_almacen_id, auth.uid(), p_tipo, p_cantidad, p_nota, p_foto)
  returning id into v_mov_id;
  if p_tipo = 'ingreso' then
    update stock_por_almacen set stock_actual = stock_actual + p_cantidad where producto_id = p_producto_id and almacen_id = p_almacen_id;
    update productos set stock_actual = stock_actual + p_cantidad where id = p_producto_id;
  else
    update stock_por_almacen set stock_actual = stock_actual - p_cantidad where producto_id = p_producto_id and almacen_id = p_almacen_id;
    update productos set stock_actual = stock_actual - p_cantidad where id = p_producto_id;
  end if;
  return v_mov_id;
end;
$$;

insert into almacenes (empresa_id, nombre, descripcion, es_default)
values ('fb56a544-5376-40e8-b663-20aebc1b4f43', 'Principal', 'Almacén principal', true);
