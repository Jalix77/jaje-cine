'use client'

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../../../lib/supabaseClient'
import { ClientLayout } from '../../../components/feature/ClientLayout'

type TicketStatus = 'TO_PAY' | 'PENDING' | 'CONFIRMED' | 'USED' | 'EXPIRED' | 'CANCELLED'

type TicketView = {
  id: string
  reservationId: string
  confirmationCode: string
  movieTitle: string
  moviePoster?: string | null
  showDate: string
  showTime: string
  roomName?: string | null
  seats: string[]
  totalPrice: number
  status: TicketStatus
  paymentStatus?: string
  paymentMethod?: string
  bookingDate?: string
}

function mapStatus(resStatus?: string | null, payStatus?: string | null): TicketStatus {
  const s = (resStatus || '').toUpperCase()
  const p = (payStatus || '').toUpperCase()
  if (s.includes('CANCEL')) return 'CANCELLED'
  if (s.includes('USED') || s.includes('SCANNED')) return 'USED'
  if (s.includes('EXPIRE')) return 'EXPIRED'
  if (s.includes('CONFIRM') || p === 'PAYE') return 'CONFIRMED'
  if (p === 'CASH_A_LARRIVEE') return 'TO_PAY'
  return 'PENDING'
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string; border: string; icon: string }> = {
  CONFIRMED:  { label: 'Confirmé',          bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30',  icon: 'ri-checkbox-circle-fill' },
  TO_PAY:     { label: "Cash à l'arrivée",  bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30',   icon: 'ri-money-dollar-circle-fill' },
  PENDING:    { label: 'En attente',         bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: 'ri-time-fill' },
  USED:       { label: 'Utilisé',            bg: 'bg-gray-500/15',   text: 'text-gray-400',   border: 'border-gray-500/30',   icon: 'ri-check-double-fill' },
  EXPIRED:    { label: 'Expiré',             bg: 'bg-gray-500/15',   text: 'text-gray-400',   border: 'border-gray-500/30',   icon: 'ri-time-line' },
  CANCELLED:  { label: 'Annulé',             bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30',    icon: 'ri-close-circle-fill' },
}

const PAYMENT_CONFIG: Record<string, { label: string; cls: string }> = {
  PAYE:            { label: 'Payé',              cls: 'text-green-400 bg-green-500/10 border-green-500/25' },
  PAID:            { label: 'Payé',              cls: 'text-green-400 bg-green-500/10 border-green-500/25' },
  CASH_A_LARRIVEE: { label: "Cash à l'arrivée",  cls: 'text-blue-400  bg-blue-500/10  border-blue-500/25' },
  PENDING:         { label: 'En attente',         cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
  CANCELLED:       { label: 'Annulé',             cls: 'text-red-400  bg-red-500/10   border-red-500/25' },
  REJECTED:        { label: 'Rejeté',             cls: 'text-red-400  bg-red-500/10   border-red-500/25' },
  REFUNDED:        { label: 'Remboursé',          cls: 'text-purple-400 bg-purple-500/10 border-purple-500/25' },
}

function paymentCfg(s?: string) {
  const key = (s || '').toUpperCase()
  return PAYMENT_CONFIG[key] || { label: s || 'Non renseigné', cls: 'text-gray-400 bg-gray-500/10 border-gray-500/25' }
}

type FilterTab = 'all' | 'active' | 'used' | 'cancelled'

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'active',    label: 'Actifs' },
  { key: 'used',      label: 'Utilisés' },
  { key: 'cancelled', label: 'Annulés' },
]

function matchFilter(t: TicketView, f: FilterTab) {
  if (f === 'all') return true
  if (f === 'active') return t.status === 'CONFIRMED' || t.status === 'PENDING' || t.status === 'TO_PAY'
  if (f === 'used') return t.status === 'USED' || t.status === 'EXPIRED'
  if (f === 'cancelled') return t.status === 'CANCELLED'
  return true
}

export default function TicketsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<TicketView[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData.user) {
        if (mounted) { setTickets([]); setLoading(false) }
        return
      }

      const { data: reservations, error: rErr } = await supabase
        .from('reservations')
        .select(`
          id, confirmation_code, total_price_htg, status, payment_status, payment_method, created_at,
          showtimes:showtime_id (
            show_date, show_time,
            rooms:room_id (name),
            movies:movie_id (title, poster_url)
          )
        `)
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })

      if (rErr) {
        if (mounted) { setError(rErr.message); setLoading(false) }
        return
      }

      const reservationIds = (reservations || []).map((x: any) => x.id)
      let seatsByReservation: Record<string, string[]> = {}

      if (reservationIds.length > 0) {
        const { data: resSeats } = await supabase
          .from('reservation_seats')
          .select('reservation_id, seats:seat_id(row_letter, seat_number)')
          .in('reservation_id', reservationIds)

        seatsByReservation = (resSeats || []).reduce((acc: any, row: any) => {
          const rid = row.reservation_id
          const s = row?.seats
          if (!acc[rid]) acc[rid] = []
          if (s) acc[rid].push(`${s.row_letter}${s.seat_number}`)
          return acc
        }, {})
      }

      const mapped: TicketView[] = (reservations || []).map((r: any) => {
        const st = r.showtimes
        const mv = st?.movies
        const rm = st?.rooms
        return {
          id: r.confirmation_code || r.id,
          reservationId: r.id,
          confirmationCode: r.confirmation_code,
          movieTitle: mv?.title || 'Film',
          moviePoster: mv?.poster_url || null,
          showDate: st?.show_date,
          showTime: st?.show_time?.slice?.(0, 5) || st?.show_time,
          roomName: rm?.name || null,
          seats: seatsByReservation[r.id] || [],
          totalPrice: Number(r.total_price_htg || 0),
          status: mapStatus(r.status, r.payment_status),
          paymentStatus: r.payment_status,
          paymentMethod: r.payment_method,
          bookingDate: r.created_at,
        }
      })

      if (mounted) { setTickets(mapped); setLoading(false) }
    }

    load()
    return () => { mounted = false }
  }, [])

  const filtered = tickets.filter((t) => matchFilter(t, filter))

  return (
    <ClientLayout title="Mes Tickets" showBack>
      <div className="max-w-lg mx-auto px-4 py-5">

        {/* Header stats */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-gray-400 text-sm">
              {loading ? '...' : `${tickets.length} réservation${tickets.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/seances"
            className="flex items-center gap-1.5 px-4 py-2 bg-gold text-black font-semibold rounded-full text-sm hover:bg-yellow-400 transition"
          >
            <i className="ri-add-line"></i> Nouvelle
          </Link>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const count = tickets.filter((t) => matchFilter(t, f.key)).length
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition border ${
                  filter === f.key
                    ? 'bg-gold text-black border-gold'
                    : 'text-gray-400 border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-black/20' : 'bg-white/8'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* États */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <i className="ri-loader-4-line text-5xl text-gold animate-spin block mb-4"></i>
            Chargement de vos tickets...
          </div>
        ) : error ? (
          <div className="bg-red-500/8 border border-red-500/25 rounded-2xl p-6 text-center">
            <i className="ri-error-warning-line text-red-400 text-3xl block mb-2"></i>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <i className="ri-ticket-2-line text-6xl text-gray-700 mb-4 block"></i>
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'all' ? 'Aucun ticket pour le moment' : `Aucun ticket ${FILTERS.find(f => f.key === filter)?.label.toLowerCase()}`}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              {filter === 'all' ? 'Réservez votre première séance JAJE Ciné !' : 'Changez de filtre ou réservez une séance.'}
            </p>
            <Link
              to="/seances"
              className="inline-flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-400 transition"
            >
              <i className="ri-calendar-line"></i> Voir les séances
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((t) => {
              const cfg = STATUS_CONFIG[t.status]
              const pcfg = paymentCfg(t.paymentStatus)
              const isExpanded = expandedId === t.reservationId
              const showDateFormatted = t.showDate
                ? new Date(t.showDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : '—'
              const bookingDateFormatted = t.bookingDate
                ? new Date(t.bookingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                : null

              const isPast = t.showDate ? new Date(t.showDate) < new Date() : false

              return (
                <div
                  key={t.reservationId}
                  className={`rounded-2xl overflow-hidden border transition ${
                    isPast && t.status !== 'CANCELLED'
                      ? 'border-white/6 bg-white/3'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Bande couleur statut */}
                  <div className={`h-1 w-full ${cfg.bg.replace('/15', '').replace('/20', '')}`} style={{
                    background: t.status === 'CONFIRMED' ? 'linear-gradient(90deg, #22c55e, #16a34a)' :
                      t.status === 'TO_PAY' ? 'linear-gradient(90deg, #3b82f6, #2563eb)' :
                      t.status === 'PENDING' ? 'linear-gradient(90deg, #eab308, #ca8a04)' :
                      t.status === 'CANCELLED' ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
                      'linear-gradient(90deg, #6b7280, #4b5563)'
                  }} />

                  {/* Ligne principale */}
                  <div className="p-4 flex items-center gap-4">
                    {/* Poster */}
                    <div className="relative flex-shrink-0">
                      {t.moviePoster ? (
                        <img src={t.moviePoster} alt={t.movieTitle} className="w-14 h-20 object-cover rounded-xl" />
                      ) : (
                        <div className="w-14 h-20 bg-gray-800 rounded-xl flex items-center justify-center">
                          <i className="ri-film-line text-gray-600 text-xl"></i>
                        </div>
                      )}
                      {isPast && t.status === 'USED' && (
                        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                          <i className="ri-check-double-fill text-green-400 text-xl"></i>
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-white font-bold text-base leading-tight">{t.movieTitle}</h3>
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <i className={cfg.icon}></i> {cfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <i className="ri-calendar-line text-gold"></i>{showDateFormatted}
                        </span>
                        {t.showTime && (
                          <span className="flex items-center gap-1">
                            <i className="ri-time-line text-gold"></i>{t.showTime}
                          </span>
                        )}
                        {t.roomName && (
                          <span className="flex items-center gap-1">
                            <i className="ri-building-line text-gold"></i>{t.roomName}
                          </span>
                        )}
                        {t.seats.length > 0 && (
                          <span className="flex items-center gap-1">
                            <i className="ri-seat-line text-gold"></i>{t.seats.join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-gold font-bold text-sm">{t.totalPrice.toLocaleString()} HTG</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${pcfg.cls}`}>{pcfg.label}</span>
                      </div>

                      {bookingDateFormatted && (
                        <p className="text-gray-600 text-xs">Réservé le {bookingDateFormatted}</p>
                      )}
                    </div>
                  </div>

                  {/* Code */}
                  <div className="px-4 pb-1">
                    <p className="font-mono text-gray-600 text-xs">{t.confirmationCode}</p>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 pt-2 flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/ticket/${t.reservationId}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gold text-black text-sm font-semibold rounded-full hover:bg-yellow-400 transition"
                    >
                      <i className="ri-ticket-2-line"></i> Voir le ticket
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : t.reservationId)}
                      className="flex items-center gap-1.5 px-4 py-2.5 border border-white/12 text-white text-sm rounded-full hover:bg-white/8 transition"
                    >
                      <i className={isExpanded ? 'ri-eye-off-line' : 'ri-qr-code-line'}></i>
                      {isExpanded ? 'Masquer' : 'QR'}
                    </button>
                  </div>

                  {/* QR Code expandable */}
                  {isExpanded && (
                    <div className="mx-4 mb-4 bg-white rounded-2xl p-5 flex flex-col items-center gap-3">
                      <QRCodeCanvas value={t.confirmationCode} size={150} level="H" includeMargin={false} />
                      <div className="text-center">
                        <p className="font-mono font-bold text-gray-900 text-sm">{t.confirmationCode}</p>
                        <p className="text-gray-500 text-xs mt-1">Présentez ce code à l'entrée</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
