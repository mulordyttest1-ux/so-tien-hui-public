import { supabase } from './supabaseClient';

// Tất cả truy vấn đều dựa vào Row Level Security của Supabase:
// server chỉ trả về dòng thuộc về user đang đăng nhập.

export async function fetchTags() {
  const [persons, categories, sources] = await Promise.all([
    supabase.from('persons').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('sources').select('*').order('name'),
  ]);
  return {
    persons: persons.data || [],
    categories: categories.data || [],
    sources: sources.data || [],
  };
}

/** Tạo thẻ mới (người / hạng mục / nguồn) ngay trong form — trả về bản ghi */
export async function createTag(table, name, userId) {
  const { data, error } = await supabase
    .from(table)
    .upsert({ user_id: userId, name: name.trim() }, { onConflict: 'user_id,name' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchHui() {
  const [groups, rounds] = await Promise.all([
    supabase.from('hui_groups').select('*').order('created_at', { ascending: false }),
    supabase.from('hui_rounds').select('*').order('period_no'),
  ]);
  return { groups: groups.data || [], rounds: rounds.data || [] };
}

/**
 * Ghi 1 kỳ hụi + tự động tạo giao dịch gương vào sổ chung:
 * đóng hụi → 1 khoản CHI, hốt hụi → 1 khoản THU.
 * Khi sửa/xóa kỳ, các giao dịch gương (hui_round_id = kỳ) bị xóa theo (FK cascade / xóa tay).
 */
export async function saveHuiRound({ group, round, userId }) {
  let saved = round;
  if (round.id) {
    // Xóa gương cũ trước khi ghi lại
    await supabase.from('transactions').delete().eq('hui_round_id', round.id);
    const { data, error } = await supabase
      .from('hui_rounds').update(round).eq('id', round.id).select().single();
    if (error) throw error;
    saved = data;
  } else {
    const { data, error } = await supabase
      .from('hui_rounds').insert(round).select().single();
    if (error) throw error;
    saved = data;
  }
  const mirrors = [];
  if (Number(saved.my_contribution) > 0) {
    mirrors.push({
      user_id: userId, type: 'chi', amount: saved.my_contribution, date: saved.date,
      hui_group_id: group.id, hui_round_id: saved.id,
      note: `Đóng hụi ${group.name} — kỳ ${saved.period_no}`,
    });
  }
  if (Number(saved.my_withdrawal) > 0) {
    mirrors.push({
      user_id: userId, type: 'thu', amount: saved.my_withdrawal, date: saved.date,
      hui_group_id: group.id, hui_round_id: saved.id,
      note: `Hốt hụi ${group.name} — kỳ ${saved.period_no}`,
    });
  }
  if (mirrors.length) {
    const { error } = await supabase.from('transactions').insert(mirrors);
    if (error) throw error;
  }
  return saved;
}

export async function deleteHuiRound(roundId) {
  await supabase.from('transactions').delete().eq('hui_round_id', roundId);
  const { error } = await supabase.from('hui_rounds').delete().eq('id', roundId);
  if (error) throw error;
}
