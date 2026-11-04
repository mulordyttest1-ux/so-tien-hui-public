'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import MoneyInput from '../../components/MoneyInput';
import { useRequireAuth } from '../../components/useRequireAuth';
import { supabase } from '../../lib/supabaseClient';
import { fetchHui, saveHuiRound, deleteHuiRound, fetchTags } from '../../lib/data';
import { fetchBankAccounts, fetchPayments, createPayment, findSimilarPayments } from '../../lib/payments';
import { cleanMemo } from '../../lib/vietqr';
import { fmtVND, todayISO, calcHuiGroup } from '../../lib/format';

const EMPTY_GROUP = { name: '', amount_per_period: '', total_shares: '', my_shares: 1, total_periods: '', fee: 0, start_date: todayISO(), note: '' };

export default function HuiPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [ready, setReady] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [roundFor, setRoundFor] = useState(null); // {group, round}
  const [bankFor, setBankFor] = useState(null); // {group, round}
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [bankPersonId, setBankPersonId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [bankBusy, setBankBusy] = useState(false);

  async function load() {
    const [h, pay, acc, tg] = await Promise.all([fetchHui(), fetchPayments(), fetchBankAccounts(), fetchTags()]);
    setGroups(h.groups); setRounds(h.rounds); setPayments(pay); setAccounts(acc); setPersons(tg.persons); setReady(true);
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  async function saveGroup(e) {
    e.preventDefault();
    if (!editingGroup.amount_per_period || Number(editingGroup.amount_per_period) < 1) { alert('Nhập tiền 1 chân / 1 kỳ lớn hơn 0.'); return; }
    const payload = {
      user_id: user.id, name: editingGroup.name,
      amount_per_period: Number(editingGroup.amount_per_period),
      total_shares: Number(editingGroup.total_shares),
      my_shares: Number(editingGroup.my_shares || 1),
      total_periods: Number(editingGroup.total_periods),
      fee: Number(editingGroup.fee || 0),
      start_date: editingGroup.start_date || null, note: editingGroup.note || '',
    };
    try {
      let saved = null;
      if (editingGroup.id) {
        const { data, error } = await supabase.from('hui_groups').update(payload).eq('id', editingGroup.id).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase.from('hui_groups').insert(payload).select().single();
        if (error) throw error;
        saved = data;
      }
      // Hiện dây hụi mới ngay tại chỗ, rồi tải lại để đồng bộ.
      if (saved) setGroups(prev => [saved, ...prev.filter(g => g.id !== saved.id)]);
      setEditingGroup(null); await load();
    } catch (err) { alert('Không lưu được dây hụi: ' + err.message); }
  }

  async function removeGroup(g) {
    if (!confirm(`Xóa dây hụi "${g.name}" và toàn bộ các kỳ + giao dịch liên quan?`)) return;
    await supabase.from('transactions').delete().eq('hui_group_id', g.id);
    const { error } = await supabase.from('hui_groups').delete().eq('id', g.id);
    if (error) alert(error.message); else load();
  }

  async function saveRound(e) {
    e.preventDefault();
    const { group, round } = roundFor;
    try {
      const saved = await saveHuiRound({
        group, userId: user.id,
        round: {
          ...(round.id ? { id: round.id } : {}),
          user_id: user.id, group_id: group.id,
          period_no: Number(round.period_no), date: round.date,
          winner_name: round.winner_name || '',
          my_contribution: Number(round.my_contribution || 0),
          my_withdrawal: Number(round.my_withdrawal || 0),
          note: round.note || '',
        },
      });
      if (saved) setRounds(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
      setRoundFor(null); await load();
    } catch (err) { alert('Không lưu được kỳ hụi: ' + err.message); }
  }

  async function createHuiBankPayment() {
    const { group, round } = bankFor;
    const amount = Number(group.amount_per_period) * Number(group.my_shares || 1);
    if (!bankPersonId) { alert('Chọn người nhận tiền.'); return; }
    if (!bankAccountId) { alert('Chọn tài khoản ngân hàng nhận tiền.'); return; }
    const similar = await findSimilarPayments(bankPersonId, amount).catch(() => []);
    if (similar.length > 0 && !confirm(`Đã có ${similar.length} lệnh gần đây cho người này với đúng số tiền này trong 24h qua. Có thể bạn bấm trùng — vẫn tạo lệnh mới?`)) return;
    setBankBusy(true);
    try {
      const pay = await createPayment({
        userId: user.id, personId: bankPersonId, bankAccountId,
        amount, memo: cleanMemo(`Dong hui ${group.name} ky ${round.period_no}`),
        date: round.date, note: `Đóng hụi ${group.name} — kỳ ${round.period_no} (qua ngân hàng)`,
        huiGroupId: group.id, huiRoundId: round.id, launchMethod: 'qr',
      });
      setBankFor(null); setBankBusy(false);
      router.push(`/chuyen-khoan/${pay.id}`);
    } catch (err) { alert('Không tạo được lệnh: ' + err.message); setBankBusy(false); }
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      {!ready ? <div className="loading">Đang tải hụi…</div>
        : groups.length === 0 ? <div className="empty">Chưa có dây hụi nào. Bấm nút + để tạo dây đầu tiên.</div>
        : groups.map(g => {
          const gr = rounds.filter(r => r.group_id === g.id);
          const c = calcHuiGroup(g, gr);
          return (
            <div className="card" key={g.id}>
              <h3>{g.name}</h3>
              <div className="muted">
                {fmtVND(g.amount_per_period)}/kỳ · {g.total_shares} chân (mình {g.my_shares}) · {g.total_periods} kỳ · thầu {fmtVND(g.fee)}
              </div>
              <div style={{ marginTop: 8, lineHeight: 1.7 }}>
                <div>Đã đóng: <b>{fmtVND(c.daDong)}</b> ({c.roundsDone}/{g.total_periods} kỳ)</div>
                {(() => {
                  const pend = payments.filter(p => p.hui_group_id === g.id && p.status === 'pending');
                  return pend.length > 0 ? (
                    <div>Chờ xác nhận qua ngân hàng: <b>{fmtVND(pend.reduce((s, p) => s + Number(p.amount), 0))}</b> ({pend.length} lệnh, chưa tính vào “Đã đóng”)</div>
                  ) : null;
                })()}
                <div>Đã hốt: <b>{fmtVND(c.daHot)}</b>{c.daHotRoi ? '' : ` — nếu hốt sẽ được khoảng ${fmtVND(c.estimatedHaulPerTime)}/lần`}</div>
                {c.daHotRoi && <div>Còn phải đóng (hụi chết): <b>{fmtVND(c.conPhaiDongHuiChet)}</b></div>}
                <div>Chốt dây dự kiến: <span className={c.loiLoDuKien >= 0 ? 'thu' : 'chi'}>
                  {c.loiLoDuKien >= 0 ? 'Lời ' : 'Lỗ '}{fmtVND(Math.abs(c.loiLoDuKien))}</span>
                </div>
              </div>

              {gr.map(r => {
                const pendPay = payments.find(p => p.hui_round_id === r.id && p.status === 'pending');
                return (
                <div className="row" key={r.id}>
                  <span>Kỳ {r.period_no} · {r.date}
                    {pendPay && <span className="badge-pending" style={{ marginLeft: 6 }}>Chờ xác nhận NH</span>}
                    <br />
                    <span className="muted">
                      {r.winner_name ? `Người hốt: ${r.winner_name}` : ''}
                      {Number(r.my_contribution) > 0 ? ` · Mình đóng ${fmtVND(r.my_contribution)}` : ''}
                      {Number(r.my_withdrawal) > 0 ? ` · Mình hốt ${fmtVND(r.my_withdrawal)}` : ''}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn secondary small" onClick={() => setRoundFor({ group: g, round: { ...r } })}>Sửa</button>
                    <button className="btn danger small" onClick={async () => {
                      if (payments.some(p => p.hui_round_id === r.id && p.status === 'pending')) { alert('Kỳ này đang có lệnh chuyển khoản chờ xác nhận — hãy chốt hoặc hủy lệnh ở tab Ngân hàng trước khi xóa kỳ.'); return; }
                      if (confirm('Xóa kỳ này? Giao dịch gương trong sổ cũng bị xóa.')) { await deleteHuiRound(r.id); load(); }
                    }}>Xóa</button>
                    {pendPay
                      ? <a className="btn secondary small" href={`/chuyen-khoan/${pendPay.id}`}>Mở lệnh CK</a>
                      : Number(r.my_contribution) === 0 && (
                        <button className="btn small" onClick={() => { setBankFor({ group: g, round: r }); setBankPersonId(''); setBankAccountId(''); }}>
                          Đóng qua NH
                        </button>
                      )}
                  </span>
                </div>
                );
              })}

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn small" onClick={() => setRoundFor({
                  group: g,
                  round: { period_no: gr.length + 1, date: todayISO(), winner_name: '', my_contribution: c.perPeriodMine, my_withdrawal: 0, note: '' },
                })}>+ Ghi kỳ mới</button>
                <button className="btn secondary small" onClick={() => setEditingGroup({ ...g })}>Sửa dây</button>
                <button className="btn danger small" onClick={() => removeGroup(g)}>Xóa dây</button>
              </div>
            </div>
          );
        })}

      <button className="fab" aria-label="Tạo dây hụi mới" onClick={() => setEditingGroup({ ...EMPTY_GROUP })}>+</button>

      {editingGroup && (
        <div className="modal-bg" onClick={() => setEditingGroup(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingGroup.id ? 'Sửa dây hụi' : 'Tạo dây hụi mới'}</h2>
            <form onSubmit={saveGroup}>
              <label className="field"><span>Tên dây hụi</span>
                <input required value={editingGroup.name} onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })} placeholder="VD: Hụi tháng 1 triệu" /></label>
              <label className="field"><span>Tiền 1 chân / 1 kỳ (đ)</span>
                <MoneyInput value={editingGroup.amount_per_period} onChange={v => setEditingGroup({ ...editingGroup, amount_per_period: v })} placeholder="VD: 1.000.000" /></label>
              <div className="grid2" style={{ gap: 8 }}>
                <label className="field"><span>Tổng số chân</span>
                  <input type="number" required min="1" value={editingGroup.total_shares} onChange={e => setEditingGroup({ ...editingGroup, total_shares: e.target.value })} /></label>
                <label className="field"><span>Số chân của mình</span>
                  <input type="number" required min="1" value={editingGroup.my_shares} onChange={e => setEditingGroup({ ...editingGroup, my_shares: e.target.value })} /></label>
                <label className="field"><span>Tổng số kỳ</span>
                  <input type="number" required min="1" value={editingGroup.total_periods} onChange={e => setEditingGroup({ ...editingGroup, total_periods: e.target.value })} /></label>
                <label className="field"><span>Tiền thầu / lần hốt (đ)</span>
                  <MoneyInput value={editingGroup.fee} onChange={v => setEditingGroup({ ...editingGroup, fee: v })} /></label>
              </div>
              <label className="field"><span>Ngày bắt đầu</span>
                <input type="date" value={editingGroup.start_date || ''} onChange={e => setEditingGroup({ ...editingGroup, start_date: e.target.value })} /></label>
              <label className="field"><span>Ghi chú</span>
                <input value={editingGroup.note || ''} onChange={e => setEditingGroup({ ...editingGroup, note: e.target.value })} /></label>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setEditingGroup(null)}>Hủy</button>
                <button type="submit" className="btn">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bankFor && (() => {
        const amount = Number(bankFor.group.amount_per_period) * Number(bankFor.group.my_shares || 1);
        const acc = accounts.find(a => a.id === bankAccountId);
        return (
          <div className="modal-bg" onClick={() => setBankFor(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Đóng hụi qua ngân hàng — {bankFor.group.name} kỳ {bankFor.round.period_no}</h2>
              <p className="muted" style={{ lineHeight: 1.8 }}>
                Số tiền kỳ này: <b>{fmtVND(amount)}</b><br />
                Nội dung chuyển khoản: <b>{cleanMemo(`Dong hui ${bankFor.group.name} ky ${bankFor.round.period_no}`)}</b>
              </p>
              <label className="field"><span>Chuyển cho người (ví dụ: chị C)</span>
                <select value={bankPersonId} onChange={e => { setBankPersonId(e.target.value); setBankAccountId(''); }}>
                  <option value="">— Chọn người —</option>
                  {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Tài khoản nhận tiền</span>
                <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}>
                  <option value="">— Chọn tài khoản —</option>
                  {accounts.filter(a => !bankPersonId || a.person_id === bankPersonId).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.bank_name} · {a.account_number}{a.holder_name ? ` (${a.holder_name})` : ''}{a.note ? ` — ${a.note}` : ''}
                    </option>
                  ))}
                </select>
                <span className="muted">Chưa có tài khoản thì vào tab Ngân hàng để thêm (quét QR hoặc nhập tay).</span>
              </label>
              <p className="muted">
                Bấm “Tạo lệnh” là kỳ này được ghi với tiền đóng = 0 và lệnh chuyển khoản ở trạng thái
                <b> Chờ xác nhận</b>. Khi bạn xác nhận đã chuyển, tiền đóng mới ghi vào kỳ này.
                Hủy lệnh thì kỳ vẫn ở 0, không mất gì.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setBankFor(null)}>Hủy</button>
                <button type="button" className="btn" disabled={bankBusy} onClick={createHuiBankPayment}>Tạo lệnh &amp; mở app ngân hàng</button>
              </div>
            </div>
          </div>
        );
      })()}

      {roundFor && (
        <div className="modal-bg" onClick={() => setRoundFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Ghi kỳ hụi — {roundFor.group.name}</h2>
            <form onSubmit={saveRound}>
              <div className="grid2" style={{ gap: 8 }}>
                <label className="field"><span>Kỳ số</span>
                  <input type="number" required min="1" value={roundFor.round.period_no}
                    onChange={e => setRoundFor({ ...roundFor, round: { ...roundFor.round, period_no: e.target.value } })} /></label>
                <label className="field"><span>Ngày</span>
                  <input type="date" required value={roundFor.round.date}
                    onChange={e => setRoundFor({ ...roundFor, round: { ...roundFor.round, date: e.target.value } })} /></label>
              </div>
              <label className="field"><span>Người hốt kỳ này</span>
                <input value={roundFor.round.winner_name || ''}
                  onChange={e => setRoundFor({ ...roundFor, round: { ...roundFor.round, winner_name: e.target.value } })}
                  placeholder="Tên người hốt (để trống nếu chưa ai hốt)" /></label>
              <label className="field"><span>Mình đóng kỳ này (đ)</span>
                <MoneyInput value={roundFor.round.my_contribution}
                  onChange={v => setRoundFor({ ...roundFor, round: { ...roundFor.round, my_contribution: v } })} /></label>
              <label className="field"><span>Mình hốt kỳ này (đ) — 0 nếu không phải mình</span>
                <MoneyInput value={roundFor.round.my_withdrawal}
                  onChange={v => setRoundFor({ ...roundFor, round: { ...roundFor.round, my_withdrawal: v } })} /></label>
              <p className="muted">Khoản đóng / hốt sẽ tự ghi vào Sổ tiền.</p>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setRoundFor(null)}>Hủy</button>
                <button type="submit" className="btn">Lưu kỳ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
