'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '../components/AppShell';
import { useRequireAuth } from '../components/useRequireAuth';
import { fetchTransactions, fetchHui } from '../lib/data';
import { fetchTags } from '../lib/data';
import { fmtVND, todayISO, thisWeekRange, thisMonthRange, inRange, sumByType, calcHuiGroup } from '../lib/format';

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const [txs, setTxs] = useState([]);
  const [hui, setHui] = useState({ groups: [], rounds: [] });
  const [tags, setTags] = useState({ persons: [], categories: [], sources: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchTransactions(), fetchHui(), fetchTags()])
      .then(([t, h, tg]) => { setTxs(t); setHui(h); setTags(tg); setReady(true); })
      .catch(e => alert('Không tải được dữ liệu: ' + e.message));
  }, [user]);

  if (loading || !user) return <div className="loading">Đang tải…</div>;
  if (!ready) return <AppShell userEmail={user.email}><div className="loading">Đang tải sổ…</div></AppShell>;

  const today = todayISO();
  const week = thisWeekRange();
  const month = thisMonthRange();
  const monthTxs = txs.filter(t => inRange(t.date, month));
  const monthThu = sumByType(monthTxs, 'thu');
  const monthChi = sumByType(monthTxs, 'chi');
  const todayTxs = txs.filter(t => t.date === today);
  const weekTxs = txs.filter(t => inRange(t.date, week));
  const personName = id => tags.persons.find(p => p.id === id)?.name || '';
  const catName = id => tags.categories.find(c => c.id === id)?.name || '';

  return (
    <AppShell userEmail={user.email}>
      <div className="card">
        <div className="muted">Còn lại tháng này</div>
        <div className="big">{fmtVND(monthThu - monthChi)}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <span className="thu">Thu {fmtVND(monthThu)}</span>
          <span className="chi">Chi {fmtVND(monthChi)}</span>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Hôm nay</h3>
          <div className="thu">+ {fmtVND(sumByType(todayTxs, 'thu'))}</div>
          <div className="chi">− {fmtVND(sumByType(todayTxs, 'chi'))}</div>
        </div>
        <div className="card">
          <h3>Tuần này</h3>
          <div className="thu">+ {fmtVND(sumByType(weekTxs, 'thu'))}</div>
          <div className="chi">− {fmtVND(sumByType(weekTxs, 'chi'))}</div>
        </div>
      </div>

      {hui.groups.length > 0 && (
        <div className="card">
          <h3>Hụi đang chạy</h3>
          {hui.groups.map(g => {
            const c = calcHuiGroup(g, hui.rounds.filter(r => r.group_id === g.id));
            return (
              <div className="row" key={g.id}>
                <span>{g.name}<br />
                  <span className="muted">Đã đóng {fmtVND(c.daDong)} · Đã hốt {fmtVND(c.daHot)}</span>
                </span>
                <span className={c.loiLoDuKien >= 0 ? 'thu' : 'chi'}>
                  {c.loiLoDuKien >= 0 ? 'Lời ' : 'Lỗ '}{fmtVND(Math.abs(c.loiLoDuKien))}
                </span>
              </div>
            );
          })}
          <Link href="/hui">Xem chi tiết hụi →</Link>
        </div>
      )}

      <div className="card">
        <h3>Ghi gần đây</h3>
        {txs.length === 0 && <div className="empty">Chưa có khoản nào. Bấm “Sổ tiền” để ghi khoản đầu tiên.</div>}
        {txs.slice(0, 8).map(t => (
          <div className="row" key={t.id}>
            <span>
              {t.note || catName(t.category_id) || (t.type === 'thu' ? 'Khoản thu' : 'Khoản chi')}
              <br /><span className="muted">{t.date}{personName(t.person_id) ? ' · ' + personName(t.person_id) : ''}{catName(t.category_id) ? ' · ' + catName(t.category_id) : ''}</span>
            </span>
            <span className={t.type === 'thu' ? 'thu' : 'chi'}>
              {t.type === 'thu' ? '+' : '−'} {fmtVND(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
