/**
 * statusUtils.ts — Système de statuts séparés Jaje Ciné (Phase 9)
 *
 * Trois dimensions indépendantes :
 *   reservation_status : pending | confirmed | cancelled | expired
 *   payment_status     : pending | paid | refunded | rejected | cash_on_arrival
 *   entry_status       : not_used | used | denied
 *
 * Les anciennes valeurs (EN_ATTENTE_VALIDATION, PAYE, etc.) sont
 * traduites ici pour garantir la rétrocompatibilité totale.
 */

// ── Types ──────────────────────────────────────────────────────────────────
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'
export type PaymentStatus     = 'pending' | 'paid' | 'refunded' | 'rejected' | 'cash_on_arrival'
export type EntryStatus       = 'not_used' | 'used' | 'denied'

export interface StatusConfig {
  label: string
  icon: string
  color: string        // CSS hex
  bg: string           // rgba background
  border: string       // rgba border
}

// ── Palette centralisée ────────────────────────────────────────────────────
const C = {
  green:  '#16a34a',
  orange: '#f97316',
  red:    '#ef4444',
  gray:   '#6b7280',
  blue:   '#3b82f6',
  purple: '#a855f7',
  gold:   '#D4AF37',
}

// ── RESERVATION STATUS ─────────────────────────────────────────────────────
export const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, StatusConfig> = {
  pending:   { label: 'En attente',  icon: '⏳', color: C.orange, bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)'  },
  confirmed: { label: 'Confirmée',   icon: '✓',  color: C.green,  bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.3)'   },
  cancelled: { label: 'Annulée',     icon: '✕',  color: C.red,    bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  expired:   { label: 'Expirée',     icon: '○',  color: C.gray,   bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' },
}

// ── PAYMENT STATUS ─────────────────────────────────────────────────────────
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  pending:         { label: 'En attente',      icon: '⏳', color: C.orange, bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)'  },
  paid:            { label: 'Payé',            icon: '✓',  color: C.green,  bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.3)'   },
  refunded:        { label: 'Remboursé',       icon: '↩',  color: C.purple, bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)'  },
  rejected:        { label: 'Rejeté',          icon: '✕',  color: C.red,    bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  cash_on_arrival: { label: "Cash à l'entrée", icon: '💵', color: C.blue,   bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)'  },
}

// ── ENTRY STATUS ───────────────────────────────────────────────────────────
export const ENTRY_STATUS_CONFIG: Record<EntryStatus, StatusConfig> = {
  not_used: { label: 'Non utilisée', icon: '○',  color: C.blue,  bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)'  },
  used:     { label: 'Utilisée',     icon: '✓',  color: C.green, bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.3)'   },
  denied:   { label: 'Refusée',      icon: '✕',  color: C.red,   bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
}

// ── Traducteurs rétrocompatibilité ─────────────────────────────────────────

/**
 * Traduit l'ancien `status` DB vers ReservationStatus normalisé.
 * Fonctionne avec les deux systèmes (ancien + nouveau).
 */
export function toReservationStatus(raw: string | null | undefined): ReservationStatus {
  switch ((raw ?? '').toUpperCase()) {
    case 'PENDING':   return 'pending'
    case 'CANCELLED': return 'cancelled'
    case 'EXPIRED':   return 'expired'
    // CONFIRMED, USED et les nouvelles valeurs → confirmed
    case 'CONFIRMED':
    case 'USED':
    default:
      if (raw === 'pending')   return 'pending'
      if (raw === 'cancelled') return 'cancelled'
      if (raw === 'expired')   return 'expired'
      if (raw === 'confirmed') return 'confirmed'
      return 'confirmed'
  }
}

/**
 * Traduit l'ancien `payment_status` DB vers PaymentStatus normalisé.
 * Fonctionne avec les deux systèmes.
 */
export function toPaymentStatus(raw: string | null | undefined): PaymentStatus {
  switch ((raw ?? '').toUpperCase()) {
    case 'PAYE':
    case 'PAID':                  return 'paid'
    case 'EN_ATTENTE_VALIDATION':
    case 'PENDING':               return 'pending'
    case 'CASH_A_LARRIVEE':
    case 'CASH_ON_ARRIVAL':       return 'cash_on_arrival'
    case 'REFUSE':
    case 'REJECTED':              return 'rejected'
    case 'REMBOURSE':
    case 'REFUNDED':              return 'refunded'
    default:
      // Valeurs normalisées passées directement
      if (raw === 'pending')         return 'pending'
      if (raw === 'paid')            return 'paid'
      if (raw === 'refunded')        return 'refunded'
      if (raw === 'rejected')        return 'rejected'
      if (raw === 'cash_on_arrival') return 'cash_on_arrival'
      return 'pending'
  }
}

/**
 * Traduit `entry_status` DB vers EntryStatus normalisé.
 * L'ancien status='USED' est mappé vers 'used'.
 */
export function toEntryStatus(
  entryStatusRaw: string | null | undefined,
  legacyStatus?: string | null
): EntryStatus {
  // Priorité : nouvelle colonne entry_status
  switch ((entryStatusRaw ?? '').toLowerCase()) {
    case 'used':     return 'used'
    case 'denied':   return 'denied'
    case 'not_used': return 'not_used'
  }
  // Fallback : ancien status='USED' pour les anciennes réservations
  if ((legacyStatus ?? '').toUpperCase() === 'USED') return 'used'
  return 'not_used'
}

// ── Getters de config avec fallback ───────────────────────────────────────
export function getReservationConfig(raw: string | null | undefined): StatusConfig {
  return RESERVATION_STATUS_CONFIG[toReservationStatus(raw)]
}
export function getPaymentConfig(raw: string | null | undefined): StatusConfig {
  return PAYMENT_STATUS_CONFIG[toPaymentStatus(raw)]
}
export function getEntryConfig(
  entryRaw: string | null | undefined,
  legacyStatus?: string | null
): StatusConfig {
  return ENTRY_STATUS_CONFIG[toEntryStatus(entryRaw, legacyStatus)]
}

// ── Valeurs DB pour les nouveaux inserts ───────────────────────────────────
/** Valeurs à écrire lors d'une nouvelle réservation */
export const NEW_RESERVATION_DEFAULTS = {
  reservation_status: 'confirmed' as ReservationStatus,
  entry_status:       'not_used'  as EntryStatus,
} as const

/** Valeurs à écrire lors d'un scan réussi */
export const SCAN_SUCCESS_UPDATE = {
  entry_status: 'used' as EntryStatus,
} as const

/** Valeurs à écrire lors d'un refus d'entrée */
export const SCAN_DENIED_UPDATE = {
  entry_status: 'denied' as EntryStatus,
} as const
