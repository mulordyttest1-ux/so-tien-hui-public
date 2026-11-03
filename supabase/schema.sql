-- ============================================================
-- Sổ Tiền & Hụi — Schema cho Supabase (Postgres)
-- Cách dùng: Supabase Dashboard > SQL Editor > dán toàn bộ file này > Run.
-- Mỗi người dùng (auth.users) có 1 sổ RIÊNG. Row Level Security (RLS)
-- bảo đảm người dùng chỉ đọc/ghi được dòng có user_id = chính họ.
-- ============================================================

-- ---------- Bảng thẻ gắn tự do: Người / Hạng mục / Nguồn tiền ----------
create table if not exists public.persons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.sources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- Bảng trung tâm: Giao dịch ----------
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null check (type in ('thu', 'chi')),
  amount       numeric(15,0) not null check (amount > 0),
  date         date not null default current_date,
  person_id    uuid references public.persons(id) on delete set null,
  category_id  uuid references public.categories(id) on delete set null,
  source_id    uuid references public.sources(id) on delete set null,
  hui_group_id uuid,
  hui_round_id uuid,
  note         text default '',
  created_at   timestamptz not null default now()
);

-- ---------- Hụi: dây hụi ----------
create table if not exists public.hui_groups (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  amount_per_period  numeric(15,0) not null check (amount_per_period > 0), -- tiền 1 chân / 1 kỳ
  total_shares       int not null check (total_shares > 0),                -- tổng số chân của dây
  my_shares          int not null default 1 check (my_shares > 0),         -- số chân của mình
  total_periods      int not null check (total_periods > 0),               -- tổng số kỳ
  fee                numeric(15,0) not null default 0,                     -- tiền thầu mỗi lần hốt
  start_date         date,
  note               text default '',
  created_at         timestamptz not null default now()
);

-- ---------- Hụi: từng kỳ ----------
create table if not exists public.hui_rounds (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  group_id        uuid not null references public.hui_groups(id) on delete cascade,
  period_no       int not null check (period_no > 0),
  date            date not null default current_date,
  winner_name     text default '',              -- tên người hốt kỳ này (văn bản tự do)
  my_contribution numeric(15,0) not null default 0,  -- mình đóng kỳ này
  my_withdrawal   numeric(15,0) not null default 0,  -- mình hốt kỳ này (0 = chưa hốt)
  note            text default '',
  created_at      timestamptz not null default now(),
  unique (group_id, period_no)
);

-- Khóa ngoại từ transactions sang hụi (khai báo sau khi 2 bảng hụi đã tồn tại)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_hui_group_fk') then
    alter table public.transactions
      add constraint transactions_hui_group_fk
      foreign key (hui_group_id) references public.hui_groups(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_hui_round_fk') then
    alter table public.transactions
      add constraint transactions_hui_round_fk
      foreign key (hui_round_id) references public.hui_rounds(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_tx_user_date    on public.transactions(user_id, date desc);
create index if not exists idx_tx_user_person  on public.transactions(user_id, person_id);
create index if not exists idx_rounds_group    on public.hui_rounds(group_id, period_no);

-- ============================================================
-- ROW LEVEL SECURITY — mỗi người chỉ thấy dữ liệu của chính mình
-- ============================================================
alter table public.persons      enable row level security;
alter table public.categories   enable row level security;
alter table public.sources      enable row level security;
alter table public.transactions enable row level security;
alter table public.hui_groups   enable row level security;
alter table public.hui_rounds   enable row level security;

-- Tạo policy "chỉ của mình" cho từng bảng (xóa policy cũ cùng tên nếu chạy lại)
do $$
declare t text;
begin
  foreach t in array array['persons','categories','sources','transactions','hui_groups','hui_rounds']
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t);
  end loop;
end $$;
