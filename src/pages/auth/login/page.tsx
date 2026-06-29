import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";

type View = "login" | "forgot" | "forgot-sent";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const redirectParam = new URLSearchParams(location.search).get("redirect");
    if (redirectParam && redirectParam.startsWith("/")) return redirectParam;
    return "/compte";
  }, [location.search]);

  // Bannière "mot de passe réinitialisé avec succès"
  const resetSuccess = new URLSearchParams(location.search).get("reset") === "success";

  const [view, setView] = useState<View>("login");

  // --- Login fields ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Forgot password fields ---
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // ── Login ─────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) { setErrorMsg(error.message); return; }
      if (!data?.session) { setErrorMsg("Connexion échouée : session introuvable."); return; }
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Forgot password ───────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotSubmitting) return;
    setForgotSubmitting(true);
    setForgotError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );
      if (error) {
        const msg = error.message.toLowerCase();
        setForgotError(
          msg.includes("rate limit") || msg.includes("email rate limit")
            ? "Trop de tentatives. Veuillez attendre 30 à 60 minutes avant de réessayer."
            : error.message
        );
        return;
      }
      setView("forgot-sent");
    } catch (err: any) {
      setForgotError(err?.message || "Erreur inconnue");
    } finally {
      setForgotSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Bannière succès réinitialisation */}
        {resetSuccess && (
          <div className="mb-4 flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <svg className="mt-0.5 shrink-0 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Mot de passe mis à jour. Vous pouvez vous connecter.</span>
          </div>
        )}

        {/* ── VUE : Login ── */}
        {view === "login" && (
          <form
            onSubmit={handleLogin}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <h1 className="text-2xl font-semibold mb-1">JAJE Ciné</h1>
            <p className="text-gray-500 mb-6">Se connecter</p>

            {errorMsg && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {errorMsg}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="w-full mb-4 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="votre@email.com"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Votre mot de passe"
              required
            />

            {/* Lien mot de passe oublié */}
            <div className="flex justify-end mt-2 mb-6">
              <button
                type="button"
                onClick={() => { setView("forgot"); setForgotEmail(email); setForgotError(null); }}
                className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg py-2 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Connexion…" : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/auth/register")}
              className="w-full mt-3 text-sm text-gray-600 hover:text-black"
            >
              Pas encore de compte ? Créer un compte
            </button>
          </form>
        )}

        {/* ── VUE : Forgot – formulaire email ── */}
        {view === "forgot" && (
          <form
            onSubmit={handleForgot}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            {/* Bouton retour */}
            <button
              type="button"
              onClick={() => { setView("login"); setForgotError(null); }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la connexion
            </button>

            <h1 className="text-2xl font-semibold mb-1">JAJE Ciné</h1>
            <p className="text-gray-500 mb-6">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            {forgotError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {forgotError}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="w-full mb-5 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="votre@email.com"
              required
            />

            <button
              type="submit"
              disabled={forgotSubmitting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg py-2 disabled:opacity-60 transition-colors"
            >
              {forgotSubmitting ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
            </button>
          </form>
        )}

        {/* ── VUE : Forgot – email envoyé ── */}
        {view === "forgot-sent" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
            {/* Icône enveloppe */}
            <div className="w-14 h-14 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email envoyé !</h2>
            <p className="text-gray-500 text-sm mb-1">
              Si un compte existe pour{" "}
              <span className="font-medium text-gray-700">{forgotEmail}</span>,
            </p>
            <p className="text-gray-500 text-sm mb-6">
              vous recevrez un lien de réinitialisation dans quelques instants.
            </p>

            <p className="text-xs text-gray-400 mb-5">
              Pensez à vérifier vos spams si vous ne voyez rien.
            </p>

            <button
              type="button"
              onClick={() => setView("login")}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg py-2 transition-colors"
            >
              Retour à la connexion
            </button>

            <button
              type="button"
              onClick={() => { setView("forgot"); setForgotError(null); }}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-800"
            >
              Renvoyer un lien
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
