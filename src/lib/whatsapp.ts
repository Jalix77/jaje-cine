// ── Utilitaires WhatsApp — JAJE Ciné ────────────────────────────────────────
// Implémentation actuelle : liens wa.me (aucune API requise)
// Préparé pour future intégration : WhatsApp Business API / Meta Cloud / Twilio / WATI

// ── Formatage numéro Haïti ─────────────────────────────────────────────────

export function formatPhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '';
  // Supprimer tout sauf les chiffres
  let digits = phone.replace(/\D/g, '');
  // Déjà avec indicatif 509
  if (digits.startsWith('509') && digits.length === 11) return digits;
  // Avec 00509
  if (digits.startsWith('00509')) return digits.slice(2);
  // +509 → 509 déjà géré par replace(/\D/g,'')
  // 8 chiffres sans indicatif → ajouter 509
  if (digits.length === 8) return `509${digits}`;
  // 10 chiffres commençant par 0 → retirer le 0 et ajouter 509
  if (digits.length === 10 && digits.startsWith('0')) return `509${digits.slice(1)}`;
  return digits;
}

export function isValidHaitiPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const formatted = formatPhoneForWhatsApp(phone);
  // +509 + 8 chiffres — préfixes mobiles Haïti : 3, 4 (anciens) + nouveaux
  return /^509[2-9]\d{7}$/.test(formatted);
}

export function phoneValidationMessage(phone: string | null | undefined): string {
  if (!phone || phone.trim() === '') return 'Téléphone non renseigné';
  if (!isValidHaitiPhone(phone)) return 'Numéro WhatsApp invalide';
  return '';
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface WhatsAppReservation {
  guest_name?:        string | null;
  guest_phone?:       string | null;
  movie_title?:       string | null;
  show_date?:         string | null;
  show_time?:         string | null;
  room_name?:         string | null;
  seats?:             string[] | string | null;
  confirmation_code?: string | null;
  total_price_htg?:   number | null;
  reservation_status?: string | null;
  payment_status?:    string | null;
  entry_status?:      string | null;
  status?:            string | null;
}

// ── Helpers formatage ─────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return d; }
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return '—';
  return String(t).slice(0, 5);
}

function fmtSeats(seats: string[] | string | null | undefined): string {
  if (!seats) return '—';
  if (Array.isArray(seats)) return seats.join(', ') || '—';
  return seats || '—';
}

function fmtResStatus(resStatus: string | null | undefined, legacy: string | null | undefined): string {
  if (resStatus === 'confirmed' || legacy === 'CONFIRMED') return 'Confirmee';
  if (resStatus === 'cancelled' || legacy === 'CANCELLED') return 'Annulee';
  return 'En attente';
}

function fmtPayStatus(ps: string | null | undefined): string {
  if (ps === 'PAYE' || ps === 'paid')    return 'Paye';
  if (ps === 'CASH_A_LARRIVEE')          return "Cash a l'entree";
  if (ps === 'EN_ATTENTE_VALIDATION')    return 'En attente de validation';
  if (ps === 'REFUSE' || ps === 'ANNULE') return 'Refuse';
  return '—';
}

function fmtEntryStatus(es: string | null | undefined): string {
  if (es === 'used')   return 'Utilisee';
  if (es === 'denied') return 'Refusee';
  return 'Non utilisee';
}

function firstName(name: string | null | undefined): string {
  return (name || 'Client').split(' ')[0];
}

// ── Générateurs de messages ───────────────────────────────────────────────

