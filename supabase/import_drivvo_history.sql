-- ============================================================
-- Import lich su Drivvo da sua (Mazda CX-3) — chay 1 lan.
-- Buoc 1: thay __USER_ID__ bang uuid cua TAI KHOAN THAT
-- (tai khoan dang dang nhap tren production, KHONG phai demo
-- voyeu@yeuvo.yeu). Buoc 2: chay toan bo file trong SQL Editor.
-- Neu xe Mazda CX-3 da ton tai thi lenh se dung lai (khong nhan doi).
-- Du kien: 1 xe, 94 lan do xang, 40 chi phi, 1 bao duong,
-- 1 khoan dinh ky (Tien loi ngan hang) + 27 ky da dong.
-- ============================================================

do $$
begin
  if exists (select 1 from public.vehicles where user_id = '__USER_ID__' and name = 'Mazda CX-3') then
    raise exception 'Mazda CX-3 da ton tai cho user nay — dung lai de tranh nhan doi';
  end if;
end $$;

insert into public.vehicles (id, user_id, name, kind, make_model, plate, year, fuel_type, current_odometer)
values ('1849253b-a844-4681-839a-e7bf2787f987', '__USER_ID__', 'Mazda CX-3', 'o_to', 'Mazda CX-3', NULL, NULL, 'xang', 34795);

