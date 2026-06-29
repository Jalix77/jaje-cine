
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/base/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation de l'envoi d'email
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gold">JAJE Ciné</h1>
              <p className="text-gray-400 text-sm mt-1">Votre cinéma de référence</p>
            </Link>
          </div>

          {/* Message de succès */}
          <div className="bg-dark-card rounded-lg shadow-xl p-8 border border-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-check-line text-2xl text-green-400"></i>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-4">Email envoyé !</h2>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Si un compte existe avec cette adresse email, un lien de réinitialisation 
                de mot de passe a été envoyé. Vérifiez votre boîte de réception et vos spams.
              </p>

              <div className="space-y-4">
                <Link 
                  to="/auth/login" 
                  className="block w-full bg-gold hover:bg-gold/90 text-dark-bg font-medium py-3 px-4 rounded-md transition-colors text-center"
                >
                  Retour à la connexion
                </Link>
                
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="block w-full text-gold hover:text-gold/80 text-sm transition-colors"
                >
                  Renvoyer un email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gold">JAJE Ciné</h1>
            <p className="text-gray-400 text-sm mt-1">Votre cinéma de référence</p>
          </Link>
        </div>

        {/* Formulaire de récupération */}
        <div className="bg-dark-card rounded-lg shadow-xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Mot de passe oublié ?</h2>
          <p className="text-gray-400 text-center mb-6">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                placeholder="votre@email.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !email}
              className="w-full whitespace-nowrap"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi en cours...
                </div>
              ) : (
                'Envoyer le lien'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link to="/auth/login" className="text-gold hover:text-gold/80 transition-colors font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Lien de retour */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            <i className="ri-arrow-left-line mr-2"></i>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
