'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import QrScanner from './QrScanner';

const TABS = [
  { href: '/', label: 'Tổng quan', icon: '🏠' },
  { href: '/so-tien', label: 'Sổ tiền', icon: '💰' },
  { href: '/hui', label: 'Hụi', icon: '🔄' },
  { href: '/ngan-hang', label: 'Ngân hàng', icon: '🏦' },
  { href: '/tinh-nhanh', label: 'Tính nhanh', icon: '🧮' },
  { href: '/bao-cao', label: 'Báo cáo', icon: '📊' },
];

export default function AppShell({ children, userEmail }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);

  // Nut quet QR noi bat tren moi man hinh: bam la mo camera ngay, khong qua
  // tab trung gian. Quet xong thi sang trang Chuyen nhanh voi ma QR da doc.
  function handleScanned(text) {
    setShowScanner(false);
    try { sessionStorage.setItem('pendingQr', text); } catch { /* bo qua */ }
    router.push('/chuyen-nhanh');
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Sổ Tiền &amp; Hụi</span>
        <span className="topbar-right">
          {userEmail && <span className="email">{userEmail}</span>}
          <button className="link-btn" onClick={logout}>Đăng xuất</button>
        </span>
      </header>
      <main className="content">{children}</main>
      <button type="button" className="qr-fab" aria-label="Quét mã QR để chuyển tiền"
        onClick={() => setShowScanner(true)}>
        📷
      </button>
      {showScanner && (
        <div className="qr-overlay">
          <QrScanner onScan={handleScanned} onClose={() => setShowScanner(false)} />
        </div>
      )}
      <nav className="bottomnav">
        {TABS.map(t => (
          <Link key={t.href} href={t.href}
            className={pathname === t.href ? 'tab active' : 'tab'}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
