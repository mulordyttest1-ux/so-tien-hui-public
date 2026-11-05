'use client';
import { useState } from 'react';
import katex from 'katex';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import { supabase } from '../../lib/supabaseClient';

const GOI_Y = [
  'Tháng này chi bao nhiêu?',
  'Khoản nào sắp đến hạn?',
  'Còn việc gì chưa xong?',
  'Quỹ nhóm còn phải đóng bao nhiêu?',
];

// Model tra loi toan bang LaTeX ($...$, $$...$$) va **in dam** — trang phai
// ve lai thanh bieu thuc toan / chu dam that, neu khong se hien ma tho
// (vi du \frac, \sqrt, ^) nhu chi Nancy thay. KaTeX ve cong thuc;
// doan nao khong phai toan that thi giu nguyen chu.
function renderMath(tex, displayMode, key) {
  let html = '';
  try { html = katex.renderToString(tex, { displayMode, throwOnError: false }); } catch { html = ''; }
  if (!html || html.includes('katex-error')) return <span key={key}>{tex}</span>;
  if (displayMode) return <div key={key} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderBold(text, keyPrefix) {
  return String(text).split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/);
    return m ? <strong key={keyPrefix + i}>{m[1]}</strong> : <span key={keyPrefix + i}>{p}</span>;
  });
}

function isMathContent(s) {
  // Chuoi trong $...$ chi coi la toan khi co dau hieu toan hoc
  // (lenh \, mu _, {}...) hoac la phep tinh thuan so.
  return /[\\^_{}]/.test(s) || /^\s*[\d\s.+\-*/()=<>!]+\s*$/.test(s);
}

function renderText(text) {
  const parts = String(text).split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g);
  return parts.map((p, i) => {
    let m = p.match(/^\$\$([\s\S]+?)\$\$$/) || p.match(/^\\\[([\s\S]+?)\\\]$/);
    if (m) return renderMath(m[1], true, 'm' + i);
    m = p.match(/^\$([^$\n]+?)\$$/) || p.match(/^\\\(([\s\S]+?)\\\)$/);
    if (m && (p.startsWith('\\(') || isMathContent(m[1]))) return renderMath(m[1], false, 'm' + i);
    return <span key={'t' + i}>{renderBold(p, 'b' + i + '-')}</span>;
  });
}

export default function TroLyGroqPage() {
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
      const res = await fetch('/api/agent-groq', {
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
      <h2>⚡ Trợ lý Groq</h2>
      <p className="muted">
        Hỏi về sổ của bạn — thu chi, hạn đóng, quỹ nhóm, việc cần làm — trợ lý tra ngay số thật trong app rồi trả lời.
        Bản đầu chỉ đọc và ghi việc cần làm, chưa tự ghi tiền. Câu hỏi của bạn được gửi sang Groq để trả lời; Groq cam kết không dùng câu hỏi để huấn luyện mô hình.
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
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{renderText(m.content)}</div>
        </div>
      ))}
      {busy && <div className="loading">Trợ lý đang tra sổ…</div>}

      <form onSubmit={e => { e.preventDefault(); send(); }}
        style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Hỏi trợ lý Groq…" style={{ flex: 1, minWidth: 0 }} />
        <button className="btn" type="submit" disabled={busy || !text.trim()} style={{ width: 'auto', flex: 'none' }}>Gửi</button>
      </form>
    </AppShell>
  );
}
