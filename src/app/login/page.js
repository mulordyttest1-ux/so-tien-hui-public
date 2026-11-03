'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setNotice('Đã đăng ký. Kiểm tra email để xác nhận tài khoản, rồi quay lại đăng nhập.');
          setMode('login');
        } else router.replace('/');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/');
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, thử lại nhé.');
    }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <h1>Sổ Tiền &amp; Hụi</h1>
      <p className="muted" style={{ textAlign: 'center' }}>
        Mỗi người một tài khoản — một sổ tiền riêng, không ai thấy của ai.
      </p>
      {!isSupabaseConfigured && (
        <div className="error">
          App chưa được cấu hình Supabase (thiếu NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).
          Người quản trị cần làm theo README.md để app hoạt động.
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}
      <form onSubmit={submit}>
        <label className="field"><span>Email</span>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="ban@email.com" autoComplete="email" />
        </label>
        <label className="field"><span>Mật khẩu</span>
          <input type="password" required minLength={6} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Ít nhất 6 ký tự"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? 'Đang xử lý…' : mode === 'register' ? 'Đăng ký tài khoản' : 'Đăng nhập'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        {mode === 'register' ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
        <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
          {mode === 'register' ? 'Đăng nhập' : 'Đăng ký miễn phí'}
        </a>
      </p>
    </div>
  );
}