insert into public.vehicle_fuel_logs (user_id, vehicle_id, date, odometer, litres, price_per_litre, total, station, note) values
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-08-28', 1, 23, 21317, 500000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-09-01', 161, 37, 21520, 800000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-09-08', 500, 28, 21520, 600000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-09-13', 750, 36, 19722, 710000, 'PV Oil', 'Gia ghi trong Drivvo: 20.000d (du doan); gia sua: 19.722d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-09-21', 1102, 40, 20150, 800000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-01', 1414, 37, 20150, 754000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-08', 1861, 40, 20150, 800000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-15', 2300, 35, 20150, 700000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-20', 2617, 14, 21900, 300000, 'PV Oil', 'Nghi trùng lặp: chỉ chạy 9 km so với lần trước mà đổ 14 lít'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-21', 2626, 14, 21900, 300000, 'PV Oil', 'Nghi trùng lặp: chỉ chạy 9 km so với lần trước mà đổ 14 lít'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-28', 2908, 24, 20890, 500000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-11-02', 3105, 24, 20890, 500000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-11-06', 3360, 33, 20910, 700000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-11-14', 3681, 28, 21260, 600000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-11-20', 4000, 24, 21010, 500000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-11-26', 4262, 24, 21010, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-12-07', 4523, 24, 21010, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-12-15', 4759, 24, 21010, 500000, 'Đình Sơn', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-12-21', 5010, 23, 21420, 500000, 'Đình Sơn', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-12-27', 5254, 23, 21420, 500000, 'Đình Sơn', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-01-01', 5495, 23, 21420, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-01-07', 5741, 23, 21420, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-01-14', 6009, 23, 21420, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-01-20', 6265, 23, 21420, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-01-25', 6515, 23, 21420, 500000, 'Đình Sơn', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-01-29', 6666, 24, 21420, 520000, 'Đình Sơn', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-02-06', 6950, 23, 21330, 500000, 'Đình Sơn', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-02-12', 7200, 23, 21330, 500000, 'Đình Sơn', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-02-19', 7470, 23, 21330, 500000, 'A Duy', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-02-24', 7697, 23, 21750, 500000, 'A Duy', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-02', 7944, 23, 21530, 500000, 'A Duy', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-09', 8166, 25, 20080, 500000, 'A Duy', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-13', 8400, 15, 20080, 300000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-18', 8593, 25, 20080, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-25', 8845, 25, 20080, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-04-02', 9153, 25, 20080, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-04-06', 9394, 23, 21320, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-04-12', 9634, 26, 19580, 500000, 'PV Oil', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-04-21', 9899, 26, 19580, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-04-22', 10216, 34, 19220, 660000, 'A Duy', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-04-30', 10565, 26, 19220, 500000, 'A Duy', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-05-06', 10843, 26, 19220, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-05-11', 11111, 26, 19220, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-05-18', 11808, 25, 19980, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-05-25', 12106, 25, 19920, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-05', 12419, 30, 19920, 600000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-11', 12793, 8, 19920, 150000, 'Moc Mien', 'Nghi sai: 8 lít rồi 5 ngày sau 58 lít (vượt bình 48 lít)'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-16', 12898, 58, 19920, 1150000, 'Moc Mien', 'Nghi sai: 58 lít vượt bình 48 lít; có thể gộp nhiều lần đổ'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-22', 13544, 25, 19920, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-25', 13880, 25, 19920, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-07-04', 14216, 25, 19920, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-07-08', 14559, 25, 19920, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-07-28', 14911, 25, 19920, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-08-04', 15226, 30, 20020, 600000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-08-12', 15599, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-08-16', 15915, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-08-22', 16221, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-08-29', 16581, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-09-04', 16911, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-09-15', 17200, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-09-22', 17524, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-09-27', 18000, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-10-03', 18336, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-10-09', 18682, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-10-15', 19205, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-10-21', 19571, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-12-05', 19943, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-01-15', 20317, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-01-29', 20695, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-02-13', 21083, 25, 20020, 500000, 'Moc Mien', ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-02-28', 21478, 19, 26316, 500000, 'Moc Mien', 'Chị xác nhận 11/11/2026: bản ghi này nhập sai (giá suy ra vượt giá tối đa chính thức ngày nhập) — giữ nguyên tổng tiền/số lít, chờ sửa trong app. Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-16', 21856, 37, 27027, 1000000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 27.027d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-19', 22422, 17, 29412, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 30.000d (du doan); gia sua: 29.412d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-21', 22703, 17, 29412, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 30.000d (du doan); gia sua: 29.412d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-25', 22976, 19, 26316, 500000, 'Moc Mien', 'Trùng ngày với lần đổ 23.280 km — kiểm tra lại ngày Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-25', 23280, 19, 26316, 500000, 'Moc Mien', 'Trùng ngày với lần đổ 22.976 km — kiểm tra lại ngày Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-29', 23588, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-04', 23900, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-09', 24216, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-12', 24536, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-15', 24848, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-19', 25188, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-25', 25499, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-29', 25820, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 27.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-05-03', 26145, 19, 26316, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 26.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-05-07', 26471, 19, 26316, 500000, 'Moc Mien', 'Chị xác nhận 11/11/2026: bản ghi này nhập sai (giá suy ra vượt giá tối đa chính thức ngày nhập) — giữ nguyên tổng tiền/số lít, chờ sửa trong app. Gia ghi trong Drivvo: 26.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-05-11', 26798, 19, 26316, 500000, 'Moc Mien', 'Chị xác nhận 11/11/2026: bản ghi này nhập sai (giá suy ra vượt giá tối đa chính thức ngày nhập) — giữ nguyên tổng tiền/số lít, chờ sửa trong app. Gia ghi trong Drivvo: 26.000d (du doan); gia sua: 26.316d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-05-15', 27125, 21, 23810, 500000, 'Moc Mien', 'Gia ghi trong Drivvo: 24.000d (du doan); gia sua: 23.810d (tong tien / so lit).'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-06-30', 29115, 159, 24032, 3821088, 'Moc Mien', 'ƯỚC TÍNH 2026-05-16–2026-06-30: gia 24.032đ/L = gia trung binh E10 RON95-V Vung 2 (Dak Lak, Vung 1 x 1,02) trong ky; 21/46 ngay dung gia V that (diem gia V trong vong 7 ngay), con lai suy tu E10-III + chenh V-III ~900d vi day V thua. So lit uoc tu so km. Gia that tai cay Moc Mien thuong thap hon gia toi da vai tram dong. ƯỚC TÍNH 16/05-30/06/2026 (~1.990 km theo mức chạy bình quân 43 km/ngày) UOC TINH — chua co ban ghi that.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-07-31', 30415, 104, 22051, 2293304, 'Moc Mien', 'ƯỚC TÍNH 2026-07-01–2026-07-31: gia 22.051đ/L = gia trung binh E10 RON95-V Vung 2 (Dak Lak, Vung 1 x 1,02) trong ky; 0/31 ngay dung gia V that (diem gia V trong vong 7 ngay), con lai suy tu E10-III + chenh V-III ~900d vi day V thua. So lit uoc tu so km. Gia that tai cay Moc Mien thuong thap hon gia toi da vai tram dong. ƯỚC TÍNH tháng 07/2026 (~1.300 km) UOC TINH — chua co ban ghi that.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-08-31', 31715, 104, 23848, 2480192, 'Moc Mien', 'ƯỚC TÍNH 2026-08-01–2026-08-31: gia 23.848đ/L = gia trung binh E10 RON95-V Vung 2 (Dak Lak, Vung 1 x 1,02) trong ky; 0/31 ngay dung gia V that (diem gia V trong vong 7 ngay), con lai suy tu E10-III + chenh V-III ~900d vi day V thua. So lit uoc tu so km. Gia that tai cay Moc Mien thuong thap hon gia toi da vai tram dong. ƯỚC TÍNH tháng 08/2026 (~1.300 km) UOC TINH — chua co ban ghi that.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-09-30', 33015, 104, 26305, 2735720, 'Moc Mien', 'ƯỚC TÍNH 2026-09-01–2026-09-30: gia 26.305đ/L = gia trung binh E10 RON95-V Vung 2 (Dak Lak, Vung 1 x 1,02) trong ky; 0/30 ngay dung gia V that (diem gia V trong vong 7 ngay), con lai suy tu E10-III + chenh V-III ~900d vi day V thua. So lit uoc tu so km. Gia that tai cay Moc Mien thuong thap hon gia toi da vai tram dong. ƯỚC TÍNH tháng 09/2026 (~1.300 km) UOC TINH — chua co ban ghi that.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-10-31', 34315, 104, 27980, 2909920, 'Moc Mien', 'ƯỚC TÍNH 2026-10-01–2026-10-31: gia 27.980đ/L = gia trung binh E10 RON95-V Vung 2 (Dak Lak, Vung 1 x 1,02) trong ky; 10/31 ngay dung gia V that (diem gia V trong vong 7 ngay), con lai suy tu E10-III + chenh V-III ~650d vi day V thua. So lit uoc tu so km. Gia that tai cay Moc Mien thuong thap hon gia toi da vai tram dong. ƯỚC TÍNH tháng 10/2026 (~1.300 km) UOC TINH — chua co ban ghi that.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-11-11', 34795, 38, 23823, 905274, 'Moc Mien', 'ƯỚC TÍNH 2026-11-01–2026-11-11: gia 23.823đ/L = gia trung binh E10 RON95-V Vung 2 (Dak Lak, Vung 1 x 1,02) trong ky; 11/11 ngay dung gia V that (diem gia V trong vong 7 ngay), con lai suy tu E10-III + chenh V-III ~1100d vi day V thua. So lit uoc tu so km. Gia that tai cay Moc Mien thuong thap hon gia toi da vai tram dong. ƯỚC TÍNH 01-11/11/2026 (~480 km) UOC TINH — chua co ban ghi that.');

