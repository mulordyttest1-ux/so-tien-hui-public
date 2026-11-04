// Nghiep vu khoan dinh ky (vay gop, lai vay, hoa don dinh ky).
// Trong tam la GHI LOG: moi lan dong la 1 ban ghi (khoan chi trong so
// + log ky) va ngay den han tu doi sang thang sau. Khong can biet ben
// cho vay la ai. Nhac nho = danh sach "Sap den han" o trang chinh (web
// app khong day thong bao ra man hinh khoa nhu app native).
import { supabase } from './supabaseClient';

export const RECURRING_KIND_LABELS = {
  installment: 'Góp theo kỳ',
  interest_only: 'Lãi hàng tháng + gốc đáo hạn',
  bill: 'Hóa đơn định kỳ',
};

// Cong n thang, kep ngay ve cuoi thang neu thang dich khong du ngay.
export function addMonths(dateStr, n) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr + 'T00:00:00') - today) / 86400000);
}

export async function fetchRecurringItems() {
  const { data, error } = await supabase.from('recurring_items')
    .select('*').order('next_due_date', { ascending: true, nullsFirst: false }).order('created_at');
  if (error) throw error;
  return data || [];
}

export async function fetchRecurringPayments(itemId) {
  let q = supabase.from('recurring_payments').select('*').order('paid_date', { ascending: false });
  if (itemId) q = q.eq('recurring_item_id', itemId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createRecurringItem(userId, f) {
  const payload = {
    user_id: userId, name: f.name, kind: f.kind || 'bill',
    amount: Number(f.amount), due_day: f.due_day ? Number(f.due_day) : null,
    next_due_date: f.next_due_date || null,
    total_terms: f.total_terms ? Number(f.total_terms) : null,
    paid_terms: f.paid_terms ? Number(f.paid_terms) : 0,
    total_amount: f.total_amount ? Number(f.total_amount) : null,
    remaining_amount: f.remaining_amount ? Number(f.remaining_amount) : null,
    maturity_date: f.maturity_date || null,
    maturity_amount: f.maturity_amount ? Number(f.maturity_amount) : null,
    note: f.note || '', status: 'active',
  };
  const { data, error } = await supabase.from('recurring_items').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateRecurringItem(id, f) {
  const payload = {
    name: f.name, kind: f.kind, amount: Number(f.amount),
    due_day: f.due_day ? Number(f.due_day) : null,
    next_due_date: f.next_due_date || null,
    total_terms: f.total_terms ? Number(f.total_terms) : null,
    paid_terms: f.paid_terms ? Number(f.paid_terms) : 0,
    total_amount: f.total_amount ? Number(f.total_amount) : null,
    remaining_amount: f.remaining_amount ? Number(f.remaining_amount) : null,
    maturity_date: f.maturity_date || null,
    maturity_amount: f.maturity_amount ? Number(f.maturity_amount) : null,
    note: f.note || '',
  };
  const { data, error } = await supabase.from('recurring_items').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Xoa khoan dinh ky (giai doan debug: xoa thoai mai). Lich su dong cua
// no xoa theo (FK cascade) NHUNG cac khoan chi da ghi trong so van giu
// lai — tien da chi la that, khong xoa theo.
export async function deleteRecurringItem(id) {
  const { error } = await supabase.from('recurring_items').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// Ghi 1 lan dong: khoan chi trong so (tru khi skipTx: chi ghi log ky,
// danh cho truong hop da co khoan chi ben So tien / Ngan hang roi,
// tranh ghi trung) + log ky + doi lich.
// principal=true: tra goc dao han -> khoan xong, khong con ky toi.
export async function recordRecurringPayment(item, userId, { amount, date, skipTx, principal }) {
  const amt = Number(amount);
  const paidDate = date || new Date().toISOString().slice(0, 10);
  let txId = null;
  if (!skipTx) {
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
      user_id: userId, type: 'chi', amount: amt, date: paidDate,
      note: principal ? `Trả gốc ${item.name}` : `Đóng ${item.name}`,
      status: 'confirmed',
    }).select().single();
    if (txErr) throw txErr;
    txId = tx.id;
  }
  const { error: logErr } = await supabase.from('recurring_payments').insert({
    user_id: userId, recurring_item_id: item.id, transaction_id: txId,
    amount: amt, paid_date: paidDate,
    kind: principal ? 'principal' : (item.kind === 'interest_only' ? 'interest' : 'payment'),
    note: skipTx ? 'Chỉ ghi log kỳ' : '',
  });
  if (logErr) throw logErr;

  let patch;
  if (principal) {
    patch = { status: 'done', next_due_date: null };
  } else if (item.kind === 'installment') {
    const paid = (item.paid_terms || 0) + 1;
    const done = item.total_terms && paid >= item.total_terms;
    patch = {
      paid_terms: paid,
      remaining_amount: item.remaining_amount != null ? Math.max(0, Number(item.remaining_amount) - amt) : null,
      next_due_date: done ? null : addMonths(item.next_due_date, 1),
      status: done ? 'done' : 'active',
    };
  } else {
    patch = { next_due_date: addMonths(item.next_due_date, 1) };
  }
  const { error: upErr } = await supabase.from('recurring_items').update(patch).eq('id', item.id);
  if (upErr) throw upErr;
  return true;
}

// Nhac nho: cac ky toi + ngay dao han trong `days` ngay toi hoac da
// qua han, sap xep theo ngay. Hien o trang chinh moi khi mo app.
export function upcomingItems(items, days = 30) {
  const out = [];
  for (const it of items || []) {
    if (it.status !== 'active') continue;
    if (it.next_due_date) {
      const diff = daysUntil(it.next_due_date);
      if (diff != null && diff <= days) {
        out.push({ item: it, type: 'due', date: it.next_due_date, amount: it.amount, diff });
      }
    }
    if (it.maturity_date) {
      const diff = daysUntil(it.maturity_date);
      if (diff != null && diff <= days) {
        out.push({ item: it, type: 'maturity', date: it.maturity_date, amount: it.maturity_amount, diff });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
