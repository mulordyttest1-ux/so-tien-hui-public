-- ============================================================
-- Migration: khoan dinh ky (vay gop, lai vay, hoa don dinh ky)
-- Chay 1 lan trong Supabase Dashboard > SQL Editor.
--
-- Moi khoan dinh ky co lich dong rieng: bam "Da dong" la ghi
-- khoan chi vao so + ghi log ky + tu doi ngay den han sang thang
-- sau. Khong can biet ben cho vay la ai — chi can so lieu de ghi log.
-- ============================================================

create table if not exists public.recurring_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  kind             text not null default 'bill'
                     check (kind in ('installment', 'interest_only', 'bill')),
  amount           numeric(15,0) not null check (amount > 0),
  due_day          int check (due_day between 1 and 31),
  next_due_date    date,
  total_terms      int,
  paid_terms       int not null default 0,
  total_amount     numeric(15,0),
  remaining_amount numeric(15,0),
  maturity_date    date,
  maturity_amount  numeric(15,0),
  note             text default '',
  status           text not null default 'active' check (status in ('active', 'done')),
  created_at       timestamptz not null default now()
);

-- Lich su tung lan dong (log day du, khong bia lich su cu).
create table if not exists public.recurring_payments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  recurring_item_id uuid not null references public.recurring_items(id) on delete cascade,
  transaction_id    uuid references public.transactions(id) on delete set null,
  amount            numeric(15,0) not null check (amount > 0),
  paid_date         date not null,
  kind              text not null default 'payment'
                      check (kind in ('payment', 'interest', 'principal')),
  note              text default '',
  created_at        timestamptz not null default now()
);

alter table public.recurring_items    enable row level security;
alter table public.recurring_payments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['recurring_items', 'recurring_payments']
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t);
  end loop;
end $$;
