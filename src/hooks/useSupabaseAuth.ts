import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      console.log('[auth] getSession');
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[auth] onAuthStateChange', event, newSession);
      setSession(newSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
