import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { ClientLayout } from '../../components/feature/ClientLayout';

type ProfileData = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

type ReservationStat = {
  total: number;
  active: number;
  used: number;
};

type NextTicket = {
  movieTitle: string;
  moviePoster?: string | null;
  showDate: string;
  showTime: string;
  roomName?: string | null;
  seats: string[];
  confirmationCode: string;
  reservationId: string;
  status: string;
  paymentStatus: string;
};

const QUICK_ACTIONS = [
  { icon: 'ri-film-line', label: 'Voir les films', path: '/films', color: 'from-purple-900/60 to-purple-800/40', accent: 'text-purple-300' },
  { icon: 'ri-calendar-line', label: 'Réserver', path: '/seances', color: 'from-green-900/60 to-green-800/40', accent: 'text-green-300' },
  { icon: 'ri-ticket-2-line', label: 'Mes tickets', path: '/compte/tickets', color: 'from-yellow-900/60 to-yellow-800/40', accent: 'text-gold' },
  { icon: 'ri-customer-service-2-line', label: 'Support', path: '/contact', color: 'from-blue-900/60 to-blue-800/40', accent: 'text-blue-300' },
];

function StatusBadge({ label, variant }: { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'gray' }) {
  const styles = {
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {label}
    </span>
  );
}

function getPaymentVariant(s?: string): 'success' | 'warning' | 'error' | 'gray' {
  if (!s) return 'gray';
  const u = s.toUpperCase();
  if (u === 'PAYE' || u === 'PAID') return 'success';
  if (u.includes('CANCEL') || u.includes('REJECT')) return 'error';
  if (u.includes('CASH') || u.includes('PENDING')) return 'warning';
  return 'gray';
}

function getPaymentLabel(s?: string): string {
  if (!s) return 'Non renseigné';
  const u = s.toUpperCase();
  if (u === 'PAYE' || u === 'PAID') return 'Payé';
  if (u === 'CASH_A_LARRIVEE') return "Cash à l'arrivée";
  if (u.includes('CANCEL')) return 'Annulé';
  if (u.includes('REJECT')) return 'Rejeté';
  if (u.includes('REFUND')) return 'Remboursé';
  return 'En attente';
}

