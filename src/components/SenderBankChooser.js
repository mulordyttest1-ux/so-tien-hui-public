'use client';
// Bang chon app ngan hang cua NGUOI CHUYEN cho VietQR Deeplink.
// App tu dien len truoc, cac app con lai nam sau nut "+N ngan hang khac".
// Chon app nao thi app do duoc luu lam mac dinh tren may nay.
import { useEffect, useState } from 'react';
import { fetchSenderAppList } from '../lib/vietqr';

export default function SenderBankChooser({ open, currentAppId, onSelect, onClose }) {
  const [apps, setApps] = useState([]);
  const [source, setSource] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchSenderAppList()
      .then(({ apps: list, source: src }) => { setApps(list); setSource(src); setLoading(false); })
      .catch(() => { setApps([]); setLoading(false); });
  }, [open ]);

  if (!open) return null;
  const autofill = apps.filter(a => a.autofill);
  const rest = apps.filter(a => !a.autofill);
  const shown = showAll ? [...autofill, ...rest] : autofill;

  return (
    <div className="modal-bg modal-top" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Chọn app ngân hàng của bạn</h2>
        <p className="muted">
          App này là app <b>bạn dùng để chuyển tiền</b>, không phải ngân hàng của người nhận.
          Chọn một lần, app sẽ nhớ trên máy này. App gắn nhãn “Tự động điền” sẽ mở ra với
          số tiền, số tài khoản và nội dung điền sẵn; app còn lại vẫn mở được nhưng bạn tự nhập.
        </p>
        {loading && <div className="loading">Đang tải danh sách ngân hàng…</div>}
        {!loading && apps.length === 0 && (
          <div className="muted">Không tải được danh sách ngân hàng. Hãy thử lại hoặc quét mã QR để chuyển khoản.</div>
        )}
        {shown.map(a => (
          <button key={a.appId} type="button" className="btn secondary" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 8, textAlign: 'left' }}
            onClick={() => onSelect(a)}>
            {a.appLogo
              ? <img src={a.appLogo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              : <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#e5e7eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(a.appName || a.appId).charAt(0)}</span>}
            <span style={{ flex: 1 }}>
              <b>{a.appName}</b>
              {a.bankName && a.bankName !== a.appName ? <span className="muted"> · {a.bankName}</span> : null}
              {a.autofill ? <span> · <b>Tự động điền</b></span> : null}
            </span>
            {a.appId === currentAppId ? <span>✓ Đang dùng</span> : null}
          </button>
        ))}
        {!showAll && rest.length > 0 && (
          <button type="button" className="btn small" onClick={() => setShowAll(true)}>
            +{rest.length} ngân hàng khác
          </button>
        )}
        {source === 'bundled' && (
          <p className="muted" style={{ marginTop: 8 }}>Không tải được danh sách mới từ VietQR nên đang dùng danh sách có sẵn trên máy.</p>
        )}
        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button type="button" className="btn secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
