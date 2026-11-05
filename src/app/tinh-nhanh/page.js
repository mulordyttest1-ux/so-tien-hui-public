'use client';
import { useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import { CALC_TEMPLATES } from '../../lib/calcTemplates';
import { solveValues } from '../../lib/solver';
import MoneyInput from '../../components/MoneyInput';

const DAY_MS = 86400000;

// Ngày <-> số ngày kể từ 01/01/1970 (UTC), để bộ máy số học xử lý được phép trừ ngày.
function dateToEpoch(str) {
  const t = Date.parse(str + 'T00:00:00Z');
  return Number.isFinite(t) ? Math.round(t / DAY_MS) : NaN;
}
function epochToDate(n) {
  return new Date(Math.round(n) * DAY_MS).toISOString().slice(0, 10);
}
function fmtDateVn(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}
function fmtNum(v, kind) {
  if (v === undefined || v === null || !Number.isFinite(v)) return '';
  const maxDec = kind === 'pct' ? 4 : 2;
  const rounded = Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : Number(v.toFixed(maxDec));
  return rounded.toLocaleString('vi-VN', { maximumFractionDigits: maxDec });
}
function fmtMoney(v) {
  return v === undefined ? '' : fmtNum(v, 'money') + 'đ';
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
        const n = f.kind === 'date'
          ? dateToEpoch(raw[f.key])
          : Number(String(raw[f.key]).replace(/[\s.]/g, '').replace(',', '.'));
        if (Number.isFinite(n)) known[f.key] = n;
      } else if (f.default !== undefined) {
        known[f.key] = f.default;
      }
    }
    return solveValues(tpl.rules, known);
  }, [tpl, raw]);

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  // Kết quả nổi bật: tiền lời trong khoảng ngày (nếu có), nếu không thì lời/tháng.
  const hasKhoang = solved.tienLoiKhoang !== undefined;
  const heroAmount = hasKhoang ? fmtMoney(solved.tienLoiKhoang) : (solved.loiThang !== undefined ? fmtMoney(solved.loiThang) : null);
  const heroLabel = hasKhoang ? 'Lợi nhuận trong khoảng ngày' : 'Lợi nhuận mỗi tháng';
  const heroSub = hasKhoang
    ? [
        solved.ngayBatDau !== undefined ? `Từ ${fmtDateVn(epochToDate(solved.ngayBatDau))}` : '',
        solved.ngayKetThuc !== undefined ? `đến ${fmtDateVn(epochToDate(solved.ngayKetThuc))}` : '',
        solved.soNgayKhoang !== undefined ? `· ${fmtNum(solved.soNgayKhoang, 'int')} ngày` : '',
      ].filter(Boolean).join(' ')
    : (solved.loiNgay !== undefined ? `≈ ${fmtMoney(solved.loiNgay)} / ngày` : '');

  function fieldView(f) {
    const isGiven = raw[f.key] !== undefined && raw[f.key] !== '';
    const isDefault = !isGiven && f.default !== undefined;
    const derived = !isGiven && !isDefault && solved[f.key] !== undefined;
    let value = '';
    if (isGiven) value = raw[f.key];
    else if (f.kind === 'date' && solved[f.key] !== undefined) value = epochToDate(solved[f.key]);
    else if (solved[f.key] !== undefined) value = fmtNum(solved[f.key], f.kind);
    return { isGiven, isDefault, derived, value };
  }

  function renderField(f) {
    if (f.kind === 'bool') {
      const checked = raw[f.key] !== undefined ? raw[f.key] === '1' : (solved[f.key] === 1);
      return (
        <label className="field" key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            style={{ width: 'auto', accentColor: '#168250' }}
            checked={checked}
            onChange={e => setRaw(prev => ({ ...prev, [f.key]: e.target.checked ? '1' : '0' }))}
          />
          <span style={{ fontSize: 14 }}>{f.label} <span className="muted">(bật: đến − từ + 1 ngày; tắt: chỉ tính hiệu số)</span></span>
        </label>
      );
    }
    const { derived, isDefault, value } = fieldView(f);
    return (
      <label className="field" key={f.key}>
        <span>{f.label} {f.unit && <span className="muted">({f.unit})</span>}
          {derived && <span className="chip">tự tính</span>}
          {isDefault && <span className="muted" style={{ marginLeft: 6 }}>mặc định</span>}
        </span>
        {f.kind === 'money' ? (
          <MoneyInput
            value={value}
            placeholder={f.placeholder || 'Chưa có dữ kiện'}
            onChange={v => setRaw(prev => ({ ...prev, [f.key]: v }))}
            className={derived ? 'derived' : ''}
          />
        ) : (
          <input
            type={f.kind === 'date' ? 'date' : 'text'}
            inputMode={f.kind === 'date' ? undefined : 'decimal'}
            value={value}
            placeholder={f.placeholder || 'Chưa có dữ kiện'}
            onChange={e => setRaw(prev => ({ ...prev, [f.key]: e.target.value }))}
            className={derived ? 'derived' : ''}
          />
        )}
      </label>
    );
  }

  const sections = tpl.sections || [{ id: 'all', title: '', hint: '' }];
  const fieldsOf = (sid) => tpl.fields.filter(f => (f.section || 'all') === sid);

  return (
    <AppShell userEmail={user.email}>
      <div className="filters">
        <select value={templateId} onChange={e => { setTemplateId(e.target.value); setRaw({}); }}>
          {CALC_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
        </select>
        <button className="btn secondary" onClick={() => setRaw({})}>Xóa hết, tính lại</button>
      </div>

      {/* Kết quả nổi bật lên đầu, theo cách các app tính tiền đẹp vẫn làm:
          đáp án trước, chi tiết sau — không còn danh sách dài lê thê. */}
      <div className="hero">
        <div className="hero-label">{tpl.icon} {heroLabel}</div>
        <div className="hero-amount">{heroAmount || '—'}</div>
        <div className="hero-sub">{heroAmount ? heroSub : 'Nhập 2 ô bất kỳ bên dưới để bắt đầu tính.'}</div>
      </div>

      {sections.map(sec => {
        const fs = fieldsOf(sec.id);
        if (!fs.length) return null;
        const body = (
          <>
            {sec.hint && <p className="muted" style={{ marginTop: 0 }}>{sec.hint}</p>}
            <div className="grid2">{fs.map(renderField)}</div>
          </>
        );
        return sec.collapsed ? (
          <details className="card" key={sec.id}>
            <summary className="section-title">{sec.title} <span className="muted">— xem thêm</span></summary>
            <div style={{ marginTop: 10 }}>{body}</div>
          </details>
        ) : (
          <div className="card" key={sec.id}>
            <h3 className="section-title">{sec.title}</h3>
            {body}
          </div>
        );
      })}

      <p className="muted">Ô gắn chip “tự tính” là app tự suy ra — bạn gõ đè vào cũng được, app tính tiếp theo số của bạn. Mẫu tính mới sẽ được thêm khi phát sinh bài toán mới.</p>
    </AppShell>
  );
}
