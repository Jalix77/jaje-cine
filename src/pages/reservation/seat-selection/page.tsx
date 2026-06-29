/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  JAJE CINÉ — Sélection des Sièges (v2 Premium)                  ║
 * ║  Design immersif style grands cinémas (AMC/Cineplex/Cinemark)   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Logique métier 100% conservée :
 *  · seat_locks (verrous 15 min)
 *  · reservation_seats
 *  · Supabase realtime-safe (polling 15s)
 *  · SESSION_KEY unique par onglet
 */

import {
  useEffect, useState, useCallback, useMemo, useRef,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type SeatStatus = 'AVAILABLE' | 'TAKEN' | 'LOCKED' | 'SELECTED';

interface Seat {
  id: string;
  row_letter: string;
  seat_number: number;
  status: SeatStatus;
  zone_name?: string;
  price_htg?: number;
  is_accessible: boolean;
}

interface ShowtimeInfo {
  id: string;
  show_date: string;
  show_time: string;
  base_price_htg: number;
  available_seats: number;
  movie: {
    title: string;
    poster_url?: string | null;
    duration_minutes?: number | null;
    rating?: string | null;
  } | null;
  room: { name: string; rows: number; seats_per_row: number } | null;
}

const SESSION_KEY = `seat_session_${Math.random().toString(36).slice(2)}`;

// ─────────────────────────────────────────────────────────────────────────────
// ZONES — couleur par type de zone
// ─────────────────────────────────────────────────────────────────────────────
interface ZoneColor { base: string; glow: string; border: string; label: string; }

const ZONE_PALETTE: Record<string, ZoneColor> = {
  vip:       { base: '#6d28d9', glow: 'rgba(109,40,217,.55)', border: '#7c3aed', label: 'VIP' },
  premium:   { base: '#1d4ed8', glow: 'rgba(29,78,216,.50)',  border: '#3b82f6', label: 'Premium' },
  standard:  { base: '#1e3a8a', glow: 'rgba(30,58,138,.40)',  border: '#2563eb', label: 'Standard' },
  pmr:       { base: '#0d766e', glow: 'rgba(13,118,110,.45)', border: '#0d9488', label: 'PMR' },
  accessible:{ base: '#0d766e', glow: 'rgba(13,118,110,.45)', border: '#0d9488', label: 'Accessible' },
};

const DEFAULT_ZONE: ZoneColor = { base: '#1e3a8a', glow: 'rgba(30,58,138,.40)', border: '#2563eb', label: 'Standard' };

function resolveZone(name?: string): ZoneColor {
  if (!name) return DEFAULT_ZONE;
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(ZONE_PALETTE)) {
    if (key.includes(k)) return v;
  }
  return { ...DEFAULT_ZONE, label: name };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : ScreenDisplay — écran courbé premium
// ─────────────────────────────────────────────────────────────────────────────
function ScreenDisplay() {
  return (
    <div className="relative flex flex-col items-center mb-8 select-none px-4">
      {/* Halo diffus derrière l'écran */}
      <div
        className="absolute inset-x-0 top-0 h-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,.22) 0%, transparent 70%)',
        }}
      />

      {/* SVG de l'écran */}
      <svg
        viewBox="0 0 800 56"
        className="w-full max-w-3xl relative z-10"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Dégradé horizontal principal */}
          <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#312e81" stopOpacity=".0" />
            <stop offset="15%"  stopColor="#818cf8" stopOpacity=".6" />
            <stop offset="50%"  stopColor="#e0e7ff" stopOpacity="1"  />
            <stop offset="85%"  stopColor="#818cf8" stopOpacity=".6" />
            <stop offset="100%" stopColor="#312e81" stopOpacity=".0" />
          </linearGradient>
          {/* Dégradé de remplissage sous la courbe */}
          <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity=".12" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity=".0"  />
          </linearGradient>
          <filter id="glow" x="-10%" y="-200%" width="120%" height="600%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Zone remplie sous la courbe */}
        <path
          d="M 10 46 Q 400 8 790 46 L 790 56 L 10 56 Z"
          fill="url(#sg2)"
        />
        {/* Bord lumineux principal */}
        <path
          d="M 10 46 Q 400 8 790 46"
          stroke="url(#sg1)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
        />
        {/* Filet blanc fin */}
        <path
          d="M 10 46 Q 400 8 790 46"
          stroke="rgba(255,255,255,.18)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Reflet intérieur */}
        <path
          d="M 80 44 Q 400 12 720 44"
          stroke="rgba(255,255,255,.06)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Label ÉCRAN */}
      <span className="mt-2 text-[10px] tracking-[.4em] text-indigo-300/60 font-semibold uppercase">
        É C R A N
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : CinemaSeat — fauteuil SVG premium
// ─────────────────────────────────────────────────────────────────────────────
function CinemaSeat({
  seat,
  isSelected,
  zone,
  onToggle,
}: {
  seat: Seat;
  isSelected: boolean;
  zone: ZoneColor;
  onToggle: (seat: Seat) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const isTaken  = seat.status === 'TAKEN';
  const isLocked = seat.status === 'LOCKED';
  const disabled = isTaken || isLocked;

  // Couleurs selon état
  const colors = useMemo(() => {
    if (isTaken)     return { fill: '#1f2937', stroke: '#2d3748', glow: 'none',              opacity: .45 };
    if (isLocked)    return { fill: '#78350f', stroke: '#92400e', glow: 'rgba(251,146,60,.4)', opacity: .8  };
    if (isSelected)  return { fill: '#d97706', stroke: '#f59e0b', glow: 'rgba(245,158,11,.6)', opacity: 1   };
    if (hovered)     return { fill: '#4338ca', stroke: '#818cf8', glow: zone.glow,             opacity: 1   };
    return           { fill: zone.base,      stroke: zone.border, glow: zone.glow,            opacity: 1   };
  }, [isTaken, isLocked, isSelected, hovered, zone]);

  const title = isTaken  ? 'Occupé'
    : isLocked ? 'Réservé temporairement'
    : `${seat.row_letter}-${seat.seat_number}${seat.zone_name ? ` · ${seat.zone_name}` : ''} · ${Number(seat.price_htg ?? 0).toLocaleString()} HTG`;

  return (
    <button
      onClick={() => !disabled && onToggle(seat)}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isSelected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'relative flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900',
        'transition-all duration-150',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        !disabled && !isSelected && hovered ? '-translate-y-1' : '',
        isSelected ? '-translate-y-1 scale-110' : '',
      ].join(' ')}
      style={{
        filter: isSelected || (hovered && !disabled)
          ? `drop-shadow(0 0 6px ${colors.glow})`
          : 'none',
        opacity: colors.opacity,
      }}
    >
      <svg
        width="34"
        height="30"
        viewBox="0 0 38 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Dossier */}
        <path
          d="M5 2 Q5 1 19 1 Q33 1 33 2 Q37 2 37 7 L37 18 Q37 21 33 21 L5 21 Q1 21 1 18 L1 7 Q1 2 5 2Z"
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="1"
        />
        {/* Accoudoir gauche */}
        <rect x="-1" y="17" width="5" height="12" rx="2" fill={colors.fill} stroke={colors.stroke} strokeWidth="1" />
        {/* Accoudoir droit */}
        <rect x="34" y="17" width="5" height="12" rx="2" fill={colors.fill} stroke={colors.stroke} strokeWidth="1" />
        {/* Assise */}
        <rect x="2" y="19" width="34" height="10" rx="3" fill={colors.fill} stroke={colors.stroke} strokeWidth="1" />
        {/* Pieds */}
        <rect x="7"  y="29" width="5" height="5" rx="1.5" fill={colors.fill} stroke={colors.stroke} strokeWidth=".8" />
        <rect x="26" y="29" width="5" height="5" rx="1.5" fill={colors.fill} stroke={colors.stroke} strokeWidth=".8" />

        {/* PMR icon */}
        {seat.is_accessible && (
          <text x="19" y="14" textAnchor="middle" fontSize="10" fill="#5eead4" fontWeight="bold">♿</text>
        )}

        {/* Reflet subtil sur le dossier */}
        {!isTaken && !isLocked && (
          <path
            d="M9 4 Q19 3 29 4"
            stroke="rgba(255,255,255,.18)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : MovieSummaryCard — carte du film en haut
// ─────────────────────────────────────────────────────────────────────────────
function MovieSummaryCard({ showtime }: { showtime: ShowtimeInfo }) {
  const movie = showtime.movie as any;
  const room  = showtime.room  as any;

  const dateLabel = (() => {
    try {
      return new Date(showtime.show_date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
    } catch { return showtime.show_date; }
  })();

  const ratingLabel = (() => {
    const r = movie?.rating;
    if (!r) return null;
    const map: Record<string, string> = {
      'G': 'Tous publics', 'PG': 'Parental guidance', 'PG-13': 'Déconseillé -13',
      'R': 'Interdit -17', 'NC-17': 'Interdit -17',
    };
    return map[r] ?? r;
  })();

  const posterFallback = `https://placehold.co/200x300/111827/374151?text=${encodeURIComponent(movie?.title ?? 'Film')}`;

  return (
    <div className="flex gap-4 items-start p-4 bg-gray-900/70 border border-white/8 rounded-2xl mb-1">
      {/* Affiche */}
      <div className="flex-shrink-0 w-16 aspect-[2/3] rounded-xl overflow-hidden shadow-lg shadow-black/40 ring-1 ring-white/10">
        <img
          src={movie?.poster_url || posterFallback}
          alt={movie?.title ?? 'Film'}
          className="w-full h-full object-cover object-top"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = posterFallback; }}
        />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-white text-base leading-tight truncate mb-2">
          {movie?.title ?? 'Film sans titre'}
        </h1>

        <div className="space-y-1">
          <InfoRow icon="ri-calendar-event-line" text={dateLabel} />
          <div className="flex items-center gap-3">
            <InfoRow icon="ri-time-line" text={showtime.show_time?.slice(0, 5)} highlight />
            {movie?.duration_minutes && (
              <InfoRow icon="ri-timer-line" text={`${movie.duration_minutes} min`} />
            )}
          </div>
          <InfoRow icon="ri-building-4-line" text={room?.name ?? 'Salle'} />
          {ratingLabel && <InfoRow icon="ri-shield-check-line" text={ratingLabel} />}
        </div>
      </div>

      {/* Prix — source unique : showtimes.base_price_htg */}
      <div className="flex-shrink-0 text-right">
        <p className="text-amber-400 font-bold text-lg leading-none">
          {Number(showtime.base_price_htg).toLocaleString()}
        </p>
        <p className="text-gray-500 text-[10px] mt-0.5">HTG / siège</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, text, highlight }: { icon: string; text?: string | null; highlight?: boolean }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-1.5">
      <i className={`${icon} text-xs text-indigo-400 flex-shrink-0`} />
      <span className={`text-xs leading-none capitalize truncate ${highlight ? 'text-amber-400 font-bold' : 'text-gray-300'}`}>
        {text}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : SeatLegend — légende horizontale
// ─────────────────────────────────────────────────────────────────────────────
function SeatLegend({ zones }: { zones: { name: string; price: number }[] }) {
  const items = [
    { color: '#1e40af', border: '#3b82f6', label: 'Disponible' },
    { color: '#d97706', border: '#f59e0b', label: 'Sélectionné' },
    { color: '#78350f', border: '#92400e', label: 'Temporaire' },
    { color: '#1f2937', border: '#374151', label: 'Occupé',     opacity: .5 },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {items.map(({ color, border, label, opacity }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="16" height="14" viewBox="0 0 38 34" fill="none" style={{ opacity: opacity ?? 1 }}>
              <path d="M5 2 Q5 1 19 1 Q33 1 33 2 Q37 2 37 7 L37 18 Q37 21 33 21 L5 21 Q1 21 1 18 L1 7 Q1 2 5 2Z" fill={color} stroke={border} strokeWidth="1.5" />
              <rect x="-1" y="17" width="5" height="12" rx="2" fill={color} stroke={border} strokeWidth="1.5" />
              <rect x="34" y="17" width="5" height="12" rx="2" fill={color} stroke={border} strokeWidth="1.5" />
              <rect x="2" y="19" width="34" height="10" rx="3" fill={color} stroke={border} strokeWidth="1.5" />
            </svg>
            <span className="text-[11px] text-gray-400">{label}</span>
          </div>
        ))}
        {/* PMR */}
        <div className="flex items-center gap-1.5">
          <span className="text-teal-400 text-sm leading-none">♿</span>
          <span className="text-[11px] text-gray-400">PMR</span>
        </div>
      </div>

      {/* Zones tarifaires */}
      {zones.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-white/8">
          {zones.map(({ name, price }) => {
            const z = resolveZone(name);
            return (
              <div
                key={name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: `${z.base}22`, border: `1px solid ${z.border}40`, color: z.border }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: z.base, boxShadow: `0 0 4px ${z.glow}` }}
                />
                {z.label} — {Number(price).toLocaleString()} HTG
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : StickyCheckoutBar — barre de réservation fixe
// ─────────────────────────────────────────────────────────────────────────────
function StickyCheckoutBar({
  selectedSeats,
  total,
  onClear,
  onContinue,
}: {
  selectedSeats: { label: string; price: number }[];
  total: number;
  onClear: () => void;
  onContinue: () => void;
}) {
  const count    = selectedSeats.length;
  const disabled = count === 0;
  const labels   = selectedSeats.map((s) => s.label).join(', ');

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      {/* Dégradé masque */}
      <div className="h-8 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />

      <div className="bg-gray-950/98 backdrop-blur-xl border-t border-white/8 shadow-2xl">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Ligne sièges sélectionnés */}
          {!disabled && (
            <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-hide">
              <i className="ri-seat-line text-indigo-400 text-xs flex-shrink-0" />
              <span className="text-xs text-gray-400 flex-shrink-0">
                {count} siège{count > 1 ? 's' : ''} :
              </span>
              <span className="text-xs text-white font-medium truncate">{labels}</span>
            </div>
          )}

          {/* Ligne principale */}
          <div className="flex items-center gap-3">
            {/* Total */}
            <div className="flex-1 min-w-0">
              {disabled ? (
                <p className="text-sm text-gray-500">Aucun siège sélectionné</p>
              ) : (
                <div>
                  <p className="text-amber-400 font-bold text-xl leading-none">
                    {total.toLocaleString()} HTG
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5">total</p>
                </div>
              )}
            </div>

            {/* Bouton vider */}
            {!disabled && (
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 text-xs font-medium transition-colors"
              >
                <i className="ri-delete-bin-line" />
                Vider
              </button>
            )}

            {/* Bouton Continuer */}
            <button
              onClick={onContinue}
              disabled={disabled}
              className={[
                'flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm',
                'transition-all duration-200 active:scale-95 whitespace-nowrap',
                disabled
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25',
              ].join(' ')}
            >
              {disabled ? (
                <>Choisissez vos sièges</>
              ) : (
                <>
                  Continuer
                  <span className="bg-black/20 text-black rounded-full px-2 py-0.5 text-xs font-bold">
                    {count}
                  </span>
                  <i className="ri-arrow-right-line" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : SeatMap — plan de salle avec perspective
// ─────────────────────────────────────────────────────────────────────────────
function SeatMap({
  seats,
  rows,
  selected,
  onToggle,
  zoomLevel,
}: {
  seats: Seat[];
  rows: string[];
  selected: Set<string>;
  onToggle: (seat: Seat) => void;
  zoomLevel: number;
}) {
  // Index de rangée pour l'effet perspective (A=0 = proche écran, dernière=1)
  const totalRows = rows.length;

  // Aisle position : milieu de la rangée la plus longue
  const maxSeatsPerRow = useMemo(() =>
    rows.reduce((max, row) => {
      const c = seats.filter((s) => s.row_letter === row).length;
      return Math.max(max, c);
    }, 0),
  [rows, seats]);

  const aisleAfter = Math.ceil(maxSeatsPerRow / 2);

  return (
    <div
      className="transition-transform duration-200 origin-top"
      style={{ transform: `scale(${zoomLevel})` }}
    >
      <div className="inline-flex flex-col items-center gap-0">
        {rows.map((row, rowIdx) => {
          const rowSeats = seats.filter((s) => s.row_letter === row);

          // Perspective : rangée A (proches de l'écran) = plus petite
          const t         = rowIdx / Math.max(totalRows - 1, 1);
          const rowScale  = 0.74 + t * 0.26;         // 0.74 → 1.0
          const rowGap    = Math.round(2 + t * 3);   // 2px → 5px
          const rowOpacity= 0.65 + t * 0.35;         // légèrement atténué au premier rang

          return (
            <div
              key={row}
              className="flex items-center"
              style={{
                gap: `${rowGap}px`,
                transform: `scaleX(${rowScale})`,
                opacity: rowOpacity,
                marginBottom: `${Math.round(2 + t * 2)}px`,
              }}
            >
              {/* Label rangée gauche */}
              <div
                className="w-6 text-center text-[10px] font-bold text-gray-500 select-none flex-shrink-0"
                style={{ transform: `scaleX(${1 / rowScale})` }}   // contre-scale pour rester lisible
              >
                {row}
              </div>

              {/* Sièges */}
              {rowSeats.map((seat, idx) => {
                const zoneColor = resolveZone(seat.zone_name);
                return (
                  <div key={seat.id} className="flex items-center" style={{ gap: `${rowGap}px` }}>
                    {/* Allée latérale gauche */}
                    {idx === 0 && <div className="w-3 flex-shrink-0" />}

                    <CinemaSeat
                      seat={seat}
                      isSelected={selected.has(seat.id)}
                      zone={zoneColor}
                      onToggle={onToggle}
                    />

                    {/* Allée centrale */}
                    {seat.seat_number === aisleAfter && (
                      <div
                        className="w-6 flex-shrink-0 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <div className="w-px h-4 bg-gray-700/50 rounded" />
                      </div>
                    )}

                    {/* Allée latérale droite */}
                    {idx === rowSeats.length - 1 && <div className="w-3 flex-shrink-0" />}
                  </div>
                );
              })}

              {/* Label rangée droite */}
              <div
                className="w-6 text-center text-[10px] font-bold text-gray-500 select-none flex-shrink-0"
                style={{ transform: `scaleX(${1 / rowScale})` }}
              >
                {row}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function SeatSelectionPage() {
  const navigate   = useNavigate();
  const { showtimeId } = useParams<{ showtimeId: string }>();

  const [showtime, setShowtime] = useState<ShowtimeInfo | null>(null);
  const [seats,    setSeats]    = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [rows,     setRows]     = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ── Pinch-to-zoom ──────────────────────────────────────────────────────────
  const lastPinchDist = useRef<number | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    }
  };
  const handleTouchMove = (e: ReactTouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist / lastPinchDist.current;
      setZoomLevel((z) => Math.min(2.2, Math.max(0.55, z * delta)));
      lastPinchDist.current = dist;
    }
  };
  const handleTouchEnd = () => { lastPinchDist.current = null; };

  // ── Chargement Supabase ───────────────────────────────────────────────────
  const loadSeats = useCallback(async () => {
    if (!showtimeId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: stData, error: stErr } = await supabase
        .from('showtimes')
        .select(`
          id, show_date, show_time, base_price_htg, available_seats, room_id,
          movie:movies(title, poster_url, duration_minutes, rating),
          room:rooms(name, rows, seats_per_row)
        `)
        .eq('id', showtimeId)
        .single();

      if (stErr || !stData) throw new Error('Séance introuvable');
      setShowtime(stData as unknown as ShowtimeInfo);

      const roomId = (stData as any).room_id;

      const { data: seatsData, error: seatsErr } = await supabase
        .from('seats')
        .select('id, row_letter, seat_number, status, zone:seat_zones(name, price_htg)')
        .eq('room_id', roomId || '')
        .order('row_letter',  { ascending: true })
        .order('seat_number', { ascending: true });

      if (seatsErr) throw seatsErr;

      // Sièges pris
      const { data: takenData } = await supabase
        .from('reservation_seats')
        .select('seat_id')
        .eq('showtime_id', showtimeId);

      const takenIds = new Set((takenData ?? []).map((t: any) => t.seat_id));

      // Sièges verrouillés
      const { data: lockedData } = await supabase
        .from('seat_locks')
        .select('seat_id')
        .eq('showtime_id', showtimeId)
        .gt('expires_at', new Date().toISOString());

      const lockedIds = new Set((lockedData ?? []).map((l: any) => l.seat_id));

      const mapped: Seat[] = (seatsData ?? []).map((s: any) => {
        let status: SeatStatus = 'AVAILABLE';
        if (s.status !== 'AVAILABLE') status = 'TAKEN';
        if (takenIds.has(s.id))       status = 'TAKEN';
        if (lockedIds.has(s.id))      status = 'LOCKED';

        const zoneName = s.zone?.name ?? '';
        return {
          id:            s.id,
          row_letter:    s.row_letter,
          seat_number:   s.seat_number,
          status,
          zone_name:     zoneName || undefined,
          // Source unique : showtimes.base_price_htg — les zones ne remplacent pas le prix
          price_htg:     stData.base_price_htg,
          is_accessible: /pmr|accessible|handicap/i.test(zoneName),
        };
      });

      setSeats(mapped);
      setRows([...new Set(mapped.map((s) => s.row_letter))].sort());
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  useEffect(() => {
    loadSeats();
    const iv = setInterval(() => loadSeats(), 15_000);
    return () => clearInterval(iv);
  }, [loadSeats]);

  // Nettoyage verrous à la sortie
  useEffect(() => () => {
    supabase.from('seat_locks').delete().eq('session_id', SESSION_KEY).then(() => {});
  }, []);

  if (!showtimeId) return <Navigate to="/seances" replace />;

  // ── Toggle siège ──────────────────────────────────────────────────────────
  const toggleSeat = async (seat: Seat) => {
    if (seat.status === 'TAKEN' || seat.status === 'LOCKED') return;

    const isNowSelected = selected.has(seat.id);

    if (isNowSelected) {
      setSelected((p) => { const s = new Set(p); s.delete(seat.id); return s; });
      await supabase.from('seat_locks').delete()
        .eq('seat_id',    seat.id)
        .eq('showtime_id', showtimeId)
        .eq('session_id',  SESSION_KEY);
    } else {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { error: le } = await supabase.from('seat_locks').upsert(
        { seat_id: seat.id, showtime_id: showtimeId, session_id: SESSION_KEY, expires_at: expiresAt },
        { onConflict: 'seat_id,showtime_id' }
      );
      if (le) {
        alert('Ce siège vient d\'être pris. Veuillez en choisir un autre.');
        await loadSeats();
        return;
      }
      setSelected((p) => new Set([...p, seat.id]));
    }
  };

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const selectedList = Array.from(selected);

  const selectedSeatsInfo = selectedList
    .map((id) => seats.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => ({
      id:    s!.id,
      label: `${s!.row_letter}-${s!.seat_number}`,
      price: Number(s!.price_htg ?? showtime?.base_price_htg ?? 0),
    }));

  const total = selectedSeatsInfo.reduce((sum, s) => sum + s.price, 0);

  // Zones présentes (pour légende)
  const zonesPresent = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of seats) {
      const name = s.zone_name ?? 'Standard';
      if (!map.has(name)) map.set(name, s.price_htg ?? showtime?.base_price_htg ?? 0);
    }
    return [...map.entries()].map(([name, price]) => ({ name, price }));
  }, [seats, showtime]);

  // ── Vider la sélection ────────────────────────────────────────────────────
  const handleClear = async () => {
    for (const id of selectedList) {
      await supabase.from('seat_locks').delete()
        .eq('seat_id', id)
        .eq('session_id', SESSION_KEY);
    }
    setSelected(new Set());
  };

  // ── Continuer ─────────────────────────────────────────────────────────────
  const handleContinue = () => {
    const labels = selectedSeatsInfo.map((s) => s.label).join(',');
    navigate(`/reservation/checkout?showtimeId=${showtimeId}&seats=${encodeURIComponent(labels)}`);
  };

  // ── Zoom controls ─────────────────────────────────────────────────────────
  const zoomIn  = () => setZoomLevel((z) => Math.min(2.2,  z + 0.15));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.55, z - 0.15));
  const zoomReset = () => setZoomLevel(1);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header compact ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/6 shadow-xl shadow-black/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/seances"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/6 hover:bg-white/12 text-white transition-colors flex-shrink-0"
            aria-label="Retour aux séances"
          >
            <i className="ri-arrow-left-line text-lg" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Sélection des sièges</p>
            <h1 className="font-bold text-white text-sm truncate leading-tight">
              {(showtime?.movie as any)?.title ?? '…'}
            </h1>
          </div>
          {/* Compteur sièges */}
          <div className={[
            'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
            selectedList.length > 0
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-gray-500 border border-white/10',
          ].join(' ')}>
            {selectedList.length > 0 ? `${selectedList.length} siège${selectedList.length > 1 ? 's' : ''}` : 'Aucun siège'}
          </div>
        </div>
      </header>

      {/* ── Contenu ────────────────────────────────────────────────────────── */}
      <main className="flex-1 pb-36">
        <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">

          {/* Carte film */}
          {showtime && <MovieSummaryCard showtime={showtime} />}

          {/* Plan de salle */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-1 border border-indigo-400/30 rounded-full animate-ping" />
              </div>
              <p className="text-gray-400 text-sm">Chargement du plan de salle…</p>
            </div>

          ) : error ? (
            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-8 text-center">
              <i className="ri-error-warning-line text-4xl text-red-400 mb-3 block" />
              <p className="text-red-300 font-semibold mb-1">{error}</p>
              <p className="text-red-400/70 text-sm mb-5">Vérifiez votre connexion ou réessayez.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => loadSeats()}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm rounded-xl transition-colors"
                >
                  <i className="ri-refresh-line mr-2" />Réessayer
                </button>
                <Link
                  to="/seances"
                  className="px-4 py-2 bg-white/8 hover:bg-white/15 text-white text-sm rounded-xl transition-colors"
                >
                  Retour aux séances
                </Link>
              </div>
            </div>

          ) : seats.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-700/50 rounded-2xl">
              <i className="ri-seat-line text-5xl text-gray-600 mb-4 block" />
              <p className="text-gray-300 font-semibold text-lg">Aucun siège configuré</p>
              <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                Les sièges de cette salle n'ont pas encore été créés dans la table{' '}
                <code className="text-amber-400">seats</code>.
              </p>
              <Link
                to="/seances"
                className="inline-block mt-6 px-5 py-2.5 bg-white/8 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Retour aux séances
              </Link>
            </div>

          ) : (
            /* ── Carte du plan de salle ──────────────────────────────────── */
            <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/40 border border-white/8 rounded-3xl overflow-hidden shadow-2xl">

              {/* ── Barre de zoom ──────────────────────────────────────── */}
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                  Plan de salle
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={zoomOut}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/6 hover:bg-white/12 text-gray-300 text-xs transition-colors"
                    aria-label="Zoom arrière"
                  >
                    <i className="ri-zoom-out-line" />
                  </button>
                  <button
                    onClick={zoomReset}
                    className="px-2 h-7 flex items-center justify-center rounded-lg bg-white/6 hover:bg-white/12 text-gray-300 text-[10px] font-mono transition-colors"
                    aria-label="Réinitialiser le zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={zoomIn}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/6 hover:bg-white/12 text-gray-300 text-xs transition-colors"
                    aria-label="Zoom avant"
                  >
                    <i className="ri-zoom-in-line" />
                  </button>
                </div>
              </div>

              {/* ── Zone de la grille (scrollable + pinch) ──────────────── */}
              <div
                ref={mapWrapperRef}
                className="overflow-auto py-6 px-2"
                style={{
                  touchAction: 'pan-x pan-y pinch-zoom',
                  cursor: zoomLevel > 1 ? 'grab' : 'default',
                  maxHeight: '65vh',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Ambient light au plafond */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-32"
                  style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(99,102,241,.08) 0%, transparent 70%)' }}
                />

                {/* Écran */}
                <ScreenDisplay />

                {/* Grille avec perspective */}
                <div className="flex justify-center overflow-x-auto pb-2">
                  <SeatMap
                    seats={seats}
                    rows={rows}
                    selected={selected}
                    onToggle={toggleSeat}
                    zoomLevel={1}   // zoom géré par le container
                  />
                </div>

                {/* Bas de salle */}
                <p className="text-center text-[9px] tracking-[.3em] text-gray-700 uppercase mt-5">
                  Entrée de la salle
                </p>
              </div>

              {/* ── Légende ──────────────────────────────────────────────── */}
              <div className="px-5 pb-5 pt-3 border-t border-white/6">
                <SeatLegend zones={zonesPresent} />
              </div>

              {/* ── Tip mobile ───────────────────────────────────────────── */}
              <div className="flex items-center justify-center gap-1.5 pb-4 opacity-40">
                <i className="ri-zoom-in-line text-[10px] text-gray-500" />
                <p className="text-[9px] text-gray-500">Pincez pour zoomer · Glissez pour parcourir</p>
              </div>
            </div>
          )}

          {/* Refresh info */}
          {!loading && !error && seats.length > 0 && (
            <p className="text-center text-[10px] text-gray-700">
              <i className="ri-refresh-line mr-1" />
              Plan actualisé automatiquement toutes les 15 s
            </p>
          )}
        </div>
      </main>

      {/* ── Barre de checkout fixe ───────────────────────────────────────── */}
      {!loading && !error && seats.length > 0 && (
        <StickyCheckoutBar
          selectedSeats={selectedSeatsInfo}
          total={total}
          onClear={handleClear}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