insert into public.vehicle_expenses (user_id, vehicle_id, date, category, amount, odometer, note) values
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-09-30', 'Tiền lời ngân hàng', 2315000, 1200, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-30', 'Tiền lời ngân hàng', 2215000, 3000, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-11-21', 'Chăm sóc xe', 20355000, NULL, 'Màn gotech + áp suất lốp 12700000; 2 lần dán decal 3200000; 2 lần lót sàn 3400000; 300000; 300000; 255000; 200000'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-11-30', 'Tiền lời ngân hàng', 2215000, 4300, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-12-30', 'Tiền lời ngân hàng', 2215000, 5400, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-01-08', 'Tiền lời ngân hàng', 2215000, 5800, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-02-12', 'Tiền lời ngân hàng', 2141000, 6950, 'Tháng 1 2025'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-01', 'Bảo dưỡng', 1474956, 7883, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-02', 'Tiền gốc ngân hàng', 30000000, 8000, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-03-02', 'Tiền lời ngân hàng', 2100000, 8000, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-04-06', 'Tiền lời ngân hàng', 2126000, 9395, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-05-06', 'Tiền lời ngân hàng', 2215000, 10844, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-06', 'Tiền gốc ngân hàng', 4000000, 12420, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-09', 'Bảo dưỡng', 2053015, 12500, 'Tiền mặt'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-06-15', 'Tiền lời ngân hàng', 2137500, NULL, 'ƯỚC TÍNH — tháng 06/2025 chị không ghi; nội suy từ tháng 05 (2.215.000) và tháng 07 (2.060.000). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-07-04', 'Tiền lời ngân hàng', 2060000, 14217, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-08-07', 'Tiền lời ngân hàng', 2215000, 15300, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-08-07', 'Tiền gốc ngân hàng', 5000000, NULL, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-09-13', 'Tiền lời ngân hàng', 2091000, 16912, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-09-13', 'Bảo hiểm', 6580000, NULL, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-09-27', 'Bảo dưỡng', 2058506, 17777, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-10-15', 'Tiền lời ngân hàng', 2070500, NULL, 'ƯỚC TÍNH — tháng 10/2025 chị không ghi; nội suy từ tháng 09 (2.091.000) và tháng 11 (2.050.000). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-11-09', 'Tiền lời ngân hàng', 2050000, 19575, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-11-09', 'Tiền gốc ngân hàng', 5000000, 19580, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-12-05', 'Tiền lời ngân hàng', 1900000, 19999, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2025-12-15', 'Bảo dưỡng', 2000000, NULL, 'ƯỚC TÍNH — tháng 12/2025 chị không ghi; theo nhịp bảo dưỡng mỗi quý ~2.000.000đ (03, 06, 09/2025). Chưa đối chiếu. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-01-10', 'Tiền lời ngân hàng', 2026000, 20000, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-02-15', 'Tiền lời ngân hàng', 1900000, 21084, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-08', 'Tiền lời ngân hàng', 1762000, 21480, ''),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-03-15', 'Bảo dưỡng', 2000000, NULL, 'ƯỚC TÍNH — tháng 03/2026 chị không ghi; theo nhịp bảo dưỡng mỗi quý ~2.000.000đ (03, 06, 09/2025). Chưa đối chiếu. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-04-15', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 04/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-05-15', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 05/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-06-15', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 06/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-06-15', 'Bảo dưỡng', 2000000, NULL, 'ƯỚC TÍNH — tháng 06/2026 chị không ghi; theo nhịp bảo dưỡng mỗi quý ~2.000.000đ (03, 06, 09/2025). Chưa đối chiếu. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-07-15', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 07/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-08-15', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 08/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-09-15', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 09/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-09-15', 'Bảo dưỡng', 2000000, NULL, 'ƯỚC TÍNH — tháng 09/2026 chị không ghi; theo nhịp bảo dưỡng mỗi quý ~2.000.000đ (03, 06, 09/2025). Chưa đối chiếu. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-10-15', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 10/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.'),
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2026-11-09', 'Tiền lời ngân hàng', 1762000, NULL, 'ƯỚC TÍNH — tháng 11/2026 chị không ghi; thêm theo giá lần cuối 1.762.000đ (tháng 03/2026). Chưa đối chiếu sao kê. UOC TINH — chua doi chieu sao ke.');

