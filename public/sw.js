// Service worker tối giản (network-first) để app cài được dạng PWA
// và vẫn mở được các trang đã xem khi mất mạng.
// QUAN TRỌNG: chỉ xử lý request GET cùng origin (trang/tài nguyên tĩnh của app).
// Không bao giờ chạm vào API dữ liệu (Supabase) — dữ liệu tiền phải luôn mới nhất.
const CACHE = 'so-tien-hui-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // bỏ qua API ngoài (Supabase...)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
