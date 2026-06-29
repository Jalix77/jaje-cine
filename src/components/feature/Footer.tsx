import { Link } from 'react-router-dom';
import { useState } from 'react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const navigationLinks = {
    films: [
      { name: 'À l\'affiche', path: '/films?filter=now-showing' },
      { name: 'Bientôt', path: '/films?filter=coming-soon' },
      { name: 'Tous les films', path: '/films' }
    ],
    services: [
      { name: 'Séances', path: '/seances' },
      { name: 'Réservation', path: '/reservation' },
      { name: 'Mon compte', path: '/compte' },
      { name: 'Mes tickets', path: '/compte/tickets' }
    ],
    support: [
      { name: 'FAQ', path: '/faq' },
      { name: 'Contact', path: '/contact' },
      { name: 'Règlement', path: '/reglement' },
      { name: 'Conditions', path: '/conditions' }
    ]
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialiser les messages
    setMessage('');
    setMessageType('');

    // Validation
    if (!email.trim()) {
      setMessage('Veuillez entrer votre adresse email');
      setMessageType('error');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Veuillez entrer une adresse email valide');
      setMessageType('error');
      return;
    }

    // Simulation de l'envoi
    setIsSubmitting(true);
    
    try {
      // Mock - simulation d'une requête
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock - stockage local temporaire
      const newsletters = JSON.parse(localStorage.getItem('newsletter_subscriptions') || '[]');
      const newSubscription = {
        email,
        subscribedAt: new Date().toISOString(),
        id: Date.now()
      };
      
      // Vérifier si l'email existe déjà
      const emailExists = newsletters.some((sub: any) => sub.email === email);
      
      if (emailExists) {
        setMessage('Cet email est déjà inscrit à notre newsletter');
        setMessageType('error');
      } else {
        newsletters.push(newSubscription);
        localStorage.setItem('newsletter_subscriptions', JSON.stringify(newsletters));
        
        setMessage('Merci ! Vous êtes inscrit à notre newsletter.');
        setMessageType('success');
        setEmail(''); // Vider le champ
      }
    } catch {
      setMessage('Une erreur est survenue. Veuillez réessayer.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
      
      // Effacer le message après 5 secondes
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  return (
    <footer className="bg-black text-white">
      {/* Section principale */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://public.readdy.ai/ai/img_res/a034f95d-b26b-4318-906b-b7c87c36940d.png"
                alt="JAJE Ciné"
                className="h-10 w-auto"
              />
              <span className="text-2xl font-serif font-bold">JAJE Ciné</span>
            </div>
            <p className="text-light-gray text-sm leading-relaxed">
              Votre cinéma de référence à Port-au-Prince. Vivez le cinéma comme jamais auparavant avec les derniers blockbusters dans un cadre moderne et confortable.
            </p>
            <div className="flex items-center space-x-2 text-sm text-light-gray">
              <i className="ri-map-pin-line text-gold"></i>
              <span>Port-au-Prince, Haïti</span>
            </div>
          </div>

          {/* Navigation Films */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Films</h4>
            <ul className="space-y-2">
              {navigationLinks.films.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-light-gray hover:text-gold transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Services</h4>
            <ul className="space-y-2">
              {navigationLinks.services.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-light-gray hover:text-gold transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter et réseaux sociaux */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Restez informé</h4>
            <p className="text-light-gray text-sm">
              Recevez les dernières actualités et offres spéciales
            </p>
            
            {/* Formulaire newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex rounded-full overflow-hidden max-w-xs">
                <input
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 bg-dark-gray border-0 text-white text-sm focus:outline-none focus:ring-2 transition-all duration-300 ${
                    messageType === 'error' 
                      ? 'focus:ring-red-500 ring-1 ring-red-500' 
                      : 'focus:ring-gold'
                  } disabled:opacity-50`}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold hover:bg-yellow-400 text-black px-4 py-2 rounded-r-full transition-all duration-300 flex items-center justify-center min-w-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <i className="ri-loader-2-line animate-spin"></i>
                  ) : (
                    <i className="ri-arrow-right-line"></i>
                  )}
                </button>
              </div>
              
              {/* Message de feedback */}
              {message && (
                <div className={`text-xs mt-2 ${
                  messageType === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <i className={`${
                    messageType === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'
                  } mr-1`}></i>
                  {message}
                </div>
              )}
            </form>

            {/* Réseaux sociaux */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm">Suivez-nous</h5>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-dark-gray rounded-full flex items-center justify-center hover:bg-gold hover:text-black transition-all duration-300">
                  <i className="ri-instagram-line text-lg"></i>
                </a>
                <a 
                  href="https://www.facebook.com/Jalpierre" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-dark-gray rounded-full flex items-center justify-center hover:bg-gold hover:text-black transition-all duration-300"
                >
                  <i className="ri-facebook-fill text-lg"></i>
                </a>
                <a href="https://wa.me/50947945556" className="w-10 h-10 bg-dark-gray rounded-full flex items-center justify-center hover:bg-green-500 transition-all duration-300">
                  <i className="ri-whatsapp-line text-lg"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre du bas */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-light-gray">
              <span>© 2025 JAJE Ciné</span>
              <Link to="/confidentialite" className="hover:text-gold transition-colors duration-300">
                Politique de confidentialité
              </Link>
              <Link to="/conditions" className="hover:text-gold transition-colors duration-300">
                Conditions d'utilisation
              </Link>
            </div>
            <a 
              href="https://readdy.ai/?ref=logo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-light-gray hover:text-gold transition-colors duration-300"
            >
              Powered by Readdy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Export par défaut pour compatibilité d'import
export default Footer;
