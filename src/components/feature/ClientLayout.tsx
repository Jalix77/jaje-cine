import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ClientLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const NAV_ITEMS = [
  { icon: 'ri-ticket-2-line', label: 'Tickets', path: '/compte/tickets' },
  { icon: 'ri-calendar-check-line', label: 'Réservations', path: '/seances' },
  { icon: 'ri-user-line', label: 'Profil', path: '/compte' },
  { icon: 'ri-film-line', label: 'Films', path: '/films' },
];

const DRAWER_ITEMS = [
  { icon: 'ri-ticket-2-fill', label: 'Mes tickets', path: '/compte/tickets', color: 'text-gold' },
  { icon: 'ri-calendar-check-fill', label: 'Mes réservations', path: '/seances', color: 'text-green-400' },
  { icon: 'ri-heart-fill', label: 'Films favoris', path: '/films', color: 'text-red-400' },
  { icon: 'ri-history-line', label: 'Historique', path: '/compte/tickets', color: 'text-blue-400' },
  { icon: 'ri-user-fill', label: 'Mon profil', path: '/compte', color: 'text-purple-400' },
  { icon: 'ri-wallet-3-fill', label: 'Portefeuille', path: '/compte', color: 'text-yellow-400' },
  { icon: 'ri-notification-3-fill', label: 'Notifications', path: '/compte', color: 'text-orange-400' },
  { icon: 'ri-customer-service-2-fill', label: 'Aide / Support', path: '/contact', color: 'text-teal-400' },
];

export function ClientLayout({ children, title, showBack }: ClientLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fermer le drawer en cliquant hors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  // Bloquer le scroll quand drawer ouvert
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await signOut();
    navigate('/');
  };

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ── HEADER MOBILE STICKY ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/8 h-14 flex items-center px-4 gap-3">
        {/* Retour ou Logo */}
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition"
          >
            <i className="ri-arrow-left-line text-white text-lg"></i>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="JAJE Ciné" className="h-8 w-8 object-contain" />
            <span className="text-gold font-bold text-base hidden xs:block">JAJE Ciné</span>
          </Link>
        )}

        {/* Titre de la page */}
        {title && (
          <h1 className="flex-1 text-center text-white font-semibold text-base truncate">{title}</h1>
        )}

        {!title && <div className="flex-1" />}

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          <Link
            to="/films"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition"
          >
            <i className="ri-search-line text-white text-lg"></i>
          </Link>

          {/* Avatar profil */}
          <Link
            to="/compte"
            className="w-9 h-9 rounded-full bg-gold flex items-center justify-center flex-shrink-0"
          >
            <span className="text-black font-bold text-sm">{initial}</span>
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition"
          >
            <i className="ri-menu-3-line text-white text-lg"></i>
          </button>
        </div>
      </header>

      {/* ── OVERLAY ──────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* ── DRAWER ───────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-[80vw] max-w-[320px] z-50 flex flex-col transform transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(160deg, #0a0a0a 0%, #0d2b1d 40%, #1a0d0f 80%, #0a0a0a 100%)',
          borderLeft: '1px solid rgba(212,175,55,0.15)',
        }}
      >
        {/* Fermer */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
              <span className="text-black font-bold">{initial}</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{user?.name || 'Utilisateur'}</p>
              <p className="text-gray-400 text-xs truncate max-w-[160px]">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <i className="ri-close-line text-white"></i>
          </button>
        </div>

        {/* Items navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {DRAWER_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition group ${
                  active
                    ? 'bg-gold/15 border border-gold/30'
                    : 'hover:bg-white/8 border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/6 ${item.color}`}>
                  <i className={`${item.icon} text-xl`}></i>
                </div>
                <span className={`font-medium text-sm ${active ? 'text-gold' : 'text-white'}`}>
                  {item.label}
                </span>
                <i className="ri-arrow-right-s-line text-gray-600 ml-auto"></i>
              </Link>
            );
          })}
        </nav>

        {/* Bas du drawer */}
        <div className="px-3 py-4 border-t border-white/8 space-y-2">
          <Link
            to="/contact"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/8 transition"
          >
            <i className="ri-question-line text-gray-400 text-lg"></i>
            <span className="text-gray-300 text-sm">Aide &amp; Support</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition"
          >
            <i className="ri-logout-circle-r-line text-red-400 text-lg"></i>
            <span className="text-red-400 text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ────────────────────────────────── */}
      <main className="flex-1 pt-14 pb-20">
        {children}
      </main>

      {/* ── BOTTOM NAVIGATION MOBILE ─────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-black/95 backdrop-blur-md">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
                  active ? 'text-gold' : 'text-gray-500 hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-2xl`}></i>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default ClientLayout;
