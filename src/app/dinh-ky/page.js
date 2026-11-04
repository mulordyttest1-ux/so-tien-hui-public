'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import MoneyInput from '../../components/MoneyInput';
import {
  fetchRecurringItems, fetchRecurringPayments, createRecurringItem,
  updateRecurringItem, deleteRecurringItem, recordRecurringPayment,
  RECURRING_KIND_LABELS, daysUntil,
} from '../../lib/recurring';
import { fmtVND, todayISO } from '../../lib/format';

const EMPTY = {
  name: '', kind: 'installment', amount: '', due_day: '', next_due_date: '',
  total_terms: '', paid_terms: '', total_amount: '', remaining_amount: '',
  maturity_date: '', maturity_amount: '', note: '',
};

function dueLabel(dateStr) {
  if (!dateStr) return 'Chưa đặt ngày';
  const d = daysUntil(dateStr);
  if (d < 0) return `Quá hạn ${-d} ngày (${dateStr})`;
  if (d === 0) return `Đến hạn hôm nay (${dateStr})`;
  return `Đến hạn sau ${d} ngày (${dateStr})`;
}

export default function DinhKyPage() {
  const { user, loading } = useRequireAuth();
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState({});
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null); // { item, principal }
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(todayISO());
  const [skipTx, setSkipTx] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [it, lg] = await Promise.all([fetchRecurringItems(), fetchRecurringPayments()]);
    setItems(it);
    const grouped = {};
    for (const r of lg) (grouped[r.recurring_item_id] = grouped[r.recurring_item_id] || []).push(r);
    setLogs(grouped);
    setReady(true);
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  async function save(e) {
    e.preventDefault();
    if (!editing.name || !editing.amount || Number(editing.amount) < 1) { alert('Nhập tên và số tiền lớn hơn 0.'); return; }
    setBusy(true);
    try {
      if (editing.id) await updateRecurringItem(editing.id, editing);
      else await createRecurringItem(user.id, editing);
      setEditing(null); await load();
    } catch (err) { alert('Không lưu được: ' + err.message); }
    finally { setBusy(false); }
  }

  async function pay() {
    if (!payAmount || Number(payAmount) < 1) { alert('Nhập số tiền lớn hơn 0.'); return; }
    setBusy(true);
    try {
      await recordRecurringPayment(paying.item, user.id, {
        amount: Number(payAmount), date: payDate, skipTx, principal: paying.principal,
      });
      setPaying(null); await load();
    } catch (err) { alert('Không ghi được: ' + err.message); }
    finally { setBusy(false); }
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      <h2>🔁 Khoản định kỳ</h2>
      <p className="muted">
        Vay góp, lãi vay, điện, nước, hay bất cứ khoản nào phải đóng định kỳ — ghi một lần,
        tới kỳ bấm “Đã đóng” là có log. Mở app lên là thấy ngay khoản sắp đến hạn ở trang chính.
      </p>
      <button className="btn" onClick={() => setEditing({ ...EMPTY })}>+ Thêm khoản định kỳ</button>

      {editing && (
        <div className="card">
          <h3>{editing.id ? 'Sửa khoản' : 'Khoản mới'}</h3>
          <form onSubmit={save}>
            <label className="field"><span>Tên khoản</span>
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="VD: Khoản góp 1, Tiền điện" required />
            </label>
            <label className="field"><span>Loại</span>
              <select value={editing.kind} onChange={e => setEditing({ ...editing, kind: e.target.value })}>
                {Object.entries(RECURRING_KIND_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field"><span>Số tiền mỗi kỳ (đ)</span>
              <MoneyInput value={editing.amount} onChange={v => setEditing({ ...editing, amount: v })} placeholder="VD: 5.800.000" />
            </label>
            <label className="field"><span>Ngày đến hạn mỗi tháng (1–31, để trống nếu không cố định)</span>
              <input type="number" min="1" max="31" value={editing.due_day} onChange={e => setEditing({ ...editing, due_day: e.target.value })} />
            </label>
            <label className="field"><span>Kỳ tới đến hạn ngày</span>
              <input type="date" value={editing.next_due_date} onChange={e => setEditing({ ...editing, next_due_date: e.target.value })} />
            </label>
            {editing.kind === 'installment' && (<>
              <label className="field"><span>Tổng số kỳ</span>
                <input type="number" min="1" value={editing.total_terms} onChange={e => setEditing({ ...editing, total_terms: e.target.value })} />
              </label>
              <label className="field"><span>Đã trả (kỳ)</span>
                <input type="number" min="0" value={editing.paid_terms} onChange={e => setEditing({ ...editing, paid_terms: e.target.value })} />
              </label>
              <label className="field"><span>Tổng phải trả (đ)</span>
                <MoneyInput value={editing.total_amount} onChange={v => setEditing({ ...editing, total_amount: v })} />
              </label>
              <label className="field"><span>Dư nợ còn lại (đ)</span>
                <MoneyInput value={editing.remaining_amount} onChange={v => setEditing({ ...editing, remaining_amount: v })} />
              </label>
            </>)}
            {editing.kind === 'interest_only' && (<>
              <label className="field"><span>Ngày đáo hạn (trả gốc)</span>
                <input type="date" value={editing.maturity_date} onChange={e => setEditing({ ...editing, maturity_date: e.target.value })} />
              </label>
              <label className="field"><span>Số gốc đáo hạn (đ)</span>
                <MoneyInput value={editing.maturity_amount} onChange={v => setEditing({ ...editing, maturity_amount: v })} />
              </label>
            </>)}
            <label className="field"><span>Ghi chú</span>
              <input value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} />
            </label>
            <div className="modal-actions">
              <button type="submit" className="btn" disabled={busy}>Lưu</button>
              <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Đóng</button>
            </div>
          </form>
        </div>
      )}

      {!ready && <div className="loading">Đang tải…</div>}
      {ready && items.length === 0 && <div className="empty">Chưa có khoản định kỳ nào. Bấm “+ Thêm khoản định kỳ” để tạo khoản đầu tiên.</div>}

      {items.map(it => {
        const overdue = it.next_due_date && daysUntil(it.next_due_date) < 0;
        const itemLogs = logs[it.id] || [];
        return (
          <div className="card" key={it.id} style={overdue ? { border: '2px solid #dc2626' } : undefined}>
            <div className="row" style={{ border: 'none', padding: 0 }}>
              <span>
                <b>{it.name}</b> <span className="muted">· {RECURRING_KIND_LABELS[it.kind] || it.kind}</span>
                {it.status === 'done' && <span className="badge-ok" style={{ marginLeft: 6 }}>Đã xong</span>}
                <br /><span className="muted">
                  {it.status === 'active' ? dueLabel(it.next_due_date) : 'Không còn kỳ tới'}
                  {` · Mỗi kỳ ${fmtVND(it.amount)}`}
                  {it.kind === 'installment' && it.total_terms ? ` · Đã đóng ${it.paid_terms}/${it.total_terms} kỳ` : ''}
                  {it.remaining_amount != null ? ` · Còn lại ${fmtVND(it.remaining_amount)}` : ''}
                  {it.kind === 'interest_only' && it.maturity_amount ? ` · Gốc đáo hạn ${fmtVND(it.maturity_amount)}${it.maturity_date ? ` ngày ${it.maturity_date}` : ''}` : ''}
                  {it.note ? <><br />{it.note}</> : ''}
                </span>
              </span>
            </div>

            {it.status === 'active' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button className="btn small" onClick={() => {
                  setPaying({ item: it, principal: false });
                  setPayAmount(it.amount); setPayDate(todayISO()); setSkipTx(false);
                }}>Đã đóng kỳ này</button>
                {it.kind === 'interest_only' && it.maturity_amount && (
                  <button className="btn secondary small" onClick={() => {
                    setPaying({ item: it, principal: true });
                    setPayAmount(it.maturity_amount); setPayDate(todayISO()); setSkipTx(false);
                  }}>Trả gốc đáo hạn</button>
                )}
                <button className="btn secondary small" onClick={() => setEditing({ ...it,
                  amount: String(it.amount ?? ''), due_day: it.due_day ?? '',
                  total_terms: it.total_terms ?? '', paid_terms: it.paid_terms ?? '',
                  total_amount: it.total_amount ?? '', remaining_amount: it.remaining_amount ?? '',
                  maturity_amount: it.maturity_amount ?? '',
                })}>Sửa</button>
                <button className="btn danger small" onClick={() => setDeleting(it.id)}>Xóa</button>
              </div>
            )}

            {paying && paying.item.id === it.id && (
              <div style={{ marginTop: 8 }}>
                <p className="muted">
                  {paying.principal ? 'Trả gốc đáo hạn — ghi khoản chi và kết thúc khoản này.' : 'Ghi log kỳ này: tạo khoản chi trong sổ và dời ngày đến hạn sang tháng sau.'}
                </p>
                <label className="field"><span>Số tiền (đ)</span>
                  <MoneyInput value={payAmount} onChange={setPayAmount} />
                </label>
                <label className="field"><span>Ngày đóng</span>
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
                </label>
                <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={skipTx} onChange={e => setSkipTx(e.target.checked)} />
                  Chỉ ghi log kỳ (đã có khoản chi bên Sổ tiền / Ngân hàng rồi, đừng ghi thêm để khỏi trùng)
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn small" disabled={busy} onClick={pay}>Xác nhận đã đóng</button>
                  <button className="btn secondary small" onClick={() => setPaying(null)}>Đóng</button>
                </div>
              </div>
            )}

            {deleting === it.id && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="muted">Xóa khoản này? Các khoản chi đã ghi trong sổ vẫn giữ lại, chỉ mất lịch log kỳ của nó.</span>
                <button className="btn danger small" disabled={busy}
                  onClick={async () => { setBusy(true); try { await deleteRecurringItem(it.id); setDeleting(null); await load(); } catch (e) { alert(e.message); } finally { setBusy(false); } }}>
                  Xóa hẳn
                </button>
                <button className="btn secondary small" onClick={() => setDeleting(null)}>Giữ lại</button>
              </div>
            )}

            {itemLogs.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="muted">Lịch đóng gần đây:</div>
                {itemLogs.slice(0, 5).map(r => (
                  <div className="row" key={r.id}>
                    <span className="muted">{r.paid_date}{r.kind === 'principal' ? ' · Trả gốc' : r.kind === 'interest' ? ' · Lãi' : ''}{r.note ? ` · ${r.note}` : ''}</span>
                    <span className="chi">− {fmtVND(r.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </AppShell>
  );
}
