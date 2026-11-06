-- Bloom · fase 5 · esquema inicial (tech §3 + SDD §3.6, ajustado al modelo de las fases 3–4)
--
-- Reglas:
-- * Toda fila de usuario lleva user_id y su clave es (user_id, id). El id es el que genera el
--   teléfono (uuid, o el id de una receta base como 'v60-base-v1'): reenviar la misma fila nunca
--   duplica (idempotencia del sync) y una FK compuesta (x_id, user_id) no puede apuntar a filas
--   de otro usuario aunque una FK ignore RLS (P-11).
-- * RLS activada y forzada en todas las tablas: política owner_all (auth.uid() = user_id).
-- * Gana el cambio más reciente (tech §4): un trigger descarta updates con updated_at más viejo.
-- * Fuera de esta migración (fases futuras): research_sources, usage_counters, champion_refs,
--   bucket bag-photos.

-- ── LWW: un update más viejo que lo guardado no pisa la fila ──────────────────
create or replace function public.keep_newest()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

-- ── Perfil y Setup ───────────────────────────────────────────────────────────
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  setup jsonb not null default '{"grinder": null, "brewAltitudeM": null}'::jsonb,
  haptics boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ── Cafés, bolsas y ajustes de stock (P-25, P-11) ────────────────────────────
create table public.coffees (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (length(name) between 1 and 200),
  roaster text,
  origin_country text,
  variety text,
  process text check (process in ('lavado', 'natural', 'honey', 'anaerobico', 'otro')),
  roast_level text check (roast_level in ('claro', 'medio', 'medio_oscuro', 'oscuro')),
  roast_date date,
  altitude_m integer check (altitude_m between 0 and 3000),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.coffee_bags (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  coffee_id text not null,
  number integer not null check (number > 0),
  initial_g numeric not null check (initial_g > 0),
  opened_at timestamptz not null,
  status text not null check (status in ('active', 'finished')),
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, coffee_id) references public.coffees (user_id, id) on delete cascade
);
create index coffee_bags_coffee_idx on public.coffee_bags (user_id, coffee_id, status);

create table public.stock_adjustments (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  bag_id text not null,
  delta_g numeric not null,
  reason text not null default 'manual',
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, bag_id) references public.coffee_bags (user_id, id) on delete cascade
);

-- ── Recetas: versiones (seed propias del usuario, motor y ajustes) ───────────
create table public.recipe_versions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  recipe_id text not null,
  number integer not null check (number > 0),
  parent_version_id text,
  status text not null check (status in ('active', 'locked', 'reverted')),
  method text not null check (method in ('v60', 'aeropress', 'espresso')),
  objective text,
  coffee_id text,
  source text not null check (source in ('seed', 'engine', 'user')),
  seed_version text,
  name text not null,
  params jsonb not null,
  traceability jsonb not null,
  engine_version text,
  adjust_meta jsonb,
  locked_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, coffee_id) references public.coffees (user_id, id) on delete cascade
);
create index recipe_versions_recipe_idx on public.recipe_versions (user_id, recipe_id, number);

-- ── Brews (se crean una vez; la evaluación los actualiza) ────────────────────
create table public.brew_sessions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  version_id text not null,
  method text not null check (method in ('v60', 'aeropress', 'espresso')),
  coffee_id text,
  bag_id text,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  grams_used numeric not null check (grams_used >= 0),
  duration_s integer not null check (duration_s >= 0),
  outcome text not null check (outcome in ('completed', 'abandoned')),
  rating smallint check (rating between 1 and 5),
  symptoms text[] not null default '{}',
  notes text check (length(notes) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, version_id) references public.recipe_versions (user_id, id),
  foreign key (user_id, coffee_id) references public.coffees (user_id, id) on delete set null (coffee_id),
  foreign key (user_id, bag_id) references public.coffee_bags (user_id, id) on delete set null (bag_id)
);
create index brew_sessions_finished_idx on public.brew_sessions (user_id, finished_at desc);
create index brew_sessions_bag_idx on public.brew_sessions (user_id, bag_id);

-- ── LWW en tablas editables ──────────────────────────────────────────────────
create trigger keep_newest before update on public.profiles for each row execute function public.keep_newest();
create trigger keep_newest before update on public.coffees for each row execute function public.keep_newest();
create trigger keep_newest before update on public.coffee_bags for each row execute function public.keep_newest();
create trigger keep_newest before update on public.stock_adjustments for each row execute function public.keep_newest();
create trigger keep_newest before update on public.recipe_versions for each row execute function public.keep_newest();
create trigger keep_newest before update on public.brew_sessions for each row execute function public.keep_newest();

-- ── RLS: dueño en todo, forzada ──────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles', 'coffees', 'coffee_bags', 'stock_adjustments', 'recipe_versions', 'brew_sessions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format(
      'create policy owner_all on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

-- ── Stock derivado (tech §3): inicial − Σ brews + Σ ajustes; respeta RLS ─────
create view public.bag_stock
with (security_invoker = true)
as
select
  b.user_id,
  b.id as bag_id,
  b.coffee_id,
  b.initial_g
    - coalesce((select sum(s.grams_used) from public.brew_sessions s
                where s.user_id = b.user_id and s.bag_id = b.id and s.outcome = 'completed'), 0)
    + coalesce((select sum(a.delta_g) from public.stock_adjustments a
                where a.user_id = b.user_id and a.bag_id = b.id), 0) as current_g
from public.coffee_bags b;

revoke all on public.bag_stock from anon;
grant select on public.bag_stock to authenticated;