export function generateReservationMessage(r: WhatsAppReservation): string {
  const isCash = r.payment_status === 'CASH_A_LARRIVEE';
  return [
    `Bonjour ${firstName(r.guest_name)},`,
    '',
    `Votre reservation JAJE Cine est enregistree.`,
    '',
    `Film : ${r.movie_title || '—'}`,
    `Date : ${fmtDate(r.show_date)}`,
    `Heure : ${fmtTime(r.show_time)}`,
    `Salle : ${r.room_name || '—'}`,
    `Siege(s) : ${fmtSeats(r.seats)}`,
    `Code : ${r.confirmation_code || '—'}`,
    `Total : ${Number(r.total_price_htg || 0).toLocaleString()} HTG`,
    '',
    `Statut reservation : ${fmtResStatus(r.reservation_status, r.status)}`,
    `Paiement : ${fmtPayStatus(r.payment_status)}`,
    `Entree : ${fmtEntryStatus(r.entry_status)}`,
    '',
    `Presentez votre QR Code a l'entree.`,
    isCash ? `Si vous payez en cash, merci d'arriver 15 minutes avant la seance.` : '',
    '',
    `Merci d'avoir choisi JAJE Cine.`,
  ].filter(l => l !== null).join('\n').replace(/\n{3,}/g, '\n\n');
}

export function generateReminderMessage(r: WhatsAppReservation): string {
  return [
    `Bonjour ${firstName(r.guest_name)},`,
    '',
    `Petit rappel pour votre seance JAJE Cine :`,
    '',
    `Film : ${r.movie_title || '—'}`,
    `Date : ${fmtDate(r.show_date)}`,
    `Heure : ${fmtTime(r.show_time)}`,
    `Salle : ${r.room_name || '—'}`,
    `Siege(s) : ${fmtSeats(r.seats)}`,
    '',
    `Merci de presenter votre QR Code a l'entree.`,
  ].join('\n');
}

export function generatePaymentMessage(r: WhatsAppReservation): string {
  return [
    `Bonjour ${firstName(r.guest_name)},`,
    '',
    `Votre paiement JAJE Cine a bien ete confirme.`,
    '',
    `Film : ${r.movie_title || '—'}`,
    `Date : ${fmtDate(r.show_date)}`,
    `Heure : ${fmtTime(r.show_time)}`,
    `Montant paye : ${Number(r.total_price_htg || 0).toLocaleString()} HTG`,
    `Code ticket : ${r.confirmation_code || '—'}`,
    '',
    `Merci.`,
  ].join('\n');
}

export function generateCancellationMessage(r: WhatsAppReservation): string {
  return [
    `Bonjour ${firstName(r.guest_name)},`,
    '',
    `Votre reservation JAJE Cine a ete annulee.`,
    '',
    `Film : ${r.movie_title || '—'}`,
    `Date : ${fmtDate(r.show_date)}`,
    `Heure : ${fmtTime(r.show_time)}`,
    `Code ticket : ${r.confirmation_code || '—'}`,
    '',
    `Pour toute question, contactez l'equipe JAJE Cine.`,
  ].join('\n');
}

// ── URL wa.me ─────────────────────────────────────────────────────────────

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const formatted = formatPhoneForWhatsApp(phone);
  if (!formatted) return '';
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string | null | undefined, message: string): void {
  const url = buildWhatsAppUrl(phone, message);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

// ── Future API officielle (non activée) ───────────────────────────────────
// Prêt pour : WhatsApp Business API, Meta Cloud API, Twilio, WATI
// Activer en changeant provider dans la config et en fournissant les tokens.

export type WhatsAppProvider = 'wa.me' | 'whatsapp_business' | 'meta_cloud' | 'twilio' | 'wati';

export interface WhatsAppAPIConfig {
  provider: WhatsAppProvider;
  token?: string;
  phoneNumberId?: string;  // Meta Cloud
  accountSid?: string;     // Twilio
  apiKey?: string;         // WATI
  baseUrl?: string;        // WATI endpoint
}

export const DEFAULT_CONFIG: WhatsAppAPIConfig = {
  provider: 'wa.me', // Mode actuel — aucune API requise
};

export async function sendWhatsAppMessage(
  phone: string | null | undefined,
  message: string,
  config: WhatsAppAPIConfig = DEFAULT_CONFIG,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const validationError = phoneValidationMessage(phone);
  if (validationError) return { success: false, error: validationError };

  if (config.provider === 'wa.me') {
    const url = buildWhatsAppUrl(phone, message);
    return { success: true, url };
  }

  // Placeholder pour future intégration API
  return {
    success: false,
    error: `Provider "${config.provider}" non encore configuré. Utiliser wa.me pour l'instant.`,
  };
}
