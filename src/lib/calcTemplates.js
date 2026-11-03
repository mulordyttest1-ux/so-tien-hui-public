// Các MẪU TÍNH của module Tính nhanh.
// Mỗi mẫu = danh sách trường (ô) + danh sách luật ràng buộc (xem solver.js).
// Phát sinh bài toán mới trong tương lai -> thêm 1 mẫu vào mảng này.

const TRIEU = 1_000_000;

export const CALC_TEMPLATES = [
  {
    id: 'lai-thu-dong',
    name: 'Lãi thu thụ động',
    icon: '💸',
    desc: 'Đưa vốn cho một nguồn (người A, người B...) và nhận tiền lời. Nhập bất kỳ 2 ô nào bạn biết — các ô còn lại tự suy ra.',
    fields: [
      { key: 'von', label: 'Vốn đưa đi', unit: 'đ', kind: 'money', placeholder: 'VD: 1000000000' },
      { key: 'loiThang', label: 'Tiền lời mỗi tháng', unit: 'đ/tháng', kind: 'money', placeholder: 'VD: 3000000' },
      { key: 'loiNgay', label: 'Tiền lời mỗi ngày', unit: 'đ/ngày', kind: 'money' },
      { key: 'loiNam', label: 'Tiền lời mỗi năm', unit: 'đ/năm', kind: 'money' },
      { key: 'moiTrieuNgay', label: 'Lời trên mỗi 1 triệu / ngày', unit: 'đ', kind: 'money', placeholder: 'VD: 250' },
      { key: 'moiTrieuThang', label: 'Lời trên mỗi 1 triệu / tháng', unit: 'đ', kind: 'money' },
      { key: 'laiNgay', label: 'Lãi suất % / ngày', unit: '%', kind: 'pct' },
      { key: 'laiThang', label: 'Lãi suất % / tháng', unit: '%', kind: 'pct' },
      { key: 'laiNam', label: 'Lãi suất % / năm', unit: '%', kind: 'pct' },
      { key: 'soNgay', label: 'Số ngày trong tháng (để quy đổi)', unit: 'ngày', kind: 'int', default: 30 },
    ],
    // Quan hệ gốc: lời tháng <-> lời ngày <-> lời năm; lời <-> vốn qua
    // "lời trên 1 triệu" và qua lãi suất %. Mọi luật đều có chiều ngược.
    rules: [
      // tháng <-> ngày <-> năm
      { inputs: ['loiNgay', 'soNgay'], output: 'loiThang', compute: (d, n) => d * n },
      { inputs: ['loiThang', 'soNgay'], output: 'loiNgay', compute: (m, n) => m / n },
      { inputs: ['loiThang'], output: 'loiNam', compute: (m) => m * 12 },
      { inputs: ['loiNam'], output: 'loiThang', compute: (y) => y / 12 },
      // vốn + lời tháng <-> lời trên 1 triệu / tháng
      { inputs: ['loiThang', 'von'], output: 'moiTrieuThang', compute: (m, p) => (m / p) * TRIEU },
      { inputs: ['moiTrieuThang', 'von'], output: 'loiThang', compute: (r, p) => (r * p) / TRIEU },
      { inputs: ['loiThang', 'moiTrieuThang'], output: 'von', compute: (m, r) => (m / r) * TRIEU },
      // vốn + lời ngày <-> lời trên 1 triệu / ngày
      { inputs: ['loiNgay', 'von'], output: 'moiTrieuNgay', compute: (d, p) => (d / p) * TRIEU },
      { inputs: ['moiTrieuNgay', 'von'], output: 'loiNgay', compute: (r, p) => (r * p) / TRIEU },
      { inputs: ['loiNgay', 'moiTrieuNgay'], output: 'von', compute: (d, r) => (d / r) * TRIEU },
      // 1 triệu / tháng <-> 1 triệu / ngày
      { inputs: ['moiTrieuNgay', 'soNgay'], output: 'moiTrieuThang', compute: (r, n) => r * n },
      { inputs: ['moiTrieuThang', 'soNgay'], output: 'moiTrieuNgay', compute: (r, n) => r / n },
      // lãi suất % tháng <-> vốn + lời tháng
      { inputs: ['loiThang', 'von'], output: 'laiThang', compute: (m, p) => (m / p) * 100 },
      { inputs: ['laiThang', 'von'], output: 'loiThang', compute: (pc, p) => (pc / 100) * p },
      { inputs: ['loiThang', 'laiThang'], output: 'von', compute: (m, pc) => m / (pc / 100) },
      // lãi suất % năm <-> % tháng, và <-> vốn + lời năm
      { inputs: ['laiThang'], output: 'laiNam', compute: (pc) => pc * 12 },
      { inputs: ['laiNam'], output: 'laiThang', compute: (pc) => pc / 12 },
      { inputs: ['loiNam', 'von'], output: 'laiNam', compute: (y, p) => (y / p) * 100 },
      { inputs: ['laiNam', 'von'], output: 'loiNam', compute: (pc, p) => (pc / 100) * p },
      { inputs: ['loiNam', 'laiNam'], output: 'von', compute: (y, pc) => y / (pc / 100) },
      // lãi suất % ngày <-> % tháng (và suy ra qua lời ngày / vốn)
      { inputs: ['laiThang', 'soNgay'], output: 'laiNgay', compute: (pc, n) => pc / n },
      { inputs: ['laiNgay', 'soNgay'], output: 'laiThang', compute: (pc, n) => pc * n },
      { inputs: ['loiNgay', 'von'], output: 'laiNgay', compute: (d, p) => (d / p) * 100 },
    ],
  },
];
