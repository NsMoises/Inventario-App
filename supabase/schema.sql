-- =============================================================
-- SISTEMA DE CONTROL DE INVENTARIO - SUPABASE SCHEMA
-- =============================================================
-- Este script crea toda la estructura de base de datos:
-- tablas, índices, funciones RPC, triggers y políticas RLS.
-- Ejecutar en el SQL Editor de Supabase Dashboard.
-- =============================================================

-- 0. EXTENSIONES NECESARIAS
create extension if not exists "pgcrypto";

-- =============================================================
-- 1. TABLAS DEL SISTEMA
-- =============================================================

-- 1.1 TIENDAS
create table if not exists tiendas (
  id bigint primary key generated always as identity,
  nombre text not null unique,
  created_at timestamptz not null default now()
);

-- 1.2 PERFILES DE USUARIO (vinculados a auth.users)
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre_completo text not null,
  rol text not null check (rol in ('admin', 'usuario_tienda')),
  tienda_id bigint references tiendas(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.3 PRODUCTOS
create table if not exists productos (
  id bigint primary key generated always as identity,
  nombre text not null,
  descripcion text default '',
  sku text not null unique,
  categoria text default '',
  marca text default '',
  proveedor text default '',
  unidad_medida text default 'unidad',
  precio_compra numeric(10,2) default 0,
  precio_venta numeric(10,2) default 0,
  stock_minimo integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.4 STOCK (ALMACÉN POR TIENDA)
create table if not exists stock (
  id bigint primary key generated always as identity,
  producto_id bigint not null references productos(id) on delete restrict,
  tienda_id bigint not null references tiendas(id) on delete restrict,
  cantidad integer not null default 0 check (cantidad >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (producto_id, tienda_id)
);

-- 1.5 KARDEX (MOVIMIENTOS)
create table if not exists kardex (
  id bigint primary key generated always as identity,
  producto_id bigint not null references productos(id) on delete restrict,
  tienda_origen_id bigint references tiendas(id) on delete restrict,
  tienda_destino_id bigint references tiendas(id) on delete restrict,
  tipo_movimiento text not null check (tipo_movimiento in ('ENTRADA', 'SALIDA', 'TRANSFERENCIA')),
  cantidad integer not null check (cantidad > 0),
  fecha_hora timestamptz not null default now(),
  usuario_id uuid not null references perfiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- =============================================================
-- 2. ÍNDICES PARA RENDIMIENTO
-- =============================================================
create index if not exists idx_kardex_fecha on kardex(fecha_hora desc);
create index if not exists idx_kardex_producto on kardex(producto_id);
create index if not exists idx_kardex_tienda_origen on kardex(tienda_origen_id);
create index if not exists idx_kardex_tienda_destino on kardex(tienda_destino_id);
create index if not exists idx_kardex_tipo on kardex(tipo_movimiento);
create index if not exists idx_stock_tienda on stock(tienda_id);
create index if not exists idx_stock_producto on stock(producto_id);
create index if not exists idx_perfiles_tienda on perfiles(tienda_id);
create index if not exists idx_perfiles_rol on perfiles(rol);

-- =============================================================
-- 3. FUNCIÓN: REGISTRAR ENTRADA DE STOCK
-- =============================================================
create or replace function registrar_entrada(
  p_producto_id bigint,
  p_tienda_id bigint,
  p_cantidad integer,
  p_usuario_id uuid
) returns jsonb
language plpgsql
security definer
as $$
begin
  if p_cantidad <= 0 then
    return jsonb_build_object('exito', false, 'error', 'La cantidad debe ser mayor a 0');
  end if;

  insert into stock (producto_id, tienda_id, cantidad)
  values (p_producto_id, p_tienda_id, p_cantidad)
  on conflict (producto_id, tienda_id)
  do update set cantidad = stock.cantidad + p_cantidad,
                updated_at = now();

  insert into kardex (producto_id, tienda_destino_id, tipo_movimiento, cantidad, usuario_id)
  values (p_producto_id, p_tienda_id, 'ENTRADA', p_cantidad, p_usuario_id);

  return jsonb_build_object('exito', true);
end;
$$;

-- =============================================================
-- 4. FUNCIÓN: REGISTRAR VENTA (SALIDA)
-- =============================================================
create or replace function registrar_venta(
  p_producto_id bigint,
  p_tienda_id bigint,
  p_cantidad integer,
  p_usuario_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_stock_actual integer;
begin
  if p_cantidad <= 0 then
    return jsonb_build_object('exito', false, 'error', 'La cantidad debe ser mayor a 0');
  end if;

  select cantidad into v_stock_actual
  from stock
  where producto_id = p_producto_id and tienda_id = p_tienda_id;

  if v_stock_actual is null or v_stock_actual < p_cantidad then
    return jsonb_build_object('exito', false, 'error', 'Stock insuficiente. Disponible: ' || coalesce(v_stock_actual::text, '0'));
  end if;

  update stock
  set cantidad = cantidad - p_cantidad,
      updated_at = now()
  where producto_id = p_producto_id and tienda_id = p_tienda_id;

  insert into kardex (producto_id, tienda_origen_id, tipo_movimiento, cantidad, usuario_id)
  values (p_producto_id, p_tienda_id, 'SALIDA', p_cantidad, p_usuario_id);

  return jsonb_build_object('exito', true);
end;
$$;

-- =============================================================
-- 5. FUNCIÓN: TRANSFERIR STOCK ENTRE TIENDAS (ATÓMICA)
-- =============================================================
create or replace function transferir_stock(
  p_producto_id bigint,
  p_tienda_origen_id bigint,
  p_tienda_destino_id bigint,
  p_cantidad integer,
  p_usuario_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_stock_origen integer;
begin
  if p_tienda_origen_id = p_tienda_destino_id then
    return jsonb_build_object('exito', false, 'error', 'La tienda origen y destino deben ser diferentes');
  end if;

  if p_cantidad <= 0 then
    return jsonb_build_object('exito', false, 'error', 'La cantidad debe ser mayor a 0');
  end if;

  select cantidad into v_stock_origen
  from stock
  where producto_id = p_producto_id and tienda_id = p_tienda_origen_id;

  if v_stock_origen is null or v_stock_origen < p_cantidad then
    return jsonb_build_object('exito', false, 'error', 'Stock insuficiente en origen. Disponible: ' || coalesce(v_stock_origen::text, '0'));
  end if;

  -- Restar de origen
  update stock
  set cantidad = cantidad - p_cantidad,
      updated_at = now()
  where producto_id = p_producto_id and tienda_id = p_tienda_origen_id;

  -- Sumar en destino
  insert into stock (producto_id, tienda_id, cantidad)
  values (p_producto_id, p_tienda_destino_id, p_cantidad)
  on conflict (producto_id, tienda_id)
  do update set cantidad = stock.cantidad + p_cantidad,
                updated_at = now();

  -- Registrar en kardex
  insert into kardex (producto_id, tienda_origen_id, tienda_destino_id, tipo_movimiento, cantidad, usuario_id)
  values (p_producto_id, p_tienda_origen_id, p_tienda_destino_id, 'TRANSFERENCIA', p_cantidad, p_usuario_id);

  return jsonb_build_object('exito', true);
end;
$$;

-- =============================================================
-- 6. TRIGGER: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
-- =============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, email, nombre_completo, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'rol', 'usuario_tienda')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- =============================================================
-- 7. TRIGGER: ACTUALIZAR updated_at EN PERFILES
-- =============================================================
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_perfiles
  before update on perfiles
  for each row
  execute function update_updated_at_column();

create trigger set_updated_at_productos
  before update on productos
  for each row
  execute function update_updated_at_column();

create trigger set_updated_at_stock
  before update on stock
  for each row
  execute function update_updated_at_column();

-- =============================================================
-- 8. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- =============================================================

-- 8.1 HABILITAR RLS EN TODAS LAS TABLAS
alter table tiendas enable row level security;
alter table perfiles enable row level security;
alter table productos enable row level security;
alter table stock enable row level security;
alter table kardex enable row level security;

-- 8.2 FUNCIÓN AUXILIAR PARA VERIFICAR ROL
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function public.tienda_usuario()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select tienda_id from public.perfiles
  where id = auth.uid() and rol = 'usuario_tienda';
$$;

-- 8.3 POLÍTICAS PARA TIENDAS
create policy "Todos pueden leer tiendas"
  on tiendas for select
  using (true);

create policy "Solo admin puede gestionar tiendas"
  on tiendas for insert
  with check (public.es_admin());

create policy "Solo admin puede editar tiendas"
  on tiendas for update
  using (public.es_admin());

create policy "Solo admin puede eliminar tiendas"
  on tiendas for delete
  using (public.es_admin());

-- 8.4 POLÍTICAS PARA PERFILES
create policy "Admin puede ver todos los perfiles"
  on perfiles for select
  using (public.es_admin() or id = auth.uid());

create policy "Usuarios ven su propio perfil"
  on perfiles for select
  using (id = auth.uid());

create policy "Solo admin puede modificar perfiles"
  on perfiles for insert
  with check (public.es_admin());

create policy "Solo admin puede actualizar perfiles"
  on perfiles for update
  using (public.es_admin());

create policy "Solo admin puede eliminar perfiles"
  on perfiles for delete
  using (public.es_admin());

-- 8.5 POLÍTICAS PARA PRODUCTOS
create policy "Admin puede todo en productos"
  on productos for all
  using (public.es_admin());

create policy "Usuarios pueden ver productos"
  on productos for select
  using (true);

-- 8.6 POLÍTICAS PARA STOCK
create policy "Admin puede todo en stock"
  on stock for all
  using (public.es_admin());

create policy "Usuario ve stock de su tienda"
  on stock for select
  using (
    tienda_id = public.tienda_usuario()
  );

create policy "Usuario puede modificar stock de su tienda"
  on stock for insert
  with check (tienda_id = public.tienda_usuario());

create policy "Usuario puede actualizar stock de su tienda"
  on stock for update
  using (tienda_id = public.tienda_usuario());

-- 8.7 POLÍTICAS PARA KARDEX
create policy "Admin puede todo en kardex"
  on kardex for all
  using (public.es_admin());

create policy "Usuario ve kardex de su tienda"
  on kardex for select
  using (
    tienda_origen_id = public.tienda_usuario() or
    tienda_destino_id = public.tienda_usuario()
  );

create policy "Usuario puede insertar kardex"
  on kardex for insert
  with check (
    tipo_movimiento in ('ENTRADA', 'SALIDA')
    and (
      tienda_origen_id = public.tienda_usuario() or
      tienda_destino_id = public.tienda_usuario()
    )
  );

-- =============================================================
-- 9. DATOS INICIALES (SEED)
-- =============================================================
insert into tiendas (nombre) values
  ('Abancay'),
  ('Gamarra'),
  ('Centro')
on conflict (nombre) do nothing;
