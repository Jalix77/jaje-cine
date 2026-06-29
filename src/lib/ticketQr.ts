/**
 * ticketQr.ts — QR Code sécurisé pour Jaje Ciné
 *
 * Le QR contient un payload JSON + une signature HMAC-SHA256.
 * Le scanner valide la signature avant d'accepter le ticket.
 * La clé secrète est dans VITE_TICKET_SECRET (env).
 */

/** Structure du payload embarqué dans le QR */
export interface TicketQrPayload {
  v: 2;                    // version du format
  ticketId: string;        // UUID de la réservation
  code: string;            // confirmation_code lisible (JC-2026-XXXXXX)
  movie: string;
  showDate: string;        // ISO date
  showTime: string;        // HH:MM
  room: string;
  seats: string[];
  customer: string;        // nom du client
  status: string;          // PENDING | CONFIRMED | USED | CANCELLED
  issuedAt: string;        // ISO datetime de création
}

/** Format complet du QR (payload + signature) */
interface SignedQrData {
  d: TicketQrPayload;      // data
  s: string;               // signature hex
}

// ── Secret ────────────────────────────────────────────────────────────────────
// VITE_ = exposé au browser (anon key equivaut), mais c'est suffisant pour
// protéger contre la contrefaçon basique. Pour production, utiliser un secret
// côté serveur uniquement et vérifier via /api/ticket/verify.
const SECRET =
  (import.meta as any).env?.VITE_TICKET_SECRET ??
  'jaje-cine-default-secret-change-in-prod';

/** Encode une clé HMAC depuis une string */
async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Convertit un ArrayBuffer en hex string */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Signe un payload et retourne la string JSON à encoder dans le QR */
export async function signTicketPayload(payload: TicketQrPayload): Promise<string> {
  const key = await getKey(SECRET);
  const enc = new TextEncoder();
  const data = JSON.stringify(payload);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const signed: SignedQrData = { d: payload, s: bufToHex(sigBuf) };
  return JSON.stringify(signed);
}

/** Vérifie et parse un QR string. Retourne null si invalide / tampered. */
export async function verifyTicketQr(
  qrString: string
): Promise<TicketQrPayload | null> {
  try {
    const parsed: SignedQrData = JSON.parse(qrString);
    if (!parsed?.d || !parsed?.s) return null;

    const key = await getKey(SECRET);
    const enc = new TextEncoder();
    const data = JSON.stringify(parsed.d);

    // Convertir hex → Uint8Array
    const sigBytes = new Uint8Array(
      (parsed.s.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16))
    );

    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
    if (!ok) return null;

    return parsed.d;
  } catch {
    return null;
  }
}

/** Génère le payload complet à partir d'un objet ticket */
export function buildTicketPayload(ticket: {
  id: string;
  confirmation_code: string;
  movie_title: string;
  show_date: string;
  show_time: string;
  room_name: string;
  seats: string[];
  guest_name: string | null;
  status: string;
}): TicketQrPayload {
  return {
    v: 2,
    ticketId: ticket.id,
    code: ticket.confirmation_code,
    movie: ticket.movie_title,
    showDate: ticket.show_date,
    showTime: ticket.show_time.slice(0, 5),
    room: ticket.room_name,
    seats: ticket.seats,
    customer: ticket.guest_name ?? 'Client',
    status: ticket.status,
    issuedAt: new Date().toISOString(),
  };
}
