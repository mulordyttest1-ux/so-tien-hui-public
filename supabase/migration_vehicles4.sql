-- Noi Xe co voi So tien (nguyen tac tap con, 2026-11-12):
-- Thu Chi la tap me (thuc te); Xe chi la filter. Moi khoan xe nhap sau
-- nay dong thoi la 1 giao dich trong transactions (co vehicle_id) de
-- tong thu chi thang gom het; trang Xe loc theo vehicle_id de xem.
-- Du lieu cu KHONG backfill: cac dong xe cu co transaction_id NULL
-- va khong tao giao dich so tien (giu nguyen lich su nhu da duyet).

alter table public.transactions
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

alter table public.vehicle_fuel_logs
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

alter table public.vehicle_expenses
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

alter table public.vehicle_services
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

-- Khoan dinh ky nao gan voi xe (VD: Tien loi ngan hang cua Mazda CX-3):
-- bam "Da dong" o Dinh ky se ghi them vao lich su chi phi xe.
alter table public.recurring_items
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

create index if not exists idx_tx_vehicle on public.transactions(user_id, vehicle_id);
