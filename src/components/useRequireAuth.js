'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

/** Bat buoc dang nhap: chua co session thi day ve /login, giu lai dich den
 *  (?next=) de dang nhap xong tu nhay lai dung cho dang mo — quan trong cho
 *  nut Quet QR ngoai man hinh chinh iPhone (mo thang vao /quet-qr). */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function loginUrl() {
    const next = pathname && pathname !== '/login'
      ? `?next=${encodeURIComponent(pathname)}`
      : '';
    return '/login' + next;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace(loginUrl());
      else { setUser(data.session.user); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace(loginUrl());
      else setUser(session.user);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname]);

  return { user, loading };
}
