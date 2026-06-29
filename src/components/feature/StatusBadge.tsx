/**
 * StatusBadge — Badges visuels pour les 3 dimensions de statut
 *
 * Usage:
 *   <ReservationBadge status="confirmed" />
 *   <PaymentBadge     status="pending" />
 *   <EntryBadge       status="not_used" />
 *
 *   // Depuis valeurs DB brutes (rétrocompat)
 *   <ReservationBadge raw="CONFIRMED" />
 *   <PaymentBadge     raw="EN_ATTENTE_VALIDATION" />
 *   <EntryBadge       raw="not_used" legacyStatus="USED" />
 *
 *   // Panneau complet 3-statuts (pour page ticket)
 *   <StatusPanel reservation={r} />
 */

import {
  getReservationConfig, getPaymentConfig, getEntryConfig,
  type ReservationStatus, type PaymentStatus, type EntryStatus,
  type StatusConfig,
} from '../../lib/statusUtils'

// ── Badge de base ─────────────────────────────────────────────────────────
interface BadgeProps {
  config: StatusConfig
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

function Badge({ config, size = 'md', showIcon = true }: BadgeProps) {
  const padding  = size === 'sm' ? '2px 8px'  : size === 'lg' ? '6px 14px' : '3px 10px'
  const fontSize = size === 'sm' ? 11         : size === 'lg' ? 14         : 12

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding, fontSize, fontWeight: 700,
      color: config.color,
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 20,
      whiteSpace: 'nowrap',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {showIcon && <span style={{ fontSize: size === 'lg' ? 14 : 11 }}>{config.icon}</span>}
      {config.label}
    </span>
  )
}

// ── Badges spécialisés ────────────────────────────────────────────────────
export function ReservationBadge({ raw, size }: { raw?: string | null; size?: BadgeProps['size'] }) {
  return <Badge config={getReservationConfig(raw)} size={size} />
}

export function PaymentBadge({ raw, size }: { raw?: string | null; size?: BadgeProps['size'] }) {
  return <Badge config={getPaymentConfig(raw)} size={size} />
}

export function EntryBadge({ raw, legacyStatus, size }: {
  raw?: string | null; legacyStatus?: string | null; size?: BadgeProps['size']
}) {
  return <Badge config={getEntryConfig(raw, legacyStatus)} size={size} />
}

// ── Panneau 3-statuts (page ticket / détail admin) ─────────────────────────
interface StatusPanelProps {
  /** Valeur de reservation_status (nouvelle colonne) ou status (ancienne) */
  reservationStatus?: string | null
  /** Valeur de payment_status */
  paymentStatus?: string | null
  /** Valeur de entry_status (nouvelle colonne) */
  entryStatus?: string | null
  /** Ancien status pour fallback entry */
  legacyStatus?: string | null
  /** Style compact (horizontal) ou carte (vertical) */
  layout?: 'horizontal' | 'card'
}

export function StatusPanel({
  reservationStatus,
  paymentStatus,
  entryStatus,
  legacyStatus,
  layout = 'card',
}: StatusPanelProps) {
  const rCfg = getReservationConfig(reservationStatus ?? legacyStatus)
  const pCfg = getPaymentConfig(paymentStatus)
  const eCfg = getEntryConfig(entryStatus, legacyStatus)

  if (layout === 'horizontal') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <StatusRow label="Réservation" config={rCfg} compact />
        <StatusRow label="Paiement"    config={pCfg} compact />
        <StatusRow label="Entrée"      config={eCfg} compact />
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <StatusCard label="Réservation" config={rCfg} />
      <StatusCard label="Paiement"    config={pCfg} />
      <StatusCard label="Entrée"      config={eCfg} />
    </div>
  )
}

function StatusCard({ label, config }: { label: string; config: StatusConfig }) {
  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 12,
      padding: '12px 14px',
      textAlign: 'center',
    }}>
      <p style={{
        color: '#6b7280', fontSize: 10, letterSpacing: '0.1em',
        textTransform: 'uppercase', margin: '0 0 8px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {label}
      </p>
      <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>{config.icon}</div>
      <p style={{ color: config.color, fontWeight: 700, fontSize: 13, margin: 0 }}>
        {config.label}
      </p>
    </div>
  )
}

function StatusRow({ label, config, compact }: { label: string; config: StatusConfig; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#6b7280', fontSize: 12 }}>{label} :</span>
      <Badge config={config} size="sm" />
    </div>
  )
}
