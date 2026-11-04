-- ============================================================
-- Migration 2: phan loai doi tac + chuyen nhanh (giai doan 1.5)
-- Chay 1 lan trong Supabase Dashboard > SQL Editor, SAU migration_bank.sql.
-- - persons them cot kind: nguoi | cong_ty | shop | khac.
--   "Nguoi" o day la chieu quan ly cua nguoi dung (ai nhan tien / tien cho ai),
--   khac voi holder_name tren bank_accounts (ten phap ly theo ngan hang).
-- - Khong doi bang payments/transactions: lenh chuyen nhanh dung chung luong
--   createPayment (transaction pending toi thieu + payment pending).
-- ============================================================

alter table public.persons
  add column if not exists kind text not null default 'nguoi'
    check (kind in ('nguoi', 'cong_ty', 'shop', 'khac'));
