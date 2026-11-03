'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import { supabase } from '../../lib/supabaseClient';
import { fetchHui, saveHuiRound, deleteHuiRound } from '../../lib/data';
import { fmtVND, todayISO, calcHuiGroup } from '../../lib/format';

const EMPTY_GROUP = { name: '', amount_per_period: '', total_shares: '', my_shares: 1, total_periods: '', fee: 0, start_date: todayISO(), note: '' };

export default function HuiPage() {
  const { user, loading } = useRequireAuth();
  const [groups, setGroups] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [ready, setReady] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [roundFor, setRoundFor] = useState(null); // {group, round}

  async function load() {
    const h = await fetchHui();
    setGroups(h.groups); setRounds(h.rounds); setReady(true);
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  async function saveGroup(e) {
    e.preventDefault();
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
                <div>Đã hốt: <b>{fmtVND(c.daHot)}</b>{c.daHotRoi ? '' : ` — nếu hốt sẽ được khoảng ${fmtVND(c.estimatedHaulPerTime)}/lần`}</div>
                {c.daHotRoi && <div>Còn phải đóng (hụi chết): <b>{fmtVND(c.conPhaiDongHuiChet)}</b></div>}
                <div>Chốt dây dự kiến: <span className={c.loiLoDuKien >= 0 ? 'thu' : 'chi'}>
                  {c.loiLoDuKien >= 0 ? 'Lời ' : 'Lỗ '}{fmtVND(Math.abs(c.loiLoDuKien))}</span>
                </div>
              </div>

              {gr.map(r => (
                <div className="row" key={r.id}>
                  <span>Kỳ {r.period_no} · {r.date}<br />
                    <span className="muted">
                      {r.winner_name ? `Người hốt: ${r.winner_name}` : ''}
                      {Number(r.my_contribution) > 0 ? ` · Mình đóng ${fmtVND(r.my_contribution)}` : ''}
                      {Number(r.my_withdrawal) > 0 ? ` · Mình hốt ${fmtVND(r.my_withdrawal)}` : ''}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary small" onClick={() => setRoundFor({ group: g, round: { ...r } })}>Sửa</button>
                    <button className="btn danger small" onClick={async () => { if (confirm('Xóa kỳ này? Giao dịch gương trong sổ cũng bị xóa.')) { await deleteHuiRound(r.id); load(); } }}>Xóa</button>
                  </span>
                </div>
              ))}

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
                <input type="number" required min="1" value={editingGroup.amount_per_period} onChange={e => setEditingGroup({ ...editingGroup, amount_per_period: e.target.value })} placeholder="VD: 1000000" /></label>
              <div className="grid2" style={{ gap: 8 }}>
                <label className="field"><span>Tổng số chân</span>
                  <input type="number" required min="1" value={editingGroup.total_shares} onChange={e => setEditingGroup({ ...editingGroup, total_shares: e.target.value })} /></label>
                <label className="field"><span>Số chân của mình</span>
                  <input type="number" required min="1" value={editingGroup.my_shares} onChange={e => setEditingGroup({ ...editingGroup, my_shares: e.target.value })} /></label>
                <label className="field"><span>Tổng số kỳ</span>
                  <input type="number" required min="1" value={editingGroup.total_periods} onChange={e => setEditingGroup({ ...editingGroup, total_periods: e.target.value })} /></label>
                <label className="field"><span>Tiền thầu / lần hốt (đ)</span>
                  <input type="number" min="0" value={editingGroup.fee} onChange={e => setEditingGroup({ ...editingGroup, fee: e.target.value })} /></label>
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
                <input type="number" min="0" value={roundFor.round.my_contribution}
                  onChange={e => setRoundFor({ ...roundFor, round: { ...roundFor.round, my_contribution: e.target.value } })} /></label>
              <label className="field"><span>Mình hốt kỳ này (đ) — 0 nếu không phải mình</span>
                <input type="number" min="0" value={roundFor.round.my_withdrawal}
                  onChange={e => setRoundFor({ ...roundFor, round: { ...roundFor.round, my_withdrawal: e.target.value } })} /></label>
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