export default function ComptePage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>({});
  const [stats, setStats] = useState<ReservationStat>({ total: 0, active: 0, used: 0 });
  const [nextTicket, setNextTicket] = useState<NextTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);

      // Profil
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (mounted && prof) setProfile(prof);

      // Réservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          id, status, payment_status, payment_method, confirmation_code, created_at,
          showtimes:showtime_id (
            show_date, show_time,
            rooms:room_id (name),
            movies:movie_id (title, poster_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      const rows = reservations || [];
      const total = rows.length;
      const active = rows.filter((r: any) => {
        const s = (r.status || '').toUpperCase();
        return s.includes('CONFIRM') || s.includes('PENDING') || s.includes('TO_PAY');
      }).length;
      const used = rows.filter((r: any) => (r.status || '').toUpperCase().includes('USED')).length;
      setStats({ total, active, used });

      // Prochain ticket (première réservation active à venir)
      const upcoming = rows.find((r: any) => {
        const s = (r.status || '').toUpperCase();
        const st = r.showtimes;
        const dateStr = st?.show_date;
        if (!dateStr) return false;
        const showDate = new Date(dateStr);
        return (s.includes('CONFIRM') || s.includes('PENDING') || s.includes('TO_PAY')) && showDate >= new Date();
      });

      if (upcoming) {
        const st = upcoming.showtimes;
        const mv = st?.movies;
        const rm = st?.rooms;
        // Récupérer les sièges
        const { data: resSeats } = await supabase
          .from('reservation_seats')
          .select('seats:seat_id(row_letter, seat_number)')
          .eq('reservation_id', upcoming.id);

        const seats = (resSeats || []).map((rs: any) => {
          const s = rs?.seats;
          return s ? `${s.row_letter}${s.seat_number}` : null;
        }).filter(Boolean) as string[];

        if (mounted) {
          setNextTicket({
            movieTitle: mv?.title || 'Film',
            moviePoster: mv?.poster_url || null,
            showDate: st?.show_date || '',
            showTime: st?.show_time?.slice?.(0, 5) || st?.show_time || '',
            roomName: rm?.name || null,
            seats,
            confirmationCode: upcoming.confirmation_code || upcoming.id,
            reservationId: upcoming.id,
            status: upcoming.status || '',
            paymentStatus: upcoming.payment_status || '',
          });
        }
      }

      if (mounted) setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [user]);

  const handleEditStart = () => {
    setEditForm({ name: user?.name || '', phone: user?.phone || profile?.phone || '' });
    setIsEditing(true);
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const nameParts = editForm.name.trim().split(' ');
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';

      await supabase
        .from('profiles')
        .upsert({ id: user.id, first_name: first, last_name: last, phone: editForm.phone })
        .eq('id', user.id);

      await supabase.auth.updateUser({ data: { name: editForm.name, phone: editForm.phone } });

      setProfile((p) => ({ ...p, first_name: first, last_name: last, phone: editForm.phone }));
      setSaveMsg('Profil mis à jour !');
      setIsEditing(false);
    } catch {
      setSaveMsg('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3500);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <i className="ri-loader-4-line text-gold text-4xl animate-spin"></i>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Utilisateur';
  const displayPhone = user.phone || profile.phone || null;
  const initial = displayName.charAt(0).toUpperCase();

  const memberSince = user.joinDate
    ? new Date(user.joinDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'Non renseigné';

  const nextShowDateFormatted = nextTicket?.showDate
    ? new Date(nextTicket.showDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    : '—';

  return (
    <ClientLayout title="Mon Compte">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* ── CARTE PROFIL ───────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0d0f 0%, #0d2b1d 50%, #1a1500 100%)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          {/* Décor */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(30%, -30%)' }} />

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-black font-bold text-2xl">{initial}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-white font-bold text-lg leading-tight truncate">{displayName}</h2>
                <StatusBadge label="Actif" variant="success" />
              </div>
              <p className="text-gray-400 text-sm mt-0.5 truncate">{user.email}</p>
              <p className="text-gray-500 text-xs mt-1">Membre depuis {memberSince}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { value: stats.total, label: 'Réservations' },
              { value: stats.active, label: 'Tickets actifs' },
              { value: stats.used, label: 'Films vus' },
            ].map((s) => (
              <div key={s.label} className="bg-white/6 rounded-xl p-3 text-center">
                <div className="text-gold font-bold text-xl">{loading ? '—' : s.value}</div>
                <div className="text-gray-400 text-xs mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROCHAIN TICKET ────────────────────────────────── */}
        {loading ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center justify-center h-32">
            <i className="ri-loader-4-line text-gold text-2xl animate-spin"></i>
          </div>
        ) : nextTicket ? (
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: 'linear-gradient(135deg, #111 0%, #0d1f15 100%)' }}>
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <h3 className="text-gold text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <i className="ri-ticket-2-fill"></i> Prochain ticket
              </h3>
              <StatusBadge
                label={nextTicket.status.toUpperCase().includes('CONFIRM') ? 'Confirmé' : 'En attente'}
                variant={nextTicket.status.toUpperCase().includes('CONFIRM') ? 'success' : 'warning'}
              />
            </div>

            <div className="px-5 pb-4 flex gap-4">
              {nextTicket.moviePoster ? (
                <img
                  src={nextTicket.moviePoster}
                  alt={nextTicket.movieTitle}
                  className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-24 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-film-line text-gray-600 text-2xl"></i>
                </div>
              )}

              <div className="flex-1 min-w-0 py-1 space-y-2">
                <p className="text-white font-bold text-base leading-tight">{nextTicket.movieTitle}</p>
                <div className="space-y-1 text-sm text-gray-400">
                  <p><i className="ri-calendar-line mr-1.5 text-gold"></i>{nextShowDateFormatted}</p>
                  {nextTicket.showTime && <p><i className="ri-time-line mr-1.5 text-gold"></i>{nextTicket.showTime}</p>}
                  {nextTicket.roomName && <p><i className="ri-building-line mr-1.5 text-gold"></i>{nextTicket.roomName}</p>}
                  {nextTicket.seats.length > 0 && (
                    <p><i className="ri-seat-line mr-1.5 text-gold"></i>{nextTicket.seats.join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge label={getPaymentLabel(nextTicket.paymentStatus)} variant={getPaymentVariant(nextTicket.paymentStatus)} />
                  <StatusBadge label="Non utilisé" variant="info" />
                </div>
              </div>
            </div>

            <div className="px-5 pb-4 flex gap-3">
              <button
                onClick={() => navigate(`/ticket/${nextTicket.reservationId}`)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gold text-black font-semibold rounded-full text-sm hover:bg-yellow-400 transition"
              >
                <i className="ri-eye-line"></i> Voir le ticket
              </button>
              <Link
                to="/compte/tickets"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-white/15 text-white rounded-full text-sm hover:bg-white/8 transition"
              >
                Tous
              </Link>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <i className="ri-ticket-2-line text-5xl text-gray-700 block mb-3"></i>
            <p className="text-white font-semibold mb-1">Aucun ticket à venir</p>
            <p className="text-gray-500 text-sm mb-4">Réservez votre prochaine séance</p>
            <Link
              to="/seances"
              className="inline-flex items-center gap-2 bg-gold text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-yellow-400 transition"
            >
              <i className="ri-calendar-line"></i> Voir les séances
            </Link>
          </div>
        )}

        {/* ── INFORMATIONS PERSONNELLES ──────────────────────── */}
        <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <i className="ri-user-3-line text-gold"></i> Informations personnelles
            </h3>
            {!isEditing ? (
              <button
                onClick={handleEditStart}
                className="text-gold text-xs font-medium hover:text-yellow-300 transition flex items-center gap-1"
              >
                <i className="ri-edit-line"></i> Modifier
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 text-xs hover:text-white transition"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="px-5 py-4 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/8 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/8 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-gold text-black font-semibold rounded-xl text-sm hover:bg-yellow-400 transition disabled:opacity-60"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                {saveMsg && (
                  <p className={`text-xs text-center ${saveMsg.includes('Erreur') ? 'text-red-400' : 'text-green-400'}`}>
                    {saveMsg}
                  </p>
                )}
              </>
            ) : (
              <>
                {[
                  { icon: 'ri-user-line', label: 'Nom complet', value: displayName },
                  { icon: 'ri-mail-line', label: 'Email', value: user.email },
                  { icon: 'ri-phone-line', label: 'Téléphone', value: displayPhone || 'Non renseigné' },
                  { icon: 'ri-calendar-line', label: 'Membre depuis', value: memberSince },
                ].map((field) => (
                  <div key={field.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className={`${field.icon} text-gold text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 text-xs">{field.label}</p>
                      <p className={`text-sm font-medium mt-0.5 truncate ${field.value === 'Non renseigné' ? 'text-gray-500 italic' : 'text-white'}`}>
                        {field.value}
                      </p>
                    </div>
                  </div>
                ))}
                {saveMsg && (
                  <p className="text-xs text-center text-green-400">{saveMsg}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── ACTIONS RAPIDES ────────────────────────────────── */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <i className="ri-flashlight-line text-gold"></i> Actions rapides
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.path + action.label}
                to={action.path}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.color} border border-white/8 hover:border-white/20 transition min-h-[90px]`}
              >
                <i className={`${action.icon} text-3xl ${action.accent}`}></i>
                <span className="text-white text-xs font-medium text-center leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── PROFIL INCOMPLET ───────────────────────────────── */}
        {!displayPhone && !isEditing && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/8 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <i className="ri-alert-line text-yellow-400 text-xl"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-yellow-300 text-sm font-semibold">Profil incomplet</p>
              <p className="text-yellow-500/80 text-xs mt-0.5">Ajoutez votre numéro de téléphone</p>
            </div>
            <button
              onClick={handleEditStart}
              className="text-yellow-400 text-xs font-semibold border border-yellow-500/40 px-3 py-1.5 rounded-full hover:bg-yellow-500/15 transition flex-shrink-0"
            >
              Compléter
            </button>
          </div>
        )}

      </div>
    </ClientLayout>
  );
}
