import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Footer from '../../../components/feature/Footer';
import { supabase } from '../../../lib/supabaseClient';
import CinemaTicket, { type CinemaTicketData } from '../../../components/feature/CinemaTicket';
import { buildTicketPayload, signTicketPayload } from '../../../lib/ticketQr';
import {
  generateReservationMessage,
  buildWhatsAppUrl,
  phoneValidationMessage,
} from '../../../lib/whatsapp';

export default function ConfirmationPage() {
  const navigate   = useNavigate();
  const { reservationId } = useParams<{ reservationId: string }>();
  const location   = useLocation();
  const ticketRef  = useRef<HTMLDivElement>(null);

  const [ticket, setTicket]         = useState<CinemaTicketData | null>(null);
  const [qrValue, setQrValue]       = useState('');
  const [loading, setLoading]       = useState(!!reservationId);
  const [showTicket, setShowTicket] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confetti, setConfetti]     = useState(false);

  // Données passées depuis checkout via navigate state
  const stateData = (location.state as any)?.reservationData;

  // ── Chargement ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reservationId) { setLoading(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from('reservation_complete')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (data) {
        const t: CinemaTicketData = {
          id: data.id,
          confirmation_code: data.confirmation_code,
          status: data.status,
          payment_status: data.payment_status,
          guest_name: data.customer_name || null,
          guest_email: data.user_email || null,
          guest_phone: null,
          total_seats: data.total_seats,
          total_price_htg: Number(data.total_price_htg),
          payment_method: stateData?.paymentMethod || null,
          created_at: data.created_at,
          movie_title: data.movie_title,
          movie_poster: null,
          show_date: data.show_date,
          show_time: data.show_time,
          room_name: data.room_name,
          seats: data.seats ? String(data.seats).split(', ') : (stateData?.selectedSeats ?? []),
        };
        setTicket(t);
        const payload = buildTicketPayload(t);
        const signed  = await signTicketPayload(payload);
        setQrValue(signed);
      }
      setLoading(false);
    };
    load();
  }, [reservationId]);

  // Lance l'animation confetti au chargement
  useEffect(() => {
    if (!loading) {
      setTimeout(() => setConfetti(true), 300);
      setTimeout(() => setConfetti(false), 3000);
    }
  }, [loading]);

  // ── Données de fallback depuis stateData ─────────────────────────────────
  const confirmationCode = ticket?.confirmation_code || stateData?.confirmationCode || '';
  const movieTitle       = ticket?.movie_title || stateData?.movieTitle || 'Votre film';
  const showDate         = ticket?.show_date
    ? new Date(ticket.show_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : stateData?.showDate || '';
  const showTime    = ticket?.show_time?.slice(0, 5) || stateData?.showTime || '';
  const seats       = ticket?.seats.length ? ticket.seats : (stateData?.selectedSeats ?? []);
  const totalPrice  = ticket?.total_price_htg || stateData?.totalPrice || 0;
  const payMethod   = stateData?.paymentMethod || ticket?.payment_method || '';
  const customerName = ticket?.guest_name || (stateData?.customerInfo
    ? `${stateData.customerInfo.firstName} ${stateData.customerInfo.lastName}`
    : '');

  const isCash    = ticket?.payment_status === 'CASH_A_LARRIVEE' || payMethod === "Cash à l'entrée";
  const isPending = !ticket || ticket.payment_status === 'EN_ATTENTE_VALIDATION';
  const isConfirmed = ticket?.payment_status === 'PAYE' || ticket?.status === 'CONFIRMED';

  // ── WhatsApp ─────────────────────────────────────────────────────────────
  const guestPhone    = ticket?.guest_phone || stateData?.customerInfo?.phone || '';
  const waError       = phoneValidationMessage(guestPhone);
  const waMessage     = generateReservationMessage({
    guest_name:         customerName,
    guest_phone:        guestPhone,
    movie_title:        ticket?.movie_title || stateData?.movieTitle,
    show_date:          ticket?.show_date   || stateData?.showDate,
    show_time:          ticket?.show_time   || stateData?.showTime,
    room_name:          ticket?.room_name   || stateData?.roomName,
    seats:              seats,
    confirmation_code:  confirmationCode,
    total_price_htg:    totalPrice,
    reservation_status: ticket?.reservation_status,
    payment_status:     ticket?.payment_status,
    entry_status:       ticket?.entry_status,
    status:             ticket?.status,
  });
  const waUrl = buildWhatsAppUrl(guestPhone, waMessage);

  // ── Téléchargement PDF ───────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!reservationId) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/ticket/pdf?id=${reservationId}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `billet-${confirmationCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger le PDF. Vérifiez que le serveur est lancé.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Couleurs selon statut ────────────────────────────────────────────────
  const statusConfig = isCash
    ? { icon: '💵', title: 'Réservation enregistrée !', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)',
        msg: "Votre place est réservée. Présentez ce billet à l'entrée et payez en espèces au guichet (arrivez 15 min avant)." }
    : isPending
    ? { icon: '⏳', title: 'Paiement en cours de validation', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
        msg: "Nous avons reçu votre demande de paiement. Notre équipe la validera sous peu." }
    : { icon: '✅', title: 'Réservation confirmée !', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)',
        msg: "Votre paiement a été validé. Vos places sont confirmées — bon film !" };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ── Confetti particles ─────────────────────────────────────────── */}
      {confetti && <ConfettiEffect />}

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <div style={{
              width: 40, height: 40, border: '3px solid #D4AF37',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p>Chargement...</p>
          </div>
        ) : (
          <>
            {/* ── Bannière statut ──────────────────────────────────────── */}
            <div style={{
              textAlign: 'center', marginBottom: 32, padding: '40px 24px',
              borderRadius: 24, border: `1px solid ${statusConfig.border}`,
              background: statusConfig.bg,
              animation: 'fadeUp 0.5s ease-out',
            }}>
              <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>
                {statusConfig.icon}
              </div>
              <h1 style={{
                fontSize: 28, fontWeight: 800, fontFamily: 'Georgia, serif',
                color: '#fff', margin: '0 0 12px',
              }}>
                {statusConfig.title}
              </h1>
              <p style={{ color: '#9ca3af', maxWidth: 440, margin: '0 auto', fontSize: 15, lineHeight: 1.6 }}>
                {statusConfig.msg}
              </p>
            </div>

            {/* ── Ticket premium (si données dispo) ────────────────────── */}
            {ticket && qrValue ? (
              <>
                <div style={{ marginBottom: 24, animation: 'fadeUp 0.6s ease-out 0.1s both' }}>
                  <CinemaTicket ticket={ticket} qrValue={qrValue} innerRef={ticketRef} />
                </div>

                {/* Boutons d'action */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
                      color: '#111', fontWeight: 700, fontSize: 14,
                      borderRadius: 50, border: 'none', cursor: downloading ? 'wait' : 'pointer',
                      boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                      opacity: downloading ? 0.7 : 1,
                    }}
                  >
                    <i className="ri-download-line" style={{ fontSize: 16 }} />
                    {downloading ? 'Génération...' : 'Télécharger le billet PDF'}
                  </button>
                  <button
                    onClick={() => navigate(`/ticket/${reservationId}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 24px',
                      background: 'transparent',
                      color: '#D4AF37', fontWeight: 600, fontSize: 14,
                      borderRadius: 50, border: '1px solid rgba(212,175,55,0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="ri-ticket-2-line" style={{ fontSize: 16 }} />
                    Voir mon ticket
                  </button>

                  {/* Bouton WhatsApp */}
                  {waError ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', fontSize: 13 }}>
                      <i className="ri-whatsapp-line" style={{ fontSize: 16 }} />
                      {waError}
                    </div>
                  ) : (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: '#fff', fontWeight: 700, fontSize: 14,
                        borderRadius: 50, border: 'none', cursor: 'pointer',
                        textDecoration: 'none',
                        boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
                      }}
                    >
                      <i className="ri-whatsapp-line" style={{ fontSize: 16 }} />
                      Envoyer sur WhatsApp
                    </a>
                  )}
                </div>
              </>
            ) : (
              /* ── Récap minimal si pas encore de données complètes ─── */
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: 24, marginBottom: 24,
                animation: 'fadeUp 0.6s ease-out 0.1s both',
              }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Récapitulatif</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {movieTitle && <InfoRow label="Film" value={movieTitle} highlight />}
                  {showDate   && <InfoRow label="Date" value={showDate} />}
                  {showTime   && <InfoRow label="Heure" value={showTime} />}
                  {seats.length > 0 && <InfoRow label="Sièges" value={seats.join(', ')} gold />}
                  {customerName && <InfoRow label="Réservé pour" value={customerName} />}
                  {totalPrice > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Total</span>
                      <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: 18 }}>{Number(totalPrice).toLocaleString()} HTG</span>
                    </div>
                  )}
                </div>

                {/* Code de confirmation */}
                {confirmationCode && (
                  <div style={{ marginTop: 20, textAlign: 'center', padding: '16px', background: 'rgba(212,175,55,0.08)', borderRadius: 12, border: '1px solid rgba(212,175,55,0.2)' }}>
                    <p style={{ color: '#6b7280', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                      Code de confirmation
                    </p>
                    <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 22, color: '#D4AF37', margin: 0 }}>
                      {confirmationCode}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Bouton WhatsApp (récap minimal) ─────────────────────── */}
            {!ticket && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                {waError ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', fontSize: 13 }}>
                    <i className="ri-whatsapp-line" />
                    {waError}
                  </div>
                ) : (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 28px',
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                      borderRadius: 50, textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
                    }}
                  >
                    <i className="ri-whatsapp-line" style={{ fontSize: 16 }} />
                    Envoyer sur WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* ── Boutons navigation ───────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.6s ease-out 0.2s both' }}>
              {reservationId && !ticket && (
                <button
                  onClick={() => navigate(`/ticket/${reservationId}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px', background: '#D4AF37',
                    color: '#111', fontWeight: 700, fontSize: 15,
                    borderRadius: 14, border: 'none', cursor: 'pointer',
                  }}
                >
                  <i className="ri-ticket-2-line text-lg" />
                  Voir mon ticket
                </button>
              )}
              <button
                onClick={() => navigate('/seances')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', background: 'transparent',
                  color: '#9ca3af', fontWeight: 600, fontSize: 15,
                  borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                }}
              >
                <i className="ri-calendar-line" />
                Voir d'autres séances
              </button>
            </div>

            <p style={{ textAlign: 'center', color: '#4b5563', fontSize: 13, marginTop: 24 }}>
              Retrouvez tous vos tickets dans{' '}
              <button
                onClick={() => navigate('/compte/tickets')}
                style={{ color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                votre espace personnel
              </button>
            </p>
          </>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Composants helpers ─────────────────────────────────────────────────────
function InfoRow({ label, value, highlight, gold }: { label: string; value: string; highlight?: boolean; gold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: gold ? '#D4AF37' : highlight ? '#fff' : '#d1d5db', fontWeight: gold || highlight ? 700 : 500 }}>
        {value}
      </span>
    </div>
  );
}

function ConfettiEffect() {
  const colors = ['#D4AF37', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96e6a1', '#dda0dd'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 1.5,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: -20,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : 2,
          transform: `rotate(${p.rotation}deg)`,
          animation: `confettiFall 2.5s ${p.delay}s ease-in forwards`,
          opacity: 0.9,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
