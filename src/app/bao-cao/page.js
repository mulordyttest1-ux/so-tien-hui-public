'use client';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import { fetchTransactions, fetchTags } from '../../lib/data';
import { fmtVND, todayISO } from '../../lib/format';

function aggregate(txs, key, tags) {
  const map = new Map();
  for (const t of txs) {
    const id = t[key] || '__none__';
    if (!map.has(id)) map.set(id, { thu: 0, chi: 0 });
    map.get(id)[t.type] += Number(t.amount);
  }
  return [...map.entries()].map(([id, v]) => ({
    name: id === '__none__' ? '(chưa gắn)' : (tags.find(x => x.id === id)?.name || '(đã xóa)'),
    ...v, rong: v.thu - v.chi,
  })).sort((a, b) => Math.abs(b.rong) - Math.abs(a.rong));
}

export default function BaoCaoPage() {
  const { user, loading } = useRequireAuth();
  const [txs, setTxs] = useState([]);
  const [tags, setTags] = useState({ persons: [], categories: [], sources: [] });
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchTransactions(), fetchTags()])
      .then(([t, tg]) => { setTxs(t); setTags(tg); setReady(true); })
      .catch(e => alert(e.message));
  }, [user]);

  const monthTxs = useMemo(() => txs.filter(t => t.date.startsWith(month)), [txs, month]);
  const byPerson = useMemo(() => aggregate(monthTxs, 'person_id', tags.persons), [monthTxs, tags]);
  const byCategory = useMemo(() => aggregate(monthTxs, 'category_id', tags.categories), [monthTxs, tags]);
  const bySource = useMemo(() => aggregate(monthTxs.filter(t => t.type === 'thu'), 'source_id', tags.sources), [monthTxs, tags]);

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  const renderTable = (rows, showChi = true) => (
    <table className="report">
      <thead><tr><th>Tên</th><th>Thu</th>{showChi && <th>Chi</th>}<th>Ròng</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.name}</td>
            <td className="thu">{fmtVND(r.thu)}</td>
            {showChi && <td className="chi">{fmtVND(r.chi)}</td>}
            <td><b>{fmtVND(r.rong)}</b></td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={4} className="muted">Chưa có dữ liệu tháng này.</td></tr>}
      </tbody>
    </table>
  );

  return (
    <AppShell userEmail={user.email}>
      <label className="field"><span>Tháng báo cáo</span>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
      </label>
      {!ready ? <div className="loading">Đang tải báo cáo…</div> : (<>
        <div className="card">
          <h3>Theo người — ai thu, ai chi (cùng 1 người có cả 2)</h3>
          {renderTable(byPerson)}
        </div>
        <div className="card">
          <h3>Theo hạng mục</h3>
          {renderTable(byCategory)}
        </div>
        <div className="card">
          <h3>Thu theo nguồn tiền (khoản A, B, C…)</h3>
          {renderTable(bySource, false)}
        </div>
        <p className="muted">
          Tổng quan ngày / tuần / tháng nằm ở tab Tổng quan. Báo cáo biểu đồ, xuất file và
          ngân sách là giai đoạn 3.
        </p>
      </>)}
    </AppShell>
  );
}
