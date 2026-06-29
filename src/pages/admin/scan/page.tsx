/**
 * AdminScanPage — Scanner de billets Jaje Ciné (Phase 4+5)
 *
 * Fonctionnalités :
 *  - Caméra QR via html5-qrcode (React 19 compatible)
 *  - Saisie manuelle du code de confirmation
 *  - Vérification HMAC du QR signé (via ticketQr.ts)
 *  - Marquage status = 'USED' dans reservations
 *  - Log dans ticket_scans (id, reservation_id, scanned_by, scan_result, qr_payload)
 *  - États visuels : VALID (vert), ALREADY_USED (violet), INVALID (rouge), NOT_FOUND (orange)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { verifyTicketQr } from '../../../lib/ticketQr'

// ── Types ──────────────────────────────────────────────────────────────────
type ScanResult =
  | { state: 'idle' }
  | { state: 'scanning' }
  | { state: 'loading' }
  | { state: 'valid';        data: TicketInfo }
  | { state: 'already_used'; data: TicketInfo; scannedAt?: string }
  | { state: 'invalid';      reason: string }
  | { state: 'not_found' }

interface TicketInfo {
  id: string
  confirmation_code: string
  guest_name: string | null
  payment_status: string
  movie_title: string
  show_date: string
  show_time: string
  room_name: string
  seats: string[]
}

// ── Composant principal ────────────────────────────────────────────────────
export default function AdminScanPage() {
  const [result, setResult]     = useState<ScanResult>({ state: 'idle' })
  const [manualCode, setManual] = useState('')
  const [camEnabled, setCam]    = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const scannerRef  = useRef<any>(null)
  const scannerElId = 'jaje-qr-scanner'
  const lastScanned = useRef('')   // évite les doubles scans

  // ── Initialiser html5-qrcode ─────────────────────────────────────────────
  useEffect(() => {
    if (!camEnabled) return

    let html5QrCode: any

    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        html5QrCode = new Html5Qrcode(scannerElId)
        scannerRef.current = html5QrCode
        setScannerReady(true)

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            if (decoded === lastScanned.current) return
            lastScanned.current = decoded
            handleScan(decoded)
          },
          () => { /* erreur silencieuse pendant la recherche */ }
        )
      } catch (e: any) {
        console.error('Camera init error:', e)
        setResult({ state: 'invalid', reason: `Impossible d'accéder à la caméra : ${e?.message ?? e}` })
        setCam(false)
      }
    }

    init()

    return () => {
      html5QrCode?.isScanning && html5QrCode.stop().catch(() => {})
    }
  }, [camEnabled])

  // ── Logique de vérification ──────────────────────────────────────────────
  const handleScan = useCallback(async (raw: string) => {
    setResult({ state: 'loading' })

    // 1. Stopper la caméra pendant le traitement
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
      setCam(false)
    }

    // 2. Tenter de vérifier le QR signé
    let reservationId: string | null = null
    let confirmationCode: string | null = null
    let qrPayloadStr = raw

    const verified = await verifyTicketQr(raw)
    if (verified) {
      reservationId  = verified.ticketId
      confirmationCode = verified.code
    } else {
      // Fallback : essayer JSON non signé ou code brut
      try {
        const parsed = JSON.parse(raw)
        reservationId  = parsed?.ticketId ?? parsed?.id ?? null
        confirmationCode = parsed?.code ?? null
      } catch {
        // C'est peut-être juste un code lisible (JC-2026-XXXXXX)
        confirmationCode = raw.trim()
      }
    }

    // 3. Récupérer la réservation
    let query = supabase
      .from('reservations')
      .select(`
        id, confirmation_code, status, payment_status, reservation_status, entry_status,
        guest_name, total_seats,
        showtimes:showtime_id (
          show_date, show_time,
          movies:movie_id (title),
          rooms:room_id (name)
        )
      `)

    if (reservationId) {
      query = query.eq('id', reservationId) as any
    } else if (confirmationCode) {
      query = query.eq('confirmation_code', confirmationCode) as any
    } else {
      await logScan(null, 'INVALID', qrPayloadStr, 'QR illisible')
      setResult({ state: 'invalid', reason: 'QR code illisible ou format inconnu' })
      return
    }

    const { data: reservation, error: rErr } = await (query as any).single()

    if (rErr || !reservation) {
      await logScan(null, 'NOT_FOUND', qrPayloadStr, 'Réservation introuvable')
      setResult({ state: 'not_found' })
      return
    }

    // 4. Récupérer les sièges
    const { data: seatsData } = await supabase
      .from('reservation_seats')
      .select('seats:seat_id(row_letter, seat_number)')
      .eq('reservation_id', reservation.id)

    const seats = (seatsData ?? []).map((rs: any) =>
      rs.seats ? `${rs.seats.row_letter}-${rs.seats.seat_number}` : ''
    ).filter(Boolean)

    const st = (reservation as any).showtimes
    const ticketInfo: TicketInfo = {
      id:               reservation.id,
      confirmation_code: reservation.confirmation_code,
      guest_name:       reservation.guest_name,
      payment_status:   reservation.payment_status,
      movie_title:      st?.movies?.title ?? '—',
      show_date:        st?.show_date ?? '',
      show_time:        st?.show_time?.slice(0, 5) ?? '',
      room_name:        st?.rooms?.name ?? '—',
      seats,
    }

    // 5. Vérifier statut
    // entry_status = 'used' (Phase 9) ou ancien status = 'USED' (rétrocompat)
    const alreadyUsed = (reservation as any).entry_status === 'used'
                     || reservation.status === 'USED'
    if (alreadyUsed) {
      // Récupérer info du dernier scan
      const { data: lastScan } = await supabase
        .from('ticket_scans')
        .select('scanned_at')
        .eq('reservation_id', reservation.id)
        .eq('scan_result', 'VALID')
        .order('scanned_at', { ascending: false })
        .limit(1)
        .single()

      await logScan(reservation.id, 'ALREADY_USED', qrPayloadStr)
      setResult({ state: 'already_used', data: ticketInfo, scannedAt: lastScan?.scanned_at })
      return
    }

    if (reservation.status === 'CANCELLED') {
      await logScan(reservation.id, 'INVALID', qrPayloadStr, 'Réservation annulée')
      setResult({ state: 'invalid', reason: 'Cette réservation a été annulée.' })
      return
    }

    const payOk = ['PAYE', 'CASH_A_LARRIVEE'].includes(reservation.payment_status)
    const statusOk = ['CONFIRMED', 'PENDING'].includes(reservation.status) || reservation.status === null

    if (!payOk) {
      await logScan(reservation.id, 'INVALID', qrPayloadStr, `Paiement: ${reservation.payment_status}`)
      setResult({ state: 'invalid', reason: `Paiement non validé (${reservation.payment_status})` })
      return
    }

    // 6. ✅ Ticket valide → marquer USED + entry_status=used + logger
    const { error: updateErr } = await supabase
      .from('reservations')
      .update({ status: 'USED', entry_status: 'used' })
      .eq('id', reservation.id)

    if (updateErr) {
      setResult({ state: 'invalid', reason: `Erreur base de données : ${updateErr.message}` })
      return
    }

    await logScan(reservation.id, 'VALID', qrPayloadStr)
    setResult({ state: 'valid', data: ticketInfo })
  }, [])

  // ── Log dans ticket_scans ────────────────────────────────────────────────
  const logScan = async (
    reservationId: string | null,
    scanResult: string,
    qrPayload: string,
    notes?: string
  ) => {
    try {
      // entry_status_set : valeur écrite dans reservations lors de ce scan
      const entryStatusSet =
        scanResult === 'VALID'        ? 'used'     :
        scanResult === 'ALREADY_USED' ? 'used'     :
        scanResult === 'INVALID'      ? 'denied'   : null

      await supabase.from('ticket_scans').insert({
        reservation_id:   reservationId,
        scan_result:      scanResult,
        qr_payload:       qrPayload.slice(0, 2000),
        notes:            notes ?? null,
        entry_status_set: entryStatusSet,
      })
    } catch (e) {
      console.warn('logScan error:', e)
    }
  }

  // ── Réinitialiser ────────────────────────────────────────────────────────
  const reset = () => {
    setResult({ state: 'idle' })
    setManual('')
    lastScanned.current = ''
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleScan(manualCode.trim())
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px 48px',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <img src="/logo.png" alt="Jaje Ciné" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div>
            <p style={{ margin: 0, fontSize: 10, color: '#6b7280', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Jaje Ciné — Cinema & Events Platform
            </p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>
              Scanner de billets
            </h1>
          </div>
        </div>
      </div>

      {/* ── Zone principale ─────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* État : idle ou scanning → montrer caméra + saisie manuelle */}
        {(result.state === 'idle' || result.state === 'scanning') && (
          <>
            {/* Bouton caméra */}
            {!camEnabled ? (
              <button
                onClick={() => { setCam(true); setResult({ state: 'scanning' }) }}
                style={{
                  width: '100%', padding: '16px',
                  background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
                  color: '#111', fontWeight: 700, fontSize: 16,
                  border: 'none', borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 22 }}>📷</span>
                Scanner avec la caméra
              </button>
            ) : (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                {/* Viewfinder */}
                <div style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: '2px solid #D4AF37',
                  background: '#111',
                  position: 'relative',
                }}>
                  <div id={scannerElId} style={{ width: '100%' }} />
                  {/* Overlay coin viseur */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 200, height: 200, position: 'relative' }}>
                      {['tl','tr','bl','br'].map(pos => (
                        <div key={pos} style={{
                          position: 'absolute',
                          width: 24, height: 24,
                          ...(pos === 'tl' ? { top: 0, left: 0, borderTop: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37', borderRadius: '4px 0 0 0' } :
                              pos === 'tr' ? { top: 0, right: 0, borderTop: '3px solid #D4AF37', borderRight: '3px solid #D4AF37', borderRadius: '0 4px 0 0' } :
                              pos === 'bl' ? { bottom: 0, left: 0, borderBottom: '3px solid #D4AF37', borderLeft: '3px solid #D4AF37', borderRadius: '0 0 0 4px' } :
                                             { bottom: 0, right: 0, borderBottom: '3px solid #D4AF37', borderRight: '3px solid #D4AF37', borderRadius: '0 0 4px 0' }),
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setCam(false); setResult({ state: 'idle' }) }}
                  style={{
                    marginTop: 8, width: '100%', padding: '10px',
                    background: 'rgba(255,255,255,0.06)', color: '#9ca3af',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  ✕ Arrêter la caméra
                </button>
              </div>
            )}

            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#4b5563', fontSize: 12, letterSpacing: '0.1em' }}>OU</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Saisie manuelle */}
            <form onSubmit={handleManualSubmit}>
              <div style={{ position: 'relative' }}>
                <input
                  value={manualCode}
                  onChange={e => setManual(e.target.value)}
                  placeholder="Ex: JC-2026-123456"
                  autoComplete="off"
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12, color: '#fff', fontSize: 16,
                    fontFamily: 'monospace', letterSpacing: '0.05em',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                style={{
                  marginTop: 10, width: '100%', padding: '14px',
                  background: manualCode.trim() ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                  color: manualCode.trim() ? '#D4AF37' : '#4b5563',
                  border: `1px solid ${manualCode.trim() ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, cursor: manualCode.trim() ? 'pointer' : 'default',
                  fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                }}
              >
                Vérifier le code
              </button>
            </form>
          </>
        )}

        {/* État : chargement */}
        {result.state === 'loading' && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 20px',
              border: '4px solid rgba(212,175,55,0.2)',
              borderTopColor: '#D4AF37', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#9ca3af', fontSize: 16 }}>Vérification en cours...</p>
          </div>
        )}

        {/* État : VALID ✅ */}
        {result.state === 'valid' && (
          <ResultCard
            icon="✅"
            title="Ticket valide !"
            subtitle="Entrée autorisée"
            color="#22c55e"
            bg="rgba(34,197,94,0.08)"
            border="rgba(34,197,94,0.3)"
            data={result.data}
            extra={
              <div style={{
                marginTop: 12, padding: '8px 16px',
                background: 'rgba(34,197,94,0.15)', borderRadius: 8,
                color: '#22c55e', fontWeight: 700, fontSize: 14, textAlign: 'center',
              }}>
                ✔ Marqué comme UTILISÉ dans le système
              </div>
            }
            onReset={reset}
          />
        )}

        {/* État : ALREADY_USED ⚠️ */}
        {result.state === 'already_used' && (
          <ResultCard
            icon="⚠️"
            title="Ticket déjà utilisé"
            subtitle="Ce billet a déjà été scanné"
            color="#a855f7"
            bg="rgba(168,85,247,0.08)"
            border="rgba(168,85,247,0.3)"
            data={result.data}
            extra={
              result.scannedAt ? (
                <p style={{ color: '#a855f7', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                  Scanné le {new Date(result.scannedAt).toLocaleString('fr-FR')}
                </p>
              ) : null
            }
            onReset={reset}
          />
        )}

        {/* État : INVALID ❌ */}
        {result.state === 'invalid' && (
          <div style={{
            borderRadius: 20, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)', padding: 28, textAlign: 'center',
            animation: 'fadeUp 0.3s ease-out',
          }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>❌</div>
            <h2 style={{ color: '#ef4444', fontWeight: 800, fontSize: 22, margin: '0 0 8px' }}>
              Ticket invalide
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 15, margin: '0 0 20px' }}>
              {result.reason}
            </p>
            <ResetButton onClick={reset} />
          </div>
        )}

        {/* État : NOT_FOUND 🔍 */}
        {result.state === 'not_found' && (
          <div style={{
            borderRadius: 20, border: '1px solid rgba(249,115,22,0.3)',
            background: 'rgba(249,115,22,0.08)', padding: 28, textAlign: 'center',
            animation: 'fadeUp 0.3s ease-out',
          }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🔍</div>
            <h2 style={{ color: '#f97316', fontWeight: 800, fontSize: 22, margin: '0 0 8px' }}>
              Réservation introuvable
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 15, margin: '0 0 20px' }}>
              Aucune réservation ne correspond à ce code.
            </p>
            <ResetButton onClick={reset} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #4b5563; }
        input:focus { outline: none; border-color: rgba(212,175,55,0.5) !important; }
      `}</style>
    </div>
  )
}

// ── Sous-composants ────────────────────────────────────────────────────────
function ResultCard({
  icon, title, subtitle, color, bg, border, data, extra, onReset
}: {
  icon: string; title: string; subtitle: string;
  color: string; bg: string; border: string;
  data: TicketInfo; extra?: React.ReactNode; onReset: () => void;
}) {
  const showDate = data.show_date
    ? new Date(data.show_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
    : '—'

  return (
    <div style={{
      borderRadius: 20, border: `1px solid ${border}`,
      background: bg, padding: 24,
      animation: 'fadeUp 0.3s ease-out',
    }}>
      {/* Icône + titre */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}>{icon}</div>
        <h2 style={{ color, fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>{title}</h2>
        <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>{subtitle}</p>
      </div>

      {/* Infos ticket */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <InfoLine label="Film"    value={data.movie_title} bold />
        <InfoLine label="Date"    value={`${showDate} à ${data.show_time}`} />
        <InfoLine label="Salle"   value={data.room_name} />
        {data.seats.length > 0 && (
          <InfoLine label="Sièges" value={data.seats.join(' · ')} gold />
        )}
        {data.guest_name && (
          <InfoLine label="Client" value={data.guest_name} />
        )}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 4 }}>
          <InfoLine label="Code" value={data.confirmation_code} mono />
        </div>
      </div>

      {extra}

      <div style={{ marginTop: 16 }}>
        <ResetButton onClick={onReset} />
      </div>
    </div>
  )
}

function InfoLine({ label, value, bold, gold, mono }: {
  label: string; value: string; bold?: boolean; gold?: boolean; mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{
        color: gold ? '#D4AF37' : '#e5e7eb',
        fontWeight: bold || gold ? 700 : 500,
        fontFamily: mono ? 'monospace' : 'inherit',
        letterSpacing: mono ? '0.05em' : 'normal',
      }}>
        {value}
      </span>
    </div>
  )
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '13px',
        background: 'rgba(212,175,55,0.12)',
        color: '#D4AF37', fontWeight: 700, fontSize: 15,
        border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12,
        cursor: 'pointer',
      }}
    >
      📷 Scanner un autre ticket
    </button>
  )
}
