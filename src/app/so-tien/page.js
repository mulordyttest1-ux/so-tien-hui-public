'use client';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import TagSelect from '../../components/TagSelect';
import { supabase } from '../../lib/supabaseClient';
import { fetchTransactions, fetchTags } from '../../lib/data';
import { fmtVND, todayISO } from '../../lib/format';

const EMPTY = { type: 'chi', amount: '', date: todayISO(), person_id: null, category_id: null, source_id: null, note: '' };

export default function SoTienPage() {
  const { user, loading } = useRequireAuth();
  const [txs, setTxs] = useState([]);
  const [tags, setTags] = useState({ persons: [], categories: [], sources: [] });
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(null); // null | tx object (id rỗng = mới)
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [fType, setFType] = useState('');
  const [fPerson, setFPerson] = useState('');
  const [fCat, setFCat] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    const [t, tg] = await Promise.all([fetchTransactions(), fetchTags()]);
    setTxs(t); setTags(tg); setReady(true);
  }
  useEffect(() => { if (user) load().catch(e => alert(e.message)); }, [user]);

  const filtered = useMemo(() => txs.filter(t =>
    t.date.startsWith(month) &&
    (!fType || t.type === fType) &&
    (!fPerson || t.person_id === fPerson) &&
    (!fCat || t.category_id === fCat) &&
    (!search || (t.note || '').toLowerCase().includes(search.toLowerCase()))
  ), [txs, month, fType, fPerson, fCat, search]);

  const totalThu = filtered.filter(t => t.type === 'thu').reduce((s, t) => s + Number(t.amount), 0);
  const totalChi = filtered.filter(t => t.type === 'chi').reduce((s, t) => s + Number(t.amount), 0);
  const name = (list, id) => list.find(x => x.id === id)?.name || '';

  async function save(e) {
    e.preventDefault();
    const payload = {
      user_id: user.id, type: editing.type, amount: Number(editing.amount),
      date: editing.date, person_id: editing.person_id || null,
      category_id: editing.category_id || null, source_id: editing.source_id || null,
      note: editing.note || '',
    };
    try {
      if (editing.id) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').insert(payload);
        if (error) throw error;
      }
      setEditing(null); await load();
    } catch (err) { alert('Không lưu được: ' + err.message); }
  }

  async function remove(tx) {
    if (!confirm('Xóa khoản này?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
    if (error) alert(error.message); else load();
  }

  function addTagTo(listKey) {
    return rec => setTags(prev => ({ ...prev, [listKey]: [...prev[listKey].filter(x => x.id !== rec.id), rec].sort((a, b) => a.name.localeCompare(b.name)) }));
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      <div className="filters">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <select value={fType} onChange={e => setFType(e.target.value)}>
          <option value="">Thu + Chi</option><option value="thu">Chỉ thu</option><option value="chi">Chỉ chi</option>
        </select>
        <select value={fPerson} onChange={e => setFPerson(e.target.value)}>
          <option value="">Mọi người</option>
          {tags.persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={fCat} onChange={e => setFCat(e.target.value)}>
          <option value="">Mọi hạng mục</option>
          {tags.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="search" placeholder="Tìm trong ghi chú…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 16 }}>
          <span className="thu">Thu {fmtVND(totalThu)}</span>
          <span className="chi">Chi {fmtVND(totalChi)}</span>
          <span><b>Còn {fmtVND(totalThu - totalChi)}</b></span>
        </div>
      </div>

      {!ready ? <div className="loading">Đang tải sổ…</div>
        : filtered.length === 0 ? <div className="empty">Không có khoản nào khớp bộ lọc.</div>
        : filtered.map(t => (
          <div className="card" key={t.id} style={{ padding: '10px 16px' }}>
            <div className="row" style={{ border: 'none', padding: 0 }}>
              <span>
                {t.note || name(tags.categories, t.category_id) || (t.type === 'thu' ? 'Khoản thu' : 'Khoản chi')}
                <br /><span className="muted">
                  {t.date}
                  {name(tags.persons, t.person_id) && ' · ' + name(tags.persons, t.person_id)}
                  {name(tags.categories, t.category_id) && ' · ' + name(tags.categories, t.category_id)}
                  {name(tags.sources, t.source_id) && ' · Nguồn: ' + name(tags.sources, t.source_id)}
                  {t.hui_group_id ? ' · (từ Hụi)' : ''}
                </span>
              </span>
              <span className={t.type === 'thu' ? 'thu' : 'chi'}>{t.type === 'thu' ? '+' : '−'} {fmtVND(t.amount)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button className="btn secondary small" onClick={() => setEditing({ ...t, amount: String(t.amount) })}>Sửa</button>
              <button className="btn danger small" onClick={() => remove(t)}>Xóa</button>
            </div>
          </div>
        ))}

      <button className="fab" aria-label="Ghi khoản mới" onClick={() => setEditing({ ...EMPTY })}>+</button>

      {editing && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing.id ? 'Sửa khoản' : 'Ghi khoản mới'}</h2>
            <form onSubmit={save}>
              <div className="seg">
                <button type="button" className={editing.type === 'thu' ? 'on-thu' : ''} onClick={() => setEditing({ ...editing, type: 'thu' })}>Thu vào</button>
                <button type="button" className={editing.type === 'chi' ? 'on-chi' : ''} onClick={() => setEditing({ ...editing, type: 'chi' })}>Chi ra</button>
              </div>
              <label className="field"><span>Số tiền (đ)</span>
                <input type="number" inputMode="numeric" required min="1" value={editing.amount}
                  onChange={e => setEditing({ ...editing, amount: e.target.value })} placeholder="VD: 500000" />
              </label>
              <label className="field"><span>Ngày</span>
                <input type="date" required value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
              </label>
              <TagSelect label="Người" table="persons" items={tags.persons} userId={user.id}
                value={editing.person_id} onChange={v => setEditing({ ...editing, person_id: v })} onCreated={addTagTo('persons')} />
              <TagSelect label="Hạng mục" table="categories" items={tags.categories} userId={user.id}
                value={editing.category_id} onChange={v => setEditing({ ...editing, category_id: v })} onCreated={addTagTo('categories')} />
              <TagSelect label="Nguồn tiền" table="sources" items={tags.sources} userId={user.id}
                value={editing.source_id} onChange={v => setEditing({ ...editing, source_id: v })} onCreated={addTagTo('sources')} />
              <label className="field"><span>Ghi chú</span>
                <input value={editing.note || ''} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder="VD: tiền học cho con" />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Hủy</button>
                <button type="submit" className="btn">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
