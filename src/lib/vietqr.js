// VietQR - tao ma QR chuyen khoan chuan EMVCo (NAPAS) ngay trong app,
// khong gui so tai khoan / so tien cho ben thu ba nao.
//
// Dinh dang da kiem chung tu tai lieu cong khai:
// - Payload Format Indicator 00 = "01", Point of Initiation 01 = "12" (dong, co
//   so tien) hoac "11" (tinh, khong so tien).
// - Field 38 (NAPAS): 00 = "A000000727", 01 = (00 = ma BIN ngan hang,
//   01 = so tai khoan), 02 = "QRIBFTTA" (chuyen toi tai khoan).
// - 53 = "704" (VND), 54 = so tien (neu co), 58 = "VN", 62 = (08 = noi dung),
// - 63 = CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), 4 ky tu hex hoa.
// Do dai trong TLV tinh theo byte UTF-8, khong phai so ky tu.

// Danh sach ngan hang chinh (ma + BIN lay tu API cong khai api.vietqr.io/v2/banks).
export const BANKS = [
  { code: 'VCB', bin: '970436', name: 'Vietcombank' },
  { code: 'TCB', bin: '970407', name: 'Techcombank' },
  { code: 'MB', bin: '970422', name: 'MBBank' },
  { code: 'ICB', bin: '970415', name: 'VietinBank' },
  { code: 'BIDV', bin: '970418', name: 'BIDV' },
  { code: 'VBA', bin: '970405', name: 'Agribank' },
  { code: 'ACB', bin: '970416', name: 'ACB' },
  { code: 'VPB', bin: '970432', name: 'VPBank' },
  { code: 'TPB', bin: '970423', name: 'TPBank' },
  { code: 'STB', bin: '970403', name: 'Sacombank' },
  { code: 'HDB', bin: '970437', name: 'HDBank' },
  { code: 'OCB', bin: '970448', name: 'OCB' },
  { code: 'VIB', bin: '970441', name: 'VIB' },
  { code: 'SHB', bin: '970443', name: 'SHB' },
  { code: 'EIB', bin: '970431', name: 'Eximbank' },
  { code: 'MSB', bin: '970426', name: 'MSB' },
  { code: 'SEAB', bin: '970440', name: 'SeABank' },
  { code: 'LPB', bin: '970449', name: 'LPBank' },
  { code: 'NAB', bin: '970428', name: 'NamABank' },
  { code: 'PGB', bin: '970430', name: 'PGBank' },
  { code: 'KLB', bin: '970452', name: 'KienLongBank' },
  { code: 'BAB', bin: '970409', name: 'BacABank' },
  { code: 'PVCB', bin: '970412', name: 'PVcomBank' },
  { code: 'SCB', bin: '970429', name: 'SCB' },
  { code: 'SGICB', bin: '970400', name: 'SaigonBank' },
  { code: 'VAB', bin: '970427', name: 'VietABank' },
  { code: 'NCB', bin: '970419', name: 'NCB' },
  { code: 'SHBVN', bin: '970424', name: 'ShinhanBank' },
  { code: 'ABB', bin: '970425', name: 'ABBANK' },
  { code: 'BVB', bin: '970438', name: 'BaoVietBank' },
  { code: 'VIETBANK', bin: '970433', name: 'VietBank' },
  { code: 'CAKE', bin: '546034', name: 'CAKE by VPBank' },
  { code: 'TIMO', bin: '963388', name: 'Timo' },
  { code: 'momo', bin: '971025', name: 'MoMo' },
  { code: 'ZALOPAY', bin: '971101', name: 'ZaloPay' },
];

export function bankByCode(code) {
  return BANKS.find(b => b.code === code) || null;
}

