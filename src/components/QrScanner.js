'use client';
// Quet ma QR bang camera (chuyen nghiep, khong dan ma).
// Dung thu vien html5-qrcode: mo camera sau, quet lien tuc den khi doc duoc.
// Luu y iPhone: can mo app qua HTTPS (da co) + cho phep quyen camera khi trinh
// duyet hoi. Neu khong co camera / bi tu choi quyen thi bao loi ro rang thay vi
// trang trang. Co them nut chon anh QR tu thu vien (truong hop ma QR la anh
// chup man hinh) va duong lui dan ma cho truong hop xau nhat.
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onScan, onClose }) {
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [paste, setPaste] = useState('');
  const qrRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setError('Không tìm thấy camera trên thiết bị này. Hãy dùng nút “Chọn ảnh QR” bên dưới.');
          setStarting(false);
          return;
        }
        // Uu tien camera sau (thuong co nhan "back" / "rear" / "environment").
        const back = cameras.find(c => /back|rear|environment/i.test(c.label || ''));
        const cameraId = (back || cameras[0]).id;
        const qr = new Html5Qrcode('qr-reader');
        qrRef.current = qr;
        await qr.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => {
            if (doneRef.current) return;
            doneRef.current = true;
            onScan(text);
          },
          () => { /* bo qua loi quet tung khung hinh */ },
        );
        if (!cancelled) setStarting(false);
      } catch (e) {
        if (cancelled) return;
        setStarting(false);
        const msg = String(e?.message || e);
        if (/permission|denied|NotAllowed/i.test(msg)) {
          setError('Trình duyệt chưa được phép dùng camera. Hãy bấm “Cho phép” khi trình duyệt hỏi, hoặc vào Cài đặt trình duyệt > Camera > Cho phép cho trang này rồi thử lại.');
        } else if (/secure|https/i.test(msg)) {
          setError('Quét camera cần mở app qua HTTPS. Hãy mở app bằng link https://so-tien-hui-public.vercel.app (Add to Home Screen vẫn dùng được).');
        } else {
          setError('Không mở được camera: ' + msg);
        }
      }
    }
    start();
    return () => {
      cancelled = true;
      const qr = qrRef.current;
      if (qr) {
        try {
          const p = qr.stop();
          if (p && p.then) p.then(() => qr.clear().catch(() => {})).catch(() => {});
          else qr.clear().catch(() => {});
        } catch { /* da dung */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scanFile(file) {
    if (!file) return;
    try {
      const tmp = new Html5Qrcode('qr-file');
      const text = await tmp.scanFile(file, true);
      await tmp.clear().catch(() => {});
      onScan(text);
    } catch {
      alert('Không đọc được mã QR trong ảnh này. Hãy chụp lại rõ hơn hoặc quét trực tiếp bằng camera.');
    }
  }

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h3>Quét mã QR</h3>
      <p className="muted">Đưa mã QR vào khung hình. App tự đọc ngay khi nhận diện được.</p>
      <div id="qr-reader" className="qr-reader" />
      <div id="qr-file" style={{ display: 'none' }} />
      {starting && <div className="muted">Đang mở camera… (trình duyệt có thể hỏi quyền camera)</div>}
      {error && <div style={{ color: '#991b1b', marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <label className="btn secondary small" style={{ cursor: 'pointer' }}>
          Chọn ảnh QR từ thư viện
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => scanFile(e.target.files?.[0])} />
        </label>
        <button type="button" className="btn secondary small" onClick={onClose}>Đóng</button>
      </div>
      <details style={{ marginTop: 12, textAlign: 'left' }}>
        <summary className="muted" style={{ cursor: 'pointer' }}>Không quét được? Dán mã QR (dự phòng)</summary>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={paste} onChange={e => setPaste(e.target.value)} placeholder="Dán chuỗi mã QR (000201...)" style={{ flex: 1 }} />
          <button type="button" className="btn secondary small" onClick={() => paste.trim() && onScan(paste.trim())}>Dùng mã này</button>
        </div>
      </details>
    </div>
  );
}
