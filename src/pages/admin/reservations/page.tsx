import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { supabase } from '../../../lib/supabaseClient';
import {
  generateReservationMessage,
  generateReminderMessage,
  generatePaymentMessage,
  generateCancellationMessage,
  buildWhatsAppUrl,
  phoneValidationMessage,
} from '../../../lib/whatsapp';

interface ReservationRow {
  id: string;
  confirmation_code: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  total_seats: number;
  total_price_htg: number;
  payment_method: string | null;
  transaction_reference: string | null;
  status: string;
  payment_status: string;
  reservation_status?: string | null;
  entry_status?: string | null;
  created_at: string;
  movie_title?: string;
  show_date?: string;
  show_time?: string;
  room_name?: string;
  seats?: string;
}

// ── Mise a jour Supabase — 3 colonnes independantes ───────────────────────────
type ReservationUpdate = {
  reservation_status?: string;
  payment_status?: string;
  entry_status?: string;
  // Retro-compat
  status?: string;
};

// ── Dropdown d'actions par ligne ─────────────────────────────────────────────
function ActionDropdown({
  row,
  onUpdate,
  onDetail,
}: {
  row: ReservationRow;
  onUpdate: (id: string, fields: ReservationUpdate) => Promise<void>;
  onDetail: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isCancelled = row.reservation_status === 'cancelled' || row.status === 'CANCELLED';
  const isConfirmed = row.reservation_status === 'confirmed' || row.status === 'CONFIRMED';
  const isPaid      = row.payment_status === 'PAYE' || row.payment_status === 'paid';
  const isUsed      = row.entry_status === 'used' || row.status === 'USED';
  const isDenied    = row.entry_status === 'denied';

  const canConfirm  = !isConfirmed && !isCancelled;
  const canPay      = !isPaid && !isCancelled;
  const canEntry    = !isUsed && !isDenied && !isCancelled;
  const canCancel   = !isCancelled;

  const canCombo1   = (canConfirm || canPay) && !isCancelled;         // Confirmer + Payé
  const canCombo2   = (canConfirm || canPay || canEntry) && !isCancelled; // Confirmer + Payé + Entrée

  const run = async (fields: ReservationUpdate) => {
    setBusy(true);
    setOpen(false);
    try { await onUpdate(row.id, fields); } finally { setBusy(false); }
  };

  type ActionDef = {
    label: string;
    icon: string;
    cls: string;
    divider?: boolean;
    fields: ReservationUpdate;
    show: boolean;
  };

  const actions: ActionDef[] = [
    {
      label: 'Confirmer la reservation',
      icon: 'ri-checkbox-circle-line',
      cls: 'text-green-400 hover:bg-green-500/15',
      show: canConfirm,
      fields: { reservation_status: 'confirmed', status: 'CONFIRMED' },
    },
    {
      label: 'Marquer payé',
      icon: 'ri-money-dollar-circle-line',
      cls: 'text-emerald-400 hover:bg-emerald-500/15',
      show: canPay,
      fields: { payment_status: 'PAYE' },
    },
    {
      label: 'Valider entrée',
      icon: 'ri-door-open-line',
      cls: 'text-blue-400 hover:bg-blue-500/15',
      show: canEntry,
      fields: { entry_status: 'used' },
    },
    {
      label: 'Refuser entrée',
      icon: 'ri-forbid-2-line',
      cls: 'text-orange-400 hover:bg-orange-500/15',
      show: canEntry,
      fields: { entry_status: 'denied' },
    },
    {
      label: 'Confirmer + Marquer payé',
      icon: 'ri-flashlight-line',
      cls: 'text-yellow-400 hover:bg-yellow-500/15 font-semibold',
      divider: true,
      show: canCombo1,
      fields: { reservation_status: 'confirmed', status: 'CONFIRMED', payment_status: 'PAYE' },
    },
    {
      label: 'Confirmer + Payé + Entrée validée',
      icon: 'ri-star-line',
      cls: 'text-gold hover:bg-yellow-500/15 font-semibold',
      show: canCombo2,
      fields: { reservation_status: 'confirmed', status: 'CONFIRMED', payment_status: 'PAYE', entry_status: 'used' },
    },
    {
      label: 'Annuler la reservation',
      icon: 'ri-close-circle-line',
      cls: 'text-red-400 hover:bg-red-500/15',
      divider: true,
      show: canCancel,
      fields: { reservation_status: 'cancelled', status: 'CANCELLED' },
    },
  ];

  const visibleActions = actions.filter((a) => a.show);

  // WhatsApp helpers pour cette ligne
  const waError = phoneValidationMessage(row.guest_phone);
  const waInfo  = {
    guest_name: row.guest_name, guest_phone: row.guest_phone,
    movie_title: row.movie_title, show_date: row.show_date,
    show_time: row.show_time, room_name: row.room_name,
    seats: row.seats ? row.seats.split(', ') : [],
    confirmation_code: row.confirmation_code,
    total_price_htg: row.total_price_htg,
    reservation_status: row.reservation_status, payment_status: row.payment_status,
    entry_status: row.entry_status, status: row.status,
  };

  const openWA = (msg: string) => {
    const url = buildWhatsAppUrl(row.guest_phone, msg);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Bouton WhatsApp rapide */}
      {waError ? (
        <span className="p-2 text-gray-600 cursor-not-allowed" title={waError}>
          <i className="ri-whatsapp-line text-sm"></i>
        </span>
      ) : (
        <button
          onClick={() => { openWA(generateReservationMessage(waInfo)); }}
          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition"
          title="Envoyer confirmation WhatsApp"
        >
          <i className="ri-whatsapp-line text-sm"></i>
        </button>
      )}

      {/* Bouton details */}
      <button
        onClick={() => { onDetail(); setOpen(false); }}
        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
        title="Voir details"
      >
        <i className="ri-eye-line text-sm"></i>
      </button>

      {/* Bouton actions */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border ${
          busy
            ? 'bg-gray-700 text-gray-500 border-gray-600 cursor-wait'
            : 'bg-gray-700/80 text-gray-200 hover:bg-gray-600 border-gray-600'
        }`}
        title="Actions"
      >
        {busy ? <i className="ri-loader-4-line animate-spin text-sm"></i> : <i className="ri-settings-3-line text-sm"></i>}
        <i className="ri-arrow-down-s-line text-xs"></i>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {visibleActions.length === 0 ? (
            <p className="px-4 py-3 text-gray-500 text-xs">Aucune action disponible</p>
          ) : (
            <div className="py-1">
              {visibleActions.map((a, i) => (
                <React.Fragment key={a.label}>
                  {a.divider && i > 0 && <div className="border-t border-gray-700/60 my-1" />}
                  <button
                    onClick={() => run(a.fields)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${a.cls}`}
                  >
                    <i className={`${a.icon} text-base flex-shrink-0`}></i>
                    <span className="text-left leading-tight">{a.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
          {/* Section WhatsApp */}
          <div className="border-t border-gray-700/60 py-1">
            <p className="px-4 py-1.5 text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-whatsapp-line text-green-500"></i> WhatsApp
            </p>
            {waError ? (
              <p className="px-4 py-2 text-xs text-gray-500 italic">{waError}</p>
            ) : (
              <>
                <button onClick={() => openWA(generateReservationMessage(waInfo))} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-green-500/15 transition">
                  <i className="ri-whatsapp-line text-base flex-shrink-0"></i>
                  <span>Envoyer confirmation</span>
                </button>
                <button onClick={() => openWA(generateReminderMessage(waInfo))} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-green-500/15 transition">
                  <i className="ri-alarm-line text-base flex-shrink-0"></i>
                  <span>Envoyer rappel</span>
                </button>
                {(row.payment_status === 'PAYE' || row.payment_status === 'paid') && (
                  <button onClick={() => openWA(generatePaymentMessage(waInfo))} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/15 transition">
                    <i className="ri-receipt-line text-base flex-shrink-0"></i>
                    <span>Envoyer reçu paiement</span>
                  </button>
                )}
                {(row.reservation_status === 'cancelled' || row.status === 'CANCELLED') && (
                  <button onClick={() => openWA(generateCancellationMessage(waInfo))} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/15 transition">
                    <i className="ri-close-circle-line text-base flex-shrink-0"></i>
                    <span>Envoyer annulation</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Badges inline statuts ─────────────────────────────────────────────────────
function ResStatusChip({ row }: { row: ReservationRow }) {
  const isCancelled = row.reservation_status === 'cancelled' || row.status === 'CANCELLED';
  const isConfirmed = row.reservation_status === 'confirmed' || row.status === 'CONFIRMED';
  if (isCancelled) return <span className="px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-xs">Annulée</span>;
  if (isConfirmed)  return <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-full text-xs">Confirmée</span>;
  return <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-full text-xs">En attente</span>;
}

function PayStatusChip({ row }: { row: ReservationRow }) {
  const ps = row.payment_status;
  if (!ps) return <span className="text-gray-500 text-xs">—</span>;
  if (ps === 'PAYE' || ps === 'paid') return <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-full text-xs">Payé</span>;
  if (ps === 'CASH_A_LARRIVEE') return <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-xs">Cash entrée</span>;
  if (ps === 'EN_ATTENTE_VALIDATION') return <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-full text-xs">En attente</span>;
  if (ps === 'REFUSE' || ps === 'ANNULE') return <span className="px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-xs">Refusé</span>;
  return <span className="px-2 py-0.5 bg-gray-500/15 text-gray-400 border border-gray-500/30 rounded-full text-xs">{ps}</span>;
}

function EntryStatusChip({ row }: { row: ReservationRow }) {
  const es = row.entry_status;
  if (es === 'used' || row.status === 'USED') return <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-full text-xs">Utilisée</span>;
  if (es === 'denied') return <span className="px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-xs">Refusée</span>;
  return <span className="px-2 py-0.5 bg-gray-500/15 text-gray-400 border border-gray-500/30 rounded-full text-xs">Non utilisée</span>;
}

// ── Page principale ───────────────────────────────────────────────────────────
const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [entryFilter, setEntryFilter]     = useState('ALL');
  const [selectedReservation, setSelectedReservation] = useState<ReservationRow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean; waUrl?: string } | null>(null);

  const toast = (text: string, ok = true) => {
    setToastMsg({ text, ok });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('reservation_complete')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setReservations(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur chargement reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  // Mise à jour Supabase — supporte reservation_status, payment_status, entry_status
  const updateReservation = async (id: string, fields: ReservationUpdate) => {
    try {
      const { error: err } = await supabase
        .from('reservations')
        .update(fields)
        .eq('id', id);
      if (err) throw err;
      // Mise à jour locale instantanée (sans recharger toute la liste)
      setReservations((prev) =>
        prev.map((r) => r.id === id ? { ...r, ...fields } : r)
      );
      // Sync modal si ouvert sur cette réservation
      if (selectedReservation?.id === id) {
        setSelectedReservation((prev) => prev ? { ...prev, ...fields } : prev);
      }
      toast('Mis à jour avec succès');

      // Proposition WhatsApp automatique après paiement ou annulation
      const updated = reservations.find((r) => r.id === id);
      const mergedRow = updated ? { ...updated, ...fields } : null;
      if (mergedRow && mergedRow.guest_phone && !phoneValidationMessage(mergedRow.guest_phone)) {
        const waData = {
          guest_name: mergedRow.guest_name, guest_phone: mergedRow.guest_phone,
          movie_title: mergedRow.movie_title, show_date: mergedRow.show_date,
          show_time: mergedRow.show_time, room_name: mergedRow.room_name,
          seats: mergedRow.seats ? mergedRow.seats.split(', ') : [],
          confirmation_code: mergedRow.confirmation_code,
          total_price_htg: mergedRow.total_price_htg,
          reservation_status: mergedRow.reservation_status,
          payment_status: mergedRow.payment_status,
          entry_status: mergedRow.entry_status,
          status: mergedRow.status,
        };
        if (fields.payment_status === 'PAYE') {
          const url = buildWhatsAppUrl(mergedRow.guest_phone, generatePaymentMessage(waData));
          if (url) {
            setToastMsg({ text: 'Paiement confirmé — Envoyer reçu WhatsApp ?', ok: true, waUrl: url });
            return;
          }
        }
        if (fields.reservation_status === 'cancelled' || fields.status === 'CANCELLED') {
          const url = buildWhatsAppUrl(mergedRow.guest_phone, generateCancellationMessage(waData));
          if (url) {
            setToastMsg({ text: 'Réservation annulée — Envoyer notification WhatsApp ?', ok: true, waUrl: url });
            return;
          }
        }
      }
    } catch (e: any) {
      toast(`Erreur: ${e?.message}`, false);
    }
  };

  // Legacy pour le modal (rétro-compat)
  const handleStatusChange = async (id: string, newStatus: string, newPaymentStatus?: string) => {
    const fields: ReservationUpdate = { status: newStatus };
    if (newPaymentStatus) fields.payment_status = newPaymentStatus;
    if (newStatus === 'CONFIRMED') fields.reservation_status = 'confirmed';
    if (newStatus === 'CANCELLED') fields.reservation_status = 'cancelled';
    await updateReservation(id, fields);
  };

  const filtered = reservations.filter((r) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      r.confirmation_code?.toLowerCase().includes(s) ||
      r.guest_name?.toLowerCase().includes(s) ||
      r.movie_title?.toLowerCase().includes(s) ||
      r.guest_email?.toLowerCase().includes(s);
    const matchStatus = statusFilter === 'ALL' || r.payment_status === statusFilter || r.status === statusFilter;
    const matchPay    = paymentFilter === 'ALL' || r.payment_method?.toUpperCase() === paymentFilter;
    const matchEntry  = entryFilter === 'ALL'
      || (entryFilter === 'used'     && (r.entry_status === 'used'     || r.status === 'USED'))
      || (entryFilter === 'not_used' && (r.entry_status === 'not_used' || (!r.entry_status && r.status !== 'USED')))
      || (entryFilter === 'denied'   && r.entry_status === 'denied');
    return matchSearch && matchStatus && matchPay && matchEntry;
  });

  const stats = {
    total:       reservations.length,
    confirmed:   reservations.filter((r) => r.reservation_status === 'confirmed' || r.status === 'CONFIRMED').length,
    pending:     reservations.filter((r) => r.payment_status === 'EN_ATTENTE_VALIDATION').length,
    paid:        reservations.filter((r) => r.payment_status === 'PAYE' || r.payment_status === 'paid').length,
    cash:        reservations.filter((r) => r.payment_status === 'CASH_A_LARRIVEE').length,
    cancelled:   reservations.filter((r) => r.status === 'CANCELLED' || r.reservation_status === 'cancelled').length,
    entryUsed:   reservations.filter((r) => r.entry_status === 'used' || r.status === 'USED').length,
    entryDenied: reservations.filter((r) => r.entry_status === 'denied').length,
  };

  const getPayBadge = (m: string | null) => {
    if (!m) return null;
    const map: Record<string, string> = {
      MONCASH: 'text-orange-400 bg-orange-600/20 border-orange-600/30',
      NATCASH: 'text-purple-400 bg-purple-600/20 border-purple-600/30',
      CASH:    'text-gray-400 bg-gray-600/20 border-gray-600/30',
    };
    const cls = map[m.toUpperCase()] ?? 'text-gray-400 bg-gray-600/20 border-gray-600/30';
    return <span className={`px-2 py-1 rounded text-xs border ${cls}`}>{m}</span>;
  };

  return (
    <AdminLayout>
      <div className="p-8">

        {/* Toast notification */}
        {toastMsg && (
          <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3 transition-all max-w-sm ${
            toastMsg.ok
              ? 'bg-green-900/90 border border-green-500/40 text-green-300'
              : 'bg-red-900/90 border border-red-500/40 text-red-300'
          }`}>
            <i className={`flex-shrink-0 text-base ${toastMsg.ok ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}`}></i>
            <span className="flex-1 leading-snug">{toastMsg.text}</span>
            {toastMsg.waUrl && (
              <a
                href={toastMsg.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setToastMsg(null)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-lg transition whitespace-nowrap"
              >
                <i className="ri-whatsapp-line"></i> Envoyer
              </a>
            )}
            <button onClick={() => setToastMsg(null)} className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition">
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion des Reservations</h1>
            <p className="text-gray-400">Suivez et gérez toutes les réservations — 3 statuts independants</p>
          </div>
          <button onClick={loadReservations} className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all">
            <i className="ri-refresh-line mr-2"></i>Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { label: 'Total',         val: stats.total,       color: '#3b82f6', icon: 'ri-ticket-2-line' },
            { label: 'Confirmees',    val: stats.confirmed,   color: '#16a34a', icon: 'ri-checkbox-circle-line' },
            { label: 'Annulees',      val: stats.cancelled,   color: '#ef4444', icon: 'ri-close-circle-line' },
            { label: 'Pmt recus',     val: stats.paid,        color: '#16a34a', icon: 'ri-money-dollar-circle-line' },
            { label: 'Pmt attente',   val: stats.pending,     color: '#f97316', icon: 'ri-time-line' },
            { label: 'Cash entree',   val: stats.cash,        color: '#3b82f6', icon: 'ri-wallet-3-line' },
            { label: 'Entrees util.', val: stats.entryUsed,   color: '#16a34a', icon: 'ri-door-open-line' },
            { label: 'Entrees ref.',  val: stats.entryDenied, color: '#ef4444', icon: 'ri-forbid-2-line' },
          ].map((s) => (
            <div key={s.label} style={{ background: s.color + '15', border: `1px solid ${s.color}40`, borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '2px 0' }}>{loading ? '…' : s.val}</p>
              <p style={{ color: s.color, fontSize: 10, fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-6 border border-gray-700/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Code, nom, email, film..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="ALL">Tous les paiements</option>
              <option value="EN_ATTENTE_VALIDATION">Paiement en attente</option>
              <option value="PAYE">Paiement recu</option>
              <option value="CASH_A_LARRIVEE">Cash a l'entree</option>
              <option value="REFUSE">Paiement rejeté</option>
              <option value="CANCELLED">Reservation annulee</option>
            </select>
            <select value={entryFilter} onChange={(e) => setEntryFilter(e.target.value)} className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="ALL">Toutes les entrees</option>
              <option value="not_used">Non utilisee</option>
              <option value="used">Utilisee</option>
              <option value="denied">Refusee</option>
            </select>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="ALL">Tous les moyens</option>
              <option value="MONCASH">MonCash</option>
              <option value="NATCASH">NatCash</option>
              <option value="CASH">Especes</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <i className="ri-loader-4-line text-3xl text-yellow-400 animate-spin block mb-3"></i>
              <p className="text-gray-400">Chargement...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12"><p className="text-red-400">{error}</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400">Aucune reservation trouvee</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">Code / Date</th>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">Client</th>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">Film & Seance</th>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">Sieges</th>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">Montant</th>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">Moyen</th>
                    {/* 3 colonnes statut separees */}
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">
                      <span className="flex items-center gap-1.5">
                        <i className="ri-calendar-check-line text-purple-400"></i> Reservation
                      </span>
                    </th>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">
                      <span className="flex items-center gap-1.5">
                        <i className="ri-money-dollar-circle-line text-green-400"></i> Paiement
                      </span>
                    </th>
                    <th className="text-left p-4 text-gray-300 font-medium text-sm">
                      <span className="flex items-center gap-1.5">
                        <i className="ri-door-open-line text-blue-400"></i> Entree
                      </span>
                    </th>
                    <th className="text-center p-4 text-gray-300 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-gray-700/40 hover:bg-gray-800/30 transition-colors">
                      {/* Code */}
                      <td className="p-4">
                        <p className="text-white font-mono font-medium text-xs">{r.confirmation_code}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                      </td>
                      {/* Client */}
                      <td className="p-4">
                        <p className="text-white font-medium text-sm">{r.guest_name || '—'}</p>
                        <p className="text-gray-400 text-xs">{r.guest_email}</p>
                        <p className="text-gray-400 text-xs">{r.guest_phone}</p>
                      </td>
                      {/* Film */}
                      <td className="p-4">
                        <p className="text-white font-medium text-sm">{r.movie_title || '—'}</p>
                        <p className="text-gray-400 text-xs">
                          {r.show_date ? new Date(r.show_date).toLocaleDateString('fr-FR') : '—'}{' '}
                          {r.show_time ? r.show_time.slice(0, 5) : ''}
                        </p>
                        <p className="text-gray-500 text-xs">{r.room_name}</p>
                      </td>
                      {/* Sieges */}
                      <td className="p-4">
                        <p className="text-white text-sm">{r.seats || `${r.total_seats} siege(s)`}</p>
                      </td>
                      {/* Montant */}
                      <td className="p-4">
                        <p className="text-yellow-400 font-bold text-sm">{Number(r.total_price_htg).toLocaleString()} HTG</p>
                      </td>
                      {/* Moyen */}
                      <td className="p-4">
                        {getPayBadge(r.payment_method)}
                        {r.transaction_reference && (
                          <p className="text-gray-500 text-xs mt-1 font-mono truncate max-w-[80px]" title={r.transaction_reference}>
                            {r.transaction_reference}
                          </p>
                        )}
                      </td>
                      {/* Statut reservation */}
                      <td className="p-4"><ResStatusChip row={r} /></td>
                      {/* Statut paiement */}
                      <td className="p-4"><PayStatusChip row={r} /></td>
                      {/* Statut entree */}
                      <td className="p-4"><EntryStatusChip row={r} /></td>
                      {/* Actions */}
                      <td className="p-4">
                        <ActionDropdown
                          row={r}
                          onUpdate={updateReservation}
                          onDetail={() => { setSelectedReservation(r); setIsDetailModalOpen(true); }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal detail */}
        {isDetailModalOpen && selectedReservation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Details de la reservation</h2>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white transition">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                {/* Infos reservation */}
                <div className="bg-gray-800/50 rounded-xl p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Code de confirmation</p>
                    <p className="text-white font-mono font-semibold">{selectedReservation.confirmation_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Date de reservation</p>
                    <p className="text-white">{new Date(selectedReservation.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-2">Statuts actuels</p>
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <p className="text-gray-500 text-[10px] mb-1">RESERVATION</p>
                        <ResStatusChip row={selectedReservation} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] mb-1">PAIEMENT</p>
                        <PayStatusChip row={selectedReservation} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] mb-1">ENTREE</p>
                        <EntryStatusChip row={selectedReservation} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Montant total</p>
                    <p className="text-yellow-400 font-bold text-xl">{Number(selectedReservation.total_price_htg).toLocaleString()} HTG</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Moyen de paiement</p>
                    {getPayBadge(selectedReservation.payment_method)}
                    {selectedReservation.transaction_reference && (
                      <p className="text-gray-300 text-xs mt-1 font-mono">Ref: {selectedReservation.transaction_reference}</p>
                    )}
                  </div>
                </div>

                {/* Client */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <i className="ri-user-line text-blue-400"></i> Client
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-white font-medium">{selectedReservation.guest_name || '—'}</p>
                    <p className="text-gray-400">{selectedReservation.guest_email || '—'}</p>
                    <p className="text-gray-400">{selectedReservation.guest_phone || '—'}</p>
                  </div>
                </div>

                {/* Seance */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <i className="ri-film-line text-purple-400"></i> Seance
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-gray-400 text-xs">Film</p><p className="text-white">{selectedReservation.movie_title}</p></div>
                    <div><p className="text-gray-400 text-xs">Salle</p><p className="text-white">{selectedReservation.room_name}</p></div>
                    <div><p className="text-gray-400 text-xs">Date</p><p className="text-white">{selectedReservation.show_date ? new Date(selectedReservation.show_date).toLocaleDateString('fr-FR') : '—'}</p></div>
                    <div><p className="text-gray-400 text-xs">Heure</p><p className="text-white">{selectedReservation.show_time?.slice(0, 5) || '—'}</p></div>
                  </div>
                  {selectedReservation.seats && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-xs mb-1">Sieges</p>
                      <p className="text-yellow-400 font-medium">{selectedReservation.seats}</p>
                    </div>
                  )}
                </div>

                {/* Actions dans le modal */}
                {(() => {
                  const r = selectedReservation;
                  const isCancelled = r.reservation_status === 'cancelled' || r.status === 'CANCELLED';
                  const isConfirmed = r.reservation_status === 'confirmed' || r.status === 'CONFIRMED';
                  const isPaid      = r.payment_status === 'PAYE' || r.payment_status === 'paid';
                  const isUsed      = r.entry_status === 'used' || r.status === 'USED';
                  const isDenied    = r.entry_status === 'denied';
                  if (isCancelled) return null;
                  return (
                    <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <i className="ri-settings-3-line text-yellow-400"></i> Actions
                      </h3>

                      {/* Actions individuelles */}
                      <div className="grid grid-cols-2 gap-2">
                        {!isConfirmed && (
                          <button
                            onClick={() => updateReservation(r.id, { reservation_status: 'confirmed', status: 'CONFIRMED' })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/35 border border-green-500/30 text-green-400 rounded-xl text-sm font-medium transition"
                          >
                            <i className="ri-checkbox-circle-line"></i> Confirmer
                          </button>
                        )}
                        {!isPaid && (
                          <button
                            onClick={() => updateReservation(r.id, { payment_status: 'PAYE' })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition"
                          >
                            <i className="ri-money-dollar-circle-line"></i> Marquer payé
                          </button>
                        )}
                        {!isUsed && !isDenied && (
                          <button
                            onClick={() => updateReservation(r.id, { entry_status: 'used' })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-medium transition"
                          >
                            <i className="ri-door-open-line"></i> Valider entree
                          </button>
                        )}
                        {!isUsed && !isDenied && (
                          <button
                            onClick={() => updateReservation(r.id, { entry_status: 'denied' })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600/20 hover:bg-orange-600/35 border border-orange-500/30 text-orange-400 rounded-xl text-sm font-medium transition"
                          >
                            <i className="ri-forbid-2-line"></i> Refuser entree
                          </button>
                        )}
                      </div>

                      {/* Actions rapides combinées */}
                      <div className="pt-2 border-t border-gray-700/50 space-y-2">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Actions rapides</p>
                        {(!isConfirmed || !isPaid) && (
                          <button
                            onClick={() => updateReservation(r.id, { reservation_status: 'confirmed', status: 'CONFIRMED', payment_status: 'PAYE' })}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-semibold transition"
                          >
                            <i className="ri-flashlight-line text-lg"></i>
                            Confirmer + Marquer payé
                          </button>
                        )}
                        {(!isConfirmed || !isPaid || !isUsed) && (
                          <button
                            onClick={() => updateReservation(r.id, { reservation_status: 'confirmed', status: 'CONFIRMED', payment_status: 'PAYE', entry_status: 'used' })}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold rounded-xl text-sm font-semibold transition"
                            style={{ '--tw-text-opacity': '1' } as React.CSSProperties}
                          >
                            <i className="ri-star-fill text-lg text-gold"></i>
                            <span className="text-yellow-300">Confirmer + Payé + Entree validée</span>
                          </button>
                        )}
                      </div>

                      {/* Annuler */}
                      <div className="pt-2 border-t border-gray-700/50">
                        <button
                          onClick={async () => {
                            if (!confirm('Annuler cette reservation ?')) return;
                            await updateReservation(r.id, { reservation_status: 'cancelled', status: 'CANCELLED' });
                            setIsDetailModalOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition"
                        >
                          <i className="ri-close-circle-line text-lg"></i>
                          Annuler la reservation
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Section WhatsApp dans le modal */}
                {(() => {
                  const r = selectedReservation;
                  const waErr = phoneValidationMessage(r.guest_phone);
                  const waData = {
                    guest_name: r.guest_name, guest_phone: r.guest_phone,
                    movie_title: r.movie_title, show_date: r.show_date,
                    show_time: r.show_time, room_name: r.room_name,
                    seats: r.seats ? r.seats.split(', ') : [],
                    confirmation_code: r.confirmation_code,
                    total_price_htg: r.total_price_htg,
                    reservation_status: r.reservation_status,
                    payment_status: r.payment_status,
                    entry_status: r.entry_status,
                    status: r.status,
                  };
                  const openWAModal = (msg: string) => {
                    const url = buildWhatsAppUrl(r.guest_phone, msg);
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  };
                  return (
                    <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <i className="ri-whatsapp-line text-green-400 text-lg"></i> WhatsApp
                        {r.guest_phone && <span className="text-gray-400 font-normal text-sm">{r.guest_phone}</span>}
                      </h3>
                      {waErr ? (
                        <p className="text-gray-500 text-sm italic">{waErr}</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openWAModal(generateReservationMessage(waData))}
                            className="flex items-center gap-2 px-3 py-2.5 bg-green-600/15 hover:bg-green-600/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-medium transition"
                          >
                            <i className="ri-whatsapp-line"></i> Confirmation
                          </button>
                          <button
                            onClick={() => openWAModal(generateReminderMessage(waData))}
                            className="flex items-center gap-2 px-3 py-2.5 bg-green-600/15 hover:bg-green-600/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-medium transition"
                          >
                            <i className="ri-alarm-line"></i> Rappel
                          </button>
                          {(r.payment_status === 'PAYE' || r.payment_status === 'paid') && (
                            <button
                              onClick={() => openWAModal(generatePaymentMessage(waData))}
                              className="flex items-center gap-2 px-3 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium transition"
                            >
                              <i className="ri-receipt-line"></i> Reçu paiement
                            </button>
                          )}
                          {(r.reservation_status === 'cancelled' || r.status === 'CANCELLED') && (
                            <button
                              onClick={() => openWAModal(generateCancellationMessage(waData))}
                              className="flex items-center gap-2 px-3 py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium transition"
                            >
                              <i className="ri-close-circle-line"></i> Annulation
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReservations;
