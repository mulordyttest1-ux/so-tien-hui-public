'use client';
// Man hinh chuyen khoan: ma QR VietQR tu tao + nut mo app ngan hang +
// xac nhan / huy lenh. App KHONG tu biet ngan hang da chuyen xong hay chua:
// nut "Da chuyen" chi co nghia la BAN xac nhan tien da di.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import AppShell from '../../../components/AppShell';
import { useRequireAuth } from '../../../components/useRequireAuth';
import { supabase } from '../../../lib/supabaseClient';
import { fetchTags } from '../../../lib/data';
import { confirmPayment, voidPayment, VOID_REASONS } from '../../../lib/payments';
import { buildVietQR, vietqrDeeplink, DEEPLINK_AUTOFILL, bankByCode } from '../../../lib/vietqr';
import { fmtVND } from '../../../lib/format';

export default function ChuyenKhoanPage() {
  const { user, loading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const [pay, setPay] = useState(null);
  const [account, setAccount] = useState(null);
  const [persons, setPersons] = useState([]);
  const [qrUrl, setQrUrl] = useState('');
  const [qrError, setQrError] = useState('');
  const [busy, setBusy] = useState(false);
  const [voidReason, setVoidReason] = useState('abandoned');
  const [showVoid, setShowVoid] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p, error } = await supabase.from('payments').select('*').eq('id', params.id).single();
      if (error || !p) { alert('Không tìm thấy lệnh chuyển khoản.'); router.replace('/ngan-hang'); return; }
      setPay(p);
      const tg = await fetchTags();
      setPersons(tg.persons);
      if (p.bank_account_id) {
        const { data: a } = await supabase.from('bank_accounts').select('*').eq('id', p.bank_account_id).single();
        setAccount(a || null);
      }
    })().catch(e => alert(e.message));
  }, [user, params.id]);

  useEffect(() => {
    if (!pay || !account) return;
    try {
      const payload = buildVietQR({
        bin: account.bank_bin, accountNumber: account.account_number,
        amount: pay.amount, memo: pay.memo,
      });
      QRCode.toDataURL(payload, { width: 260, margin: 2 }).then(setQrUrl).catch(e => setQrError(e.message));
    } catch (e) { setQrError(e.message); }
  }, [pay, account]);

  if (loading || !user) return <div className="loading">Đang tải…</div>;
  if (!pay) return <div className="loading">Đang tải lệnh…</div>;

  const personName = persons.find(p => p.id === pay.person_id)?.name || '';
  const deeplink = account ? vietqrDeeplink({
    bankCode: account.bank_code, accountNumber: account.account_number,
    accountName: account.holder_name, amount: pay.amount, memo: pay.memo,
  }) : null;
  const dlApp = account ? DEEPLINK_AUTOFILL[account.bank_code] : null;

  async function doConfirm() {
    if (!confirm('Bạn đã chuyển khoản này bên app ngân hàng rồi, đúng không? Chỉ bấm khi tiền thật sự đã đi.')) return;
    setBusy(true);
    try { await confirmPayment(pay, user.id); router.replace('/ngan-hang'); }
    catch (e) { alert(e.message); setBusy(false); }
  }
  async function doVoid() {
    setBusy(true);
    try { await voidPayment(pay, user.id, voidReason); router.replace('/ngan-hang'); }
    catch (e) { alert(e.message); setBusy(false); }
  }

  return (
    <AppShell userEmail={user.email}>
      <div className="card">
        <h2>Chuyển khoản {fmtVND(pay.amount)}</h2>
        <div className="muted" style={{ lineHeight: 1.8 }}>
          {personName ? <div>Cho: <b>{personName}</b></div> : null}
          {account ? (
            <>
              <div>Ngân hàng: <b>{account.bank_name}</b></div>
              <div>Số TK: <b>{account.account_number}</b></div>
              {account.holder_name ? <div>Chủ TK: <b>{account.holder_name}</b></div> : null}
              {account.note ? <div>Ghi chú: {account.note}</div> : null}
            </>
          ) : <div>(tài khoản đã xóa)</div>}
          {pay.memo ? <div>Nội dung: <b>{pay.memo}</b></div> : null}
          <div>Trạng thái: <b>{pay.status === 'pending' ? 'Chờ xác nhận' : pay.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}</b></div>
        </div>
      </div>

      {pay.status === 'pending' && (
        <>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Mã QR VietQR — quét bằng app ngân hàng</h3>
            {qrUrl
              ? <img src={qrUrl} alt="Mã QR VietQR" style={{ width: 260, height: 260 }} />
              : <div className="muted">{qrError || 'Đang tạo mã…'}</div>}
            <p className="muted">Quét mã này là app ngân hàng tự điền đúng số tiền, số TK, nội dung.</p>
            {deeplink && dlApp && (
              <div>
                <a className="btn" href={deeplink} target="_blank" rel="noreferrer">
                  Mở {dlApp.appName} (thử tự điền)
                </a>
                <p className="muted" style={{ marginTop: 8 }}>
                  Nếu app ngân hàng mở ra mà KHÔNG tự điền đúng số tiền / số TK / nội dung thì
                  đừng xác nhận — hãy quay lại quét mã QR ở trên.
                </p>
              </div>
            )}
            {!deeplink && (
              <p className="muted">
                Ngân hàng này chưa hỗ trợ mở app tự điền — hãy mở app ngân hàng của bạn rồi quét mã QR ở trên.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn secondary small" onClick={() => {
                const text = `NH: ${account?.bank_name} | STK: ${account?.account_number} | Tien: ${pay.amount} | ND: ${pay.memo}`;
                navigator.clipboard?.writeText(text).then(() => alert('Đã sao chép thông tin chuyển khoản.'));
              }}>Sao chép thông tin</button>
            </div>
          </div>

          <div className="card" style={{ border: '2px solid #d97706', background: '#fffbeb' }}>
            <b>App này không tự biết ngân hàng đã chuyển xong hay chưa.</b>
            <div className="muted">
              Sau khi chuyển xong bên app ngân hàng, quay lại đây bấm “Đã chuyển”. Nếu chuyển thất bại
              hoặc không chuyển nữa, bấm “Hủy lệnh” và chọn lý do — lệnh sẽ được giữ lại làm bằng chứng, không bị xóa.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn" disabled={busy} onClick={doConfirm}>Tôi đã chuyển xong — Xác nhận</button>
              <button className="btn secondary" disabled={busy} onClick={() => setShowVoid(!showVoid)}>Hủy lệnh</button>
            </div>
            {showVoid && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <select value={voidReason} onChange={e => setVoidReason(e.target.value)}>
                  {VOID_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button className="btn danger" disabled={busy} onClick={doVoid}>Xác nhận hủy</button>
              </div>
            )}
          </div>
        </>
      )}

      {pay.status !== 'pending' && (
        <div className="card">
          <p className="muted">
            Lệnh này đã {pay.status === 'confirmed' ? 'được xác nhận' : 'bị hủy'}.
            {pay.confirmed_at ? ` Xác nhận lúc ${new Date(pay.confirmed_at).toLocaleString('vi-VN')}.` : ''}
          </p>
          <button className="btn secondary" onClick={() => router.replace('/ngan-hang')}>Về trang Ngân hàng</button>
        </div>
      )}
    </AppShell>
  );
}
