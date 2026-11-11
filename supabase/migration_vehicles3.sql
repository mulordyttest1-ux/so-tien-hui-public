-- Xe co: cho phep bo trong so km khi do xang (chi co the khong nhap km).
-- Truoc day odometer NOT NULL nen form bat buoc nhap; gio chi nhap khi nho.
alter table public.vehicle_fuel_logs alter column odometer drop not null;
