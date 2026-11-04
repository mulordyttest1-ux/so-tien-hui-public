-- ============================================================
-- Migration: tinh nang Ngan hang / Chuyen khoan (giai doan 1)
-- Chay 1 lan trong Supabase Dashboard > SQL Editor (du an da co schema cu).
-- Tuan thu ket luan kiem toan:
--  - Trang thai: pending -> confirmed | pending -> voided. Khong xoa ban ghi.
--  - Mot ky hui chi co toi da 1 lenh pending (partial unique index).
--  - payment_events chi duoc insert/select (audit append-only).
-- ============================================================

-- ---------- Tai khoan ngan hang da luu (gan theo nguoi) ----------
create table if not exists public.bank_accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  person_id      uuid references public.persons(id) on delete set null,
  bank_code      text not null,
  bank_bin       text not null,
  bank_name      text not null,
  account_number text not null,
  holder_name    text not null default '',
  note           text default '',
  is_default     boolean not null default false,
  last_used_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (user_id, bank_bin, account_number)
);

-- ---------- Lenh chuyen khoan (log) ----------
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  person_id       uuid references public.persons(id) on delete set null,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  transaction_id  uuid references public.transactions(id) on delete set null,
  amount          numeric(15,0) not null check (amount > 0),
  memo            text default '',
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'voided')),
  void_reason     text check (void_reason in ('cancelled', 'abandoned', 'failed', 'duplicate', 'other')),
  launch_method   text default 'qr',
  bank_app        text,
  bank_ref        text default '',
  launched_at     timestamptz,
  confirmed_at    timestamptz,
  voided_at       timestamptz,
  hui_group_id    uuid references public.hui_groups(id) on delete cascade,
  hui_round_id    uuid references public.hui_rounds(id) on delete cascade,
  created_at      timestamptz not null default now()
);

-- Mot ky hui chi co toi da 1 lenh pending.
create unique index if not exists idx_payments_one_pending_per_round
  on public.payments(hui_round_id) where status = 'pending' and hui_round_id is not null;

create index if not exists idx_payments_user_created on public.payments(user_id, created_at desc);
create index if not exists idx_payments_person      on public.payments(user_id, person_id);
create index if not exists idx_payments_hui_group   on public.payments(user_id, hui_group_id);

-- ---------- Audit log (append-only) ----------
create table if not exists public.payment_events (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid not null references public.payments(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  event       text not null,
  from_status text,
  to_status   text,
  note        text default '',
  created_at  timestamptz not null default now()
);

-- ---------- Transactions: them trang thai + lien ket payment ----------
alter table public.transactions
  add column if not exists status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'voided'));

alter table public.transactions
  add column if not exists payment_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_payment_fk') then
    alter table public.transactions
      add constraint transactions_payment_fk
      foreign key (payment_id) references public.payments(id) on delete set null;
  end if;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.bank_accounts  enable row level security;
alter table public.payments       enable row level security;
alter table public.payment_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array['bank_accounts', 'payments']
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- payment_events: chi duoc xem + ghi them, khong sua/xoa.
drop policy if exists "own rows read" on public.payment_events;
drop policy if exists "own rows insert" on public.payment_events;
create policy "own rows read" on public.payment_events for select
  using (auth.uid() = user_id);
create policy "own rows insert" on public.payment_events for insert
  with check (auth.uid() = user_id);
