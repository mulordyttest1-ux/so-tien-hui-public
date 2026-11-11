-- ============================================================
-- Migration giai doan 2 xe co: chi phi + bao duong theo xe.
-- Chay 1 lan trong Supabase Dashboard > SQL Editor.
-- Moi nguoi chi thay du lieu cua minh (RLS own-rows).
-- ============================================================

create table if not exists public.vehicle_expenses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date       date not null,
  category   text not null,
  amount     numeric(15,0) not null check (amount > 0),
  odometer   int,
  note       text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_services (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date       date not null,
  odometer   int,
  title      text not null,
  total      numeric(15,0) not null check (total >= 0),
  note       text default '',
  created_at timestamptz not null default now()
);

alter table public.vehicle_expenses enable row level security;
alter table public.vehicle_services enable row level security;

do $$
declare t text;
begin
  foreach t in array array['vehicle_expenses', 'vehicle_services']
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t);
  end loop;
end $$;
