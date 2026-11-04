// Nghiep vu chuyen khoan - tuan thu ket luan kiem toan:
// - Trang thai chi co: pending -> confirmed | pending -> voided (ly do).
// - Xoa/sua: GIAI DOAN DEBUG mo thoai mai theo yeu cau cua Nancy
//   (2026-11-04): xoa duoc ca lenh da xac nhan, sua duoc ca khoan gan
//   lenh. Xoa lenh da xac nhan se go ca khoan so da chot va (neu co)
//   reset tien dong cua ky hui ve 0, de so khong lech. Khi het debug
//   co the siet lai thanh chi xoa lenh chua chuyen tien.
// - Tien pending TACH RIENG khoi tien da chot trong moi tong so (xem isSettled).
// - Mot ky hui chi co toi da 1 lenh pending (rang buoc DB + kiem tra o day).
// - Tao / xac nhan / huy luon cap nhat dong bo: payment + transaction (+ ky hui
//   neu co) + ghi audit event. Neu buoc sau loi, buoc truoc duoc don dep.

import { supabase } from './supabaseClient';

export const VOID_REASONS = [
  { value: 'cancelled', label: 'Tự hủy, không chuyển nữa' },
  { value: 'abandoned', label: 'Mở app ngân hàng rồi nhưng không chuyển' },
  { value: 'failed', label: 'Chuyển thất bại bên ngân hàng' },
  { value: 'duplicate', label: 'Bị trùng lệnh' },
  { value: 'other', label: 'Lý do khác' },
];

// Row cu (truoc khi co cot status) hoac status confirmed moi tinh la da chot.
export function isSettled(tx) {
  return tx && tx.status !== 'pending' && tx.status !== 'voided';
}
export function isPendingTx(tx) {
  return tx && tx.status === 'pending';
}

