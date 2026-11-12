// Xe co (giai doan 2): chi phi + bao duong theo xe.
// Moi nguoi chi thay du lieu cua minh (RLS).
// Nguyen tac tap con: moi khoan xe dong thoi la 1 khoan chi trong
// so tien (tap me) de tong thu chi thang gom het.
import { supabase } from './supabaseClient';
import { createLedgerTx } from './data';

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

export async function addVehicleExpense(userId, e, opts = {}) {
  // skipTx: dong xe nay da co giao dich so tien roi (VD dong o Dinh ky)
  // thi chi ghi dong xe, khong tao them giao dich.
  let txId = null;
  if (!opts.skipTx) {
    const tx = await createLedgerTx(userId, {
      vehicleId: e.vehicle_id, date: e.date, amount: Number(e.amount),
      note: `${e.category} — ${e.vehicle_name || 'xe'}`,
    });
    txId = tx.id;
  }
  const { data, error } = await supabase.from('vehicle_expenses').insert({
    user_id: userId,
    vehicle_id: e.vehicle_id,
    date: e.date,
    category: e.category,
    amount: Number(e.amount),
    odometer: e.odometer ? Number(e.odometer) : null,
    note: (e.note || '').trim() || null,
    transaction_id: txId,
  }).select().single();
  if (error) {
    if (txId) await supabase.from('transactions').delete().eq('id', txId);
    throw error;
  }
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
  // Chi dong bo khi dong nay da co giao dich so tien; du lieu cu giu nguyen.
  if (data.transaction_id) {
    const { error: txErr } = await supabase.from('transactions').update({
      amount: Math.round(Number(e.amount)), date: e.date,
      note: `${e.category} — ${e.vehicle_name || 'xe'}`,
    }).eq('id', data.transaction_id);
    if (txErr) throw txErr;
  }
  return data;
}

export async function deleteVehicleExpense(id) {
  // Xoa luon giao dich so tien lien ket (neu co) de tong thang khong lech.
  const { data: row } = await supabase.from('vehicle_expenses')
    .select('transaction_id').eq('id', id).single();
  if (row && row.transaction_id) {
    const { error: txErr } = await supabase.from('transactions').delete().eq('id', row.transaction_id);
    if (txErr) throw txErr;
  }
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

export async function addVehicleService(userId, s, opts = {}) {
  let txId = null;
  if (!opts.skipTx) {
    const tx = await createLedgerTx(userId, {
      vehicleId: s.vehicle_id, date: s.date, amount: Number(s.total),
      note: `${(s.title || '').trim()} — ${s.vehicle_name || 'xe'}`,
    });
    txId = tx.id;
  }
  const { data, error } = await supabase.from('vehicle_services').insert({
    user_id: userId,
    vehicle_id: s.vehicle_id,
    date: s.date,
    odometer: s.odometer ? Number(s.odometer) : null,
    title: (s.title || '').trim(),
    total: Number(s.total),
    note: (s.note || '').trim() || null,
    transaction_id: txId,
  }).select().single();
  if (error) {
    if (txId) await supabase.from('transactions').delete().eq('id', txId);
    throw error;
  }
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
  // Chi dong bo khi dong nay da co giao dich so tien; du lieu cu giu nguyen.
  if (data.transaction_id) {
    const { error: txErr } = await supabase.from('transactions').update({
      amount: Math.round(Number(s.total)), date: s.date,
      note: `${(s.title || '').trim()} — ${s.vehicle_name || 'xe'}`,
    }).eq('id', data.transaction_id);
    if (txErr) throw txErr;
  }
  return data;
}

export async function deleteVehicleService(id) {
  // Xoa luon giao dich so tien lien ket (neu co) de tong thang khong lech.
  const { data: row } = await supabase.from('vehicle_services')
    .select('transaction_id').eq('id', id).single();
  if (row && row.transaction_id) {
    const { error: txErr } = await supabase.from('transactions').delete().eq('id', row.transaction_id);
    if (txErr) throw txErr;
  }
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
