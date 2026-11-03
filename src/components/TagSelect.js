'use client';
import { useState } from 'react';
import { createTag } from '../lib/data';

/**
 * Ô chọn thẻ (Người / Hạng mục / Nguồn) — tạo mới ngay tại chỗ:
 * chọn "＋ Thêm mới…" rồi nhập tên, thẻ được lưu và chọn luôn.
 * Cùng 1 người có thể gắn cho cả khoản thu lẫn khoản chi (thẻ tự do).
 */
export default function TagSelect({ label, table, items, value, onChange, userId, onCreated }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const rec = await createTag(table, newName, userId);
      onCreated && onCreated(rec);
      onChange(rec.id);
      setNewName(''); setAdding(false);
    } catch (e) { alert('Không thêm được: ' + e.message); }
    setBusy(false);
  }

  return (
    <label className="field">
      <span>{label}</span>
      {adding ? (
        <span className="inline-add">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            placeholder={`Tên ${label.toLowerCase()} mới`} />
          <button type="button" onClick={handleAdd} disabled={busy}>Lưu</button>
          <button type="button" onClick={() => setAdding(false)}>Hủy</button>
        </span>
      ) : (
        <select value={value || ''}
          onChange={e => {
            if (e.target.value === '__new__') setAdding(true);
            else onChange(e.target.value || null);
          }}>
          <option value="">— Không chọn —</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          <option value="__new__">＋ Thêm mới…</option>
        </select>
      )}
    </label>
  );
}
