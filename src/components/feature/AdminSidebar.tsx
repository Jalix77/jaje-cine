
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('adminRole');
  const userName = localStorage.getItem('adminName') || 'Administrateur';
  const userEmail = localStorage.getItem('adminEmail') || 'admin@jajecine.ht';

  const handleLogout = () => {
    // Nettoyer toutes les données de session
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    
    // Rediriger vers la page de connexion
    navigate('/admin/login');
  };

  const menuItems = [
    { 
      path: '/admin/dashboard', 
      icon: 'ri-dashboard-3-line', 
      label: 'Tableau de bord',
      roles: ['ADMIN', 'STAFF']
    },
    { 
      path: '/admin/films', 
      icon: 'ri-film-line', 
      label: 'Films',
      roles: ['ADMIN', 'STAFF']
    },
    { 
      path: '/admin/seances', 
      icon: 'ri-calendar-event-line', 
      label: 'Séances',
      roles: ['ADMIN', 'STAFF']
    },
    { 
      path: '/admin/reservations', 
      icon: 'ri-ticket-2-line', 
      label: 'Réservations',
      roles: ['ADMIN', 'STAFF']
    },
    { 
      path: '/admin/support', 
      icon: 'ri-customer-service-2-line', 
      label: 'Support',
      roles: ['ADMIN', 'STAFF']
    },
    { 
      path: '/admin/salles', 
      icon: 'ri-building-line', 
      label: 'Salles',
      roles: ['ADMIN']
    },
    { 
      path: '/admin/content', 
      icon: 'ri-file-text-line', 
      label: 'Contenu',
      roles: ['ADMIN']
    },
    { 
      path: '/admin/audit', 
      icon: 'ri-history-line', 
      label: 'Journal d\'audit',
      roles: ['ADMIN']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole as string)
  );

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-700/50 h-screen flex flex-col">
      {/* Logo et titre */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Jaje Ciné"
            style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <h2 className="text-white font-bold text-lg">JAJE Ciné</h2>
            <p className="text-gray-400 text-sm">Administration</p>
          </div>
        </div>
      </div>

      {/* Menu de navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`
                }
              >
                <i className={`${item.icon} text-xl group-hover:scale-110 transition-transform duration-300`}></i>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Retour au site */}
      <div className="p-4 border-b border-gray-700/50">
        <NavLink
          to="/"
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800/50 hover:bg-gray-800/70 text-gray-300 hover:text-white rounded-xl transition-all duration-300 border border-gray-700/50 whitespace-nowrap"
        >
          <i className="ri-home-line"></i>
          <span>Retour au site</span>
        </NavLink>
      </div>

      {/* Informations utilisateur et déconnexion */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              userRole === 'ADMIN' 
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                : 'bg-gradient-to-br from-blue-400 to-blue-500'
            }`}>
              <i className={`${
                userRole === 'ADMIN' ? 'ri-vip-crown-line' : 'ri-user-line'
              } text-sm text-black`}></i>
            </div>
            <div>
              <p className="text-white font-medium text-sm truncate" title={userName}>
                {userName}
              </p>
              <p className="text-gray-400 text-xs truncate" title={userEmail}>
                {userEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              userRole === 'ADMIN' 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {userRole}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-300 border border-red-600/30 whitespace-nowrap"
        >
          <i className="ri-logout-circle-line"></i>
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
