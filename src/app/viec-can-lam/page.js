'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import { fetchTodos, addTodo, toggleTodo, deleteTodo } from '../../lib/todos';

export default function ViecCanLamPage() {
  const { user, loading } = useRequireAuth();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setItems(await fetchTodos());
    setReady(true);
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  async function save(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await addTodo(user.id, text);
      setText('');
      await load();
    } catch (err) { alert('Không lưu được: ' + err.message); }
    setBusy(false);
  }

  async function toggle(it) {
    try { await toggleTodo(it.id, !it.done); await load(); }
    catch (err) { alert('Không lưu được: ' + err.message); }
  }

  async function remove(it) {
    if (deleting !== it.id) { setDeleting(it.id); return; }
    setDeleting(null);
    try { await deleteTodo(it.id); await load(); }
    catch (err) { alert('Không xóa được: ' + err.message); }
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;
  const undone = items.filter(i => !i.done).length;

  return (
    <AppShell userEmail={user.email}>
      <h2>✅ Việc cần làm</h2>
      <p className="muted">
        Ghi nhanh việc gì cần làm, cần hỏi, cần mua — mở ra là thấy, xong thì gạch đi.
        {items.length > 0 && <> Còn <b>{undone} việc</b> chưa xong.</>}
      </p>

      <form onSubmit={save} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="VD: Nhắc chị B đóng hụi, mua gạo, gọi VNPT hỏi cước…" style={{ flex: 1 }} />
        <button className="btn" type="submit" disabled={busy || !text.trim()}>Thêm</button>
      </form>

      {!ready ? <div className="loading">Đang tải…</div>
        : items.length === 0 ? <div className="empty">Chưa có việc nào. Ghi việc đầu tiên ở trên nhé.</div>
        : items.map(it => (
          <div className="row" key={it.id}>
            <button type="button" aria-label={it.done ? 'Bỏ gạch' : 'Gạch xong'}
              onClick={() => toggle(it)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
              {it.done ? '☑' : '☐'}
            </button>
            <span onClick={() => toggle(it)} style={{ flex: 1, cursor: 'pointer',
              textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.55 : 1 }}>
              {it.text}
            </span>
            <button type="button" className="btn" onClick={() => remove(it)}>
              {deleting === it.id ? 'Chắc xóa?' : 'Xóa'}
            </button>
          </div>
        ))}
    </AppShell>
  );
}
