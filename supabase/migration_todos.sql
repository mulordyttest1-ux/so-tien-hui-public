-- Viec can lam: danh sach ghi nhanh cua rieng tung nguoi, khong lien
-- quan toi so tien / hui / ngan hang. Chi 3 thao tac: them, gach xong, xoa.
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.todos enable row level security;
drop policy if exists "own todos" on public.todos;
create policy "own todos" on public.todos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
