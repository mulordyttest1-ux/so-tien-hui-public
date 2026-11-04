'use client';
// Chuyen nhanh: chuyen truoc, nhap sau (hoac khong nhap).
// Log chuyen khoan + khoan chi toi thieu (ngay, so tien, noi dung) DU LA khoan chi
// trong so — hom sieng thi vao So tien bo sung hang muc / ghi chu / nguoi.
// Chi khoa so tien / ngay / loai vi da gan voi lenh chuyen that.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import MoneyInput from '../../components/MoneyInput';
import QrScanner from '../../components/QrScanner';
import { supabase } from '../../lib/supabaseClient';
import { fetchTags } from '../../lib/data';
import { fetchBankAccounts, createPayment, findSimilarPayments } from '../../lib/payments';
import { BANKS, bankByCode, parseVietQR, cleanMemo } from '../../lib/vietqr';
import { fmtVND, todayISO, PERSON_KIND_LABELS, personDisplay } from '../../lib/format';

export default function ChuyenNhanhPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [mode, setMode] = useState('saved'); // saved | qr | manual
  const [accountId, setAccountId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);
  const [bankCode, setBankCode] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [personId, setPersonId] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonKind, setNewPersonKind] = useState('nguoi');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [acc, tg] = await Promise.all([fetchBankAccounts(), fetchTags()]);
    setAccounts(acc); setPersons(tg.persons);
    // Di tu nut quet QR tren man hinh chinh: ma QR da doc san, chi viec xu ly.
    try {
      const pending = sessionStorage.getItem('pendingQr');
      if (pending) {
        sessionStorage.removeItem('pendingQr');
        setMode('qr');
        doParseQr(pending, acc);
      }
    } catch { /* bo qua */ }
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  function doParseQr(text, accList) {
    const r = parseVietQR(text);
    if (!r.bin || !r.accountNumber) { alert('Không đọc được mã QR này (thiếu ngân hàng hoặc số tài khoản).'); return; }
    const bank = BANKS.find(b => b.bin === r.bin);
    const list = accList || accounts;
    const existing = list.find(a => a.bank_bin === r.bin && a.account_number === r.accountNumber);
    setQrInfo({ ...r, bankCode: bank ? bank.code : '', existing });
    if (r.amount) setAmount(String(r.amount));
    if (r.memo) setMemo(r.memo);
    if (existing) {
      setAccountId(existing.id);
      if (existing.person_id) setPersonId(existing.person_id);
    } else {
      setBankCode(bank ? bank.code : 'VCB');
      setAccountNumber(r.accountNumber);
      setHolderName('');
    }
    if (!r.crcOk) alert('Lưu ý: mã QR này sai checksum (có thể đã bị sửa). Hãy kiểm tra lại số tài khoản trước khi chuyển.');
  }

  async function ensurePerson() {
    if (personId) return personId;
    if (!newPersonName.trim()) return null;
    const { data, error } = await supabase.from('persons')
      .insert({ user_id: user.id, name: newPersonName.trim(), kind: newPersonKind })
      .select().single();
    if (error) throw error;
    return data.id;
  }

  async function submit() {
    if (!amount || Number(amount) < 1) { alert('Nhập số tiền lớn hơn 0.'); return; }
    setBusy(true);
    try {
      let finalAccountId = accountId;
      let finalPersonId = personId;
      if (mode === 'qr' && qrInfo && !qrInfo.existing) {
        const bank = bankByCode(bankCode);
        if (!bank) throw new Error('Chưa xác định được ngân hàng từ mã QR.');
        finalPersonId = await ensurePerson();
        const { data: acc, error } = await supabase.from('bank_accounts').insert({
          user_id: user.id, person_id: finalPersonId,
          bank_code: bank.code, bank_bin: bank.bin, bank_name: bank.name,
          account_number: accountNumber.replace(/\D/g, ''),
          holder_name: holderName || '', note: 'Lưu từ mã QR quét lần đầu (chủ TK chưa xác minh)',
        }).select().single();
        if (error) throw error;
        finalAccountId = acc.id;
      }
      if (mode === 'manual') {
        const bank = bankByCode(bankCode);
        if (!bank) throw new Error('Chưa chọn ngân hàng.');
        if (!accountNumber.replace(/\D/g, '')) throw new Error('Nhập số tài khoản.');
        finalPersonId = await ensurePerson();
        const { data: acc, error } = await supabase.from('bank_accounts').insert({
          user_id: user.id, person_id: finalPersonId,
          bank_code: bank.code, bank_bin: bank.bin, bank_name: bank.name,
          account_number: accountNumber.replace(/\D/g, ''),
          holder_name: holderName || '', note: '',
        }).select().single();
        if (error) throw error;
        finalAccountId = acc.id;
      }
      if (!finalAccountId) throw new Error('Chưa chọn tài khoản nhận tiền.');
      if (finalPersonId) {
        const similar = await findSimilarPayments(finalPersonId, Number(amount)).catch(() => []);
        if (similar.length > 0 && !confirm(`Đã có ${similar.length} lệnh gần đây cho người này với đúng số tiền này trong 24h qua. Có thể bạn bấm trùng — vẫn tạo lệnh mới?`)) { setBusy(false); return; }
      }
      const pay = await createPayment({
        userId: user.id, personId: finalPersonId, bankAccountId: finalAccountId,
        amount: Number(amount), memo: cleanMemo(memo) || 'Chuyen khoan',
        date: todayISO(), note: memo || '',
        launchMethod: 'qr',
      });
      router.push(`/chuyen-khoan/${pay.id}`);
    } catch (err) { alert('Không tạo được lệnh: ' + err.message); setBusy(false); }
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;
  const selectedAcc = accounts.find(a => a.id === accountId);

  return (
    <AppShell userEmail={user.email}>
      <div className="card">
        <h2>⚡ Chuyển nhanh</h2>
        <p className="muted">
          Chuyển trước, nhập sau. Lệnh chuyển + khoản chi tối thiểu sẽ tự vào sổ ngay;
          hôm nào siêng thì vào Sổ tiền bổ sung hạng mục / ghi chú (ví dụ “mua bao gạo”).
        </p>
        <div className="seg">
          <button type="button" className={mode === 'saved' ? 'on-thu' : ''} onClick={() => setMode('saved')}>TK đã lưu</button>
          <button type="button" className={mode === 'qr' ? 'on-thu' : ''} onClick={() => setMode('qr')}>Quét mã QR</button>
          <button type="button" className={mode === 'manual' ? 'on-thu' : ''} onClick={() => setMode('manual')}>Nhập tay</button>
        </div>

        {mode === 'saved' && (
          <label className="field"><span>Tài khoản nhận tiền</span>
            <select value={accountId} onChange={e => {
              setAccountId(e.target.value);
              const a = accounts.find(x => x.id === e.target.value);
              if (a && a.person_id) setPersonId(a.person_id);
            }}>
              <option value="">— Chọn tài khoản —</option>
              {accounts.map(a => {
                const p = persons.find(x => x.id === a.person_id);
                return (
                  <option key={a.id} value={a.id}>
                    {a.bank_name} · {a.account_number}{a.holder_name ? ` (${a.holder_name})` : ''}{p ? ` — cho: ${personDisplay(p)}` : ''}{a.note ? ` — ${a.note}` : ''}
                  </option>
                );
              })}
            </select>
            {accounts.length === 0 && <span className="muted">Chưa có tài khoản nào — dùng “Dán mã QR” hoặc “Nhập tay” ở trên.</span>}
          </label>
        )}

        {mode === 'qr' && (
          <>
            <button type="button" className="btn" onClick={() => setShowScanner(true)}>📷 Mở camera quét mã QR</button>
            {showScanner && (
              <QrScanner
                onScan={(text) => { setShowScanner(false); doParseQr(text); }}
                onClose={() => setShowScanner(false)}
              />
            )}
            {qrInfo && (
              <p className="muted" style={{ lineHeight: 1.8 }}>
                Đọc được: {qrInfo.bankCode ? bankByCode(qrInfo.bankCode)?.name || qrInfo.bankCode : `BIN ${qrInfo.bin}`} · STK {qrInfo.accountNumber}
                {qrInfo.existing ? ' (tài khoản này đã lưu rồi)' : ' (tài khoản mới — sẽ lưu lại sau khi bạn điền tên chủ TK bên dưới)'}
              </p>
            )}
            {qrInfo && !qrInfo.existing && (
              <label className="field"><span>Tên chủ tài khoản (điền sau khi thấy tên hiện ở app ngân hàng, hoặc để trống)</span>
                <input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="VD: NGUYEN VAN B" />
              </label>
            )}
          </>
        )}

        {mode === 'manual' && (
          <>
            <label className="field"><span>Ngân hàng</span>
              <select value={bankCode} onChange={e => setBankCode(e.target.value)}>
                {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Số tài khoản</span>
              <input inputMode="numeric" value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="Chỉ nhập số" />
            </label>
            <label className="field"><span>Tên chủ tài khoản</span>
              <input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="VD: NGUYEN VAN B" />
            </label>
          </>
        )}

        <label className="field"><span>Số tiền (đ)</span>
          <MoneyInput value={amount} onChange={setAmount} placeholder="VD: 500.000" />
        </label>
        <label className="field"><span>Nội dung / ghi chú (ví dụ: mua bao gạo)</span>
          <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Để trống cũng được, bổ sung sau vẫn được" />
        </label>
        <label className="field"><span>Tiền này cho ai? (không bắt buộc)</span>
          <select value={personId} onChange={e => setPersonId(e.target.value)}>
            <option value="">(không gắn người nào)</option>
            {persons.map(p => <option key={p.id} value={p.id}>{personDisplay(p)}</option>)}
          </select>
        </label>
        {!personId && (
          <div className="grid2" style={{ gap: 8 }}>
            <label className="field"><span>Hoặc tạo đối tác mới</span>
              <input value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="VD: Shop gạo, Cty ABC..." />
            </label>
            <label className="field"><span>Loại đối tác</span>
              <select value={newPersonKind} onChange={e => setNewPersonKind(e.target.value)}>
                {Object.entries(PERSON_KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn" disabled={busy} onClick={submit}>
            Tạo lệnh &amp; mở app ngân hàng
          </button>
        </div>
        {selectedAcc && <p className="muted">Đang chuyển tới: {selectedAcc.bank_name} · {selectedAcc.account_number}{selectedAcc.holder_name ? ` (${selectedAcc.holder_name})` : ''} — {fmtVND(amount || 0)}</p>}
      </div>
    </AppShell>
  );
}
