// Bộ máy giải ràng buộc cho module Tính nhanh.
//
// Mỗi "mẫu tính" khai báo một lưới các ô (trường) liên kết bằng các LUẬT suy diễn:
//   { inputs: ['a', 'b'], output: 'c', compute: (a, b) => ... }
// Người dùng nhập bất kỳ ô nào; bộ máy lặp đi lặp lại: luật nào đủ dữ kiện đầu vào
// và ô đích còn trống thì tự điền. Nhờ các luật viết xuôi + ngược cho cùng một
// quan hệ, biết trước ô nào cũng suy ra được các ô còn lại ("bài toán đa nghiệm").
//
// Ô do người dùng nhập luôn là gốc và không bao giờ bị ghi đè; chỉ ô trống mới
// được tự điền. Thêm mẫu tính mới = chỉ cần khai báo thêm trường + luật, không
// phải sửa bộ máy này.

export function solveValues(rules, known) {
  const values = { ...known };
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 200) {
    changed = false;
    for (const rule of rules) {
      if (values[rule.output] !== undefined) continue;
      const args = rule.inputs.map((k) => values[k]);
      if (args.some((v) => v === undefined || v === null || Number.isNaN(v))) continue;
      let out;
      try {
        out = rule.compute(...args);
      } catch {
        continue;
      }
      if (out === undefined || out === null || !Number.isFinite(out)) continue;
      values[rule.output] = out;
      changed = true;
    }
  }
  return values;
}
