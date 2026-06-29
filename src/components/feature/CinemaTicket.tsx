/**
 * CinemaTicket — Billet de cinéma premium Jaje Ciné
 *
 * Usage:
 *   <CinemaTicket ticket={ticketData} qrValue={signedQrString} />
 */

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { StatusPanel } from './StatusBadge';

// ── Logo Jaje Ciné ─────────────────────────────────────────────────────────
function JajeLogo({ size = 52 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Jaje Ciné"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface CinemaTicketData {
  id: string;
  confirmation_code: string;
  movie_title: string;
  movie_poster?: string | null;
  show_date: string;
  show_time: string;
  room_name: string;
  seats: string[];
  guest_name: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  // Anciens champs (rétrocompat)
  status: string;
  payment_status: string;
  // Phase 9 — nouvelles colonnes
  reservation_status?: string | null;
  entry_status?: string | null;
  payment_method?: string | null;
  total_price_htg: number;
  total_seats: number;
  created_at: string;
}

interface Props {
  ticket: CinemaTicketData;
  qrValue: string;
  /** Ref transmis depuis le parent pour le PDF/impression */
  innerRef?: React.RefObject<HTMLDivElement | null>;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

// ── Composant principal ────────────────────────────────────────────────────
export default function CinemaTicket({ ticket, qrValue, innerRef }: Props) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const ref = innerRef ?? fallbackRef;

  const showDate = formatDate(ticket.show_date);
  const showTime = ticket.show_time?.slice(0, 5) ?? '—';
  const seatList = ticket.seats.length > 0
    ? ticket.seats.join(' · ')
    : `${ticket.total_seats} siège(s)`;

  const posterFallback = `https://placehold.co/200x300/1a1a1a/888888?text=${encodeURIComponent(ticket.movie_title)}`;

  return (
    <div
      ref={ref}
      className="cinema-ticket"
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* ── HEADER DORÉ ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #1a1a1a 100%)',
        padding: '20px 24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Texture décorative */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)',
          backgroundSize: '10px 10px',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <JajeLogo size={52} />
          <div>
            <p style={{ color: '#D4AF37', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0, fontFamily: 'sans-serif' }}>
              Billet officiel
            </p>
            <h2 style={{ color: '#D4AF37', fontSize: 22, margin: '2px 0 0', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              JAJE CINÉ
            </h2>
          </div>
          {/* Affiche du film */}
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <img
              src={ticket.movie_poster || posterFallback}
              alt={ticket.movie_title}
              style={{ width: 52, height: 74, objectFit: 'cover', borderRadius: 8, border: '2px solid #D4AF37' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = posterFallback; }}
            />
          </div>
        </div>

        {/* Titre du film */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(212,175,55,0.3)' }}>
          <p style={{ color: 'rgba(212,175,55,0.7)', fontSize: 10, letterSpacing: '0.2em', margin: '0 0 4px', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
            Film
          </p>
          <h1 style={{ color: '#fff', fontSize: 20, margin: 0, fontWeight: 'bold', lineHeight: 1.2 }}>
            {ticket.movie_title}
          </h1>
        </div>
      </div>

      {/* ── PANNEAU 3 STATUTS (Phase 9) ──────────────────────────────────── */}
      <div style={{ margin: '14px 20px 8px', fontFamily: 'sans-serif' }}>
        <StatusPanel
          reservationStatus={ticket.reservation_status ?? ticket.status}
          paymentStatus={ticket.payment_status}
          entryStatus={ticket.entry_status}
          legacyStatus={ticket.status}
          layout="card"
        />
        {ticket.payment_status === 'CASH_A_LARRIVEE' && (
          <p style={{ color: '#1e40af', fontSize: 11, textAlign: 'center', margin: '8px 0 0' }}>
            💵 Payez en espèces au guichet (arrivez 15 min avant)
          </p>
        )}
      </div>

      {/* ── GRILLE D'INFOS ───────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <InfoCell label="Date" value={<span style={{ textTransform: 'capitalize', fontSize: 13 }}>{showDate}</span>} />
          <InfoCell label="Heure" value={<span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{showTime}</span>} />
          <InfoCell label="Salle" value={ticket.room_name || '—'} />
          <InfoCell label={`Siège${ticket.seats.length > 1 ? 's' : ''}`} value={
            <span style={{ color: '#D4AF37', fontWeight: 700 }}>{seatList}</span>
          } />
        </div>

        {/* Réservé pour */}
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 12,
        }}>
          <p style={{ color: '#6b7280', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            Réservé pour
          </p>
          <p style={{ color: '#111', fontWeight: 700, margin: 0, fontSize: 15 }}>
            {ticket.guest_name || '—'}
          </p>
          {ticket.guest_email && (
            <p style={{ color: '#6b7280', fontSize: 12, margin: '2px 0 0' }}>{ticket.guest_email}</p>
          )}
          {ticket.guest_phone && (
            <p style={{ color: '#6b7280', fontSize: 12, margin: '2px 0 0' }}>{ticket.guest_phone}</p>
          )}
        </div>
      </div>

      {/* ── SÉPARATEUR PERFORÉ ───────────────────────────────────────────── */}
      <Perforation />

      {/* ── QR CODE ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 20px 16px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#6b7280', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          Présentez à l'entrée
        </p>
        <div style={{
          display: 'inline-block',
          padding: 12,
          background: '#fff',
          border: '2px solid #D4AF37',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(212,175,55,0.2)',
        }}>
          <QRCodeCanvas
            value={qrValue}
            size={168}
            level="H"
            includeMargin={false}
            fgColor="#1a1a1a"
            bgColor="#ffffff"
          />
        </div>

        {/* Code lisible */}
        <div style={{ marginTop: 10 }}>
          <p style={{ color: '#9ca3af', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 3px' }}>
            Code de confirmation
          </p>
          <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#1a1a1a', margin: 0, letterSpacing: '0.05em' }}>
            {ticket.confirmation_code}
          </p>
        </div>
      </div>

      {/* ── SÉPARATEUR PERFORÉ ───────────────────────────────────────────── */}
      <Perforation />

      {/* ── PIED : PRIX + PAIEMENT ───────────────────────────────────────── */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Paiement</p>
          <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: 13, margin: 0 }}>
            {ticket.payment_method ?? '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#6b7280', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Total</p>
          <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: 22, margin: 0 }}>
            {Number(ticket.total_price_htg).toLocaleString()} <span style={{ fontSize: 14 }}>HTG</span>
          </p>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1a1a1a',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}>
        <p style={{ color: '#6b7280', fontSize: 10, margin: 0 }}>
          Réservé le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
        </p>
        <p style={{ color: '#6b7280', fontSize: 10, margin: 0 }}>
          jaje.org — Cinéma Communautaire
        </p>
      </div>
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────
function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '10px 14px',
    }}>
      <p style={{ color: '#6b7280', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: 'sans-serif' }}>
        {label}
      </p>
      <div style={{ color: '#111', fontWeight: 600, fontSize: 14, fontFamily: 'sans-serif' }}>
        {value}
      </div>
    </div>
  );
}

function Perforation() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', position: 'relative' }}>
      {/* Demi-cercle gauche */}
      <div style={{ width: 16, height: 32, background: '#f3f4f6', borderRadius: '0 16px 16px 0', flexShrink: 0 }} />
      {/* Ligne pointillée */}
      <div style={{ flex: 1, borderTop: '2px dashed #d1d5db' }} />
      {/* Demi-cercle droit */}
      <div style={{ width: 16, height: 32, background: '#f3f4f6', borderRadius: '16px 0 0 16px', flexShrink: 0 }} />
    </div>
  );
}
