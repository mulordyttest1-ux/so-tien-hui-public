'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import TagSelect from '../../components/TagSelect';
import MoneyInput from '../../components/MoneyInput';
import { supabase } from '../../lib/supabaseClient';
import { fetchTransactions, fetchTags } from '../../lib/data';
import { fetchBankAccounts, createPayment, findSimilarPayments, isSettled, isPendingTx } from '../../lib/payments';
import { cleanMemo } from '../../lib/vietqr';
import { fmtVND, todayISO } from '../../lib/format';

const EMPTY = { type: 'chi', amount: '', date: todayISO(), person_id: null, category_id: null, source_id: null, note: '' };

export default function SoTienPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [txs, setTxs] = useState([]);
  const [tags, setTags] = useState({ persons: [], categories: [], sources: [] });
  const [accounts, setAccounts] = useState([]);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(null); // null | tx object (id rỗng = mới)
  const [payMode, setPayMode] = useState(false);
  const [payAccountId, setPayAccountId] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [fType, setFType] = useState('');
  const [fPerson, setFPerson] = useState('');
  const [fCat, setFCat] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    const [t, tg, acc] = await Promise.all([fetchTransactions(), fetchTags(), fetchBankAccounts()]);
    setTxs(t); setTags(tg); setAccounts(acc); setReady(true);
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  const filtered = useMemo(() => txs.filter(t =>
    t.date.startsWith(month) &&
    (!fType || t.type === fType) &&
    (!fPerson || t.person_id === fPerson) &&
    (!fCat || t.category_id === fCat) &&
    (!search || (t.note || '').toLowerCase().includes(search.toLowerCase()))
  ), [txs, month, fType, fPerson, fCat, search]);

  // Chi tinh tien DA CHOT vao tong chinh; tien cho xac nhan / da huy tach rieng.
  const settled = filtered.filter(isSettled);
  const pending = filtered.filter(isPendingTx);
  const totalThu = settled.filter(t => t.type === 'thu').reduce((s, t) => s + Number(t.amount), 0);
  const totalChi = settled.filter(t => t.type === 'chi').reduce((s, t) => s + Number(t.amount), 0);
  const pendingChi = pending.filter(t => t.type === 'chi').reduce((s, t) => s + Number(t.amount), 0);
  const pendingThu = pending.filter(t => t.type === 'thu').reduce((s, t) => s + Number(t.amount), 0);
  const name = (list, id) => list.find(x => x.id === id)?.name || '';

  async function save(e) {
    e.preventDefault();
    if (!editing.amount || Number(editing.amount) < 1) { alert('Nhập số tiền lớn hơn 0.'); return; }
    // Khoan gan lenh CK: chi duoc bo sung truong mo ta (nguoi/hang muc/nguon/ghi chu).
    // So tien / ngay / loai khoa theo lenh chuyen that, sua la so lech voi ngan hang.
    if (editing.id && editing.payment_id) {
      const payload = {
        person_id: editing.person_id || null, category_id: editing.category_id || null,
        source_id: editing.source_id || null, note: editing.note || '',
      };
      try {
        const { data, error } = await supabase.from('transactions').update(payload).eq('id', editing.id).select().single();
        if (error) throw error;
        setTxs(prev => [data, ...prev.filter(t => t.id !== data.id)]);
        setEditing(null); await load();
      } catch (err) { alert('Không lưu được: ' + err.message); }
      return;
    }
    // Khoan chi moi + che do chuyen khoan: khong luu thang ma qua man hinh xem lai.
    if (payMode && !editing.id && editing.type === 'chi') {
      if (!payAccountId) { alert('Chọn tài khoản ngân hàng nhận tiền.'); return; }
      if (!editing.person_id) { alert('Chọn người nhận tiền (trường Người).'); return; }
      const similar = await findSimilarPayments(editing.person_id, Number(editing.amount)).catch(() => []);
      if (similar.length > 0 && !confirm(`Đã có ${similar.length} lệnh gần đây cho người này với đúng số tiền này trong 24h qua. Có thể bạn bấm trùng — vẫn tạo lệnh mới?`)) return;
      setShowReview(true);
      return;
    }
    const payload = {
      user_id: user.id, type: editing.type, amount: Number(editing.amount),
      date: editing.date, person_id: editing.person_id || null,
      category_id: editing.category_id || null, source_id: editing.source_id || null,
      note: editing.note || '',
    };
    try {
      let saved = null;
      if (editing.id) {
        const { data, error } = await supabase.from('transactions').update(payload).eq('id', editing.id).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase.from('transactions').insert(payload).select().single();
        if (error) throw error;
        saved = data;
      }
      // Cập nhật danh sách ngay tại chỗ bằng chính bản ghi server vừa trả về,
      // rồi tải lại toàn bộ để đồng bộ (không phụ thuộc cache).
      if (saved) setTxs(prev => [saved, ...prev.filter(t => t.id !== saved.id)]);
      setEditing(null); await load();
    } catch (err) { alert('Không lưu được: ' + err.message); }
  }

  async function remove(tx) {
    // Khoan gan lenh chuyen khoan khong duoc sua/xoa rieng le (kiem toan):
    // phai chot/huy lenh o tab Ngan hang, so moi khong lech.
    if (tx.payment_id) { alert('Khoản này gắn với lệnh chuyển khoản — hãy chốt hoặc hủy lệnh ở tab Ngân hàng, không xóa riêng ở đây.'); return; }
    if (!confirm('Xóa khoản này?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
    if (error) alert(error.message); else load();
  }

  async function createBankPayment() {
    setPayBusy(true);
    try {
      const memo = cleanMemo(editing.note) || 'Chuyen khoan';
      const pay = await createPayment({
        userId: user.id, personId: editing.person_id, bankAccountId: payAccountId,
        amount: Number(editing.amount), memo, date: editing.date,
        categoryId: editing.category_id, sourceId: editing.source_id,
        note: editing.note || '', launchMethod: 'qr',
      });
      setShowReview(false); setEditing(null); setPayMode(false);
      router.push(`/chuyen-khoan/${pay.id}`);
    } catch (err) { alert('Không tạo được lệnh: ' + err.message); }
    finally { setPayBusy(false); }
  }

  function addTagTo(listKey) {
    return rec => setTags(prev => ({ ...prev, [listKey]: [...prev[listKey].filter(x => x.id !== rec.id), rec].sort((a, b) => a.name.localeCompare(b.name)) }));
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      <div className="filters">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <select value={fType} onChange={e => setFType(e.target.value)}>
          <option value="">Thu + Chi</option><option value="thu">Chỉ thu</option><option value="chi">Chỉ chi</option>
        </select>
        <select value={fPerson} onChange={e => setFPerson(e.target.value)}>
          <option value="">Mọi người</option>
          {tags.persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={fCat} onChange={e => setFCat(e.target.value)}>
          <option value="">Mọi hạng mục</option>
          {tags.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="search" placeholder="Tìm trong ghi chú…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span className="thu">Thu {fmtVND(totalThu)}</span>
          <span className="chi">Chi {fmtVND(totalChi)}</span>
          <span><b>Còn {fmtVND(totalThu - totalChi)}</b></span>
        </div>
        {(pendingThu > 0 || pendingChi > 0) && (
          <div className="muted" style={{ marginTop: 4 }}>
            Chờ xác nhận (chưa tính vào số trên): thu {fmtVND(pendingThu)} · chi {fmtVND(pendingChi)} — xem ở tab Ngân hàng.
          </div>
        )}
      </div>

      {!ready ? <div className="loading">Đang tải sổ…</div>
        : filtered.length === 0 ? <div className="empty">Không có khoản nào khớp bộ lọc.</div>
        : filtered.map(t => (
          <div className="card" key={t.id} style={{ padding: '10px 16px' }}>
            <div className="row" style={{ border: 'none', padding: 0 }}>
              <span>
                {t.note || name(tags.categories, t.category_id) || (t.type === 'thu' ? 'Khoản thu' : 'Khoản chi')}
                {t.status === 'pending' && <span className="badge-pending" style={{ marginLeft: 6 }}>Chờ xác nhận</span>}
                {t.status === 'voided' && <span className="badge-void" style={{ marginLeft: 6 }}>Đã hủy</span>}
                <br /><span className="muted">
                  {t.date}
                  {name(tags.persons, t.person_id) && ' · ' + name(tags.persons, t.person_id)}
                  {name(tags.categories, t.category_id) && ' · ' + name(tags.categories, t.category_id)}
                  {name(tags.sources, t.source_id) && ' · Nguồn: ' + name(tags.sources, t.source_id)}
                  {t.hui_group_id ? ' · (từ Hụi)' : ''}
                </span>
              </span>
              <span className={t.type === 'thu' ? 'thu' : 'chi'}>{t.type === 'thu' ? '+' : '−'} {fmtVND(t.amount)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button className="btn secondary small" onClick={() => {
                setEditing({ ...t, amount: String(t.amount) });
              }}>Sửa</button>
              <button className="btn danger small" onClick={() => remove(t)}>Xóa</button>
              {t.payment_id && <a className="btn secondary small" href={`/chuyen-khoan/${t.payment_id}`}>Mở lệnh CK</a>}
            </div>
          </div>
        ))}

      {showReview && editing && (() => {
        const acc = accounts.find(a => a.id === payAccountId);
        return (
          <div className="modal-bg modal-top" onClick={() => setShowReview(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Xem lại trước khi chuyển</h2>
              <p className="muted" style={{ lineHeight: 1.8 }}>
                Số tiền: <b>{fmtVND(editing.amount)}</b><br />
                Cho: <b>{name(tags.persons, editing.person_id)}</b><br />
                {acc ? (<>Ngân hàng: <b>{acc.bank_name}</b><br />Số TK: <b>{acc.account_number}</b><br />
                {acc.holder_name ? (<>Chủ TK: <b>{acc.holder_name}</b><br /></>) : null}
                {acc.note ? (<>Ghi chú TK: {acc.note}<br /></>) : null}</>) : null}
                Nội dung chuyển khoản: <b>{cleanMemo(editing.note) || 'Chuyen khoan'}</b><br />
                Ngày: {editing.date}
              </p>
              <p className="muted">
                Bấm “Tạo lệnh” là app sẽ ghi ngay khoản này vào sổ ở trạng thái <b>Chờ xác nhận</b>
                (chưa tính vào số đã chốt) và mở màn hình mã QR để bạn chuyển bên app ngân hàng.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowReview(false)}>Quay lại sửa</button>
                <button type="button" className="btn" disabled={payBusy} onClick={createBankPayment}>Tạo lệnh &amp; mở app ngân hàng</button>
              </div>
            </div>
          </div>
        );
      })()}

      <button className="fab" aria-label="Ghi khoản mới" onClick={() => { setEditing({ ...EMPTY }); setPayMode(false); setPayAccountId(''); }}>+</button>

      {editing && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing.id ? 'Sửa khoản' : 'Ghi khoản mới'}</h2>
            {editing.payment_id && (
              <p className="muted">
                Khoản này gắn với lệnh chuyển khoản — chỉ bổ sung được người / hạng mục / nguồn / ghi chú.
                Số tiền, ngày và loại thu/chi đã khóa theo lệnh chuyển thật.
              </p>
            )}
            <form onSubmit={save}>
              <div className="seg">
                <button type="button" disabled={!!editing.payment_id} className={editing.type === 'thu' ? 'on-thu' : ''} onClick={() => setEditing({ ...editing, type: 'thu' })}>Thu vào</button>
                <button type="button" disabled={!!editing.payment_id} className={editing.type === 'chi' ? 'on-chi' : ''} onClick={() => setEditing({ ...editing, type: 'chi' })}>Chi ra</button>
              </div>
              <label className="field"><span>Số tiền (đ)</span>
                {editing.payment_id
                  ? <div><b>{fmtVND(editing.amount)}</b> <span className="muted">(đã khóa theo lệnh CK)</span></div>
                  : <MoneyInput value={editing.amount}
                    onChange={v => setEditing({ ...editing, amount: v })} placeholder="VD: 500.000" />}
              </label>
              <label className="field"><span>Ngày</span>
                <input type="date" required disabled={!!editing.payment_id} value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
              </label>
              <TagSelect label="Người" table="persons" items={tags.persons} userId={user.id}
                value={editing.person_id} onChange={v => setEditing({ ...editing, person_id: v })} onCreated={addTagTo('persons')} />
              <TagSelect label="Hạng mục" table="categories" items={tags.categories} userId={user.id}
                value={editing.category_id} onChange={v => setEditing({ ...editing, category_id: v })} onCreated={addTagTo('categories')} />
              <TagSelect label="Nguồn tiền" table="sources" items={tags.sources} userId={user.id}
                value={editing.source_id} onChange={v => setEditing({ ...editing, source_id: v })} onCreated={addTagTo('sources')} />
              <label className="field"><span>Ghi chú</span>
                <input value={editing.note || ''} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder="VD: tiền học cho con" />
              </label>
              {!editing.id && editing.type === 'chi' && (
                <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={payMode}
                    onChange={e => { setPayMode(e.target.checked); if (!e.target.checked) setShowReview(false); }} />
                  <span style={{ fontSize: 14 }}>Thanh toán khoản này qua ngân hàng (tạo mã VietQR)</span>
                </label>
              )}
              {payMode && !editing.id && editing.type === 'chi' && (
                <label className="field"><span>Tài khoản nhận tiền</span>
                  <select value={payAccountId} onChange={e => setPayAccountId(e.target.value)}>
                    <option value="">— Chọn tài khoản —</option>
                    {accounts.filter(a => !editing.person_id || a.person_id === editing.person_id).map(a => (
                      <option key={a.id} value={a.id}>
                        {a.bank_name} · {a.account_number}{a.holder_name ? ` (${a.holder_name})` : ''}{a.note ? ` — ${a.note}` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="muted">Chỉ hiện tài khoản của người đã chọn ở trên. Chưa có tài khoản thì vào tab Ngân hàng để thêm (quét QR hoặc nhập tay).</span>
                </label>
              )}
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Hủy</button>
                <button type="submit" className="btn">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
