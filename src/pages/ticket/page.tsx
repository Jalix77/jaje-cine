import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import { supabase } from '../../lib/supabaseClient';
import CinemaTicket, { type CinemaTicketData } from '../../components/feature/CinemaTicket';
import { buildTicketPayload, signTicketPayload } from '../../lib/ticketQr';
import {
  generateReservationMessage,
  buildWhatsAppUrl,
  phoneValidationMessage,
} from '../../lib/whatsapp';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket]   = useState<CinemaTicketData | null>(null);
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // ── Chargement ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { navigate('/'); return; }

    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Essayer la vue reservation_complete
      const { data: viewData, error: viewErr } = await supabase
        .from('reservation_complete')
        .select('*')
        .eq('id', id)
        .single();

      if (!viewErr && viewData) {
        const t: CinemaTicketData = {
          id: viewData.id,
          confirmation_code: viewData.confirmation_code,
          status: viewData.status,
          payment_status: viewData.payment_status,
          reservation_status: viewData.reservation_status ?? null,
          entry_status: viewData.entry_status ?? null,
          guest_name: viewData.customer_name || null,
          guest_email: viewData.user_email || null,
          guest_phone: null,
          total_seats: viewData.total_seats,
          total_price_htg: Number(viewData.total_price_htg),
          payment_method: null,
          created_at: viewData.created_at,
          movie_title: viewData.movie_title,
          movie_poster: null,
          show_date: viewData.show_date,
          show_time: viewData.show_time,
          room_name: viewData.room_name,
          seats: viewData.seats ? String(viewData.seats).split(', ') : [],
        };
        setTicket(t);
        const payload = buildTicketPayload(t);
        const signed  = await signTicketPayload(payload);
        setQrValue(signed);
        setLoading(false);
        return;
      }

      // 2. Fallback : requête directe
      const { data: resData, error: resErr } = await supabase
        .from('reservations')
        .select(`
          id, confirmation_code, status, payment_status,
          reservation_status, entry_status,
          guest_name, guest_email, guest_phone,
          total_seats, total_price_htg, payment_method,
          transaction_reference, created_at,
          showtimes:showtime_id (
            show_date, show_time,
            movies:movie_id (title, poster_url),
            rooms:room_id (name)
          )
        `)
        .eq('id', id)
        .single();

      if (resErr || !resData) {
        setError('Réservation introuvable');
        setLoading(false);
        return;
      }

      const { data: seatsData } = await supabase
        .from('reservation_seats')
        .select('seats:seat_id(row_letter, seat_number)')
        .eq('reservation_id', id);

      const seatLabels = (seatsData ?? []).map((rs: any) =>
        rs.seats ? `${rs.seats.row_letter}-${rs.seats.seat_number}` : ''
      ).filter(Boolean);

      const st = (resData as any).showtimes;
      const mv = st?.movies;
      const rm = st?.rooms;

      const t: CinemaTicketData = {
        id: resData.id,
        confirmation_code: resData.confirmation_code,
        status: resData.status,
        payment_status: resData.payment_status,
        reservation_status: (resData as any).reservation_status ?? null,
        entry_status: (resData as any).entry_status ?? null,
        guest_name: resData.guest_name,
        guest_email: resData.guest_email,
        guest_phone: resData.guest_phone,
        total_seats: resData.total_seats,
        total_price_htg: Number(resData.total_price_htg),
        payment_method: resData.payment_method,
        created_at: resData.created_at,
        movie_title: mv?.title || 'Film',
        movie_poster: mv?.poster_url || null,
        show_date: st?.show_date || '',
        show_time: st?.show_time || '',
        room_name: rm?.name || '',
        seats: seatLabels,
      };

      setTicket(t);
      const payload = buildTicketPayload(t);
      const signed  = await signTicketPayload(payload);
      setQrValue(signed);
      setLoading(false);
    };

    load();
  }, [id, navigate]);

  // ── Téléchargement PDF ───────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!ticket || !id) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/ticket/pdf?id=${id}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `billet-${ticket.confirmation_code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Impossible de télécharger le PDF. Vérifiez que le serveur est lancé.');
    } finally {
      setDownloading(false);
    }
  };

  // ── États ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 gap-4 text-gray-400">
          <div style={{
            width: 40, height: 40, border: '3px solid #D4AF37',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p>Chargement du ticket...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 pt-32 text-center">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎫</div>
          <p className="text-red-400 text-xl mb-6">{error || 'Ticket introuvable'}</p>
          <Link to="/" className="bg-gold text-black px-6 py-3 rounded-full font-semibold">
            Retour à l'accueil
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to="/compte/tickets" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition">
            <i className="ri-arrow-left-line" /> Mes tickets
          </Link>
          <span className="text-gray-600 text-xs">
            Réservation #{ticket.confirmation_code}
          </span>
        </div>

        {/* ── Ticket premium ───────────────────────────────────────────── */}
        <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
          <CinemaTicket ticket={ticket} qrValue={qrValue} innerRef={ticketRef} />
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center print:hidden">
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
              transition: 'opacity 0.2s',
              opacity: downloading ? 0.7 : 1,
            }}
          >
            <i className="ri-download-line" style={{ fontSize: 16 }} />
            {downloading ? 'Génération...' : 'Télécharger PDF'}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'transparent',
              color: '#fff', fontWeight: 600, fontSize: 14,
              borderRadius: 50, border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <i className="ri-printer-line" style={{ fontSize: 16 }} />
            Imprimer
          </button>

          {/* Bouton WhatsApp */}
          {(() => {
            const waError = phoneValidationMessage(ticket.guest_phone);
            if (waError) {
              return (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '12px 20px', borderRadius: 50,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#6b7280', fontSize: 13,
                }} title={waError}>
                  <i className="ri-whatsapp-line" style={{ fontSize: 16 }} />
                  {waError}
                </span>
              );
            }
            const msg = generateReservationMessage({
              guest_name:         ticket.guest_name,
              guest_phone:        ticket.guest_phone,
              movie_title:        ticket.movie_title,
              show_date:          ticket.show_date,
              show_time:          ticket.show_time,
              room_name:          ticket.room_name,
              seats:              ticket.seats,
              confirmation_code:  ticket.confirmation_code,
              total_price_htg:    ticket.total_price_htg,
              reservation_status: ticket.reservation_status,
              payment_status:     ticket.payment_status,
              entry_status:       ticket.entry_status,
              status:             ticket.status,
            });
            return (
              <a
                href={buildWhatsAppUrl(ticket.guest_phone, msg)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  borderRadius: 50, textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
                }}
              >
                <i className="ri-whatsapp-line" style={{ fontSize: 16 }} />
                Envoyer sur WhatsApp
              </a>
            );
          })()}

          <Link
            to="/seances"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'transparent',
              color: '#9ca3af', fontWeight: 600, fontSize: 14,
              borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
          >
            <i className="ri-calendar-line" style={{ fontSize: 16 }} />
            Autres séances
          </Link>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media print {
          body { background: white !important; }
          nav, footer, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
