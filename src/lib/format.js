// Định dạng tiền VND và các hàm ngày/tháng/tuần dùng chung.

export function fmtVND(n) {
  const v = Number(n || 0);
  return v.toLocaleString('vi-VN') + 'đ';
}

export function todayISO() {
  const d = new Date();
  return toISO(d);
}

export function toISO(d) {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

/** Khoảng tuần hiện tại (thứ 2 → chủ nhật) dạng {from, to} ISO */
export function thisWeekRange() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = thứ 2
  const from = new Date(now); from.setDate(now.getDate() - dow);
  const to = new Date(from); to.setDate(from.getDate() + 6);
  return { from: toISO(from), to: toISO(to) };
}

/** Khoảng tháng hiện tại {from, to} ISO */
export function thisMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toISO(from), to: toISO(to) };
}

export function inRange(dateISO, { from, to }) {
  return dateISO >= from && dateISO <= to;
}

export function sumByType(txs, type) {
  return txs.filter(t => t.type === type).reduce((s, t) => s + Number(t.amount), 0);
}

/**
 * Tính toán 1 dây hụi (giai đoạn 1 — công thức chuẩn, ghi rõ để giai đoạn sau tinh chỉnh):
 * - Mỗi kỳ mình đóng: amount_per_period × my_shares
 * - Tổng mình sẽ đóng cả dây: đóng mỗi kỳ × total_periods
 * - Mỗi lần mình hốt (ước tính): amount_per_period × total_shares − fee (trừ tiền thầu)
 * - "Hụi chết" (còn phải đóng sau khi đã hốt): đóng mỗi kỳ × số kỳ còn lại sau kỳ mình hốt
 * - Lời/lỗ dự kiến khi chốt dây: tổng hốt (thực tế, hoặc ước tính nếu chưa hốt) − tổng đóng cả dây
 */
export function calcHuiGroup(group, rounds) {
  const perPeriodMine = Number(group.amount_per_period) * Number(group.my_shares || 1);
  const totalPayAll = perPeriodMine * Number(group.total_periods);
  const daDong = rounds.reduce((s, r) => s + Number(r.my_contribution || 0), 0);
  const daHot = rounds.reduce((s, r) => s + Number(r.my_withdrawal || 0), 0);
  const myHaulRounds = rounds.filter(r => Number(r.my_withdrawal || 0) > 0);
  const daHotRoi = myHaulRounds.length > 0;
  const lastHaulPeriod = daHotRoi ? Math.max(...myHaulRounds.map(r => r.period_no)) : 0;
  const remainingPeriodsAfterHaul = daHotRoi
    ? Math.max(0, Number(group.total_periods) - lastHaulPeriod)
    : 0;
  const conPhaiDongHuiChet = perPeriodMine * remainingPeriodsAfterHaul;
  const estimatedHaulPerTime =
    Number(group.amount_per_period) * Number(group.total_shares) - Number(group.fee || 0);
  const projectedHaulTotal = daHotRoi
    ? daHot
    : estimatedHaulPerTime * Number(group.my_shares || 1);
  const loiLoDuKien = projectedHaulTotal - totalPayAll;
  return {
    perPeriodMine, totalPayAll, daDong, daHot, daHotRoi,
    conPhaiDongHuiChet, estimatedHaulPerTime, loiLoDuKien,
    roundsDone: rounds.length,
  };
}
