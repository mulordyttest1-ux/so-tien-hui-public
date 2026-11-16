'use client';
import { useEffect, useRef, useState } from 'react';
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
  const inputRef = useRef(null);

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
      if (inputRef.current) inputRef.current.style.height = 'auto';
      await load();
    } catch (err) { alert('Không lưu được: ' + err.message); }
    setBusy(false);
  }

  function autoGrow(e) {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
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
  const undone = items.filter(i => !i.done);
  const done = items.filter(i => i.done);

  function row(it) {
    return (
      <div className="todo-card" key={it.id}>
        <button type="button" aria-label={it.done ? 'Bỏ gạch' : 'Gạch xong'}
          className={it.done ? 'todo-check done' : 'todo-check'}
          onClick={() => toggle(it)}>
          {it.done ? '✓' : ''}
        </button>
        <span onClick={() => toggle(it)} className={it.done ? 'todo-text done' : 'todo-text'}>
          {it.text}
        </span>
        <button type="button" className={deleting === it.id ? 'todo-del confirm' : 'todo-del'}
          onClick={() => remove(it)}>
          {deleting === it.id ? 'Chắc xóa?' : '✕'}
        </button>
      </div>
    );
  }

  return (
    <AppShell userEmail={user.email}>
      <h2>📝 Ghi chú</h2>
      <p className="muted">
        Nhắc nhở công việc hàng ngày — ghi khỏi quên, xong thì gạch đi.
        {items.length > 0 && <> Còn <b>{undone.length} việc</b> chưa xong · đã xong {done.length}/{items.length}.</>}
      </p>
      {items.length > 0 && (
        <div className="todo-progress"><span style={{ width: `${Math.round(done.length / items.length * 100)}%` }} /></div>
      )}

      <form onSubmit={save} className="todo-add" style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-start' }}>
        <textarea ref={inputRef} value={text}
          onChange={e => { setText(e.target.value); autoGrow(e); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(e); } }}
          placeholder="VD: Nhắc chị B đóng hụi, mua gạo, gọi VNPT hỏi cước…" rows={2} />
        <button className="btn" type="submit" disabled={busy || !text.trim()} style={{ width: 'auto', flex: 'none' }}>Thêm</button>
      </form>

      {!ready ? <div className="loading">Đang tải…</div>
        : items.length === 0 ? <div className="empty">Chưa có việc nào. Ghi việc đầu tiên ở trên nhé.</div>
        : <>
          {undone.map(row)}
          {done.length > 0 && <>
            <div className="todo-section">✅ Đã xong ({done.length})</div>
            {done.map(row)}
          </>}
        </>}
    </AppShell>
  );
}
