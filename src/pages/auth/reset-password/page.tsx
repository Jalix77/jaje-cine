import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

type PageState = 'loading' | 'ready' | 'invalid' | 'success' | 'error';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Supabase envoie le token dans le hash de l'URL : #access_token=...&type=recovery
  // Le SDK le détecte automatiquement et émet un événement PASSWORD_RECOVERY.
  useEffect(() => {
    // Vérifier si le SDK a déjà une session active (cas où la page est
    // rechargée après que Supabase a traité le hash).
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setPageState('ready');
        return;
      }
      // Sinon, écouter l'événement PASSWORD_RECOVERY émis lors du traitement du hash.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPageState('ready');
        }
      });

      // Timeout de sécurité : si aucun événement en 5 s, le lien est invalide.
      const timer = setTimeout(() => {
        setPageState((prev) => prev === 'loading' ? 'invalid' : prev);
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    };

    checkSession();
  }, []);

  const passwordsMatch = password === confirm;
  const isStrong = password.length >= 6;
  const canSubmit = isStrong && passwordsMatch && !submitting;

  const strengthLevel = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8 && /[A-Z]/.test(password)) score++;
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    return score;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message);
        setSubmitting(false);
        return;
      }

      // Déconnecter la session de récupération
      await supabase.auth.signOut();

      setPageState('success');

      // Redirection automatique après 2 s
      setTimeout(() => {
        navigate('/auth/login?reset=success', { replace: true });
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur inconnue');
      setSubmitting(false);
    }
  };

  // ── Chargement ─────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Vérification du lien…</p>
        </div>
      </div>
    );
  }

  // ── Lien invalide / expiré ──────────────────────────────────────
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide ou expiré</h2>
          <p className="text-gray-500 text-sm mb-6">
            Ce lien de réinitialisation n'est plus valide. Les liens expirent après 1 heure.
          </p>
          <Link
            to="/auth/login"
            onClick={() => {/* open forgot from login */}}
            className="block w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg py-2 transition-colors text-center mb-3"
          >
            Demander un nouveau lien
          </Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-800">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ── Succès ─────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Mot de passe mis à jour !</h2>
          <p className="text-gray-500 text-sm mb-1">
            Votre mot de passe a été réinitialisé avec succès.
          </p>
          <p className="text-gray-400 text-xs mb-6">Redirection automatique…</p>
          <Link
            to="/auth/login?reset=success"
            className="block w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg py-2 transition-colors text-center"
          >
            Se connecter maintenant
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulaire principal ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          <h1 className="text-2xl font-semibold mb-1">JAJE Ciné</h1>
          <p className="text-gray-500 mb-6">Choisissez un nouveau mot de passe pour votre compte.</p>

          {/* Erreur Supabase */}
          {errorMsg && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {errorMsg}
            </div>
          )}

          {/* Nouveau mot de passe */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative mb-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
              disabled={submitting}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          {/* Indicateur de force */}
          {password && (
            <div className="mb-4">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      strengthLevel >= lvl
                        ? lvl === 1 ? 'bg-red-400' : lvl === 2 ? 'bg-yellow-400' : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {strengthLevel === 0 && 'Trop court'}
                {strengthLevel === 1 && 'Faible — ajoutez des majuscules et chiffres'}
                {strengthLevel === 2 && 'Moyen — presque !'}
                {strengthLevel === 3 && 'Fort ✓'}
              </p>
            </div>
          )}

          {/* Confirmer */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le mot de passe
          </label>
          <div className="relative mb-2">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className={`w-full border rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-yellow-400 ${
                confirm && !passwordsMatch ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
              }`}
              placeholder="Retapez votre mot de passe"
              required
              disabled={submitting}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showConfirm ? 'Masquer' : 'Afficher'}
            >
              {showConfirm ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          {confirm && !passwordsMatch && (
            <p className="text-xs text-red-500 mb-4">Les mots de passe ne correspondent pas.</p>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Mise à jour…
              </span>
            ) : (
              'Modifier le mot de passe'
            )}
          </button>

          <div className="mt-4 text-center">
            <Link to="/auth/login" className="text-sm text-gray-500 hover:text-gray-800 hover:underline">
              ← Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