export async function fetchBankAccounts() {
  const { data, error } = await supabase.from('bank_accounts').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function fetchPayments(filter = {}) {
  let q = supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (filter.person_id) q = q.eq('person_id', filter.person_id);
  if (filter.hui_group_id) q = q.eq('hui_group_id', filter.hui_group_id);
  if (filter.hui_round_id) q = q.eq('hui_round_id', filter.hui_round_id);
  if (filter.transaction_id) q = q.eq('transaction_id', filter.transaction_id);
  if (filter.bank_account_id) q = q.eq('bank_account_id', filter.bank_account_id);
  if (filter.status) q = q.eq('status', filter.status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function logEvent(paymentId, userId, event, fromStatus, toStatus, note) {
  await supabase.from('payment_events').insert({
    payment_id: paymentId, user_id: userId, event,
    from_status: fromStatus || null, to_status: toStatus || null, note: note || '',
  });
}

// Canh bao trung: cung nguoi + cung so tien trong 24h qua (pending hoac confirmed).
export async function findSimilarPayments(personId, amount) {
  if (!personId) return [];
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase.from('payments')
    .select('id,amount,status,created_at,memo')
    .eq('person_id', personId)
    .eq('amount', amount)
    .in('status', ['pending', 'confirmed'])
    .gte('created_at', since);
  if (error) throw error;
  return data || [];
}

// Tao lenh chuyen khoan: transaction pending + payment pending + audit event.
// Tra ve payment. Neu tao payment loi, transaction vua tao se bi don dep.
export async function createPayment({
  userId, personId, bankAccountId, amount, memo, date, categoryId, sourceId,
  note, huiGroupId, huiRoundId, launchMethod, bankApp,
}) {
  if (huiRoundId) {
    const { data: existing, error } = await supabase.from('payments')
      .select('id').eq('hui_round_id', huiRoundId).eq('status', 'pending');
    if (error) throw error;
    if (existing && existing.length > 0) {
      throw new Error('Kỳ hụi này đã có 1 lệnh chuyển khoản đang chờ xác nhận. Hãy chốt hoặc hủy lệnh cũ trước.');
    }
  }
  const { data: tx, error: txErr } = await supabase.from('transactions').insert({
    user_id: userId, type: 'chi', amount, date: date || new Date().toISOString().slice(0, 10),
    person_id: personId || null, category_id: categoryId || null, source_id: sourceId || null,
    hui_group_id: huiGroupId || null, hui_round_id: huiRoundId || null,
    note: note || '', status: 'pending',
  }).select().single();
  if (txErr) throw txErr;
  try {
    const { data: pay, error: payErr } = await supabase.from('payments').insert({
      user_id: userId, person_id: personId || null, bank_account_id: bankAccountId,
      transaction_id: tx.id, amount, memo: memo || '',
      status: 'pending', launch_method: launchMethod || 'qr', bank_app: bankApp || null,
      launched_at: new Date().toISOString(),
      hui_group_id: huiGroupId || null, hui_round_id: huiRoundId || null,
    }).select().single();
    if (payErr) throw payErr;
    await supabase.from('transactions').update({ payment_id: pay.id }).eq('id', tx.id);
    await logEvent(pay.id, userId, 'created', null, 'pending', '');
    if (bankAccountId) {
      await supabase.from('bank_accounts').update({ last_used_at: new Date().toISOString() }).eq('id', bankAccountId);
    }
    return pay;
  } catch (err) {
    await supabase.from('transactions').delete().eq('id', tx.id);
    throw err;
  }
}

// Xac nhan: chi pending moi duoc chuyen. Giu nguyen ngay gio goc, chi them confirmed_at.
// Neu lenh gan ky hui thi luc nay moi ghi tien dong vao ky (truoc do ky de 0).
export async function confirmPayment(payment, userId) {
  const { data: fresh, error: fErr } = await supabase.from('payments').select('*').eq('id', payment.id).single();
  if (fErr) throw fErr;
  if (fresh.status !== 'pending') throw new Error('Lệnh này không còn ở trạng thái chờ xác nhận.');
  const now = new Date().toISOString();
  const { error } = await supabase.from('payments')
    .update({ status: 'confirmed', confirmed_at: now }).eq('id', payment.id).eq('status', 'pending');
  if (error) throw error;
  if (fresh.transaction_id) {
    await supabase.from('transactions').update({ status: 'confirmed' }).eq('id', fresh.transaction_id);
  }
  if (fresh.hui_round_id && fresh.amount) {
    await supabase.from('hui_rounds').update({ my_contribution: fresh.amount }).eq('id', fresh.hui_round_id);
  }
  await logEvent(payment.id, userId, 'confirmed', 'pending', 'confirmed', '');
  return true;
}

// Huy: chi pending moi duoc huy. Transaction lien quan chuyen sang voided (khong xoa).
// Ky hui giu nguyen dong = 0 (vi tien chua bao gio duoc ghi vao ky).
export async function voidPayment(payment, userId, reason) {
  const { data: fresh, error: fErr } = await supabase.from('payments').select('*').eq('id', payment.id).single();
  if (fErr) throw fErr;
  if (fresh.status !== 'pending') throw new Error('Lệnh này không còn ở trạng thái chờ xác nhận.');
  const now = new Date().toISOString();
  const { error } = await supabase.from('payments')
    .update({ status: 'voided', voided_at: now, void_reason: reason || 'other' })
    .eq('id', payment.id).eq('status', 'pending');
  if (error) throw error;
  if (fresh.transaction_id) {
    await supabase.from('transactions').update({ status: 'voided' }).eq('id', fresh.transaction_id);
  }
  await logEvent(payment.id, userId, 'voided', 'pending', 'voided', reason || 'other');
  return true;
}

// Xoa han lenh chuyen khoan + khoan so + audit events cua no.
// GIAI DOAN DEBUG: mo thoai mai moi trang thai, ke ca da xac nhan.
// Neu lenh da xac nhan va gan ky hui thi reset tien dong cua ky ve 0
// (vi tien dong chi duoc ghi vao ky luc xac nhan lenh nay) de tong hui
// khong lech sau khi xoa.
export async function deletePayment(payment, userId) {
  const { data: fresh, error: fErr } = await supabase.from('payments').select('*').eq('id', payment.id).single();
  if (fErr) throw fErr;
  if (fresh.user_id !== userId) throw new Error('Không phải lệnh của bạn.');
  const wasConfirmed = fresh.status === 'confirmed';
  // Thu tu: events -> transaction -> (dao nguoc ky hui neu can) -> payment.
  // Events co FK cascade theo payment nhung xoa tuong minh de khong phu
  // thuoc vao cascade + RLS (can migration_bank4 cho phep xoa events
  // cua minh).
  const { error: evErr } = await supabase.from('payment_events').delete().eq('payment_id', fresh.id);
  if (evErr) throw evErr;
  if (fresh.transaction_id) {
    const { error: txErr } = await supabase.from('transactions').delete().eq('id', fresh.transaction_id);
    if (txErr) throw txErr;
  }
  if (wasConfirmed && fresh.hui_round_id) {
    const { error: huiErr } = await supabase.from('hui_rounds').update({ my_contribution: 0 }).eq('id', fresh.hui_round_id);
    if (huiErr) throw huiErr;
  }
  const { error } = await supabase.from('payments').delete().eq('id', fresh.id);
  if (error) throw error;
  return true;
}

export function pendingAgeLabel(createdAt) {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (days >= 7) return 'over7';
  if (days >= 1) return 'over1';
  return 'fresh';
}
