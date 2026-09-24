-- Serena Home — esquema de base de datos (Supabase / Postgres)
-- Ejecuta este archivo completo en: Supabase Dashboard -> SQL Editor -> New query -> Run

-- ============================================================
-- 1) VENDEDORES (asesoras)
-- ============================================================
create table if not exists public.vendors (
  key text primary key,              -- ej: 'lina', 'yesica' (usado en ?v=lina)
  name text not null,
  phone text,                        -- OBLIGATORIO tenerlo real antes de activar el asesor
  city text,
  active boolean not null default true
);

-- Datos reales ya existentes en el catálogo (no se inventan números nuevos)
insert into public.vendors (key, name, phone, city) values
  ('lina',   'Lina',   '573164123977', 'Bogotá'),
  ('yesica', 'Yesica', '573103359655', 'Sede 12'),
  ('jose',   'Jose',   '573189502649', 'Bucaramanga'),
  ('leini',  'Leini',  '573161178170', 'Medellín')
on conflict (key) do nothing;

-- ============================================================
-- 2) PRODUCTOS
-- ============================================================
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  description text,
  colors jsonb not null default '[]',        -- ["Blanco","Beige",...]
  sizes jsonb not null default '[]',          -- [["Doble",137733],["Queen",140427],["King",144917]]
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3) COTIZACIONES  (se guarda UNA fila por cada cotización generada,
--    se haya enviado o no por WhatsApp — punto pedido por Daniela)
-- ============================================================
create type public.quote_status as enum (
  'nueva', 'contactado', 'confirmado', 'facturado', 'cancelado'
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,                 -- formato SH-YYYYMMDD-HHMM
  fecha date not null default current_date,
  hora time not null default current_time,
  cliente_nombre text not null,
  cliente_nit text,
  cliente_ciudad text,
  cliente_telefono text,
  cliente_correo text,
  asesor_origen text references public.vendors(key),     -- de dónde vino (link ?v=)
  asesor_seleccionado text references public.vendors(key), -- el que el cliente eligió al final
  productos jsonb not null,                     -- snapshot: [{id,name,size,color,qty,price}]
  cantidad_items integer not null default 0,
  valor_total numeric(12,2) not null default 0,
  estado public.quote_status not null default 'nueva',
  enviado_whatsapp boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists quotes_created_at_idx on public.quotes (created_at desc);
create index if not exists quotes_asesor_idx on public.quotes (asesor_seleccionado);
create index if not exists quotes_estado_idx on public.quotes (estado);

-- ============================================================
-- 4) PERFILES / ROLES (Admin, Vendedor). Se crea automáticamente
--    cuando alguien se registra con Supabase Auth; por defecto SIN
--    permisos (debes ascenderlo a 'admin' manualmente, ver README).
-- ============================================================
create type public.user_role as enum ('admin', 'vendedor');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.user_role not null default 'vendedor',
  vendor_key text references public.vendors(key),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 5) SEGURIDAD (Row Level Security)
--    - Productos y vendedores: lectura pública (el catálogo es público)
--    - Cotizaciones: cualquiera puede CREAR (checkout público);
--      un admin autenticado LEE/actualiza todas; un vendedor autenticado
--      SOLO lee/actualiza las suyas (donde asesor_seleccionado = su vendor_key)
--    - Perfiles: cada quien lee el suyo; solo un admin lee todos
-- ============================================================
alter table public.products enable row level security;
alter table public.vendors enable row level security;
alter table public.quotes enable row level security;
alter table public.profiles enable row level security;

create policy "productos son publicos" on public.products
  for select using (active = true);

create policy "vendedores son publicos" on public.vendors
  for select using (active = true);

create policy "cualquiera puede crear una cotizacion" on public.quotes
  for insert with check (true);

create policy "solo admin lee cotizaciones" on public.quotes
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "vendedor lee solo sus propias cotizaciones" on public.quotes
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'vendedor'
        and p.vendor_key = public.quotes.asesor_seleccionado
    )
  );

create policy "solo admin actualiza cotizaciones" on public.quotes
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "vendedor actualiza solo sus propias cotizaciones" on public.quotes
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'vendedor'
        and p.vendor_key = public.quotes.asesor_seleccionado
    )
  );

create policy "cada quien lee su perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "admin lee todos los perfiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- CREAR USUARIOS (uno por asesora, más tú como admin):
--
-- 1. Cada persona entra a /admin/login → "Crear una cuenta nueva" → se
--    registra con SU PROPIO correo y una contraseña. Esto la crea
--    automáticamente en public.profiles con role='vendedor' y sin
--    vendor_key (sin acceso todavía).
--
-- 2. Tú, desde el SQL Editor de Supabase, conectas esa cuenta con su
--    asesora real (reemplaza el correo y la clave de vendedor: lina,
--    yesica, jose o leini):
--
--   update public.profiles
--   set vendor_key = 'lina'
--   where email = 'correo-de-lina@ejemplo.com';
--
-- 3. Para convertir tu propia cuenta en administradora (ve TODO):
--
--   update public.profiles set role = 'admin' where email = 'tu-correo@ejemplo.com';
--
-- Puedes repetir el paso 2 con cada una de las 4 asesoras cuando tengan
-- su correo listo — no hay límite de cuentas, todas caben en el plan
-- gratuito de Supabase.
-- ============================================================
