import { supabase } from './supabaseClient';

export { supabase };

interface SignInResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key' &&
  import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co');

export async function signInAdmin(email: string, password: string): Promise<SignInResult> {
  try {
    console.log('[signInAdmin] Starting login', { email });
    
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: "Supabase n'est pas encore configuré. Veuillez connecter votre projet Supabase pour activer l'authentification.",
      };
    }

    // 1. Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[signInAdmin] Auth result', { 
      authError: authError?.message, 
      userId: authData?.user?.id,
      hasSession: !!authData.session 
    });

    if (authError || !authData.user || !authData.session) {
      return {
        success: false,
        error: authError?.message || 'Erreur de connexion',
      };
    }

    // 2. Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, first_name, last_name')
      .eq('id', authData.user.id)
      .single();

    console.log('[signInAdmin] Profile result', { profile, profileError });

    if (profileError || !profile) {
      console.log('[signInAdmin] Profile not found, signing out');
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Profil utilisateur introuvable',
      };
    }

    // 3. Check role
    if (!profile.role || !['ADMIN', 'STAFF'].includes(profile.role)) {
      console.log('[signInAdmin] Access denied', { role: profile.role });
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Accès refusé - Vous devez être administrateur ou membre du staff',
      };
    }

    console.log('[signInAdmin] Login successful', { role: profile.role });

    return {
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      },
    };

  } catch (error) {
    console.error('[signInAdmin] Unexpected error', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la connexion',
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    console.log('[signOut] Signing out');
    await supabase.auth.signOut();
    localStorage.removeItem('admin_user');
  } catch (error) {
    console.error('[signOut] Error', error);
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('[getCurrentSession] Error', error);
    return null;
  }
}

export async function getCurrentUserProfile() {
  try {
    const session = await getCurrentSession();
    if (!session) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('[getCurrentUserProfile] Error', error);
    return null;
  }
}
