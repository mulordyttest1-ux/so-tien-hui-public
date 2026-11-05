'use client';
import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import { supabase } from '../../lib/supabaseClient';

const GOI_Y = [
  'Tháng này chi bao nhiêu?',
  'Khoản nào sắp đến hạn?',
  'Còn việc gì chưa xong?',
  'Quỹ nhóm còn phải đóng bao nhiêu?',
];

export default function TroLyPage() {
  const { user, loading } = useRequireAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(content) {
    const q = (content ?? text).trim();
    if (!q || busy) return;
    setText('');
    const next = [...msgs, { role: 'user', content: q }];
    setMsgs(next);
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      setMsgs([...next, { role: 'assistant', content: data.reply || 'Trợ lý chưa trả lời được, bạn thử lại nhé.' }]);
    } catch {
      setMsgs([...next, { role: 'assistant', content: 'Mất kết nối lúc gửi câu hỏi, bạn thử lại nhé.' }]);
    }
    setBusy(false);
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      <h2>🤖 Trợ lý</h2>
      <p className="muted">
        Hỏi về sổ của bạn — thu chi, hạn đóng, quỹ nhóm, việc cần làm — trợ lý tra ngay số thật trong app rồi trả lời.
        Bản đầu chỉ đọc và ghi việc cần làm, chưa tự ghi tiền. Câu hỏi của bạn được gửi sang Gemini (Google) để trả lời; Google có thể dùng câu hỏi ở gói miễn phí để huấn luyện mô hình.
      </p>

      {msgs.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {GOI_Y.map(g => (
            <button key={g} type="button" className="btn" onClick={() => send(g)}>{g}</button>
          ))}
        </div>
      )}

      {msgs.map((m, i) => (
        <div key={i} className="card" style={m.role === 'user'
          ? { background: '#eef6f0', marginLeft: 32 }
          : { marginRight: 32 }}>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.content}</div>
        </div>
      ))}
      {busy && <div className="loading">Trợ lý đang tra sổ…</div>}

      <form onSubmit={e => { e.preventDefault(); send(); }}
        style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Hỏi trợ lý…" style={{ flex: 1 }} />
        <button className="btn" type="submit" disabled={busy || !text.trim()}>Gửi</button>
      </form>
    </AppShell>
  );
}
