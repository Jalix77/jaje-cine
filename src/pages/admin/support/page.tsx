import React, { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';

// ── Note : Cette page affichera les messages de support quand une table
// `support_messages` sera créée dans Supabase.
// Les données fictives ont été retirées.

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'NOUVEAU' | 'EN_COURS' | 'RESOLU' | 'FERME';
  priority: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  response?: string;
}

const AdminSupport: React.FC = () => {
  // Sera remplacé par un fetch Supabase quand la table support_messages existera
  const [messages, setMessages] = useState<Message[]>([]);

  const [selectedMessage,    setSelectedMessage]    = useState<Message | null>(null);
  const [isDetailModalOpen,  setIsDetailModalOpen]  = useState(false);
  const [isResponseModalOpen,setIsResponseModalOpen]= useState(false);
  const [response,           setResponse]           = useState('');
  const [searchTerm,         setSearchTerm]         = useState('');
  const [statusFilter,       setStatusFilter]       = useState('ALL');
  const [priorityFilter,     setPriorityFilter]     = useState('ALL');

  const filteredMessages = messages.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      (m.name.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) &&
      (statusFilter   === 'ALL' || m.status   === statusFilter) &&
      (priorityFilter === 'ALL' || m.priority === priorityFilter)
    );
  });

  const handleStatusChange = (id: string, newStatus: Message['status']) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: newStatus, updatedAt: new Date().toISOString() } : m));
  };

  const handlePriorityChange = (id: string, newPriority: Message['priority']) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, priority: newPriority, updatedAt: new Date().toISOString() } : m));
  };

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMessage && response.trim()) {
      setMessages((prev) => prev.map((m) =>
        m.id === selectedMessage.id
          ? { ...m, response, status: 'EN_COURS', assignedTo: 'Admin', updatedAt: new Date().toISOString() }
          : m
      ));
      setIsResponseModalOpen(false);
      setResponse('');
    }
  };

  const getStatusBadge = (status: Message['status']) => {
    const map = {
      NOUVEAU:  <span className="px-3 py-1 bg-blue-600/20   text-blue-400   rounded-full text-sm border border-blue-600/30">Nouveau</span>,
      EN_COURS: <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm border border-yellow-600/30">En cours</span>,
      RESOLU:   <span className="px-3 py-1 bg-green-600/20  text-green-400  rounded-full text-sm border border-green-600/30">Résolu</span>,
      FERME:    <span className="px-3 py-1 bg-gray-600/20   text-gray-400   rounded-full text-sm border border-gray-600/30">Fermé</span>,
    };
    return map[status] ?? null;
  };

  const getPriorityBadge = (priority: Message['priority']) => {
    const map = {
      BASSE:   <span className="px-2 py-1 bg-gray-600/20   text-gray-400   rounded text-xs border border-gray-600/30">Basse</span>,
      NORMALE: <span className="px-2 py-1 bg-blue-600/20   text-blue-400   rounded text-xs border border-blue-600/30">Normale</span>,
      HAUTE:   <span className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded text-xs border border-orange-600/30">Haute</span>,
      URGENTE: <span className="px-2 py-1 bg-red-600/20    text-red-400    rounded text-xs border border-red-600/30">Urgente</span>,
    };
    return map[priority] ?? null;
  };

  const stats = {
    total:    messages.length,
    nouveau:  messages.filter((m) => m.status   === 'NOUVEAU').length,
    enCours:  messages.filter((m) => m.status   === 'EN_COURS').length,
    urgentes: messages.filter((m) => m.priority === 'URGENTE').length,
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Support Client</h1>
          <p className="text-gray-400">Gérez les demandes d'aide et les messages clients</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total messages', value: stats.total,    icon: 'ri-message-3-line',        color: 'blue' },
            { label: 'Nouveaux',       value: stats.nouveau,  icon: 'ri-notification-badge-line', color: 'blue' },
            { label: 'En cours',       value: stats.enCours,  icon: 'ri-time-line',              color: 'yellow' },
            { label: 'Urgentes',       value: stats.urgentes, icon: 'ri-alarm-warning-line',     color: 'red' },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br from-${s.color}-600/20 to-${s.color}-700/20 backdrop-blur-sm rounded-2xl p-6 border border-${s.color}-500/30`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-${s.color}-400 text-sm font-medium`}>{s.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                </div>
                <i className={`${s.icon} text-2xl text-${s.color}-400`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou sujet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="ALL">Tous les statuts</option>
              <option value="NOUVEAU">Nouveau</option>
              <option value="EN_COURS">En cours</option>
              <option value="RESOLU">Résolu</option>
              <option value="FERME">Fermé</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="ALL">Toutes priorités</option>
              <option value="URGENTE">Urgente</option>
              <option value="HAUTE">Haute</option>
              <option value="NORMALE">Normale</option>
              <option value="BASSE">Basse</option>
            </select>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          {filteredMessages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    {['Client', 'Sujet', 'Priorité', 'Statut', 'Date', 'Actions'].map((h) => (
                      <th key={h} className={`p-6 text-gray-300 font-medium ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr key={msg.id} className="border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                      <td className="p-6">
                        <p className="text-white font-medium">{msg.name}</p>
                        <p className="text-gray-400 text-sm">{msg.email}</p>
                        {msg.phone && <p className="text-gray-400 text-sm">{msg.phone}</p>}
                      </td>
                      <td className="p-6">
                        <p className="text-white font-medium">{msg.subject}</p>
                        <p className="text-gray-400 text-sm line-clamp-2">{msg.message}</p>
                      </td>
                      <td className="p-6">
                        <select value={msg.priority} onChange={(e) => handlePriorityChange(msg.id, e.target.value as Message['priority'])}
                          className="bg-gray-800/50 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
                          <option value="BASSE">Basse</option>
                          <option value="NORMALE">Normale</option>
                          <option value="HAUTE">Haute</option>
                          <option value="URGENTE">Urgente</option>
                        </select>
                      </td>
                      <td className="p-6">
                        <select value={msg.status} onChange={(e) => handleStatusChange(msg.id, e.target.value as Message['status'])}
                          className="bg-gray-800/50 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
                          <option value="NOUVEAU">Nouveau</option>
                          <option value="EN_COURS">En cours</option>
                          <option value="RESOLU">Résolu</option>
                          <option value="FERME">Fermé</option>
                        </select>
                      </td>
                      <td className="p-6">
                        <p className="text-white text-sm">{new Date(msg.createdAt).toLocaleDateString('fr-FR')}</p>
                        <p className="text-gray-400 text-xs">{new Date(msg.createdAt).toLocaleTimeString('fr-FR')}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setSelectedMessage(msg); setIsDetailModalOpen(true); }}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all" title="Voir détails">
                            <i className="ri-eye-line text-lg" />
                          </button>
                          <button onClick={() => { setSelectedMessage(msg); setResponse(msg.response || ''); setIsResponseModalOpen(true); }}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-all" title="Répondre">
                            <i className="ri-reply-line text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <i className="ri-customer-service-2-line text-5xl text-gray-600 mb-4 block" />
              <p className="text-white text-lg font-medium mb-1">Aucun message de support</p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Les messages envoyés par vos clients via le formulaire de contact apparaîtront ici.
              </p>
            </div>
          )}
        </div>

        {/* Modal détails */}
        {isDetailModalOpen && selectedMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Détails du message</h2>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white">
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-3">{selectedMessage.subject}</h3>
                  <div className="flex gap-3 mb-4">{getStatusBadge(selectedMessage.status)}{getPriorityBadge(selectedMessage.priority)}</div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><p className="text-gray-400 text-sm">De</p><p className="text-white">{selectedMessage.name}</p><p className="text-gray-400 text-sm">{selectedMessage.email}</p></div>
                    <div><p className="text-gray-400 text-sm">Date</p><p className="text-white">{new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}</p></div>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">Message</p>
                  <p className="text-white">{selectedMessage.message}</p>
                </div>
                {selectedMessage.response && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                    <h4 className="text-green-400 font-bold mb-2">Réponse</h4>
                    <p className="text-white">{selectedMessage.response}</p>
                    <p className="text-gray-400 text-sm mt-2">Par {selectedMessage.assignedTo} — {new Date(selectedMessage.updatedAt).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal réponse */}
        {isResponseModalOpen && selectedMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Répondre à {selectedMessage.name}</h2>
                <button onClick={() => setIsResponseModalOpen(false)} className="text-gray-400 hover:text-white">
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>
              <form onSubmit={handleSubmitResponse} className="space-y-5">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-2">Message original :</p>
                  <p className="text-white text-sm">{selectedMessage.message}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Votre réponse</label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    required rows={6}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    placeholder="Tapez votre réponse ici..."
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => setIsResponseModalOpen(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all whitespace-nowrap">
                    Annuler
                  </button>
                  <button type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-xl transition-all whitespace-nowrap">
                    <i className="ri-send-plane-line mr-2" />
                    Envoyer la réponse
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
