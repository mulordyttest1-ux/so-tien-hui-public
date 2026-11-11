// Gia xang chinh thuc hien tai (E10 RON 95-V, vung 2 — Dak Lak).
// Nguon live: giahanghoa.net (dang lai bang Petrolimex), doc toi da 1 lan/gio.
// Neu lay khong duoc: tra gia cu da biet, ghi ro fallback=true de giao dien
// bao chi biet la gia cu ma sua tay — khong bao gio tra gia gia tao.
export const dynamic = 'force-dynamic';

const SOURCE_URL = 'https://giahanghoa.net/en/fuel';
const FALLBACK = { price: 23100, effectiveDate: '2026-11-05' };

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

let cache = null; // { at, data }
const TTL_MS = 60 * 60 * 1000;

function parsePrice(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // Bang vung 2 nam sau bang vung 1; chi doc trong phan bang vung 2.
  const r2 = text.indexOf('Region 2 Fuel Price Table');
  if (r2 < 0) return null;
  const m = /E10 RON 95-V[^0-9]{0,60}?(\d{1,3}(?:\.\d{3})+)\s*đ/.exec(text.slice(r2));
  if (!m) return null;
  const price = Number(m[1].replace(/\./g, ''));
  if (!price || price <= 0) return null;
  // Ngay hieu luc dang "Nov 5, 2026" — doi thang bang tay, khong qua Date()
  // de khong bi lech mui gio (GMT+7 lam doi ngay khi toISOString).
  const d = /Effective Date\s*([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})/.exec(text);
  let effectiveDate = null;
  if (d && MONTHS[d[1]]) {
    effectiveDate = `${d[3]}-${MONTHS[d[1]]}-${String(Number(d[2])).padStart(2, '0')}`;
  }
  return { price, effectiveDate };
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return Response.json(cache.data);
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(SOURCE_URL, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GiaDinhNho/1.0)' },
    });
    clearTimeout(t);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const parsed = parsePrice(await res.text());
    if (!parsed) throw new Error('parse failed');
    const data = {
      price: parsed.price,
      effectiveDate: parsed.effectiveDate || FALLBACK.effectiveDate,
      grade: 'E10 RON 95-V',
      zone: 2,
      source: 'giahanghoa.net (bảng Petrolimex)',
      fallback: false,
    };
    cache = { at: Date.now(), data };
    return Response.json(data);
  } catch (e) {
    const data = {
      price: FALLBACK.price,
      effectiveDate: FALLBACK.effectiveDate,
      grade: 'E10 RON 95-V',
      zone: 2,
      source: 'giahanghoa.net (bảng Petrolimex)',
      fallback: true,
    };
    cache = { at: Date.now(), data };
    return Response.json(data);
  }
}
