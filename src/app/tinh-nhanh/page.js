'use client';
import { useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import { CALC_TEMPLATES } from '../../lib/calcTemplates';
import { solveValues } from '../../lib/solver';

// Hiển thị số: tiền làm tròn tới đồng (tối đa 2 số lẻ khi cần), % tối đa 4 số lẻ.
function fmtNum(v, kind) {
  if (v === undefined || v === null || !Number.isFinite(v)) return '';
  const maxDec = kind === 'pct' ? 4 : 2;
  const rounded = Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : Number(v.toFixed(maxDec));
  return rounded.toLocaleString('vi-VN', { maximumFractionDigits: maxDec });
}

export default function TinhNhanhPage() {
  const { user, loading } = useRequireAuth();
  const [templateId, setTemplateId] = useState(CALC_TEMPLATES[0].id);
  const tpl = CALC_TEMPLATES.find(t => t.id === templateId) || CALC_TEMPLATES[0];
  // raw: những gì người dùng tự gõ (chuỗi theo key). Ô không có trong raw = ô trống / tự tính.
  const [raw, setRaw] = useState({});

  const solved = useMemo(() => {
    const known = {};
    for (const f of tpl.fields) {
      if (raw[f.key] !== undefined && raw[f.key] !== '') {
        const n = Number(String(raw[f.key]).replace(/[\s.]/g, '').replace(',', '.'));
        if (Number.isFinite(n)) known[f.key] = n;
      } else if (f.default !== undefined) {
        known[f.key] = f.default;
      }
    }
    return solveValues(tpl.rules, known);
  }, [tpl, raw]);

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  const filledCount = tpl.fields.filter(f => solved[f.key] !== undefined).length;

  return (
    <AppShell userEmail={user.email}>
      <div className="filters">
        <select value={templateId} onChange={e => { setTemplateId(e.target.value); setRaw({}); }}>
          {CALC_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
        </select>
        <button className="btn secondary" onClick={() => setRaw({})}>Xóa hết, tính lại</button>
      </div>

      <div className="card">
        <h3>{tpl.icon} {tpl.name}</h3>
        <p className="muted" style={{ marginTop: 4 }}>{tpl.desc}</p>
        <p className="muted">Ô ghi <b>“tự tính”</b> là app tự suy ra từ các ô bạn đã nhập — bạn gõ đè vào ô đó cũng được, app sẽ tính tiếp theo số của bạn. Đã có dữ kiện: {filledCount}/{tpl.fields.length} ô.</p>
      </div>

      <div className="card">
        {tpl.fields.map(f => {
          const isGiven = raw[f.key] !== undefined && raw[f.key] !== '';
          const isDefault = !isGiven && f.default !== undefined;
          const derived = !isGiven && !isDefault && solved[f.key] !== undefined;
          const value = isGiven ? raw[f.key] : (solved[f.key] !== undefined ? fmtNum(solved[f.key], f.kind) : '');
          return (
            <label className="field" key={f.key}>
              <span>{f.label} {f.unit && <span className="muted">({f.unit})</span>}
                {derived && <span className="thu" style={{ marginLeft: 6 }}>· tự tính</span>}
                {isDefault && <span className="muted" style={{ marginLeft: 6 }}>· mặc định, sửa được</span>}
              </span>
              <input
                type="text" inputMode="decimal"
                value={value}
                placeholder={f.placeholder || 'Chưa có dữ kiện'}
                onChange={e => setRaw(prev => ({ ...prev, [f.key]: e.target.value }))}
                style={derived ? { background: '#f0f7f0' } : undefined}
              />
            </label>
          );
        })}
      </div>

      <p className="muted">Mẫu tính mới sẽ được thêm vào đây khi phát sinh bài toán mới — chỉ cần khai báo thêm các ô và công thức ràng buộc, bộ máy tự tính không phải sửa.</p>
    </AppShell>
  );
}
