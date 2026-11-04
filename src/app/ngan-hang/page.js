'use client';
// Tab Ngan hang: quan ly tai khoan da luu (gan theo nguoi) + lich su chuyen khoan.
// Lenh pending luon hien dau tien, ke ca khi da qua 7 ngay (banner can chot ngay).
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import TransferHistory from '../../components/TransferHistory';
import { supabase } from '../../lib/supabaseClient';
import { fetchTags } from '../../lib/data';
import { fetchBankAccounts, fetchPayments, pendingAgeLabel } from '../../lib/payments';
import { BANKS, bankByCode, parseVietQR } from '../../lib/vietqr';
import { fmtVND } from '../../lib/format';

const EMPTY_ACC = { person_id: '', bank_code: 'VCB', account_number: '', holder_name: '', note: '' };

export default function NganHangPage() {
  const { user, loading } = useRequireAuth();
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [persons, setPersons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fPerson, setFPerson] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [qrPaste, setQrPaste] = useState('');

  async function load() {
    const [acc, pay, tg, grp] = await Promise.all([
      fetchBankAccounts(), fetchPayments(), fetchTags(),
      supabase.from('hui_groups').select('id,name'),
    ]);
    setAccounts(acc); setPayments(pay); setPersons(tg.persons);
    setGroups(grp.data || []); setReady(true);
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  const pending = useMemo(() => payments.filter(p => p.status === 'pending'), [payments]);
  const overdue = useMemo(() => pending.filter(p => pendingAgeLabel(p.created_at) === 'over7'), [pending]);
  const filtered = useMemo(() => payments.filter(p =>
    (!fPerson || p.person_id === fPerson) && (!fStatus || p.status === fStatus)
  ), [payments, fPerson, fStatus]);

  async function saveAccount(e) {
    e.preventDefault();
    const bank = bankByCode(editing.bank_code);
    if (!bank) { alert('Chưa chọn ngân hàng.'); return; }
    if (!editing.account_number.replace(/\D/g, '')) { alert('Nhập số tài khoản.'); return; }
    const payload = {
      user_id: user.id, person_id: editing.person_id || null,
      bank_code: bank.code, bank_bin: bank.bin, bank_name: bank.name,
      account_number: editing.account_number.replace(/\D/g, ''),
      holder_name: editing.holder_name || '', note: editing.note || '',
    };
    try {
      if (editing.id) {
        const { error } = await supabase.from('bank_accounts').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bank_accounts').insert(payload);
        if (error) throw error;
      }
      setEditing(null); await load();
    } catch (err) { alert('Không lưu được tài khoản: ' + err.message); }
  }

  async function removeAccount(a) {
    const used = payments.some(p => p.bank_account_id === a.id);
    if (used && !confirm('Tài khoản này đã có lệnh chuyển khoản gắn kèm. Xóa tài khoản thì các lệnh cũ sẽ hiện "(tài khoản đã xóa)" nhưng không mất log. Vẫn xóa?')) return;
    if (!used && !confirm('Xóa tài khoản này?')) return;
    const { error } = await supabase.from('bank_accounts').delete().eq('id', a.id);
    if (error) alert(error.message); else load();
  }

  function pasteQr() {
    const r = parseVietQR(qrPaste);
    if (!r.bin || !r.accountNumber) { alert('Không đọc được mã QR này (thiếu ngân hàng hoặc số tài khoản).'); return; }
    const bank = BANKS.find(b => b.bin === r.bin);
    setEditing({
      ...EMPTY_ACC,
      bank_code: bank ? bank.code : 'VCB',
      account_number: r.accountNumber,
      note: r.memo ? `Từ mã QR: ${r.memo}` : '',
    });
    if (!r.crcOk) alert('Lưu ý: mã QR này sai checksum (có thể đã bị sửa). Hãy kiểm tra lại số tài khoản trước khi dùng.');
    setQrPaste('');
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      {overdue.length > 0 && (
        <div className="card" style={{ border: '2px solid #c2410c', background: '#fff7ed' }}>
          <b>⚠️ Có {overdue.length} lệnh chờ xác nhận đã quá 7 ngày.</b>
          <div className="muted">Hãy chốt (đã chuyển / hủy) ngay để sổ không bị treo. Tiền chờ xác nhận không tính vào số đã chốt.</div>
        </div>
      )}
      {pending.length > 0 && overdue.length === 0 && (
        <div className="card" style={{ border: '2px solid #d97706', background: '#fffbeb' }}>
          <b>⏳ {pending.length} lệnh đang chờ xác nhận</b>
          <span className="muted"> — tổng {fmtVND(pending.reduce((s, p) => s + Number(p.amount), 0))} chưa tính vào số đã chốt.</span>
        </div>
      )}

      <div className="card">
        <h3>Tài khoản ngân hàng đã lưu</h3>
        <p className="muted">Mỗi tài khoản gắn với 1 người (người nhận tiền). Chủ tài khoản có thể khác người đó — ví dụ tài khoản của chị B, kế toán của chị C.</p>
        {accounts.length === 0 && <div className="empty">Chưa có tài khoản nào. Bấm + để thêm.</div>}
        {accounts.map(a => (
          <div className="row" key={a.id}>
            <span><b>{a.bank_name}</b> · {a.account_number}
              <br /><span className="muted">
                {a.holder_name ? `Chủ TK: ${a.holder_name}` : ''}
                {persons.find(p => p.id === a.person_id) ? ` · Nhận cho: ${persons.find(p => p.id === a.person_id).name}` : ''}
                {a.note ? ` · ${a.note}` : ''}
              </span>
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button className="btn secondary small" onClick={() => setEditing({ ...a })}>Sửa</button>
              <button className="btn danger small" onClick={() => removeAccount(a)}>Xóa</button>
            </span>
          </div>
        ))}
        <button className="btn small" style={{ marginTop: 8 }} onClick={() => setEditing({ ...EMPTY_ACC })}>+ Thêm tài khoản</button>
      </div>

      <div className="card">
        <h3>Lịch sử chuyển khoản</h3>
        <div className="filters">
          <select value={fPerson} onChange={e => setFPerson(e.target.value)}>
            <option value="">Mọi người</option>
            {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="">Mọi trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="voided">Đã hủy</option>
          </select>
        </div>
        {!ready ? <div className="loading">Đang tải…</div>
          : <TransferHistory payments={filtered} accounts={accounts} persons={persons} groups={groups} userId={user.id} onChanged={load} />}
      </div>

      <button className="fab" aria-label="Thêm tài khoản ngân hàng" onClick={() => setEditing({ ...EMPTY_ACC })}>+</button>

      {editing && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing.id ? 'Sửa tài khoản' : 'Thêm tài khoản ngân hàng'}</h2>
            <form onSubmit={saveAccount}>
              <label className="field"><span>Nhận tiền cho người</span>
                <select value={editing.person_id} onChange={e => setEditing({ ...editing, person_id: e.target.value })}>
                  <option value="">(chưa gắn người nào)</option>
                  {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Ngân hàng</span>
                <select value={editing.bank_code} onChange={e => setEditing({ ...editing, bank_code: e.target.value })}>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Số tài khoản</span>
                <input required inputMode="numeric" value={editing.account_number}
                  onChange={e => setEditing({ ...editing, account_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="Chỉ nhập số" />
              </label>
              <label className="field"><span>Tên chủ tài khoản (đúng tên ngân hàng)</span>
                <input value={editing.holder_name} onChange={e => setEditing({ ...editing, holder_name: e.target.value })}
                  placeholder="VD: NGUYEN VAN B" />
              </label>
              <label className="field"><span>Ghi chú</span>
                <input value={editing.note || ''} onChange={e => setEditing({ ...editing, note: e.target.value })}
                  placeholder="VD: kế toán của chị C" />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Hủy</button>
                <button type="submit" className="btn">Lưu</button>
              </div>
            </form>
            <div style={{ marginTop: 16 }}>
              <label className="field"><span>Hoặc dán nội dung mã QR VietQR của người nhận</span>
                <input value={qrPaste} onChange={e => setQrPaste(e.target.value)} placeholder="Dán chuỗi mã QR (bắt đầu bằng 000201...)" />
              </label>
              <button type="button" className="btn secondary small" onClick={pasteQr}>Tách thông tin từ mã QR</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
