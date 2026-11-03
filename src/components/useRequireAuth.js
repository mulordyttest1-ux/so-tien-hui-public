'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

/** Bắt buộc đăng nhập: chưa có session thì đẩy về /login */
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
      else { setUser(data.session.user); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login');
      else setUser(session.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return { user, loading };
}
