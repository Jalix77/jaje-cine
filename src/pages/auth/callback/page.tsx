import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/admin/dashboard';
      
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Erreur auth callback:', error);
            navigate('/admin/login', { 
              state: { error: 'Erreur lors de l\'authentification' },
              replace: true 
            });
            return;
          }
          
          // Redirection vers la page demandée
          navigate(next, { replace: true });
        } catch (error) {
          console.error('Erreur callback:', error);
          navigate('/admin/login', { 
            state: { error: 'Erreur lors de l\'authentification' },
            replace: true 
          });
        }
      } else {
        navigate('/admin/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authentification en cours...</p>
      </div>
    </div>
  );
}
