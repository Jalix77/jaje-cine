import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInAdmin } from '../../../lib/supabase';
import { supabase } from '../../../lib/supabaseClient';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSupabaseWarning, setShowSupabaseWarning] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const stateError = location.state?.error;

  useEffect(() => {
    if (stateError) {
      setError(stateError);
    }
  }, [stateError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowSupabaseWarning(false);

    try {
      console.log('[AdminLoginPage] Submitting login', { email });
      
      const result = await signInAdmin(email, password);
      
      if (!result.success) {
        console.log('[AdminLoginPage] Login failed', { error: result.error });
        
        if (result.error?.includes('Supabase n\'est pas encore configuré')) {
          setShowSupabaseWarning(true);
        }
        setError(result.error || 'Erreur de connexion');
        return;
      }

      console.log('[AdminLoginPage] Login successful', { user: result.user });

      // Store user data
      if (result.user) {
  localStorage.setItem('admin_user', JSON.stringify(result.user));

  // ✅ Pour le sidebar
  localStorage.setItem('adminRole', result.user.role || 'STAFF');
  localStorage.setItem('adminEmail', result.user.email || email);
  localStorage.setItem(
    'adminName',
    (result.user as any).full_name || result.user.name || 'Administrateur'
  );
}

      // Attendre un peu que Supabase persiste la session
      await new Promise(resolve => setTimeout(resolve, 100));

      // Vérifier que la session est bien là avant de rediriger
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AdminLoginPage] Session after login', { hasSession: !!session });

      if (!session) {
        setError('Erreur de session - Veuillez réessayer');
        return;
      }

      // Safe redirect
      const rawReturnTo = (location.state as any)?.returnTo;
      const safeReturnTo =
        typeof rawReturnTo === "string" &&
        rawReturnTo.startsWith("/admin") &&
        rawReturnTo !== "/admin/login"
          ? rawReturnTo
          : "/admin/dashboard";

      console.log('[AdminLoginPage] Redirecting to', { safeReturnTo });
      navigate(safeReturnTo, { replace: true });

    } catch (err: any) {
      console.error('[AdminLoginPage] Unexpected error', err);
      setError(err.message || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setEmail('admin@jajecine.ht');
      setPassword('admin123');
    } else {
      setEmail('staff@jajecine.ht');
      setPassword('staff123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-teal-600 rounded-full flex items-center justify-center">
              <i className="ri-admin-line text-2xl text-white"></i>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Administration JAJE Ciné
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Connectez-vous à votre compte administrateur
            </p>
          </div>

          {/* Supabase Warning */}
          {showSupabaseWarning && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex">
                <i className="ri-error-warning-line text-orange-400 mt-0.5"></i>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Configuration requise</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Supabase n'est pas encore configuré. Pour activer l'authentification :
                  </p>
                  <ol className="text-sm text-orange-700 mt-2 ml-4 list-decimal space-y-1">
                    <li>Créez un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">supabase.com</a></li>
                    <li>Copiez votre URL et clé API</li>
                    <li>Ajoutez-les dans les variables d'environnement</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && !showSupabaseWarning && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <i className="ri-error-warning-line text-red-400 mt-0.5"></i>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full px-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="admin@jajecine.ht"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full px-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
            <div className="mt-4 text-center">
              
              </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">
              Comptes de démonstration
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <i className="ri-shield-star-line mr-2 text-yellow-500"></i>
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('staff')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <i className="ri-user-settings-line mr-2 text-blue-500"></i>
                Staff
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Cliquez pour auto-remplir les identifiants de test
            </p>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 transition-colors"
            >
              <i className="ri-arrow-left-line mr-1"></i>
              Retour au site principal
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <i className="ri-information-line text-blue-400 mt-0.5"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Authentification sécurisée
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Cette interface utilise Supabase Auth pour une sécurité maximale. 
                Seuls les comptes avec les rôles ADMIN ou STAFF peuvent accéder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
