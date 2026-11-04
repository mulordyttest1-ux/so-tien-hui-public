'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

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
