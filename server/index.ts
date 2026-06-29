import express from 'express'
import cors from 'cors'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config as dotenvConfig } from 'dotenv'

// ── ESM __dirname polyfill ─────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// ── Charger .env.local depuis la racine du projet ─────────────────────────
// tsx injecte déjà les vars, mais on force le chargement explicite en fallback
const envPath = path.resolve(process.cwd(), '.env.local')
dotenvConfig({ path: envPath, override: false })

// ── Bypass TLS pour outil local uniquement ────────────────────────────────
// Nécessaire sur certains Windows où le store de certificats Node.js
// ne reconnaît pas le certificat Supabase (UNABLE_TO_VERIFY_LEAF_SIGNATURE)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// ── Debug démarrage ───────────────────────────────────────────────────────
console.log('📂 .env.local lu depuis :', envPath)
console.log('   VITE_SUPABASE_URL         :', process.env.VITE_SUPABASE_URL        ? '✅' : '❌ MANQUANT')
console.log('   SUPABASE_SERVICE_ROLE_KEY :', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌ MANQUANT')

const app = express()

app.use(cors())
app.use(express.json())

// ── GET /api/ticket/pdf?id=<reservationId> ────────────────────────────────
// Génère un PDF imprimable du billet. Utilise la Service Role Key côté serveur
// uniquement — jamais exposée au navigateur.
app.get('/api/ticket/pdf', async (req, res) => {
  try {
    const reservationId = req.query.id as string | undefined
    if (!reservationId) {
      return res.status(400).json({ error: 'Paramètre ?id= manquant' })
    }

    // Clés d'environnement
    const supabaseUrl    = process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local' })
    }

    // Client admin — Service Role uniquement côté serveur
    const adminSupa = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Récupérer la réservation
    const { data: res1, error: e1 } = await adminSupa
      .from('reservations')
      .select(`
        id, confirmation_code, status, payment_status,
        guest_name, guest_email, guest_phone,
        total_seats, total_price_htg, payment_method,
        created_at,
        showtimes:showtime_id (
          show_date, show_time,
          movies:movie_id (title, poster_url),
          rooms:room_id (name)
        )
      `)
      .eq('id', reservationId)
      .single()

    if (e1 || !res1) {
      return res.status(404).json({ error: 'Réservation introuvable' })
    }

    // 2. Récupérer les sièges
    const { data: seatsData } = await adminSupa
      .from('reservation_seats')
      .select('seats:seat_id(row_letter, seat_number)')
      .eq('reservation_id', reservationId)

    const seatLabels: string[] = (seatsData ?? []).map((rs: any) =>
      rs.seats ? `${rs.seats.row_letter}-${rs.seats.seat_number}` : ''
    ).filter(Boolean)

    // 3. Extraire les données
    const st = (res1 as any).showtimes
    const mv = st?.movies
    const rm = st?.rooms

    const filmTitle = mv?.title         ?? 'Film'
    const showDate  = st?.show_date
      ? new Date(st.show_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '—'
    const showTime  = st?.show_time?.slice(0, 5)  ?? '—'
    const roomName  = rm?.name                     ?? '—'
    const price     = Number(res1.total_price_htg).toLocaleString('fr-FR')
    const code      = res1.confirmation_code        ?? reservationId
    const guestName = res1.guest_name               ?? '—'
    const payMethod = res1.payment_method           ?? '—'
    const seatsStr  = seatLabels.length > 0 ? seatLabels.join('  ·  ') : `${res1.total_seats} siège(s)`

    // 4. Générer le QR code (payload JSON simple pour le PDF)
    const qrPayload = JSON.stringify({ v: 2, ticketId: reservationId, code })
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 200, errorCorrectionLevel: 'H' })
    const qrBuffer  = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')

    // 5. Générer le PDF
    const doc = new PDFDocument({ size: [400, 650], margin: 0 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=billet-${code}.pdf`)
    doc.pipe(res)

    const W = 400

    // ── Header doré ──────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 100).fill('#1a1a1a')
    doc.rect(0, 96, W, 4).fill('#D4AF37')

    // Cercle logo
    doc.circle(50, 50, 32).fill('#111').stroke('#D4AF37').lineWidth(2)
    doc.fillColor('#D4AF37').fontSize(24).font('Helvetica-Bold').text('J', 38, 36)

    // Texte header
    doc.fillColor('#D4AF37').fontSize(8).font('Helvetica').text('BILLET OFFICIEL', 92, 28, { characterSpacing: 2 })
    doc.fillColor('#D4AF37').fontSize(20).font('Helvetica-Bold').text('JAJE CINÉ', 92, 40)
    doc.fillColor('rgba(212,175,55,0.6)').fontSize(9).font('Helvetica').text('jaje.org — Cinéma Communautaire', 92, 66)

    // ── Titre du film ─────────────────────────────────────────────────────────
    doc.rect(0, 100, W, 65).fill('#f9fafb')
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text('FILM', 24, 114, { characterSpacing: 1.5 })
    doc.fillColor('#111').fontSize(18).font('Helvetica-Bold').text(filmTitle, 24, 126, { width: W - 48 })

    // ── Grille infos ──────────────────────────────────────────────────────────
    const infoY = 180
    doc.rect(0, 165, W, 2).fill('#e5e7eb')

    const cells = [
      { label: 'DATE',       value: showDate,  x: 24,        width: 200 },
      { label: 'HEURE',      value: showTime,  x: 24+200+8,  width: 120 },
      { label: 'SALLE',      value: roomName,  x: 24,        width: 120 },
      { label: 'SIÈGE(S)',   value: seatsStr,  x: 24+120+8,  width: 200 },
    ]

    cells.forEach(({ label, value, x, width }, i) => {
      const y = infoY + Math.floor(i / 2) * 52
      doc.rect(x - 6, y - 6, width, 44).fill('#f9fafb').roundedRect(x - 6, y - 6, width, 44, 6).fill('#f9fafb')
      doc.fillColor('#9ca3af').fontSize(7).font('Helvetica').text(label, x, y, { characterSpacing: 1 })
      doc.fillColor('#111').fontSize(12).font('Helvetica-Bold').text(value, x, y + 12, { width })
    })

    // ── Réservé pour ──────────────────────────────────────────────────────────
    const guestY = infoY + 110
    doc.rect(18, guestY, W - 36, 50).roundedRect(18, guestY, W - 36, 50, 8).fill('#f9fafb')
    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica').text('RÉSERVÉ POUR', 30, guestY + 8, { characterSpacing: 1 })
    doc.fillColor('#111').fontSize(13).font('Helvetica-Bold').text(guestName, 30, guestY + 22)

    // ── Ligne perforée ────────────────────────────────────────────────────────
    const perfY = guestY + 68
    doc.circle(0, perfY, 12).fill('#e5e7eb')
    doc.circle(W, perfY, 12).fill('#e5e7eb')
    doc.dash(6, { space: 4 }).moveTo(12, perfY).lineTo(W - 12, perfY).stroke('#d1d5db').undash()

    // ── QR Code ───────────────────────────────────────────────────────────────
    const qrY = perfY + 20
    doc.rect((W - 140) / 2 - 12, qrY - 12, 164, 164).roundedRect((W - 140) / 2 - 12, qrY - 12, 164, 164, 10).fill('#fff')
    doc.rect((W - 140) / 2 - 10, qrY - 10, 160, 160).roundedRect((W - 140) / 2 - 10, qrY - 10, 160, 160, 8).stroke('#D4AF37').lineWidth(2)
    doc.image(qrBuffer, (W - 140) / 2, qrY, { fit: [140, 140] })

    // Code sous le QR
    doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text('CODE DE CONFIRMATION', 0, qrY + 148, { align: 'center', characterSpacing: 1.5 })
    doc.fillColor('#1a1a1a').fontSize(17).font('Helvetica-Bold').text(code, 0, qrY + 162, { align: 'center', characterSpacing: 1 })

    // ── Ligne perforée bas ────────────────────────────────────────────────────
    const perf2Y = qrY + 188
    doc.circle(0, perf2Y, 12).fill('#e5e7eb')
    doc.circle(W, perf2Y, 12).fill('#e5e7eb')
    doc.dash(6, { space: 4 }).moveTo(12, perf2Y).lineTo(W - 12, perf2Y).stroke('#d1d5db').undash()

    // ── Pied : prix + paiement ────────────────────────────────────────────────
    const footerY = perf2Y + 18
    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica').text('PAIEMENT', 24, footerY, { characterSpacing: 1 })
    doc.fillColor('#1a1a1a').fontSize(12).font('Helvetica-Bold').text(payMethod, 24, footerY + 12)
    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica').text('TOTAL', W - 100, footerY, { characterSpacing: 1 })
    doc.fillColor('#D4AF37').fontSize(18).font('Helvetica-Bold').text(`${price} HTG`, W - 110, footerY + 8, { width: 90, align: 'right' })

    // ── Footer noir ───────────────────────────────────────────────────────────
    doc.rect(0, 620, W, 30).fill('#1a1a1a')
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(
      `Réservé le ${new Date(res1.created_at).toLocaleDateString('fr-FR')}   ·   jaje.org`,
      0, 630, { align: 'center' }
    )

    doc.end()
  } catch (err: any) {
    console.error('PDF ERROR:', err)
    if (!res.headersSent) res.status(500).json({ error: 'Erreur génération PDF' })
  }
})

// ── POST /api/ticket/pdf (legacy compat) ──────────────────────────────────
app.post('/api/ticket/pdf', (req, res) => {
  const id = req.body?.reservationId || req.body?.id
  if (id) return res.redirect(`/api/ticket/pdf?id=${id}`)
  return res.status(400).json({ error: 'Utilisez GET /api/ticket/pdf?id=...' })
})

// ── POST /api/admin/emergency-reset ───────────────────────────────────────
/**
 * Endpoint d'urgence — localhost uniquement.
 * Body: { password: string }
 * Réinitialise support@jaje.org puis auto-détruit la page React et la route.
 */
app.post('/api/admin/emergency-reset', async (req, res) => {

  // 1. Guard : localhost uniquement
  const remoteIp =
    req.ip ??
    req.socket?.remoteAddress ??
    String(req.headers['x-forwarded-for'] ?? '').split(',')[0] ??
    ''

  const isLocalhost =
    remoteIp === '127.0.0.1'       ||
    remoteIp === '::1'              ||
    remoteIp === '::ffff:127.0.0.1' ||
    remoteIp === 'localhost'

  if (!isLocalhost) {
    return res.status(403).json({ error: 'Accès refusé : localhost uniquement.' })
  }

  // 2. Validation mot de passe
  const { password } = req.body as { password?: string }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères.' })
  }

  // 3. Clés d'environnement
  const supabaseUrl    = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error:
        'Variable manquante dans .env.local.\n' +
        'Ajoutez : SUPABASE_SERVICE_ROLE_KEY=<votre clé service_role>\n' +
        'Puis relancez le serveur.',
    })
  }

  try {
    // 4. Client Admin Supabase (Service Role uniquement côté serveur)
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const TARGET_EMAIL = 'support@jaje.org'

    // 5. Trouver l'utilisateur
    const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
    if (listError) {
      return res.status(500).json({ error: `Erreur listUsers : ${listError.message}` })
    }

    const allUsers = usersData.users as Array<{ id: string; email?: string }>
    const targetUser = allUsers.find(
      (u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase()
    )
    if (!targetUser) {
      return res.status(404).json({ error: `Utilisateur ${TARGET_EMAIL} introuvable dans Supabase Auth.` })
    }

    // 6. Mettre à jour le mot de passe
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.id,
      { password }
    )
    if (updateError) {
      return res.status(500).json({ error: `Erreur updateUserById : ${updateError.message}` })
    }

    console.log(`✅ Mot de passe de ${TARGET_EMAIL} mis à jour.`)

    // 7. Auto-destruction
    try {
      // Supprimer la page React
      const pagePath = path.resolve(__dirname, '../src/pages/dev/reset-admin/page.tsx')
      if (fs.existsSync(pagePath)) {
        fs.unlinkSync(pagePath)
        console.log('🗑️  Page supprimée :', pagePath)

        // Nettoyer les dossiers vides
        for (const dir of [path.dirname(pagePath), path.dirname(path.dirname(pagePath))]) {
          try {
            if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
              fs.rmdirSync(dir)
            }
          } catch { /* ignore */ }
        }
      }

      // Supprimer l'import + le bloc de route dans router/config.tsx
      const routerPath = path.resolve(__dirname, '../src/router/config.tsx')
      if (fs.existsSync(routerPath)) {
        let content = fs.readFileSync(routerPath, 'utf-8')

        // Supprimer la ligne d'import lazy
        content = content.replace(
          /\r?\nconst EmergencyResetPage = lazy\(\(\) => import\('[^']+'\)\);?/,
          ''
        )

        // Supprimer le bloc entre les marqueurs (inclus)
        content = content.replace(
          /[ \t]*\/\/ __EMERGENCY_RESET_START__[\s\S]*?\/\/ __EMERGENCY_RESET_END__[ \t]*\r?\n?/,
          ''
        )

        fs.writeFileSync(routerPath, content, 'utf-8')
        console.log('🗑️  Route supprimée de router/config.tsx')
      }
    } catch (destructErr) {
      // Le MDP a bien été changé — l'auto-destruction est optionnelle
      console.warn('⚠️  Auto-destruction partielle :', destructErr)
    }

    return res.json({
      ok: true,
      message: `Mot de passe de ${TARGET_EMAIL} réinitialisé avec succès. Page supprimée.`,
    })

  } catch (err: any) {
    console.error('EMERGENCY RESET ERROR:', err)
    return res.status(500).json({ error: err?.message ?? 'Erreur inconnue' })
  }
})

// ── Démarrage ──────────────────────────────────────────────────────────────
const PORT = 4000
app.listen(PORT, () => {
  console.log(`🚀 Emergency reset server running on port ${PORT}`)
  console.log(`   PDF   → POST http://localhost:${PORT}/api/ticket/pdf`)
  console.log(`   Reset → POST http://localhost:${PORT}/api/admin/emergency-reset`)
})
