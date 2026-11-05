// Viec can lam: danh sach ghi nhanh cua rieng tung nguoi, khong lien
// quan toi so tien / hui / ngan hang. Chi 3 thao tac: them, gach xong, xoa.
import { supabase } from './supabaseClient';

export async function fetchTodos() {
  const { data, error } = await supabase.from('todos')
    .select('*').order('done', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addTodo(userId, text) {
  const { data, error } = await supabase.from('todos')
    .insert({ user_id: userId, text: text.trim(), done: false }).select().single();
  if (error) throw error;
  return data;
}

export async function toggleTodo(id, done) {
  const { error } = await supabase.from('todos').update({ done }).eq('id', id);
  if (error) throw error;
}

export async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) throw error;
}
