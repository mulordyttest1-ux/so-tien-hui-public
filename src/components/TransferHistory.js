'use client';
// Component lich su chuyen khoan DUNG CHUNG cho moi man hinh (thuật toán liên kết):
// thay vì gắn log cứng vào từng màn hình, component này nhận 1 bộ lọc theo thực
// thể đang xem (người / hụi / kỳ / giao dịch / tài khoản) và tự truy vấn payments
// theo trường liên kết đó. Thêm thực thể mới sau này chỉ cần thêm trường lọc.
import { useState } from 'react';
import { confirmPayment, voidPayment, deletePayment, VOID_REASONS, pendingAgeLabel } from '../lib/payments';
import { fmtVND, personDisplay } from '../lib/format';

function statusBadge(p) {
  if (p.status === 'confirmed') return <span className="badge-ok">Đã xác nhận</span>;
  if (p.status === 'voided') return <span className="badge-void">Đã hủy</span>;
  const age = pendingAgeLabel(p.created_at);
  return (
    <span className={age === 'over7' ? 'badge-pending-old' : 'badge-pending'}>
      Chờ xác nhận{age === 'over7' ? ' — cần chốt ngay' : age === 'over1' ? ' (hơn 1 ngày)' : ''}
    </span>
  );
}

export default function TransferHistory({ payments, accounts, persons, groups, userId, onChanged, showActions = true }) {
  const [voiding, setVoiding] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [voidReason, setVoidReason] = useState('abandoned');
  const [busy, setBusy] = useState(false);

  const accName = (id) => {
    const a = (accounts || []).find(x => x.id === id);
    return a ? `${a.bank_name} · ${a.account_number}${a.holder_name ? ` (${a.holder_name})` : ''}` : '(tài khoản đã xóa)';
  };
  const personName = (id) => personDisplay((persons || []).find(x => x.id === id));
  const groupName = (id) => (groups || []).find(x => x.id === id)?.name || '';

  async function act(fn, p, extra) {
    setBusy(true);
    try { await fn(p, userId, extra); onChanged && onChanged(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  if (!payments || payments.length === 0) {
    return <div className="empty">Chưa có lệnh chuyển khoản nào.</div>;
  }

  return (
    <div>
      {payments.map(p => (
        <div className="card" key={p.id} style={{ padding: '10px 16px' }}>
          <div className="row" style={{ border: 'none', padding: 0 }}>
            <span>
              <b>{fmtVND(p.amount)}</b> {statusBadge(p)}
              <br /><span className="muted">
                {new Date(p.created_at).toLocaleString('vi-VN')}
                {personName(p.person_id) ? ` · Cho: ${personName(p.person_id)}` : ''}
                {groupName(p.hui_group_id) ? ` · Hụi: ${groupName(p.hui_group_id)}` : ''}
                {p.hui_round_id ? ' · (kỳ hụi)' : ''}
                <br />TK nhận: {accName(p.bank_account_id)}
                {p.memo ? <><br />Nội dung: {p.memo}</> : ''}
                {p.confirmed_at ? <><br />Xác nhận lúc: {new Date(p.confirmed_at).toLocaleString('vi-VN')}</> : ''}
                {p.status === 'voided' ? <><br />Lý do hủy: {VOID_REASONS.find(r => r.value === p.void_reason)?.label || p.void_reason}</> : ''}
              </span>
            </span>
          </div>
          {showActions && p.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button className="btn small" disabled={busy} onClick={() => setConfirming(p.id)}>
                Đã chuyển — Xác nhận
              </button>
              <button className="btn secondary small" disabled={busy} onClick={() => setVoiding(p.id)}>Hủy lệnh</button>
              <a className="btn secondary small" href={`/chuyen-khoan/${p.id}`}>Mở lại mã QR</a>
              <button className="btn danger small" disabled={busy} onClick={() => setDeleting(p.id)}>Xóa</button>
            </div>
          )}
          {showActions && (p.status === 'voided' || p.status === 'confirmed') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button className="btn danger small" disabled={busy} onClick={() => setDeleting(p.id)}>Xóa</button>
            </div>
          )}
          {showActions && deleting === p.id && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="muted">{p.status === 'confirmed'
                ? 'Lệnh này đã chuyển thành công — xóa sẽ gỡ cả khoản sổ đã chốt (và tiền đóng hụi của kỳ này nếu có). Vẫn xóa?'
                : 'Xóa hẳn lệnh này và khoản sổ liên quan? Lệnh chưa chuyển tiền nên xóa không làm lệch số đã chốt.'}</span>
              <button className="btn danger small" disabled={busy}
                onClick={() => act(deletePayment, p).then(() => setDeleting(null))}>
                Xóa hẳn
              </button>
              <button className="btn secondary small" onClick={() => setDeleting(null)}>Giữ lại</button>
            </div>
          )}
          {showActions && confirming === p.id && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="muted">Tiền thật sự đã đi bên app ngân hàng rồi?</span>
              <button className="btn small" disabled={busy}
                onClick={() => act(confirmPayment, p).then(() => setConfirming(null))}>
                Đúng, đã chuyển
              </button>
              <button className="btn secondary small" onClick={() => setConfirming(null)}>Chưa, để sau</button>
            </div>
          )}
          {voiding === p.id && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <select value={voidReason} onChange={e => setVoidReason(e.target.value)}>
                {VOID_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button className="btn danger small" disabled={busy}
                onClick={() => act(voidPayment, p, voidReason).then(() => setVoiding(null))}>
                Xác nhận hủy
              </button>
              <button className="btn secondary small" onClick={() => setVoiding(null)}>Đóng</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
