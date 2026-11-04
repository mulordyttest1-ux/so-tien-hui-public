'use client';
// Quet ma QR bang camera SAU (khong phai camera truoc).
// Bai hoc 2026-11-04: ban dau chon camera theo nhan thiet bi (back/rear) nhung
// iOS AN NHAN truoc khi cap quyen camera, nen doan nhan that bai va roi ve
// cameras[0] — tren iPhone thuong la camera truoc. Cach dung: xin thang camera
// sau bang facingMode "environment" (khong phu thuoc vao nhan), neu that bai moi
// roi ve chon theo id. Them nut "Doi camera" de chuyen qua lai khi may van
// chon sai. Con co nut chon anh QR tu thu vien va duong lui dan ma.
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCAN_CONFIG = { fps: 10, qrbox: { width: 250, height: 250 } };

export default function QrScanner({ onScan, onClose }) {
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [paste, setPaste] = useState('');
  const [cameras, setCameras] = useState([]);
  const [camIndex, setCamIndex] = useState(0);
  const [switching, setSwitching] = useState(false);
  const qrRef = useRef(null);
  const camerasRef = useRef([]);
  const doneRef = useRef(false);

  function onSuccess(text) {
    if (doneRef.current) return;
    doneRef.current = true;
    onScan(text);
  }

  function explainError(e) {
    const msg = String(e?.message || e);
    if (/permission|denied|NotAllowed/i.test(msg)) {
      return 'Trình duyệt chưa được phép dùng camera. Hãy bấm “Cho phép” khi trình duyệt hỏi, hoặc vào Cài đặt trình duyệt > Camera > Cho phép cho trang này rồi thử lại.';
    }
    if (/secure|https/i.test(msg)) {
      return 'Quét camera cần mở app qua HTTPS. Hãy mở app bằng link https://so-tien-hui-public.vercel.app (Add to Home Screen vẫn dùng được).';
    }
    return 'Không mở được camera: ' + msg;
  }

  useEffect(() => {
    let cancelled = false;
    async function start() {
      const qr = new Html5Qrcode('qr-reader');
      qrRef.current = qr;
      try {
        // Cach 1 (chinh): xin thang camera sau — khong can nhan thiet bi.
        await qr.start({ facingMode: 'environment' }, SCAN_CONFIG, onSuccess, () => {});
      } catch (e1) {
        // Cach 2 (du phong): chon theo id, uu tien nhan back/rear.
        try {
          const cams = await Html5Qrcode.getCameras();
          if (!cams || cams.length === 0) throw e1;
          camerasRef.current = cams;
          setCameras(cams);
          const backIdx = cams.findIndex(c => /back|rear|environment/i.test(c.label || ''));
          const idx = backIdx >= 0 ? backIdx : 0;
          setCamIndex(idx);
          await qr.start(cams[idx].id, SCAN_CONFIG, onSuccess, () => {});
        } catch (e2) {
          if (cancelled) return;
          setStarting(false);
          setError(explainError(e2));
          return;
        }
      }
      if (!cancelled) setStarting(false);
      // Mo thanh cong roi thi nap lai danh sach camera (luc nay nhan da co
      // sau khi cap quyen) de nut Doi camera dung duoc.
      try {
        const cams = await Html5Qrcode.getCameras();
        if (cams && cams.length > 0) { camerasRef.current = cams; setCameras(cams); }
      } catch { /* khong quan trong */ }
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

  async function switchCamera() {
    const list = camerasRef.current;
    if (list.length < 2 || switching) return;
    setSwitching(true);
    const qr = qrRef.current;
    try {
      await qr.stop();
      const next = (camIndex + 1) % list.length;
      setCamIndex(next);
      await qr.start(list[next].id, SCAN_CONFIG, onSuccess, () => {});
      setError('');
    } catch (e) {
      setError('Không đổi được camera: ' + (e?.message || e));
    }
    setSwitching(false);
  }

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
      {starting && <div className="muted">Đang mở camera sau… (trình duyệt có thể hỏi quyền camera)</div>}
      {error && <div style={{ color: '#991b1b', marginTop: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        {cameras.length > 1 && (
          <button type="button" className="btn secondary small" disabled={switching} onClick={switchCamera}>
            🔄 Đổi camera {switching ? '…' : ''}
          </button>
        )}
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
