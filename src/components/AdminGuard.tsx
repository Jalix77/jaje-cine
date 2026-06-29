import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

type Role = 'ADMIN' | 'STAFF' | 'CLIENT';

function canAccess(userRole: Role | undefined, requiredRole: Role) {
  if (!userRole) return false;

  if (requiredRole === 'ADMIN') return userRole === 'ADMIN';
  if (requiredRole === 'STAFF') return userRole === 'STAFF' || userRole === 'ADMIN';

  return false;
}

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

export default function AdminGuard({ children, requiredRole = 'STAFF' }: AdminGuardProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      console.log('[AdminGuard] Checking access for:', location.pathname);
      
      try {
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.log('[AdminGuard] No session - redirecting to login');
          navigate('/admin/login', { replace: true });
          return;
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (profileError || !profile) {
          console.log('[AdminGuard] No profile - redirecting to login');
          navigate('/admin/login', { replace: true });
          return;
        }

        const userRole = profile?.role as Role | undefined;

        if (!canAccess(userRole, requiredRole)) {
          console.log('[AdminGuard] Access denied - redirecting to login');
          navigate('/admin/login', { replace: true });
          return;
        }

        console.log('[AdminGuard] Access granted');
        setAllowed(true);
        
      } catch (error) {
        console.error('[AdminGuard] Error:', error);
        navigate('/admin/login', { replace: true });
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [navigate, location, requiredRole]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  return allowed ? <>{children}</> : null;
}