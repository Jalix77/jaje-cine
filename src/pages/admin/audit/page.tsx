import React, { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';

// ── Note : Le journal d'audit sera alimenté par de vraies données
// lorsqu'une table `audit_logs` sera créée dans Supabase.
// Pour l'instant, la page affiche l'état vide correct.

interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  user: string;
  userRole: 'ADMIN' | 'STAFF';
  changes: { field: string; oldValue: string; newValue: string }[];
  timestamp: string;
  ipAddress: string;
}

const AdminAudit: React.FC = () => {
  const [auditLogs] = useState<AuditLog[]>([]); // Sera branché sur Supabase

  const [searchTerm,    setSearchTerm]    = useState('');
  const [actionFilter,  setActionFilter]  = useState('ALL');
  const [entityFilter,  setEntityFilter]  = useState('ALL');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [selectedLog,   setSelectedLog]   = useState<AuditLog | null>(null);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);

  const filteredLogs = auditLogs.filter((log) => {
    const q   = searchTerm.toLowerCase();
    const hit = log.user.toLowerCase().includes(q) ||
                log.entity.toLowerCase().includes(q) ||
                log.entityId.toLowerCase().includes(q);
    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
    return (
      hit &&
      (actionFilter === 'ALL' || log.action === actionFilter) &&
      (entityFilter === 'ALL' || log.entity === entityFilter) &&
      (!dateFrom || logDate >= dateFrom) &&
      (!dateTo   || logDate <= dateTo)
    );
  });

  const getActionBadge = (action: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      CREATE: { bg: 'bg-green-600/20', text: 'text-green-400 border-green-600/30', label: 'Création' },
      UPDATE: { bg: 'bg-blue-600/20',  text: 'text-blue-400 border-blue-600/30',   label: 'Modification' },
      DELETE: { bg: 'bg-red-600/20',   text: 'text-red-400 border-red-600/30',     label: 'Suppression' },
    };
    const s = map[action] ?? { bg: 'bg-gray-600/20', text: 'text-gray-400 border-gray-600/30', label: action };
    return <span className={`px-3 py-1 ${s.bg} ${s.text} rounded-full text-sm border`}>{s.label}</span>;
  };

  const getEntityIcon = (entity: string) => ({
    'Film': 'ri-film-line', 'Séance': 'ri-calendar-event-line',
    'Réservation': 'ri-ticket-2-line', 'Salle': 'ri-building-line',
  }[entity] ?? 'ri-file-line');

  const exportLogs = () => {
    if (filteredLogs.length === 0) return;
    const rows = [
      ['Timestamp', 'Action', 'Entité', 'ID', 'Utilisateur', 'Rôle', 'Modifications', 'IP'],
      ...filteredLogs.map((l) => [
        new Date(l.timestamp).toLocaleString('fr-FR'),
        l.action, l.entity, l.entityId, l.user, l.userRole,
        l.changes.map((c) => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; '),
        l.ipAddress,
      ]),
    ].map((r) => r.join(',')).join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Journal d'Audit</h1>
            <p className="text-gray-400">Suivez toutes les modifications apportées au système</p>
          </div>
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 whitespace-nowrap"
          >
            <i className="ri-download-line mr-2" />
            Exporter CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[
            { label: 'Total actions',  value: auditLogs.length,                                   color: 'blue' },
            { label: "Aujourd'hui",    value: auditLogs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]).length, color: 'green' },
            { label: 'Créations',      value: auditLogs.filter(l => l.action === 'CREATE').length, color: 'green' },
            { label: 'Modifications',  value: auditLogs.filter(l => l.action === 'UPDATE').length, color: 'blue' },
            { label: 'Suppressions',   value: auditLogs.filter(l => l.action === 'DELETE').length, color: 'red' },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br from-${s.color}-600/20 to-${s.color}-700/20 backdrop-blur-sm rounded-2xl p-6 border border-${s.color}-500/30`}>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className={`text-${s.color}-400 text-sm font-medium`}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2 relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="ALL">Toutes actions</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
            </select>
            <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="ALL">Toutes entités</option>
              <option value="Film">Film</option>
              <option value="Séance">Séance</option>
              <option value="Réservation">Réservation</option>
              <option value="Salle">Salle</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    {['Timestamp', 'Action', 'Entité', 'Utilisateur', 'Modifications', 'IP', 'Détails'].map((h) => (
                      <th key={h} className="text-left p-6 text-gray-300 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                      <td className="p-6">
                        <p className="text-white text-sm">{new Date(log.timestamp).toLocaleDateString('fr-FR')}</p>
                        <p className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</p>
                      </td>
                      <td className="p-6">{getActionBadge(log.action)}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <i className={`${getEntityIcon(log.entity)} text-lg text-blue-400`} />
                          <div>
                            <p className="text-white font-medium">{log.entity}</p>
                            <p className="text-gray-400 text-sm">{log.entityId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-white font-medium">{log.user}</p>
                        <span className="text-xs text-yellow-400">{log.userRole}</span>
                      </td>
                      <td className="p-6">
                        {log.changes.slice(0, 2).map((c, i) => (
                          <div key={i} className="text-sm">
                            <span className="text-gray-400">{c.field}:</span>
                            <span className="text-red-400 ml-1">{c.oldValue || '(vide)'}</span>
                            <span className="text-gray-500 mx-1">→</span>
                            <span className="text-green-400">{c.newValue}</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-6">
                        <p className="text-gray-300 text-sm font-mono">{log.ipAddress}</p>
                      </td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => { setSelectedLog(log); setIsDetailOpen(true); }}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                        >
                          <i className="ri-eye-line text-lg" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <i className="ri-file-list-line text-5xl text-gray-600 mb-4 block" />
              <p className="text-white text-lg font-medium mb-1">Aucune entrée dans le journal</p>
              <p className="text-gray-500 text-sm">
                Les actions admin (création, modification, suppression) apparaîtront ici une fois le système d'audit activé.
              </p>
            </div>
          )}
        </div>

        {/* Modal détails */}
        {isDetailOpen && selectedLog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Détails de l'audit</h2>
                <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-white">
                  <i className="ri-close-line text-2xl" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-800/50 rounded-xl p-4">
                  <div><p className="text-gray-400 text-sm">Action</p>{getActionBadge(selectedLog.action)}</div>
                  <div><p className="text-gray-400 text-sm">Entité</p><p className="text-white">{selectedLog.entity}</p></div>
                  <div><p className="text-gray-400 text-sm">ID</p><p className="text-white font-mono text-sm">{selectedLog.entityId}</p></div>
                  <div><p className="text-gray-400 text-sm">Utilisateur</p><p className="text-white">{selectedLog.user}</p></div>
                  <div><p className="text-gray-400 text-sm">Date & Heure</p><p className="text-white">{new Date(selectedLog.timestamp).toLocaleString('fr-FR')}</p></div>
                  <div><p className="text-gray-400 text-sm">IP</p><p className="text-white font-mono">{selectedLog.ipAddress}</p></div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                  <h3 className="text-white font-bold">Modifications</h3>
                  {selectedLog.changes.map((c, i) => (
                    <div key={i} className="border-l-2 border-blue-500 pl-3">
                      <p className="text-blue-400 font-medium text-sm">{c.field}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-sm font-mono">{c.oldValue || '(vide)'}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-sm font-mono">{c.newValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAudit;