// App ngan hang iOS ho tro deeplink kem tu dien (autofill=1 theo
// api.vietqr.io/v2/ios-app-deeplinks). Cac ngan hang khac van quet duoc ma QR.
export const DEEPLINK_AUTOFILL = {
  MB: { appId: 'mb', appName: 'MB Bank' },
  ICB: { appId: 'icb', appName: 'VietinBank iPay' },
  BIDV: { appId: 'bidv', appName: 'BIDV SmartBanking' },
  ACB: { appId: 'acb', appName: 'ACB ONE' },
  OCB: { appId: 'ocb', appName: 'OCB OMNI' },
};

function byteLen(s) {
  return new TextEncoder().encode(s).length;
}

function tlv(tag, value) {
  return tag + String(byteLen(value)).padStart(2, '0') + value;
}

export function crc16ccitt(str) {
  const bytes = new TextEncoder().encode(str);
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Noi dung chuyen khoan: ngan hang chi nhan chu/so khong dau.
export function cleanMemo(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

export function buildVietQR({ bin, accountNumber, amount, memo }) {
  if (!bin || !accountNumber) throw new Error('Thieu ngan hang hoac so tai khoan.');
  const beneficiary = tlv('00', bin) + tlv('01', String(accountNumber).replace(/\D/g, ''));
  const field38 = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  let payload = tlv('00', '01');
  payload += tlv('01', amount ? '12' : '11');
  payload += tlv('38', field38);
  payload += tlv('53', '704');
  if (amount) payload += tlv('54', String(Math.round(Number(amount))));
  payload += tlv('58', 'VN');
  const m = cleanMemo(memo);
  if (m) payload += tlv('62', tlv('08', m));
  payload += '6304';
  return payload + crc16ccitt(payload);
}

// Tach thong tin tu mot payload VietQR da quet/dan (dung cho "dan ma QR").
export function parseVietQR(payload) {
  const out = {};
  function parse(s, target) {
    let i = 0;
    while (i + 4 <= s.length) {
      const tag = s.slice(i, i + 2);
      const len = parseInt(s.slice(i + 2, i + 4), 10);
      if (Number.isNaN(len) || i + 4 + len > s.length) break;
      const val = s.slice(i + 4, i + 4 + len);
      target[tag] = val;
      i += 4 + len;
    }
  }
  const top = {};
  parse(String(payload || '').trim(), top);
  if (top['38']) {
    const f38 = {};
    parse(top['38'], f38);
    if (f38['01']) {
      const ben = {};
      parse(f38['01'], ben);
      out.bin = ben['00'] || '';
      out.accountNumber = ben['01'] || '';
    }
  }
  if (top['54']) out.amount = Number(top['54']);
  if (top['62']) {
    const f62 = {};
    parse(top['62'], f62);
    out.memo = f62['08'] || '';
  }
  if (top['63']) {
    out.crcOk = crc16ccitt(String(payload).trim().slice(0, -4)) === top['63'].toUpperCase();
  }
  return out;
}

// Link mo app ngan hang qua VietQR Deeplink.
// LUU Y TRUNG THUC: VietQR cong bo danh sach app + cac truong du lieu duoc gui
// (ma ngan hang, so TK, ten TK, so tien, noi dung), nhung ten tham so query
// chinh xac cua dl.vietqr.io khong co trong tai lieu cong khai ma tac gia kiem
// chung duoc. Link nay gui kem dung cac truong do theo quy uoc chung cua
// VietQR; neu app ngan hang khong tu dien, nguoi dung quet ma QR ben duoi
// (ma nay thi chac chan dung chuan) va KHONG duoc xac nhan khi thong tin sai.
export function vietqrDeeplink({ bankCode, accountNumber, accountName, amount, memo }) {
  const app = DEEPLINK_AUTOFILL[bankCode];
  if (!app) return null;
  const q = new URLSearchParams({
    app: app.appId,
    bank: bankCode,
    accountNumber: String(accountNumber).replace(/\D/g, ''),
    accountName: accountName || '',
    amount: String(Math.round(Number(amount) || 0)),
    addInfo: cleanMemo(memo),
  });
  return `https://dl.vietqr.io/pay?${q.toString()}`;
}
