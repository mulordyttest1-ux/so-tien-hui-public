import './globals.css';
import 'katex/dist/katex.min.css';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

export const metadata = {
  title: 'Gia Đình Nhỏ',
  description: 'Ghi thu chi theo người, hạng mục, nguồn tiền và quản lý hụi, hốt hụi, lời lỗ.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Gia Đình Nhỏ' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#168250',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
