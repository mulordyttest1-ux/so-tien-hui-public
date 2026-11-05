'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '../components/AppShell';
import { useRequireAuth } from '../components/useRequireAuth';
import { fetchTransactions, fetchHui } from '../lib/data';
import { fetchTags } from '../lib/data';
import { fetchPayments, isSettled, isPendingTx } from '../lib/payments';
import { fetchRecurringItems, upcomingItems } from '../lib/recurring';
import { fetchTodos } from '../lib/todos';
import { fmtVND, todayISO, thisWeekRange, thisMonthRange, inRange, sumByType, calcHuiGroup } from '../lib/format';

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const [txs, setTxs] = useState([]);
  const [hui, setHui] = useState({ groups: [], rounds: [] });
  const [tags, setTags] = useState({ persons: [], categories: [], sources: [] });
  const [payments, setPayments] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [todos, setTodos] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchTransactions(), fetchHui(), fetchTags(), fetchPayments(), fetchRecurringItems(), fetchTodos()])
      .then(([t, h, tg, pay, rec, td]) => { setTxs(t); setHui(h); setTags(tg); setPayments(pay); setRecurring(rec); setTodos(td); setReady(true); })
      .catch(e => alert('Không tải được dữ liệu: ' + e.message));
  }, [user]);

  if (loading || !user) return <div className="loading">Đang tải…</div>;
  if (!ready) return <AppShell userEmail={user.email}><div className="loading">Đang tải sổ…</div></AppShell>;

  const today = todayISO();
  const week = thisWeekRange();
  const month = thisMonthRange();
  // Chi tinh tien DA CHOT vao cac con so chinh; tien cho xac nhan tach rieng.
  const settledTxs = txs.filter(isSettled);
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const pendingTotal = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const monthTxs = settledTxs.filter(t => inRange(t.date, month));
  const monthThu = sumByType(monthTxs, 'thu');
  const monthChi = sumByType(monthTxs, 'chi');
  const todayTxs = settledTxs.filter(t => t.date === today);
  const weekTxs = settledTxs.filter(t => inRange(t.date, week));
  const personName = id => tags.persons.find(p => p.id === id)?.name || '';
  const catName = id => tags.categories.find(c => c.id === id)?.name || '';
  // Nhac nho dinh ky: chi khi con <= 3 ngay nua hoac da qua han.
  // (Truoc day la 30 ngay nen cac khoan con 16-20 ngay van hien.)
  const upcoming = upcomingItems(recurring, 3);
  const hasOverdue = upcoming.some(u => u.diff < 0);

  return (
    <AppShell userEmail={user.email}>
      {pendingPayments.length > 0 && (
        <div className="card" style={{ border: '2px solid #d97706', background: '#fffbeb' }}>
          <b>⏳ {pendingPayments.length} lệnh chuyển khoản đang chờ xác nhận</b>
          <span className="muted"> — tổng {fmtVND(pendingTotal)} chưa tính vào các số bên dưới. </span>
          <Link href="/ngan-hang">Chốt ngay →</Link>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="card" style={hasOverdue ? { border: '2px solid #dc2626' } : { border: '2px solid #d97706', background: '#fffbeb' }}>
          <h3>🔔 Sắp đến hạn</h3>
          {upcoming.map((u, i) => (
            <div className="row" key={u.item.id + u.type + i}>
              <span>{u.item.name}
                <br /><span className="muted">
                  {u.type === 'maturity' ? 'Gốc đáo hạn' : 'Kỳ tới'} · {u.date}
                  {u.diff < 0 ? ` · Quá hạn ${-u.diff} ngày` : u.diff === 0 ? ' · Hôm nay' : ` · Sau ${u.diff} ngày`}
                </span>
              </span>
              <span className="chi">− {fmtVND(u.amount)}</span>
            </div>
          ))}
          <Link href="/dinh-ky">Vào Định kỳ để đóng →</Link>
        </div>
      )}
      <div className="card">
        <h3>📱 Nút Quét QR ngoài màn hình chính iPhone</h3>
        <p className="muted" style={{ lineHeight: 1.8 }}>
          Muốn bấm một cái ngoài màn hình chính là quét ngay? Mở trang Quét QR bằng Safari rồi
          Chia sẻ → Thêm vào Màn hình chính (hướng dẫn chi tiết ở trong trang đó).
        </p>
        <Link className="btn" href="/quet-qr">📷 Mở trang Quét QR</Link>
      </div>
      <div className="card">
        <div className="muted">Còn lại tháng này</div>
        <div className="big">{fmtVND(monthThu - monthChi)}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <span className="thu">Thu {fmtVND(monthThu)}</span>
          <span className="chi">Chi {fmtVND(monthChi)}</span>
        </div>
      </div>

      {/* Dashboard: luoi o chuc nang — moi muc 1 o, them bao nhieu muc
          cung khong chat bot bar vi bot bar chi hien muc hay mo nhat. */}
      <div className="card">
        <h3>🧭 Chức năng</h3>
        <div className="grid2">
          {[
            { href: '/so-tien', icon: '💰', name: 'Thu Chi', hint: `Tháng này thu ${fmtVND(monthThu)} · chi ${fmtVND(monthChi)}` },
            { href: '/hui', icon: '🔄', name: 'Quỹ Nhóm', hint: hui.groups.length ? `${hui.groups.length} dây đang chạy` : 'Chưa có dây hụi' },
            { href: '/ngan-hang', icon: '🏦', name: 'Ngân hàng', hint: pendingPayments.length ? `${pendingPayments.length} lệnh chờ xác nhận` : 'Không có lệnh chờ' },
            { href: '/dinh-ky', icon: '🔁', name: 'Định kỳ', hint: upcoming.length ? `${upcoming.length} khoản sắp đến hạn` : 'Không có khoản sắp đến hạn' },
            { href: '/tinh-nhanh', icon: '🧮', name: 'Tính nhanh', hint: 'Lãi, quy đổi, tính theo ngày' },
            { href: '/bao-cao', icon: '📊', name: 'Báo cáo', hint: 'Tổng quan theo tháng' },
            { href: '/quet-qr', icon: '📷', name: 'Quét QR', hint: 'Quét mã để chuyển tiền' },
            { href: '/chuyen-nhanh', icon: '⚡', name: 'Chuyển nhanh', hint: 'Chuyển tiền không cần quét' },
            { href: '/viec-can-lam', icon: '✅', name: 'Việc cần làm', hint: todos.filter(t => !t.done).length ? `${todos.filter(t => !t.done).length} việc chưa xong` : 'Chưa có việc nào' },
            { href: '/tro-ly', icon: '🤖', name: 'Trợ lý', hint: 'Hỏi về sổ, hạn đóng, quỹ nhóm…' },
            { href: 'https://muse.ai', icon: '💬', name: 'Nhờ Muse', hint: 'Mở Muse để hỏi / nhờ làm', external: true },
          ].map(t => (
            <Link key={t.href} href={t.href} className="card"
              {...(t.external ? { target: '_blank', rel: 'noopener' } : {})}
              style={{ textAlign: 'center', textDecoration: 'none', color: 'inherit', margin: 0 }}>
              <div style={{ fontSize: 28 }}>{t.icon}</div>
              <div><b>{t.name}</b></div>
              <div className="muted" style={{ fontSize: 13 }}>{t.hint}</div>
            </Link>
          ))}
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
          <h3>Quỹ nhóm đang chạy</h3>
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
              {t.status === 'pending' && <span className="badge-pending" style={{ marginLeft: 6 }}>Chờ xác nhận</span>}
              {t.status === 'voided' && <span className="badge-void" style={{ marginLeft: 6 }}>Đã hủy</span>}
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
