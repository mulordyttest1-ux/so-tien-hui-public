// Xe co (giai doan 2): chi phi + bao duong theo xe.
// Moi nguoi chi thay du lieu cua minh (RLS).
import { supabase } from './supabaseClient';

export const EXPENSE_CATEGORIES = [
  'Tiền lời ngân hàng',
  'Tiền gốc ngân hàng',
  'Bảo dưỡng',
  'Bảo hiểm',
  'Chăm sóc xe',
  'Khác',
];

export async function fetchVehicleExpenses(vehicleId) {
  const { data, error } = await supabase.from('vehicle_expenses')
    .select('*').eq('vehicle_id', vehicleId)
    .order('date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addVehicleExpense(userId, e) {
  const { data, error } = await supabase.from('vehicle_expenses').insert({
    user_id: userId,
    vehicle_id: e.vehicle_id,
    date: e.date,
    category: e.category,
    amount: Number(e.amount),
    odometer: e.odometer ? Number(e.odometer) : null,
    note: (e.note || '').trim() || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateVehicleExpense(id, e) {
  const { data, error } = await supabase.from('vehicle_expenses').update({
    date: e.date,
    category: e.category,
    amount: Number(e.amount),
    odometer: e.odometer ? Number(e.odometer) : null,
    note: (e.note || '').trim() || null,
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVehicleExpense(id) {
  const { error } = await supabase.from('vehicle_expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchVehicleServices(vehicleId) {
  const { data, error } = await supabase.from('vehicle_services')
    .select('*').eq('vehicle_id', vehicleId)
    .order('date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addVehicleService(userId, s) {
  const { data, error } = await supabase.from('vehicle_services').insert({
    user_id: userId,
    vehicle_id: s.vehicle_id,
    date: s.date,
    odometer: s.odometer ? Number(s.odometer) : null,
    title: (s.title || '').trim(),
    total: Number(s.total),
    note: (s.note || '').trim() || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateVehicleService(id, s) {
  const { data, error } = await supabase.from('vehicle_services').update({
    date: s.date,
    odometer: s.odometer ? Number(s.odometer) : null,
    title: (s.title || '').trim(),
    total: Number(s.total),
    note: (s.note || '').trim() || null,
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVehicleService(id) {
  const { error } = await supabase.from('vehicle_services').delete().eq('id', id);
  if (error) throw error;
}

export function expenseTotals(expenses) {
  const byCat = {};
  let total = 0;
  for (const e of expenses || []) {
    const amt = Number(e.amount) || 0;
    total += amt;
    byCat[e.category] = (byCat[e.category] || 0) + amt;
  }
  return { total, byCat };
}
