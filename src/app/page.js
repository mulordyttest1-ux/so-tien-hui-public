'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useRequireAuth } from '../../components/useRequireAuth';
import MoneyInput from '../../components/MoneyInput';
import { fmtVND, todayISO } from '../../lib/format';
import {
  fetchVehicles, addVehicle, updateVehicle, deleteVehicle,
  fetchFuelLogs, addFuelLog, deleteFuelLog, fuelStats, kindLabel,
} from '../../lib/vehicles';

const EMPTY_VEHICLE = { name: '', kind: 'xe_may', make_model: '', plate: '', year: '', fuel_type: 'xang', current_odometer: '' };

export default function XePage() {
  const { user, loading } = useRequireAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [ready, setReady] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vform, setVform] = useState(EMPTY_VEHICLE);
  const [fdate, setFdate] = useState(todayISO());
  const [fodo, setFodo] = useState('');
  const [flitres, setFlitres] = useState('');
  const [fprice, setFprice] = useState('');
  const [fstation, setFstation] = useState('');
  const [fnote, setFnote] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadVehicles(selectId) {
    const vs = await fetchVehicles();
    setVehicles(vs);
    const id = selectId || vs[0]?.id || null;
    setSelectedId(id);
    if (id) setLogs(await fetchFuelLogs(id));
    else setLogs([]);
    setReady(true);
  }
  useEffect(() => { if (user) loadVehicles().catch(e => alert(e.message)); }, [user]);

  async function selectVehicle(id) {
    setSelectedId(id);
    setLogs(await fetchFuelLogs(id));
    const v = vehicles.find(x => x.id === id);
    setFodo(v?.current_odometer ? String(v.current_odometer) : '');
  }

  const selected = vehicles.find(v => v.id === selectedId) || null;
  const stats = fuelStats(logs);
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

  async function saveFuel(e) {
    e.preventDefault();
    if (!selected || !fdate || !fodo || !flitres || !fprice || busy) return;
    setBusy(true);
    try {
      await addFuelLog(user.id, {
        vehicle_id: selected.id, date: fdate, odometer: fodo,
        litres: flitres, price_per_litre: fprice, station: fstation, note: fnote,
      });
      // So km hien tai cua xe = so km moi nhat neu lon hon.
      if (!selected.current_odometer || Number(fodo) > Number(selected.current_odometer)) {
        await updateVehicle(selected.id, { ...selected, current_odometer: fodo });
      }
      setFlitres(''); setFprice(''); setFstation(''); setFnote('');
      setFodo(String(fodo));
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

  if (loading || !user) return <div className="loading">Đang tải…</div>;

  return (
    <AppShell userEmail={user.email}>
      <h2>🚗 Xe cộ</h2>
      <p className="muted">
        Ghi đổ xăng, theo dõi mức tiêu hao từng xe. Mức tiêu hao tính theo lần đổ đầy bình:
        số km chạy được từ lần đổ trước chia cho số lít lần này.
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
                </div>
              </div>
            )}

            {selected && (
              <>
                <h3 style={{ marginTop: 16 }}>Đổ xăng mới</h3>
                <form onSubmit={saveFuel} style={{ display: 'grid', gap: 8 }}>
                  <label>Ngày <input type="date" value={fdate} onChange={e => setFdate(e.target.value)} required /></label>
                  <label>Số km lúc đổ <input type="number" min="0" step="1" value={fodo} onChange={e => setFodo(e.target.value)} placeholder="VD: 45210" required style={{ width: '100%' }} /></label>
                  <label>Số lít <input type="number" min="0" step="0.01" value={flitres} onChange={e => setFlitres(e.target.value)} placeholder="VD: 3.5" required style={{ width: '100%' }} /></label>
                  <label>Giá / lít (đ)
                    <MoneyInput value={fprice} onChange={setFprice} placeholder="VD: 20.000" />
                  </label>
                  <div>Tổng tiền: <b>{ftotal > 0 ? fmtVND(Math.round(ftotal)) : '—'}</b></div>
                  <label>Cây xăng (không bắt buộc) <input value={fstation} onChange={e => setFstation(e.target.value)} placeholder="VD: Petrolimex Nguyễn Văn Linh" style={{ width: '100%' }} /></label>
                  <label>Ghi chú (không bắt buộc) <input value={fnote} onChange={e => setFnote(e.target.value)} style={{ width: '100%' }} /></label>
                  <button className="btn" type="submit" disabled={busy || !fdate || !fodo || !flitres || !fprice}>Lưu lần đổ xăng</button>
                </form>

                <h3 style={{ marginTop: 16 }}>Lịch sử đổ xăng</h3>
                {stats.logs.length === 0 ? <div className="empty">Chưa có lần đổ xăng nào cho xe này.</div>
                  : [...stats.logs].reverse().map(log => (
                    <div className="row" key={log.id}>
                      <div style={{ flex: 1 }}>
                        <b>{log.date}</b> · {Number(log.odometer).toLocaleString('vi-VN')} km · {Number(log.litres).toLocaleString('vi-VN')} lít · {fmtVND(log.total)}
                        {log.station ? <span className="muted"> · {log.station}</span> : ''}
                        <div className="muted">Mức tiêu hao: {fmtKmL(log.kmPerLitre)}{log.kmPerLitre == null && ' (bình đầu tiên, chưa tính được)'}</div>
                      </div>
                      <button type="button" className="btn" onClick={() => removeFuel(log)}>
                        {deleting === log.id ? 'Chắc xóa?' : 'Xóa'}
                      </button>
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
          <label>Số km hiện tại <input type="number" min="0" step="1" value={vform.current_odometer} onChange={e => setVform({ ...vform, current_odometer: e.target.value })} placeholder="VD: 45210" style={{ width: '100%' }} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={busy || !vform.name.trim()} style={{ width: 'auto', flex: 'none' }}>Lưu xe</button>
            <button className="btn" type="button" onClick={() => { setShowVehicleForm(false); setEditingVehicle(null); }} style={{ width: 'auto', flex: 'none' }}>Hủy</button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
