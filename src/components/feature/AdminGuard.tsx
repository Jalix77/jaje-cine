
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'STAFF';
}

export function AdminGuard({ children, requiredRole = 'STAFF' }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuthAndRole = useCallback(async () => {
    try {
      // 🛑 Anti-boucle : si on est déjà sur /admin/login, ne rien faire
      if (location.pathname === '/admin/login') {
        setIsLoading(false);
        setIsAuthorized(false);
        return;
      }
      // Vérifier l'utilisateur (plus robuste que getSession juste après un login)
      let { data: userData, error: userError } = await supabase.auth.getUser();

      // Si user null, on tente un refresh une fois (race condition post-login)
      if (!userData?.user) {
        await supabase.auth.refreshSession();
        const retry = await supabase.auth.getUser();
        userData = retry.data;
        userError = retry.error;
      }

      if (userError || !userData?.user) {
        navigate('/admin/login', {
          state: { returnTo: location.pathname },
          replace: true
        });
        return;
      }

      const userId = userData.user.id;

      // Récupérer le rôle depuis profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Erreur récupération profil:', profileError);
        navigate('/admin/login', { replace: true });
        return;
      }

      const userRole = profile.role;

      if (!hasRequiredRole(userRole, requiredRole)) {
        console.warn(`Accès refusé: rôle ${userRole} insuffisant pour ${requiredRole}`);
        navigate('/admin/login', { replace: true });
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      navigate('/admin/login', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [location, navigate, requiredRole]);

  useEffect(() => {
    checkAuthAndRole();
  }, [checkAuthAndRole]);

  const hasRequiredRole = (userRole: string, required: string): boolean => {
    if (required === 'STAFF') {
      return userRole === 'STAFF' || userRole === 'ADMIN';
    }
    if (required === 'ADMIN') {
      return userRole === 'ADMIN';
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // La redirection est déjà en cours
  }

  return <>{children}</>;
}

// Export par défaut pour compatibilité d'import
export default AdminGuard;
