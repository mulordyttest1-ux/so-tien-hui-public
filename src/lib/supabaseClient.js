import { createClient } from '@supabase/supabase-js';

// Giá trị dự phòng để `next build` không lỗi khi chưa khai báo env.
// Khi chạy thật, bắt buộc đặt NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(url, anonKey);
export const isSupabaseConfigured = !url.includes('placeholder');
