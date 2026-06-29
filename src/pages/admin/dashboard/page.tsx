import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import AdminLayout from '../../../components/feature/AdminLayout'
import { supabase } from '../../../lib/supabaseClient'

// ── Palette ────────────────────────────────────────────────────────────────
const GOLD   = '#D4AF37'
const GOLD2  = '#B8962E'
const GREEN  = '#16a34a'
const RED    = '#ef4444'
const PURPLE = '#a855f7'
const BLUE   = '#3b82f6'
const ORANGE = '#f97316'
const PIE_COLORS = [GOLD, GREEN, BLUE, PURPLE, ORANGE, RED, '#06b6d4']

// ── Types ──────────────────────────────────────────────────────────────────
type Period = 'today' | 'week' | 'month' | 'year'

const ZERO_KPI = {
  total: 0, paid: 0, pending: 0, used: 0,
  cancelled: 0, denied: 0, revenue: 0,
  occupancyRate: 0, totalSeats: 0, bookedSeats: 0,
}
type KPI = typeof ZERO_KPI

interface DayPoint  { label: string; reservations: number; revenue: number }
interface FilmPoint { title: string; reservations: number; revenue: number }
interface RoomPoint { room: string;  booked: number; capacity: number; rate: number }
interface ShowtimeRow {
  showtime_id: string; movie: string; date: string
  room: string; booked: number; capacity: number; revenue: number
}
interface ReservationRow {
  id: string; code: string; guest: string; movie: string
  seats: number; price: number
  status: string | null; pay_status: string | null
}
interface ScanRow {
  id: string; code: string; movie: string; guest: string
  scanned_at: string; result: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function periodStart(p: Period): string {
  const now = new Date()
  if (p === 'today') { now.setHours(0,0,0,0); return now.toISOString() }
  if (p === 'week')  { const d = now.getDay()||7; now.setDate(now.getDate()-d+1); now.setHours(0,0,0,0); return now.toISOString() }
  if (p === 'month') { return new Date(now.getFullYear(), now.getMonth(), 1).toISOString() }
  return new Date(now.getFullYear(), 0, 1).toISOString()
}

function safeFmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}
function safeFmtDateFull(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })
}
function safeFmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function fmtHTG(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  return `${(isNaN(v) ? 0 : v).toLocaleString('fr-FR')} HTG`
}
function safeNum(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

// ── Tooltip recharts ───────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1a1a1a', border:'1px solid #333', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ color:GOLD, fontWeight:700, marginBottom:4 }}>{label}</p>
      {(payload ?? []).map((p: any) => (
        <p key={p?.name} style={{ color:p?.color, margin:'2px 0' }}>
          {p?.name === 'revenue'
            ? `${p?.name}: ${safeNum(p?.value).toLocaleString('fr-FR')} HTG`
            : `${p?.name}: ${p?.value ?? 0}`}
        </p>
      ))}
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [period, setPeriod]   = useState<Period>('month')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [kpi, setKpi]         = useState<KPI>(ZERO_KPI)
  const [salesDay,  setSalesDay]   = useState<DayPoint[]>([])
  const [salesFilm, setSalesFilm]  = useState<FilmPoint[]>([])
  const [rooms,     setRooms]      = useState<RoomPoint[]>([])
  const [showtimes, setShowtimes]  = useState<ShowtimeRow[]>([])
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [scans, setScans]          = useState<ScanRow[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setLoadError(null)

      try {
        const start = periodStart(period)

        // ── 1. KPIs (requêtes individuelles pour éviter un seul .all qui crashe) ─
        const countQ = async (filter: (q: any) => any): Promise<number> => {
          try {
            const { count, error } = await filter(
              supabase.from('reservations').select('*', { count: 'exact', head: true }).gte('created_at', start)
            )
            if (error) return 0
            return count ?? 0
          } catch { return 0 }
        }

        const [total, paid, pending, used, cancelled, denied] = await Promise.all([
          countQ((q: any) => q),
          countQ((q: any) => q.eq('payment_status', 'PAYE')),
          countQ((q: any) => q.eq('payment_status', 'EN_ATTENTE_VALIDATION')),
          countQ((q: any) => q.or('entry_status.eq.used,status.eq.USED')),
          countQ((q: any) => q.or('reservation_status.eq.cancelled,status.eq.CANCELLED')),
          countQ((q: any) => q.eq('entry_status', 'denied')),
        ])

        // Revenue
        let revenue = 0
        try {
          const { data: revData } = await supabase
            .from('reservations')
            .select('total_price_htg')
            .gte('created_at', start)
            .eq('payment_status', 'PAYE')
          revenue = (revData ?? []).reduce((s, r: any) => s + safeNum(r?.total_price_htg), 0)
        } catch { /* revenue reste 0 */ }

        // Capacité salles
        let totalCap = 0
        try {
          const { data: capData } = await supabase.from('rooms').select('capacity')
          totalCap = (capData ?? []).reduce((s, r: any) => s + safeNum(r?.capacity), 0)
        } catch { /* reste 0 */ }

        // Sièges réservés
        let bookedCount = 0
        try {
          const { data: seatsData } = await supabase
            .from('reservation_seats')
            .select('id')
            .gte('created_at', start)
          bookedCount = (seatsData ?? []).length
        } catch { /* reste 0 */ }

        const occRate = totalCap > 0 ? Math.round((bookedCount / totalCap) * 100) : 0

        setKpi({ total, paid, pending, used, cancelled, denied, revenue, occupancyRate: occRate, totalSeats: totalCap, bookedSeats: bookedCount })

        // ── 2. Réservations récentes ───────────────────────────────────────
        try {
          const { data: resRecent } = await supabase
            .from('reservations')
            .select(`
              id, confirmation_code, guest_name, status, payment_status,
              total_seats, total_price_htg,
              showtimes:showtime_id (
                show_date,
                movies:movie_id(title),
                rooms:room_id(name)
              )
            `)
            .gte('created_at', start)
            .order('created_at', { ascending: false })
            .limit(10)

          setReservations((resRecent ?? []).map((r: any) => ({
            id:         r?.id ?? '',
            code:       r?.confirmation_code ?? '—',
            guest:      r?.guest_name ?? '—',
            movie:      r?.showtimes?.movies?.title ?? '—',
            seats:      safeNum(r?.total_seats),
            price:      safeNum(r?.total_price_htg),
            status:     r?.status ?? null,
            pay_status: r?.payment_status ?? null,
          })))
        } catch { setReservations([]) }

        // ── 3. Données graphiques ──────────────────────────────────────────
        let allRes: any[] = []
        try {
          const { data } = await supabase
            .from('reservations')
            .select(`
              created_at, total_price_htg, payment_status, status,
              showtimes:showtime_id (
                movies:movie_id(title),
                rooms:room_id(name, capacity),
                show_date
              )
            `)
            .gte('created_at', start)
            .order('created_at', { ascending: true })
          allRes = data ?? []
        } catch { allRes = [] }

        // Ventes par jour
        const dayMap: Record<string, DayPoint> = {}
        for (const r of allRes) {
          const d = (r?.created_at ?? '').slice(0, 10)
          if (!d) continue
          if (!dayMap[d]) dayMap[d] = { label: safeFmtDate(d + 'T00:00:00'), reservations: 0, revenue: 0 }
          dayMap[d].reservations++
          if (r?.payment_status === 'PAYE') dayMap[d].revenue += safeNum(r?.total_price_htg)
        }
        setSalesDay(Object.values(dayMap))

        // Ventes par film
        const filmMap: Record<string, FilmPoint> = {}
        for (const r of allRes) {
          const title = r?.showtimes?.movies?.title ?? 'Inconnu'
          if (!filmMap[title]) filmMap[title] = { title, reservations: 0, revenue: 0 }
          filmMap[title].reservations++
          if (r?.payment_status === 'PAYE') filmMap[title].revenue += safeNum(r?.total_price_htg)
        }
        setSalesFilm(
          Object.values(filmMap)
            .sort((a, b) => b.reservations - a.reservations)
            .slice(0, 8)
            .map(f => ({ ...f, title: f.title.length > 18 ? f.title.slice(0, 16) + '…' : f.title }))
        )

        // Occupation salles
        const roomMap: Record<string, { booked: number; capacity: number }> = {}
        for (const r of allRes) {
          const name = r?.showtimes?.rooms?.name ?? 'Salle'
          const cap  = safeNum(r?.showtimes?.rooms?.capacity)
          if (!roomMap[name]) roomMap[name] = { booked: 0, capacity: cap }
          roomMap[name].booked++
        }
        setRooms(
          Object.entries(roomMap).map(([room, { booked, capacity }]) => ({
            room, booked, capacity,
            rate: capacity > 0 ? Math.round((booked / capacity) * 100) : 0,
          }))
        )

        // Meilleures séances
        const showMap: Record<string, ShowtimeRow> = {}
        for (const r of allRes) {
          const sid = (r as any)?.showtime_id ?? 'unknown'
          if (!showMap[sid]) showMap[sid] = {
            showtime_id: sid,
            movie:    r?.showtimes?.movies?.title ?? '—',
            date:     r?.showtimes?.show_date ?? '',
            room:     r?.showtimes?.rooms?.name ?? '—',
            booked:   0,
            capacity: safeNum(r?.showtimes?.rooms?.capacity),
            revenue:  0,
          }
          showMap[sid].booked++
          if (r?.payment_status === 'PAYE') showMap[sid].revenue += safeNum(r?.total_price_htg)
        }
        setShowtimes(
          Object.values(showMap)
            .sort((a, b) => b.booked - a.booked)
            .slice(0, 5)
        )

        // ── 4. Derniers scans ──────────────────────────────────────────────
        try {
          const { data: scanData } = await supabase
            .from('ticket_scans')
            .select(`
              id, scan_result, scanned_at,
              reservations:reservation_id (
                confirmation_code, guest_name,
                showtimes:showtime_id (movies:movie_id(title))
              )
            `)
            .order('scanned_at', { ascending: false })
            .limit(10)

          setScans((scanData ?? []).map((s: any) => ({
            id:         s?.id ?? '',
            code:       s?.reservations?.confirmation_code ?? '—',
            movie:      s?.reservations?.showtimes?.movies?.title ?? '—',
            guest:      s?.reservations?.guest_name ?? '—',
            scanned_at: s?.scanned_at ?? '',
            result:     s?.scan_result ?? '',
          })))
        } catch { setScans([]) }

      } catch (err: any) {
        console.error('Dashboard load error:', err)
        setLoadError(err?.message ?? 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [period])

  return (
    <AdminLayout>
      <div style={{ padding:'28px 32px', minHeight:'100vh', background:'#080c0a' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', margin:0, letterSpacing:'-0.02em' }}>
              Tableau de bord
            </h1>
            <p style={{ color:'#6b7280', margin:'4px 0 0', fontSize:14 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <div style={{ display:'flex', gap:4, background:'#111', borderRadius:12, padding:4, border:'1px solid #1f2937' }}>
            {(['today','week','month','year'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding:'8px 16px', borderRadius:8, border:'none',
                background: period===p ? 'linear-gradient(135deg,#D4AF37,#B8962E)' : 'transparent',
                color: period===p ? '#111' : '#6b7280',
                fontWeight: period===p ? 700 : 500,
                fontSize:13, cursor:'pointer', transition:'all 0.2s',
              }}>
                {{ today:"Aujourd'hui", week:'Semaine', month:'Mois', year:'Année' }[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Erreur globale */}
        {loadError && !loading && (
          <div style={{ background:'#1a0808', border:'1px solid #ef444440', borderRadius:12, padding:'16px 20px', marginBottom:24, color:'#fca5a5', display:'flex', alignItems:'center', gap:12 }}>
            <i className="ri-error-warning-line" style={{ fontSize:20, flexShrink:0 }}></i>
            <div>
              <p style={{ fontWeight:700, margin:'0 0 4px' }}>Erreur de chargement</p>
              <p style={{ fontSize:13, margin:0, opacity:0.8 }}>{loadError}</p>
            </div>
          </div>
        )}

        {loading ? <DashboardSkeleton /> : (
          <>
            {/* KPI Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
              <KpiCard icon="🎫" label="Réservations"     value={kpi.total}          color={GOLD}   />
              <KpiCard icon="✅" label="Paiements reçus"  value={kpi.paid}            color={GREEN}  sub={fmtHTG(kpi.revenue)} />
              <KpiCard icon="⏳" label="En attente"       value={kpi.pending}         color={ORANGE} alert={kpi.pending > 0} />
              <KpiCard icon="🎬" label="Entrées utilisées" value={kpi.used}           color={BLUE}   />
              <KpiCard icon="⛔" label="Entrées refusées"  value={kpi.denied}         color={PURPLE} />
              <KpiCard icon="❌" label="Annulés"           value={kpi.cancelled}      color={RED}    />
              <KpiCard icon="💰" label="Revenus HTG"      value={fmtHTG(kpi.revenue)} color={GOLD}   isText />
              <KpiCard icon="📊" label="Taux occupation"  value={`${kpi.occupancyRate}%`} color={PURPLE} isText sub={`${kpi.bookedSeats} / ${kpi.totalSeats} places`} />
            </div>

            {/* Graphiques ligne 1 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <ChartCard title="Ventes par jour" icon="📈">
                {salesDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={salesDay} margin={{ top:4, right:16, bottom:0, left:-10 }}>
                      <defs>
                        <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={GOLD} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="label" stroke="#4b5563" tick={{ fontSize:11 }} />
                      <YAxis stroke="#4b5563" tick={{ fontSize:11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize:12, color:'#9ca3af' }} />
                      <Area type="monotone" dataKey="reservations" name="réservations" stroke={GOLD} fill="url(#gradGold)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </ChartCard>

              <ChartCard title="Revenus par jour (HTG)" icon="💵">
                {salesDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={salesDay} margin={{ top:4, right:16, bottom:0, left:-10 }}>
                      <defs>
                        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={GREEN} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="label" stroke="#4b5563" tick={{ fontSize:11 }} />
                      <YAxis stroke="#4b5563" tick={{ fontSize:11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="revenue" stroke={GREEN} fill="url(#gradRev)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </ChartCard>
            </div>

            {/* Graphiques ligne 2 */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
              <ChartCard title="Réservations par film" icon="🎬">
                {salesFilm.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={salesFilm} margin={{ top:4, right:16, bottom:40, left:-10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="title" stroke="#4b5563" tick={{ fontSize:10, fill:'#9ca3af' }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis stroke="#4b5563" tick={{ fontSize:11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="reservations" name="réservations" radius={[4,4,0,0]}>
                        {salesFilm.map((_, i) => (
                          <Cell key={i} fill={i===0 ? GOLD : i===1 ? GOLD2 : '#2d3748'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </ChartCard>

              <ChartCard title="Occupation salles" icon="🏛️">
                {rooms.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={rooms}
                        dataKey="booked"
                        nameKey="room"
                        cx="50%" cy="45%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={3}
                        label={({ rate }) => `${rate ?? 0}%`}
                        labelLine={false}
                      >
                        {rooms.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any, n: any) => [v, n]}
                        contentStyle={{ background:'#1a1a1a', border:'1px solid #333', borderRadius:8, fontSize:12 }}
                      />
                      <Legend wrapperStyle={{ fontSize:11, color:'#9ca3af', paddingTop:8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </ChartCard>
            </div>

            {/* Tableaux */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

              {/* Dernières réservations */}
              <DataCard title="Dernières réservations" icon="🎟️">
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      {['Code','Film','Client','Prix','Statut'].map(h => (
                        <th key={h} style={{ color:'#6b7280', fontWeight:600, padding:'4px 8px', textAlign:'left', fontSize:11, letterSpacing:'0.05em', textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign:'center', color:'#4b5563', padding:20 }}>Aucune réservation sur cette période</td></tr>
                    ) : reservations.map(r => (
                      <tr key={r.id} style={{ borderTop:'1px solid #1f2937' }}>
                        <td style={{ padding:'8px', fontFamily:'monospace', color:GOLD, fontSize:11 }}>{r.code}</td>
                        <td style={{ padding:'8px', color:'#e5e7eb', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.movie}</td>
                        <td style={{ padding:'8px', color:'#9ca3af' }}>{r.guest}</td>
                        <td style={{ padding:'8px', color:GREEN, fontWeight:600, whiteSpace:'nowrap' }}>{safeNum(r.price).toLocaleString()}</td>
                        <td style={{ padding:'8px' }}><StatusBadge status={r.status} payStatus={r.pay_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataCard>

              {/* Dernières validations scanner */}
              <DataCard title="Dernières validations scanner" icon="📷">
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      {['Code','Film','Client','Heure','Résultat'].map(h => (
                        <th key={h} style={{ color:'#6b7280', fontWeight:600, padding:'4px 8px', textAlign:'left', fontSize:11, letterSpacing:'0.05em', textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scans.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign:'center', color:'#4b5563', padding:20 }}>Aucun scan enregistré</td></tr>
                    ) : scans.map(s => (
                      <tr key={s.id} style={{ borderTop:'1px solid #1f2937' }}>
                        <td style={{ padding:'8px', fontFamily:'monospace', color:GOLD, fontSize:11 }}>{s.code}</td>
                        <td style={{ padding:'8px', color:'#e5e7eb', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.movie}</td>
                        <td style={{ padding:'8px', color:'#9ca3af' }}>{s.guest}</td>
                        <td style={{ padding:'8px', color:'#6b7280', fontSize:12 }}>{safeFmtTime(s.scanned_at)}</td>
                        <td style={{ padding:'8px' }}><ScanBadge result={s.result} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataCard>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

              {/* Meilleures séances */}
              <DataCard title="Meilleures séances" icon="🏆">
                {showtimes.length === 0 ? (
                  <p style={{ color:'#4b5563', textAlign:'center', padding:20 }}>Aucune donnée sur cette période</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {showtimes.map((s, i) => {
                      const fillPct = s.capacity > 0 ? Math.min((s.booked / s.capacity) * 100, 100) : 0
                      return (
                        <div key={`${s.showtime_id}-${i}`} style={{ background:'#111', borderRadius:10, padding:'12px 14px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                            <div>
                              <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{s.movie}</span>
                              <span style={{ color:'#4b5563', fontSize:12, marginLeft:8 }}>
                                {safeFmtDateFull(s.date)}{s.room ? ` · ${s.room}` : ''}
                              </span>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <span style={{ color:GOLD, fontWeight:700, fontSize:13 }}>{s.booked} places</span>
                              {s.revenue > 0 && <span style={{ color:GREEN, fontSize:11, display:'block' }}>{safeNum(s.revenue).toLocaleString()} HTG</span>}
                            </div>
                          </div>
                          <div style={{ height:4, background:'#1f2937', borderRadius:2 }}>
                            <div style={{ height:'100%', width:`${fillPct}%`, background:fillPct>80?GREEN:GOLD, borderRadius:2, transition:'width 0.5s' }} />
                          </div>
                          <p style={{ color:'#4b5563', fontSize:11, margin:'4px 0 0', textAlign:'right' }}>
                            {Math.round(fillPct)}% rempli
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </DataCard>

              {/* Meilleurs films */}
              <DataCard title="Meilleurs films" icon="⭐">
                {salesFilm.length === 0 ? (
                  <p style={{ color:'#4b5563', textAlign:'center', padding:20 }}>Aucune donnée sur cette période</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {salesFilm.slice(0, 5).map((f, i) => {
                      const maxRes = salesFilm[0]?.reservations ?? 1
                      const pct    = maxRes > 0 ? (f.reservations / maxRes) * 100 : 0
                      return (
                        <div key={f.title + i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{
                            width:28, height:28, borderRadius:8,
                            background: i===0 ? `linear-gradient(135deg,${GOLD},${GOLD2})` : '#1f2937',
                            color: i===0 ? '#111' : '#6b7280',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontWeight:800, fontSize:13, flexShrink:0,
                          }}>{i+1}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ color:'#e5e7eb', fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{f.title}</span>
                              <span style={{ color:'#9ca3af', fontSize:12, flexShrink:0, marginLeft:8 }}>{f.reservations} rés.</span>
                            </div>
                            <div style={{ height:4, background:'#1f2937', borderRadius:2 }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${GOLD},${GOLD2})`, borderRadius:2 }} />
                            </div>
                            {f.revenue > 0 && (
                              <span style={{ color:GREEN, fontSize:11 }}>{safeNum(f.revenue).toLocaleString()} HTG</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </DataCard>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

// ── Sous-composants ────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color, sub, alert, isText }: {
  icon: string; label: string; value: number | string
  color: string; sub?: string; alert?: boolean; isText?: boolean
}) {
  return (
    <div style={{
      background:'#0d1410',
      border:`1px solid ${alert ? color+'60' : '#1f2937'}`,
      borderRadius:16, padding:'20px 20px 16px',
      position:'relative', overflow:'hidden',
      boxShadow: alert ? `0 0 20px ${color}20` : 'none',
    }}>
      <div style={{ position:'absolute', top:0, right:0, width:60, height:60, borderRadius:'0 16px 0 60px', background:`${color}10` }} />
      <div style={{ fontSize:22, marginBottom:10, lineHeight:1 }}>{icon}</div>
      <p style={{ color:'#6b7280', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', margin:'0 0 6px' }}>{label}</p>
      <p style={{ color:isText ? color : '#fff', fontWeight:800, fontSize:isText ? 17 : 28, margin:0, lineHeight:1 }}>
        {isText ? value : safeNum(value as number).toLocaleString('fr-FR')}
      </p>
      {sub && <p style={{ color:color, fontSize:11, margin:'6px 0 0', fontWeight:600 }}>{sub}</p>}
    </div>
  )
}

function ChartCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'#0d1410', border:'1px solid #1f2937', borderRadius:16, padding:'20px 20px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <h3 style={{ color:'#fff', fontWeight:700, fontSize:15, margin:0 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function DataCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'#0d1410', border:'1px solid #1f2937', borderRadius:16, padding:'20px', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <h3 style={{ color:'#fff', fontWeight:700, fontSize:15, margin:0 }}>{title}</h3>
      </div>
      <div style={{ overflowX:'auto' }}>{children}</div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div style={{ height:220, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#374151' }}>
      <div style={{ fontSize:36, marginBottom:8 }}>📊</div>
      <p style={{ margin:0, fontSize:13 }}>Aucune donnée sur cette période</p>
    </div>
  )
}

// Status badge — accepte null/undefined sans crasher
function StatusBadge({ status, payStatus }: { status: string | null | undefined; payStatus: string | null | undefined }) {
  const s  = status   ?? ''
  const ps = payStatus ?? ''
  const cfg =
    s  === 'CANCELLED'         ? { label:'Annulé',  color:RED,    bg:RED+'18'    } :
    s  === 'USED'              ? { label:'Utilisé', color:PURPLE, bg:PURPLE+'18' } :
    ps === 'PAYE'              ? { label:'Payé',    color:GREEN,  bg:GREEN+'18'  } :
    ps === 'CASH_A_LARRIVEE'   ? { label:'Cash',    color:BLUE,   bg:BLUE+'18'   } :
                                 { label:'Attente', color:ORANGE, bg:ORANGE+'18' }
  return (
    <span style={{ background:cfg.bg, color:cfg.color, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function ScanBadge({ result }: { result: string | null | undefined }) {
  const r = result ?? ''
  const cfg =
    r === 'VALID'        ? { label:'✓ Valide',      color:GREEN,  bg:GREEN+'18'  } :
    r === 'ALREADY_USED' ? { label:'↻ Déjà scanné', color:PURPLE, bg:PURPLE+'18' } :
    r === 'NOT_FOUND'    ? { label:'? Introuvable',  color:ORANGE, bg:ORANGE+'18' } :
    r === ''             ? { label:'—',              color:'#6b7280', bg:'#11111180' } :
                           { label:'✕ Invalide',     color:RED,    bg:RED+'18'    }
  return (
    <span style={{ background:cfg.bg, color:cfg.color, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function DashboardSkeleton() {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        {Array.from({ length:8 }).map((_,i) => (
          <div key={i} style={{ height:110, background:'#111', borderRadius:16, animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*0.1}s` }} />
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div style={{ height:280, background:'#111', borderRadius:16, animation:'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height:280, background:'#111', borderRadius:16, animation:'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
        <div style={{ height:310, background:'#111', borderRadius:16, animation:'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height:310, background:'#111', borderRadius:16, animation:'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
