-- Agentic Labs Tracker — Phase 5 schema
-- External Supabase project: paste this into the SQL editor and run.
-- Multi-tenant isolation via user_id + RLS on every table.

-- ============================================================
-- Profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  restaurant_name text,
  avatar_url text,
  features_enabled jsonb not null default '{}'::jsonb,
  has_seeded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill for existing projects
alter table public.profiles add column if not exists has_seeded boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Categories
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tag text,
  created_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);

alter table public.categories enable row level security;
drop policy if exists "categories owner all" on public.categories;
create policy "categories owner all" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Ingredients (with is_global)
-- ============================================================
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  unit_cost numeric(10,4) not null default 0,
  unit text not null default 'unit',
  is_global boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ingredients_user_idx on public.ingredients(user_id);

alter table public.ingredients enable row level security;

drop policy if exists "ingredients owner all" on public.ingredients;
create policy "ingredients owner all" on public.ingredients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ingredients read globals" on public.ingredients;
create policy "ingredients read globals" on public.ingredients
  for select using (is_global = true);

-- ============================================================
-- Menu categories
-- ============================================================
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists menu_categories_user_idx on public.menu_categories(user_id);

alter table public.menu_categories enable row level security;
drop policy if exists "menu_categories owner all" on public.menu_categories;
create policy "menu_categories owner all" on public.menu_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Menu items
-- ============================================================
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  menu_category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  pos_price numeric(10,2) not null default 0,
  delivery_price numeric(10,2) not null default 0,
  recipe jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists menu_items_user_idx on public.menu_items(user_id);

alter table public.menu_items enable row level security;
drop policy if exists "menu_items owner all" on public.menu_items;
create policy "menu_items owner all" on public.menu_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Recommendations
-- ============================================================
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent text not null default 'Sprocket',
  severity text not null check (severity in ('info','warning','critical')),
  title text not null,
  body text not null,
  suggested_action text not null,
  status text not null default 'pending' check (status in ('pending','approved','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists recommendations_user_idx on public.recommendations(user_id);

alter table public.recommendations enable row level security;
drop policy if exists "recommendations owner all" on public.recommendations;
create policy "recommendations owner all" on public.recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Settings (per-user singleton)
-- ============================================================
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  commission_rate numeric(5,4) not null default 0.25,
  target_margin numeric(5,2) not null default 65,
  critical_threshold numeric(5,2) not null default 20,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;
drop policy if exists "settings owner all" on public.settings;
create policy "settings owner all" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
