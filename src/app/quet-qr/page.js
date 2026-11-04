'use client';
// Trang quet QR truc tiep: mo ra la camera mo ngay, khong qua buoc trung gian.
// Day cung la URL de dua ra man hinh chinh iPhone: dang o trang nay trong Safari,
// bam Chia se > Them vao Man hinh chinh thi bieu tuong ngoai man hinh chinh se
// mo thang vao day (da dang nhap thi quet ngay; chua dang nhap thi dang nhap
// xong tu nhay lai day nho ?next=).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import QrScanner from '../../components/QrScanner';

export default function QuetQrPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleScanned(text) {
    setOpen(false);
    try { sessionStorage.setItem('pendingQr', text); } catch { /* bo qua */ }
    router.push('/chuyen-nhanh');
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      {open ? (
        <QrScanner onScan={handleScanned} onClose={() => setOpen(false)} />
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Quét mã QR</h3>
          <button type="button" className="btn" onClick={() => setOpen(true)}>📷 Mở lại camera</button>
        </div>
      )}
      <div className="card">
        <h3>📱 Đưa nút Quét ra màn hình chính iPhone</h3>
        <p className="muted" style={{ lineHeight: 1.8 }}>
          Đang ở đúng trang này, làm 3 bước trong Safari (không làm trong app đã cài):
        </p>
        <ol style={{ lineHeight: 1.9, paddingLeft: 20 }}>
          <li>Bấm nút <b>Chia sẻ</b> (hình vuông có mũi tên đi lên) ở thanh dưới cùng của Safari.</li>
          <li>Chọn <b>Thêm vào Màn hình chính</b>.</li>
          <li>Bấm <b>Thêm</b> ở góc trên bên phải.</li>
        </ol>
        <p className="muted" style={{ lineHeight: 1.8 }}>
          Từ giờ, bấm biểu tượng “Quét QR” ngoài màn hình chính là mở thẳng camera quét luôn —
          đã đăng nhập thì quét ngay, chưa đăng nhập thì đăng nhập xong tự nhảy vào quét.
        </p>
      </div>
    </AppShell>
  );
}
