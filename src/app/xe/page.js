'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import MoneyInput from '../../components/MoneyInput';
import { fmtVND, todayISO } from '../../lib/format';
import {
  fetchVehicles, addVehicle, updateVehicle, deleteVehicle,
  fetchFuelLogs, addFuelLog, updateFuelLog, deleteFuelLog, fuelStats, kindLabel,
} from '../../lib/vehicles';
import {
  EXPENSE_CATEGORIES, fetchVehicleExpenses, addVehicleExpense, updateVehicleExpense,
  deleteVehicleExpense, fetchVehicleServices, addVehicleService, updateVehicleService,
  deleteVehicleService, expenseTotals,
} from '../../lib/vehicleExpenses';

const EMPTY_VEHICLE = { name: '', kind: 'xe_may', make_model: '', plate: '', year: '', fuel_type: 'xang', current_odometer: '' };

// Vi sao mot lan do xang khong tinh duoc muc tieu hao.
const KM_NOTE = {
  first: 'bình đầu tiên, chưa tính được',
  no_odo: 'không nhập số km nên chưa tính được',
  prev_no_odo: 'lần trước không nhập số km nên chưa tính được',
  bad_range: 'số km không hợp lệ nên chưa tính được',
};

export default function XePage() {
  const { user, loading } = useRequireAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [ready, setReady] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vform, setVform] = useState(EMPTY_VEHICLE);
  // Do xang
  const [fdate, setFdate] = useState(todayISO());
  const [fodo, setFodo] = useState('');
  const [flitres, setFlitres] = useState('');
  const [fprice, setFprice] = useState('');
  const [fstation, setFstation] = useState('');
  const [fnote, setFnote] = useState('');
  const [editingFuel, setEditingFuel] = useState(null);
  // Chi phi
  const [edate, setEdate] = useState(todayISO());
  const [ecat, setEcat] = useState(EXPENSE_CATEGORIES[0]);
  const [eamount, setEamount] = useState('');
  const [eodo, setEodo] = useState('');
  const [enote, setEnote] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  // Bao duong
  const [sdate, setSdate] = useState(todayISO());
  const [stitle, setStitle] = useState('');
  const [stotal, setStotal] = useState('');
  const [sodo, setSodo] = useState('');
  const [snote, setSnote] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadVehicles(selectId) {
    const vs = await fetchVehicles();
    setVehicles(vs);
    const id = selectId || vs[0]?.id || null;
    setSelectedId(id);
    if (id) await loadVehicleData(id);
    else { setLogs([]); setExpenses([]); setServices([]); }
    setReady(true);
  }
  async function loadVehicleData(id) {
    const [fl, ex, sv] = await Promise.all([
      fetchFuelLogs(id), fetchVehicleExpenses(id), fetchVehicleServices(id),
    ]);
    setLogs(fl); setExpenses(ex); setServices(sv);
  }
  useEffect(() => { if (user) loadVehicles().catch(e => alert(e.message)); }, [user]);

  async function selectVehicle(id) {
    setSelectedId(id);
    await loadVehicleData(id);
    const v = vehicles.find(x => x.id === id);
    setFodo(v?.current_odometer ? String(v.current_odometer) : '');
    setEditingFuel(null); setEditingExpense(null); setEditingService(null);
  }

  const selected = vehicles.find(v => v.id === selectedId) || null;
  const stats = fuelStats(logs);
  const expTotals = expenseTotals(expenses);
  const serviceTotal = services.reduce((s, x) => s + Number(x.total || 0), 0);
  const ftotal = Number(flitres) * Number(fprice);
  const fmtKmL = v => (v == null ? '—' : v.toFixed(1) + ' km/lít');

  function openVehicleForm(v) {
    setEditingVehicle(v || null);
    setVform(v ? {
      name: v.name || '', kind: v.kind || 'xe_may', make_model: v.make_model || '',
      plate: v.plate || '', year: v.year ? String(v.year) : '',
      fuel_type: v.fuel_type || 'xang',
      current_odometer: v.current_odometer ? String(v.current_odometer) : '',
    } : EMPTY_VEHICLE);
    setShowVehicleForm(true);
  }

  async function saveVehicle(e) {
    e.preventDefault();
    if (!vform.name.trim() || busy) return;
    setBusy(true);
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vform);
        await loadVehicles(editingVehicle.id);
      } else {
        const v = await addVehicle(user.id, vform);
        await loadVehicles(v.id);
      }
      setShowVehicleForm(false);
      setEditingVehicle(null);
    } catch (err) { alert('Không lưu được xe: ' + err.message); }
    setBusy(false);
  }

  async function removeVehicle(v) {
    if (deletingVehicle !== v.id) { setDeletingVehicle(v.id); return; }
    setDeletingVehicle(null);
    try { await deleteVehicle(v.id); await loadVehicles(); }
    catch (err) { alert('Không xóa được xe: ' + err.message); }
  }

  function startEditFuel(log) {
    setEditingFuel(log);
    setFdate(log.date); setFodo(log.odometer != null ? String(log.odometer) : ''); setFlitres(String(log.litres));
    setFprice(String(log.price_per_litre)); setFstation(log.station || ''); setFnote(log.note || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetFuelForm() {
    setEditingFuel(null);
    setFdate(todayISO()); setFlitres(''); setFprice(''); setFstation(''); setFnote('');
    setFodo(selected?.current_odometer ? String(selected.current_odometer) : '');
  }

  async function saveFuel(e) {
    e.preventDefault();
    if (!selected || !fdate || !flitres || !fprice || busy) return;
    setBusy(true);
    try {
      const payload = {
        vehicle_id: selected.id, date: fdate, odometer: fodo,
        litres: flitres, price_per_litre: fprice, station: fstation, note: fnote,
      };
      if (editingFuel) await updateFuelLog(editingFuel.id, payload);
      else {
        await addFuelLog(user.id, payload);
        if (fodo && (!selected.current_odometer || Number(fodo) > Number(selected.current_odometer))) {
          await updateVehicle(selected.id, { ...selected, current_odometer: fodo });
        }
      }
      resetFuelForm();
      await loadVehicles(selected.id);
    } catch (err) { alert('Không lưu được lần đổ xăng: ' + err.message); }
    setBusy(false);
  }

  async function removeFuel(log) {
    if (deleting !== log.id) { setDeleting(log.id); return; }
    setDeleting(null);
    try { await deleteFuelLog(log.id); await loadVehicles(selectedId); }
    catch (err) { alert('Không xóa được: ' + err.message); }
  }

  function startEditExpense(ex) {
    setEditingExpense(ex);
    setEdate(ex.date); setEcat(ex.category); setEamount(String(ex.amount));
    setEodo(ex.odometer ? String(ex.odometer) : ''); setEnote(ex.note || '');
  }
  function resetExpenseForm() {
    setEditingExpense(null);
    setEdate(todayISO()); setEcat(EXPENSE_CATEGORIES[0]); setEamount(''); setEodo(''); setEnote('');
  }

  async function saveExpense(e) {
    e.preventDefault();
    if (!selected || !edate || !eamount || busy) return;
    setBusy(true);
    try {
      const payload = {
        vehicle_id: selected.id, date: edate, category: ecat,
        amount: eamount, odometer: eodo, note: enote,
      };
      if (editingExpense) await updateVehicleExpense(editingExpense.id, payload);
      else await addVehicleExpense(user.id, payload);
      resetExpenseForm();
      await loadVehicles(selected.id);
    } catch (err) { alert('Không lưu được chi phí: ' + err.message); }
    setBusy(false);
  }

  async function removeExpense(ex) {
    if (deleting !== ex.id) { setDeleting(ex.id); return; }
    setDeleting(null);
    try { await deleteVehicleExpense(ex.id); await loadVehicles(selectedId); }
    catch (err) { alert('Không xóa được: ' + err.message); }
  }

  function startEditService(sv) {
    setEditingService(sv);
    setSdate(sv.date); setStitle(sv.title); setStotal(String(sv.total));
    setSodo(sv.odometer ? String(sv.odometer) : ''); setSnote(sv.note || '');
  }
  function resetServiceForm() {
    setEditingService(null);
    setSdate(todayISO()); setStitle(''); setStotal(''); setSodo(''); setSnote('');
  }

  async function saveService(e) {
    e.preventDefault();
    if (!selected || !sdate || !stitle.trim() || !stotal || busy) return;
    setBusy(true);
    try {
      const payload = {
        vehicle_id: selected.id, date: sdate, title: stitle,
        total: stotal, odometer: sodo, note: snote,
      };
      if (editingService) await updateVehicleService(editingService.id, payload);
      else await addVehicleService(user.id, payload);
      resetServiceForm();
      await loadVehicles(selected.id);
    } catch (err) { alert('Không lưu được bảo dưỡng: ' + err.message); }
    setBusy(false);
  }

  async function removeService(sv) {
    if (deleting !== sv.id) { setDeleting(sv.id); return; }
    setDeleting(null);
    try { await deleteVehicleService(sv.id); await loadVehicles(selectedId); }
    catch (err) { alert('Không xóa được: ' + err.message); }
  }

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      <h2>🚗 Xe cộ</h2>
      <p className="muted">
        Ghi đổ xăng, chi phí, bảo dưỡng, theo dõi mức tiêu hao từng xe. Mức tiêu hao tính theo lần đổ đầy bình:
        số km chạy được từ lần đổ trước chia cho số lít lần này. Không nhập số km cũng được — lần đó chỉ
        không tính được mức tiêu hao, tiền xăng vẫn ghi đủ.
      </p>

      {!ready ? <div className="loading">Đang tải…</div>
        : vehicles.length === 0 && !showVehicleForm ? (
          <div className="empty">
            Chưa có xe nào. Thêm chiếc đầu tiên ở dưới nhé — ví dụ ô tô của chị và SH Mode 2019.
            <div style={{ marginTop: 12 }}>
              <button className="btn" type="button" onClick={() => openVehicleForm(null)}>＋ Thêm xe</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {vehicles.map(v => (
                <button key={v.id} type="button" className="btn" onClick={() => selectVehicle(v.id)}
                  style={{ width: 'auto', flex: 'none', background: v.id === selectedId ? '#168250' : undefined, color: v.id === selectedId ? '#fff' : undefined }}>
                  {v.name}
                </button>
              ))}
              <button type="button" className="btn" onClick={() => openVehicleForm(null)} style={{ width: 'auto', flex: 'none' }}>＋ Thêm xe</button>
            </div>

            {selected && (
              <div className="card">
                <b>{selected.name}</b>
                <span className="muted"> · {kindLabel(selected.kind)}
                  {selected.make_model ? ` · ${selected.make_model}` : ''}
                  {selected.plate ? ` · ${selected.plate}` : ''}
                  {selected.current_odometer ? ` · ${Number(selected.current_odometer).toLocaleString('vi-VN')} km` : ''}
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="btn" onClick={() => openVehicleForm(selected)} style={{ width: 'auto', flex: 'none' }}>Sửa xe</button>
                  <button type="button" className="btn" onClick={() => removeVehicle(selected)} style={{ width: 'auto', flex: 'none' }}>
                    {deletingVehicle === selected.id ? 'Chắc xóa xe?' : 'Xóa xe'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                  <div>⛽ Trung bình: <b>{fmtKmL(stats.avgKmPerLitre)}</b></div>
                  <div>Bình gần nhất: <b>{fmtKmL(stats.latestKmPerLitre)}</b></div>
                  <div>Xăng tháng này: <b>{fmtVND(stats.monthTotal)}</b>{stats.monthLitres > 0 && <span className="muted"> ({Number(stats.monthLitres).toLocaleString('vi-VN')} lít, {stats.monthCount} lần)</span>}</div>
                  <div>Đã chạy: <b>{stats.totalKm ? Math.round(stats.totalKm).toLocaleString('vi-VN') + ' km' : '—'}</b></div>
                  <div>Chi phí xe: <b>{fmtVND(expTotals.total)}</b></div>
                  <div>Bảo dưỡng: <b>{fmtVND(serviceTotal)}</b></div>
                </div>
              </div>
            )}

            {selected && (
              <>
                <h3 style={{ marginTop: 16 }}>{editingFuel ? 'Sửa lần đổ xăng' : 'Đổ xăng mới'}</h3>
                <form onSubmit={saveFuel} style={{ display: 'grid', gap: 8 }}>
                  <label>Ngày <input type="date" value={fdate} onChange={e => setFdate(e.target.value)} required /></label>
                  <label>Số km lúc đổ (không bắt buộc) <input type="number" min="0" step="1" value={fodo} onChange={e => setFodo(e.target.value)} placeholder="VD: 45210 — nhớ thì nhập, không nhớ thì thôi" style={{ width: '100%' }} /></label>
                  <label>Số lít <input type="number" min="0" step="0.01" value={flitres} onChange={e => setFlitres(e.target.value)} placeholder="VD: 3.5" required style={{ width: '100%' }} /></label>
                  <label>Giá / lít (đ)
                    <MoneyInput value={fprice} onChange={setFprice} placeholder="VD: 20.000" />
                  </label>
                  <div>Tổng tiền: <b>{ftotal > 0 ? fmtVND(Math.round(ftotal)) : '—'}</b></div>
                  <label>Cây xăng (không bắt buộc) <input value={fstation} onChange={e => setFstation(e.target.value)} placeholder="VD: Petrolimex Nguyễn Văn Linh" style={{ width: '100%' }} /></label>
                  <label>Ghi chú (không bắt buộc) <input value={fnote} onChange={e => setFnote(e.target.value)} style={{ width: '100%' }} /></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" type="submit" disabled={busy || !fdate || !flitres || !fprice} style={{ width: 'auto', flex: 'none' }}>{editingFuel ? 'Lưu sửa' : 'Lưu lần đổ xăng'}</button>
                    {editingFuel && <button className="btn" type="button" onClick={resetFuelForm} style={{ width: 'auto', flex: 'none' }}>Hủy sửa</button>}
                  </div>
                </form>

                <h3 style={{ marginTop: 16 }}>Lịch sử đổ xăng</h3>
                {stats.logs.length === 0 ? <div className="empty">Chưa có lần đổ xăng nào cho xe này.</div>
                  : [...stats.logs].reverse().map(log => (
                    <div className="row" key={log.id}>
                      <div style={{ flex: 1 }}>
                        <b>{log.date}</b> · {log.odometer != null ? `${Number(log.odometer).toLocaleString('vi-VN')} km` : 'không nhập km'} · {Number(log.litres).toLocaleString('vi-VN')} lít · {fmtVND(log.total)}
                        {log.station ? <span className="muted"> · {log.station}</span> : ''}
                        <div className="muted">Mức tiêu hao: {fmtKmL(log.kmPerLitre)}{log.kmPerLitre == null && ` (${KM_NOTE[log.kmNote] || 'chưa tính được'})`}</div>
                        {log.note ? <div className="muted">📝 {log.note}</div> : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn" onClick={() => startEditFuel(log)} style={{ width: 'auto', flex: 'none' }}>Sửa</button>
                        <button type="button" className="btn" onClick={() => removeFuel(log)} style={{ width: 'auto', flex: 'none' }}>
                          {deleting === log.id ? 'Chắc xóa?' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  ))}

                <h3 style={{ marginTop: 16 }}>{editingExpense ? 'Sửa chi phí' : 'Chi phí mới'}</h3>
                <form onSubmit={saveExpense} style={{ display: 'grid', gap: 8 }}>
                  <label>Ngày <input type="date" value={edate} onChange={e => setEdate(e.target.value)} required /></label>
                  <label>Loại chi phí
                    <select value={ecat} onChange={e => setEcat(e.target.value)} style={{ width: '100%' }}>
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>Số tiền (đ)
                    <MoneyInput value={eamount} onChange={setEamount} placeholder="VD: 1.762.000" />
                  </label>
                  <label>Số km lúc chi (không bắt buộc) <input type="number" min="0" step="1" value={eodo} onChange={e => setEodo(e.target.value)} style={{ width: '100%' }} /></label>
                  <label>Ghi chú (không bắt buộc) <input value={enote} onChange={e => setEnote(e.target.value)} style={{ width: '100%' }} /></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" type="submit" disabled={busy || !edate || !eamount} style={{ width: 'auto', flex: 'none' }}>{editingExpense ? 'Lưu sửa' : 'Lưu chi phí'}</button>
                    {editingExpense && <button className="btn" type="button" onClick={resetExpenseForm} style={{ width: 'auto', flex: 'none' }}>Hủy sửa</button>}
                  </div>
                </form>

                <h3 style={{ marginTop: 16 }}>Lịch sử chi phí · Tổng {fmtVND(expTotals.total)}</h3>
                {Object.keys(expTotals.byCat).length > 0 && (
                  <div className="muted" style={{ marginBottom: 8 }}>
                    {Object.entries(expTotals.byCat).map(([c, v]) => `${c}: ${fmtVND(v)}`).join(' · ')}
                  </div>
                )}
                {expenses.length === 0 ? <div className="empty">Chưa có chi phí nào cho xe này.</div>
                  : expenses.map(ex => (
                    <div className="row" key={ex.id}>
                      <div style={{ flex: 1 }}>
                        <b>{ex.date}</b> · {ex.category} · {fmtVND(ex.amount)}
                        {ex.odometer ? <span className="muted"> · {Number(ex.odometer).toLocaleString('vi-VN')} km</span> : ''}
                        {ex.note ? <div className="muted">📝 {ex.note}</div> : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn" onClick={() => startEditExpense(ex)} style={{ width: 'auto', flex: 'none' }}>Sửa</button>
                        <button type="button" className="btn" onClick={() => removeExpense(ex)} style={{ width: 'auto', flex: 'none' }}>
                          {deleting === ex.id ? 'Chắc xóa?' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  ))}

                <h3 style={{ marginTop: 16 }}>{editingService ? 'Sửa bảo dưỡng' : 'Bảo dưỡng mới'}</h3>
                <form onSubmit={saveService} style={{ display: 'grid', gap: 8 }}>
                  <label>Ngày <input type="date" value={sdate} onChange={e => setSdate(e.target.value)} required /></label>
                  <label>Nội dung <input value={stitle} onChange={e => setStitle(e.target.value)} placeholder="VD: Thay dầu + lọc dầu" required style={{ width: '100%' }} /></label>
                  <label>Tổng tiền (đ)
                    <MoneyInput value={stotal} onChange={setStotal} placeholder="VD: 1.183.946" />
                  </label>
                  <label>Số km lúc làm (không bắt buộc) <input type="number" min="0" step="1" value={sodo} onChange={e => setSodo(e.target.value)} style={{ width: '100%' }} /></label>
                  <label>Ghi chú (không bắt buộc) <input value={snote} onChange={e => setSnote(e.target.value)} style={{ width: '100%' }} /></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" type="submit" disabled={busy || !sdate || !stitle.trim() || !stotal} style={{ width: 'auto', flex: 'none' }}>{editingService ? 'Lưu sửa' : 'Lưu bảo dưỡng'}</button>
                    {editingService && <button className="btn" type="button" onClick={resetServiceForm} style={{ width: 'auto', flex: 'none' }}>Hủy sửa</button>}
                  </div>
                </form>

                <h3 style={{ marginTop: 16 }}>Lịch sử bảo dưỡng · Tổng {fmtVND(serviceTotal)}</h3>
                {services.length === 0 ? <div className="empty">Chưa có lần bảo dưỡng nào cho xe này.</div>
                  : services.map(sv => (
                    <div className="row" key={sv.id}>
                      <div style={{ flex: 1 }}>
                        <b>{sv.date}</b> · {sv.title} · {fmtVND(sv.total)}
                        {sv.odometer ? <span className="muted"> · {Number(sv.odometer).toLocaleString('vi-VN')} km</span> : ''}
                        {sv.note ? <div className="muted">📝 {sv.note}</div> : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn" onClick={() => startEditService(sv)} style={{ width: 'auto', flex: 'none' }}>Sửa</button>
                        <button type="button" className="btn" onClick={() => removeService(sv)} style={{ width: 'auto', flex: 'none' }}>
                          {deleting === sv.id ? 'Chắc xóa?' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </>
        )}

      {showVehicleForm && (
        <form onSubmit={saveVehicle} style={{ display: 'grid', gap: 8, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <h3>{editingVehicle ? 'Sửa xe' : 'Thêm xe mới'}</h3>
          <label>Tên xe <input value={vform.name} onChange={e => setVform({ ...vform, name: e.target.value })} placeholder="VD: Ô tô, SH Mode" required style={{ width: '100%' }} /></label>
          <label>Loại xe
            <select value={vform.kind} onChange={e => setVform({ ...vform, kind: e.target.value })} style={{ width: '100%' }}>
              <option value="xe_may">Xe máy</option>
              <option value="o_to">Ô tô</option>
              <option value="khac">Xe khác</option>
            </select>
          </label>
          <label>Hãng / dòng / năm <input value={vform.make_model} onChange={e => setVform({ ...vform, make_model: e.target.value })} placeholder="VD: Honda SH Mode 2019" style={{ width: '100%' }} /></label>
          <label>Biển số <input value={vform.plate} onChange={e => setVform({ ...vform, plate: e.target.value })} placeholder="VD: 47A-123.45" style={{ width: '100%' }} /></label>
          <label>Năm sản xuất <input type="number" value={vform.year} onChange={e => setVform({ ...vform, year: e.target.value })} placeholder="VD: 2019" style={{ width: '100%' }} /></label>
          <label>Loại nhiên liệu
            <select value={vform.fuel_type} onChange={e => setVform({ ...vform, fuel_type: e.target.value })} style={{ width: '100%' }}>
              <option value="xang">Xăng</option>
              <option value="dau">Dầu</option>
              <option value="dien">Điện</option>
            </select>
          </label>
          <label>Số km hiện tại (không bắt buộc) <input type="number" min="0" step="1" value={vform.current_odometer} onChange={e => setVform({ ...vform, current_odometer: e.target.value })} placeholder="VD: 45210" style={{ width: '100%' }} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={busy || !vform.name.trim()} style={{ width: 'auto', flex: 'none' }}>Lưu xe</button>
            <button className="btn" type="button" onClick={() => { setShowVehicleForm(false); setEditingVehicle(null); }} style={{ width: 'auto', flex: 'none' }}>Hủy</button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