insert into public.vehicle_services (user_id, vehicle_id, date, odometer, title, total, note) values
('__USER_ID__', '1849253b-a844-4681-839a-e7bf2787f987', '2024-10-01', 1500, 'Thay dau + ve sinh buong dot', 1183946, 'Nhan cong 125000; Dung dich lam sach buong dot 275000; Long den oc xa nhot 12600; Nuoc rua kinh 27346; Thay dau 744000. Ghi chu goc: Tong phai tra 1143681, khong tinh tien cong (khong khop tong 1183946).');

insert into public.recurring_items (id, user_id, name, kind, amount, due_day, next_due_date, total_terms, paid_terms, total_amount, remaining_amount, maturity_date, maturity_amount, note, status)
values ('7f8332db-a493-40e3-9c39-08d598c4e23c', '__USER_ID__', 'Tiền lời ngân hàng', 'interest_only', 1762000, 8, '2026-12-08', NULL, 27, NULL, NULL, NULL, NULL, 'Góp xe Mazda CX-3 — tiền lời hàng tháng, nhảy theo lãi suất; đã trả tới 11/2026 (trong đó 10 tháng ước tính). Gốc còn lại chưa biết — xem sao kê ngân hàng.', 'active');

insert into public.recurring_payments (user_id, recurring_item_id, transaction_id, amount, paid_date, kind, note) values
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2315000, '2024-09-30', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2215000, '2024-10-30', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2215000, '2024-11-30', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2215000, '2024-12-30', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2215000, '2025-01-08', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2141000, '2025-02-12', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2100000, '2025-03-02', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2126000, '2025-04-06', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2215000, '2025-05-06', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2137500, '2025-06-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2060000, '2025-07-04', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2215000, '2025-08-07', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2091000, '2025-09-13', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2070500, '2025-10-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2050000, '2025-11-09', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1900000, '2025-12-05', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 2026000, '2026-01-10', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1900000, '2026-02-15', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-03-08', 'interest', 'Lịch sử Drivvo.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-04-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-05-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-06-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-07-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-08-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-09-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-10-15', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.'),
('__USER_ID__', '7f8332db-a493-40e3-9c39-08d598c4e23c', NULL, 1762000, '2026-11-09', 'interest', 'Lịch sử Drivvo — ƯỚC TÍNH, chưa đối chiếu sao kê.');

-- Kiem tra sau khi chay:
-- select count(*) from public.vehicles where user_id = '__USER_ID__'; -- 1
-- select count(*) from public.vehicle_fuel_logs where user_id = '__USER_ID__'; -- 94
-- select count(*) from public.vehicle_expenses where user_id = '__USER_ID__'; -- 40
-- select count(*) from public.vehicle_services where user_id = '__USER_ID__'; -- 1
-- select count(*) from public.recurring_payments where user_id = '__USER_ID__' and recurring_item_id = '7f8332db-a493-40e3-9c39-08d598c4e23c'; -- 27
