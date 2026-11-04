'use client';
// Quet ma QR bang camera SAU, dung ZXing (BrowserQRCodeReader) voi video element
// cua chinh app (muted + autoplay + playsInline) — thay cho html5-qrcode.
// Ly do doi driver (ket luan sau khi nghien cuu cach lam dung cho iOS Safari):
//  - html5-qrcode 2.3.8 co loi chua sua tren iOS 17+: camera sau mo "thanh cong"
//    nhung khung hinh khong hien (chi thay hop xam + khung goc — dung trieu
//    chung gap phai). Doi sang facingMode khong sua duoc ma con lam te hon.
//  - Thu tu dung: xin quyen camera TRUOC (getUserMedia, khong await gi truoc
//    no trong cung luot bam), ROI MOI liet ke thiet bi (luc nay nhan moi hien)
//    va chon camera sau theo nhan. Khong goi getUserMedia lan 2 trong cung
//    luot mo (tranh hoi quyen thua).
//  - Quyen camera tren iOS Safari: che do "Hoi" mac dinh co the hoi lai moi
//    phien; cach het hoi han la nguoi dung dat Camera = Allow trong Website
//    Settings cua Safari (code khong tu dat duoc). Xem huong dan trong app.
import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { Html5Qrcode } from 'html5-qrcode';

const REAR_LABEL = /back|rear|environment/i;

export default function QrScanner({ onScan, onClose }) {
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [paste, setPaste] = useState('');
  const [cameras, setCameras] = useState([]);
  const [camIndex, setCamIndex] = useState(0);
  const [activeLabel, setActiveLabel] = useState('');
  const [switching, setSwitching] = useState(false);
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const camerasRef = useRef([]);
  const doneRef = useRef(false);

  function explainError(e) {
    const msg = String(e?.message || e);
    if (/permission|denied|NotAllowed/i.test(msg)) {
      return 'Trình duyệt chưa được phép dùng camera. Hãy bấm “Cho phép” khi trình duyệt hỏi. Nếu vẫn hỏi lại mỗi lần mở, vào Safari → nút aA → Cài đặt trang web → Camera → chọn “Cho phép” (thay vì “Hỏi”) thì từ sau không hỏi nữa.';
    }
    if (/secure|https|NotSupported/i.test(msg)) {
      return 'Quét camera cần mở app qua HTTPS. Hãy mở app bằng link https://so-tien-hui-public.vercel.app.';
    }
    if (/NotFound|not found|no camera|Requested device/i.test(msg)) {
      return 'Không tìm thấy camera trên thiết bị này. Hãy dùng nút “Chọn ảnh QR” bên dưới.';
    }
    return 'Không mở được camera: ' + msg;
  }

  async function startCamera(deviceId) {
    const reader = readerRef.current;
    const video = videoRef.current;
    if (!reader || !video) return;
    await reader.decodeFromVideoDevice(deviceId, video, (result, err) => {
      if (result && !doneRef.current) {
        doneRef.current = true;
        onScan(result.getText());
      }
      // err khi chua thay ma la binh thuong (NotFoundException lien tuc) — bo qua.
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;
        // 1. Xin quyen truoc, khong await gi truoc no.
        const grant = await navigator.mediaDevices.getUserMedia({ video: true });
        grant.getTracks().forEach(t => t.stop());
        if (cancelled) return;
        // 2. Luc nay nhan thiet bi moi hien — chon camera sau theo nhan.
        const devices = (await navigator.mediaDevices.enumerateDevices())
          .filter(d => d.kind === 'videoinput');
        if (!devices.length) throw new Error('Requested device not found');
        camerasRef.current = devices;
        setCameras(devices);
        const rearIdx = devices.findIndex(d => REAR_LABEL.test(d.label || ''));
        const idx = rearIdx >= 0 ? rearIdx : 0;
        setCamIndex(idx);
        setActiveLabel(devices[idx].label || '');
        // 3. Mo dung camera da chon. (Quyen da cap nen lan goi nay khong hoi lai.)
        await startCamera(devices[idx].deviceId || null);
        if (!cancelled) setStarting(false);
      } catch (e) {
        if (cancelled) return;
        setStarting(false);
        setError(explainError(e));
      }
    }
    start();
    return () => {
      cancelled = true;
      try { readerRef.current?.reset(); } catch { /* da dung */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchCamera() {
    const list = camerasRef.current;
    if (list.length < 2 || switching) return;
    setSwitching(true);
    try {
      readerRef.current?.reset();
      const next = (camIndex + 1) % list.length;
      setCamIndex(next);
      setActiveLabel(list[next].label || '');
      await startCamera(list[next].deviceId || null);
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
      <div style={{ position: 'relative', maxWidth: 420, margin: '0 auto' }}>
        <video ref={videoRef} muted autoPlay playsInline
          style={{ width: '100%', borderRadius: 12, background: '#000', display: error ? 'none' : 'block' }} />
        {!error && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 220, height: 220, border: '3px solid rgba(255,255,255,0.9)', borderRadius: 12 }} />
          </div>
        )}
      </div>
      <div id="qr-file" style={{ display: 'none' }} />
      {starting && <div className="muted">Đang mở camera sau… (trình duyệt có thể hỏi quyền camera)</div>}
      {activeLabel && !error && <div className="muted" style={{ marginTop: 6 }}>Đang dùng: {activeLabel}</div>}
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
