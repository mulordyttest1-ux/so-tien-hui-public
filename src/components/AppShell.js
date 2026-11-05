'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

// Bot bar chi 2 muc, theo yeu cau cua nguoi dung: Tong quan (dashboard)
// va Tinh nhanh. Moi muc khac mo tu luoi o chuc nang o trang chinh.
// Nut camera noi (FAB) da bo han: quet QR chi con o trong trang chinh
// (o Quet QR -> trang /quet-qr), vi hien tai camera quet tren iPhone
// chua dung duoc, de sau sua.
const BAR_TABS = [
  { href: '/', label: 'Tổng quan', icon: '🏠' },
  { href: '/tinh-nhanh', label: 'Tính nhanh', icon: '🧮' },
  { href: '/tro-ly-groq', label: 'Groq', icon: '⚡' },
];

export default function AppShell({ children, userEmail }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">Gia Đình Nhỏ</span>
        <span className="topbar-right">
          {userEmail && <span className="email">{userEmail}</span>}
          <button className="link-btn" onClick={logout}>Đăng xuất</button>
        </span>
      </header>
      <main className="content">{children}</main>
      <nav className="bottomnav">
        {BAR_TABS.map(t => (
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
