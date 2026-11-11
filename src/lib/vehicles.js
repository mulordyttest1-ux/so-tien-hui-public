// Xe co (giai doan 1): xe + nhat ky do xang + tinh muc tieu hao.
// Multi-vehicle ngay tu dau; moi nguoi chi thay xe cua minh (RLS).
import { supabase } from './supabaseClient';

export async function fetchVehicles() {
  const { data, error } = await supabase.from('vehicles')
    .select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addVehicle(userId, v) {
  const { data, error } = await supabase.from('vehicles').insert({
    user_id: userId,
    name: (v.name || '').trim(),
    kind: v.kind || 'xe_may',
    make_model: (v.make_model || '').trim() || null,
    plate: (v.plate || '').trim() || null,
    year: v.year ? Number(v.year) : null,
    fuel_type: v.fuel_type || 'xang',
    current_odometer: v.current_odometer ? Number(v.current_odometer) : null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateVehicle(id, v) {
  const { error } = await supabase.from('vehicles').update({
    name: (v.name || '').trim(),
    kind: v.kind || 'xe_may',
    make_model: (v.make_model || '').trim() || null,
    plate: (v.plate || '').trim() || null,
    year: v.year ? Number(v.year) : null,
    fuel_type: v.fuel_type || 'xang',
    current_odometer: v.current_odometer ? Number(v.current_odometer) : null,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteVehicle(id) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchFuelLogs(vehicleId) {
  const { data, error } = await supabase.from('vehicle_fuel_logs')
    .select('*').eq('vehicle_id', vehicleId)
    .order('date', { ascending: true }).order('odometer', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addFuelLog(userId, log) {
  const total = Math.round(Number(log.litres) * Number(log.price_per_litre));
  const { data, error } = await supabase.from('vehicle_fuel_logs').insert({
    user_id: userId,
    vehicle_id: log.vehicle_id,
    date: log.date,
    odometer: log.odometer ? Number(log.odometer) : null,
    litres: Number(log.litres),
    price_per_litre: Number(log.price_per_litre),
    total,
    station: (log.station || '').trim() || null,
    note: (log.note || '').trim() || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateFuelLog(id, log) {
  const total = Math.round(Number(log.litres) * Number(log.price_per_litre));
  const { data, error } = await supabase.from('vehicle_fuel_logs').update({
    date: log.date,
    odometer: log.odometer ? Number(log.odometer) : null,
    litres: Number(log.litres),
    price_per_litre: Number(log.price_per_litre),
    total,
    station: (log.station || '').trim() || null,
    note: (log.note || '').trim() || null,
  }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFuelLog(id) {
  const { error } = await supabase.from('vehicle_fuel_logs').delete().eq('id', id);
  if (error) throw error;
}

// Muc tieu hao: binh i chay duoc (odo_i - odo_{i-1}) km bang so lit do o binh i.
// Tinh theo lan do day binh; binh dau tien chua co moc truoc nen khong co so.
// So km KHONG bat buoc: binh nao thieu km (hoac binh ngay truoc no thieu km)
// thi khong tinh duoc muc tieu hao, kmNote giai thich vi sao.
export function withEconomy(logs) {
  const sorted = [...(logs || [])].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)) || Number(a.odometer) - Number(b.odometer));
  return sorted.map((log, i) => {
    let kmPerLitre = null;
    let kmNote = null;
    let kmDriven = null;
    if (i === 0) kmNote = 'first';
    else if (log.odometer == null) kmNote = 'no_odo';
    else if (sorted[i - 1].odometer == null) kmNote = 'prev_no_odo';
    else {
      const km = Number(log.odometer) - Number(sorted[i - 1].odometer);
      const litres = Number(log.litres);
      if (km > 0 && litres > 0) { kmPerLitre = km / litres; kmDriven = km; }
      else kmNote = 'bad_range';
    }
    return { ...log, kmPerLitre, kmNote, kmDriven };
  });
}

export function fuelStats(logs) {
  const withEco = withEconomy(logs);
  const segments = withEco.filter(l => l.kmPerLitre != null);
  const totalKm = segments.reduce((s, l) => s + (l.kmDriven || 0), 0);
  const totalLitres = segments.reduce((s, l) => s + Number(l.litres), 0);
  const totalFuel = withEco.reduce((s, l) => s + Number(l.total || 0), 0);
  const totalLitresAll = withEco.reduce((s, l) => s + Number(l.litres || 0), 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthLogs = withEco.filter(l => String(l.date).slice(0, 7) === monthKey);
  // Bang theo thang, moi nhat truoc. Km cua thang = tong km cua cac doan
  // ket thuc trong thang do; thang co dong uoc tinh thi danh dau.
  const byMonthMap = {};
  withEco.forEach(l => {
    const m = String(l.date).slice(0, 7);
    if (!byMonthMap[m]) byMonthMap[m] = { month: m, count: 0, litres: 0, total: 0, km: 0, hasEstimate: false };
    const r = byMonthMap[m];
    r.count += 1;
    r.litres += Number(l.litres || 0);
    r.total += Number(l.total || 0);
    r.km += l.kmDriven || 0;
    if (/ước tính/i.test(l.note || '')) r.hasEstimate = true;
  });
  const byMonth = Object.values(byMonthMap).sort((a, b) => b.month.localeCompare(a.month));
  return {
    logs: withEco,
    avgKmPerLitre: totalLitres > 0 ? totalKm / totalLitres : null,
    latestKmPerLitre: segments.length ? segments[segments.length - 1].kmPerLitre : null,
    monthTotal: monthLogs.reduce((s, l) => s + Number(l.total), 0),
    monthLitres: monthLogs.reduce((s, l) => s + Number(l.litres), 0),
    monthCount: monthLogs.length,
    totalKm,
    totalFuel,
    totalLitresAll,
    totalCount: withEco.length,
    costPerKm: totalKm > 0 ? totalFuel / totalKm : null,
    byMonth,
  };
}

export function kindLabel(kind) {
  return kind === 'o_to' ? 'Ô tô' : kind === 'khac' ? 'Xe khác' : 'Xe máy';
}
