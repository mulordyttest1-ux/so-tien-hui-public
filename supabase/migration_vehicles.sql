-- Xe co (giai doan 1): xe + nhat ky do xang. Multi-vehicle ngay tu dau,
-- dung ca nhan (o to, xe may), khong phai doi xe / doanh nghiep.
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'xe_may',
  make_model text,
  plate text,
  year int,
  fuel_type text not null default 'xang',
  current_odometer numeric,
  created_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;
drop policy if exists "own vehicles" on public.vehicles;
create policy "own vehicles" on public.vehicles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.vehicle_fuel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date date not null,
  odometer numeric not null,
  litres numeric not null,
  price_per_litre numeric not null,
  total numeric not null,
  station text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.vehicle_fuel_logs enable row level security;
drop policy if exists "own vehicle fuel logs" on public.vehicle_fuel_logs;
create policy "own vehicle fuel logs" on public.vehicle_fuel_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
