'use client';

// Ô nhập tiền kiểu Việt Nam: gõ số là tự ngắt nhóm 3 số (1.000.000.000)
// và ngay dưới ô hiện câu đọc số tiền bằng chữ ("1 tỷ đồng") để khỏi đếm số 0.
//
// API: value = chuỗi chữ số (VD "1000000000"), onChange nhận lại chuỗi chữ số.
// Hiển thị bên trong ô là dạng đã ngắt nhóm; mọi nơi lưu trữ vẫn chỉ dùng chữ số.

export function onlyDigits(v) {
  return String(v ?? '').replace(/\D/g, '');
}

export function groupDigits(v) {
  const d = onlyDigits(v);
  if (!d) return '';
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// "1 tỷ 250 triệu 300 nghìn đồng" — chỉ liệt kê các bậc khác 0.
export function vietnameseCompact(n) {
  const v = Number(n || 0);
  if (!v) return '';
  if (v < 1000) return `${v} đồng`;
  const ty = Math.floor(v / 1_000_000_000);
  let r = v % 1_000_000_000;
  const trieu = Math.floor(r / 1_000_000);
  r %= 1_000_000;
  const nghin = Math.floor(r / 1_000);
  const dong = r % 1_000;
  const parts = [];
  if (ty) parts.push(`${ty} tỷ`);
  if (trieu) parts.push(`${trieu} triệu`);
  if (nghin) parts.push(`${nghin} nghìn`);
  if (dong) parts.push(`${dong} đồng`);
  else parts.push('đồng');
  return parts.join(' ');
}

export default function MoneyInput({ value, onChange, placeholder, className }) {
  const digits = onlyDigits(value);
  const num = digits ? Number(digits) : 0;
  return (
    <span style={{ display: 'block' }}>
      <input
        type="text"
        inputMode="numeric"
        value={groupDigits(digits)}
        placeholder={placeholder}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
        className={className}
      />
      {digits !== '' && (
        <span className="money-hint">≈ {vietnameseCompact(num)}</span>
      )}
    </span>
  );
}
