
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-dark-card/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Jaje Ciné"
                style={{ height: 38, width: 38, objectFit: 'contain' }}
              />
              <span className="text-xl font-bold text-gold hidden sm:block">JAJE Ciné</span>
            </Link>
          </div>

          {/* Navigation principale */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Accueil
              </Link>
              <Link 
                to="/films" 
                className="text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Films
              </Link>
              <Link 
                to="/seances" 
                className="text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Séances
              </Link>
              <Link 
                to="/contact" 
                className="text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Actions utilisateur */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center text-sm text-white hover:text-gold transition-colors duration-300 focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center mr-2">
                      <span className="text-black font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden lg:block">{user?.name}</span>
                    <i className="ri-arrow-down-s-line ml-1"></i>
                  </button>

                  {/* Menu déroulant utilisateur */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-card rounded-md shadow-lg py-1 border border-gray-700">
                      <Link
                        to="/compte"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-white hover:bg-dark-bg hover:text-gold transition-colors"
                      >
                        <i className="ri-user-line mr-2"></i>Mon Compte
                      </Link>
                      <Link
                        to="/compte/tickets"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-white hover:bg-dark-bg hover:text-gold transition-colors"
                      >
                        <i className="ri-ticket-line mr-2"></i>Mes Tickets
                      </Link>
                      <hr className="border-gray-700 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-bg hover:text-red-300 transition-colors"
                      >
                        <i className="ri-logout-circle-line mr-2"></i>Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/auth/login"
                    className="text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/auth/register"
                    className="bg-gold text-black hover:bg-gold/90 transition-colors duration-300 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bouton menu mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gold transition-colors duration-300 p-2"
            >
              <i className={`text-xl ${isMenuOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-card border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
            >
              Accueil
            </Link>
            <Link 
              to="/films" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
            >
              Films
            </Link>
            <Link 
              to="/seances" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
            >
              Séances
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
            >
              Contact
            </Link>
            
            {/* Actions utilisateur mobile */}
            <hr className="border-gray-700 my-2" />
            
            {isAuthenticated ? (
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <div className="flex items-center text-white">
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center mr-3">
                      <span className="text-black font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                </div>
                <Link 
                  to="/compte" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
                >
                  <i className="ri-user-line mr-2"></i>Mon Compte
                </Link>
                <Link 
                  to="/compte/tickets" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
                >
                  <i className="ri-ticket-line mr-2"></i>Mes Tickets
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left text-red-400 hover:text-red-300 transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
                >
                  <i className="ri-logout-circle-line mr-2"></i>Se déconnecter
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link 
                  to="/auth/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-white hover:text-gold transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium"
                >
                  Se connecter
                </Link>
                <Link 
                  to="/auth/register" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block bg-gold text-black hover:bg-gold/90 transition-colors duration-300 px-3 py-2 rounded-md text-base font-medium mx-3 text-center whitespace-nowrap"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Export par défaut pour compatibilité d'import
export default Navbar;
