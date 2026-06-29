import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../../components/feature/Navbar'
import Footer from '../../../components/feature/Footer'
import { supabase } from '../../../lib/supabaseClient'

type PaymentMethod = 'moncash' | 'natcash' | 'cash'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ✅ on récupère les infos passées dans l'URL
  const showtimeId = searchParams.get('showtimeId') || ''
  const seatsParam = searchParams.get('seats') || '' // ex: "A1,B2"

  const selectedSeats = useMemo(
    () => seatsParam.split(',').map((s) => s.trim()).filter(Boolean),
    [seatsParam]
  )

  // ✅ états chargement données séance
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showtime, setShowtime] = useState<any>(null)
  const [movie, setMovie] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)

  useEffect(() => {
    if (!showtimeId) {
      setLoadError('Aucune séance fournie')
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)

        const { data: showtimeData, error } = await supabase
          .from('showtimes')
          .select(`
            id,
            movie_id,
            room_id,
            show_date,
            show_time,
            base_price_htg,
            multiplier,
            status,
            movie:movies(*),
            room:rooms(*)
          `)
          .eq('id', showtimeId)
          .single()

        if (error) throw error
        
        setShowtime(showtimeData)
        setMovie(showtimeData?.movie ?? null)
        setRoom(showtimeData?.room ?? null)
      } catch (err: any) {
        console.error('Erreur chargement séance:', err)
        setLoadError(err?.message || 'Erreur chargement séance')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [showtimeId])

  // -- SOURCE UNIQUE DU PRIX : showtimes.base_price_htg ---------------------
  const unitPrice  = Number(showtime?.base_price_htg ?? 0)
  const totalPrice = selectedSeats.length * unitPrice

  // ✅ état formulaire (guest)
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [transactionNumber, setTransactionNumber] = useState('')
  const [txnError, setTxnError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentNumbers = {
    moncash: '47 94 5556',
    natcash: '55 70 1164',
  } as const

  const isFormValid = () => {
    const basicOk =
      userInfo.firstName.trim() &&
      userInfo.lastName.trim() &&
      userInfo.email.trim() &&
      userInfo.phone.trim()

    if (!basicOk) return false
    if (!selectedPaymentMethod) return false

    if (selectedPaymentMethod === 'moncash' || selectedPaymentMethod === 'natcash') {
      const txn = transactionNumber.trim()
      const txnRegex = /^[A-Za-z0-9]+$/
      if (!txn || !txnRegex.test(txn) || txn.length < 8 || txn.length > 50) {
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setIsProcessing(true)
    console.log("selectedSeats =", selectedSeats)
    console.log("showtimeId =", showtimeId)
    console.log("room_id =", showtime?.room_id)
    let reservationId: string | null = null

    try {
      // Générer un code de confirmation unique
      const confirmationCode = `JC-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`

      // 1. Insérer la réservation principale
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          confirmation_code: confirmationCode,
          showtime_id: showtimeId,
          guest_email: userInfo.email,
          guest_phone: userInfo.phone,
          guest_name: `${userInfo.firstName} ${userInfo.lastName}`,
          total_seats: selectedSeats.length,
          total_price_htg: totalPrice,
          payment_method: selectedPaymentMethod?.toUpperCase(),
          transaction_reference: (selectedPaymentMethod === 'moncash' || selectedPaymentMethod === 'natcash') 
            ? transactionNumber.trim() 
            : null,
          status: 'PENDING',
          payment_status: selectedPaymentMethod === 'cash' ? 'CASH_A_LARRIVEE' : 'EN_ATTENTE_VALIDATION',
          // Phase 9 — nouvelles colonnes statuts séparés
          reservation_status: 'confirmed',
          entry_status: 'not_used'
        })
        .select()
        .single()

      if (reservationError) throw reservationError
      reservationId = reservationData.id

      // ✅ Convertir labels ("A1") -> UUID seat_id via table seats
      const { data: seatRecords, error: seatsErr } = await supabase
        .from('seats')
        .select('id,row_letter,seat_number')
        .eq('room_id', showtime?.room_id)

      if (seatsErr) throw seatsErr

      // Support des deux formats : "A5" (ancien) et "A-5" (nouveau)
      const seatIdByLabel = new Map(
        (seatRecords ?? []).flatMap(s => [
          [`${s.row_letter}${s.seat_number}`,   s.id],   // ex: "A5"
          [`${s.row_letter}-${s.seat_number}`,  s.id],   // ex: "A-5"
        ])
      )

      // Sécurité: vérifier que tous les labels existent
      const missing = selectedSeats.filter((label: string) => !seatIdByLabel.has(label))
      if (missing.length) {
        throw new Error(`Sièges introuvables: ${missing.join(', ')}`)
      }

      // Vérifier les seats déjà réservés pour ce showtime
      const seatIds = selectedSeats
        .map((label: string) => seatIdByLabel.get(label))
        .filter(Boolean)

      const { data: alreadyReserved, error: reservedErr } = await supabase
        .from('reservation_seats')
        .select('seat_id')
        .eq('showtime_id', showtimeId)
        .in('seat_id', seatIds as string[])

      if (reservedErr) throw reservedErr

      if (alreadyReserved && alreadyReserved.length > 0) {
        const reservedSeatIds = (alreadyReserved ?? []).map((r: any) => r.seat_id as string)
        const reservedLabels = selectedSeats.filter((label: string) => {
          const id = seatIdByLabel.get(label)
          return id ? reservedSeatIds.includes(id) : false  
        })
        throw new Error(`Sièges déjà réservés pour cette séance: ${reservedLabels.join(', ')}`)
      }

      // 2. Insérer les sièges dans reservation_seats
      const seatInserts = selectedSeats.map((label: string) => ({
        reservation_id: reservationId!,
        seat_id: seatIdByLabel.get(label),
        showtime_id: showtimeId,
        price_htg: unitPrice, // source unique : showtimes.base_price_htg
      }))

      const { error: seatsError } = await supabase
        .from('reservation_seats')
        .insert(seatInserts)

      if (seatsError) {
  // Rollback: supprimer la réservation principale
  await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)

  // Cas: siège déjà réservé (contrainte UNIQUE)
  if (seatsError.code === '23505') {
    throw new Error(
      "❌ Ce siège vient d'être réservé par quelqu'un d'autre. Merci de choisir un autre siège."
    )
  }

  // Autres erreurs
  throw new Error(
    "❌ Erreur lors de la réservation des sièges : " + seatsError.message
  )
}

      // 3. Naviguer vers la page de confirmation
      navigate(`/reservation/confirmation/${reservationId}`, {
        state: {
          reservationData: {
            showtimeId,
            selectedSeats,
            customerInfo: userInfo,
            paymentMethod:
              selectedPaymentMethod === 'moncash'
                ? 'MonCash'
                : selectedPaymentMethod === 'natcash'
                ? 'NatCash'
                : "Cash à l'entrée",
            transactionNumber: transactionNumber || undefined,
            confirmationCode,
            totalPrice
          },
        },
      })

    } catch (err: any) {
      console.error('Erreur réservation:', err)
      alert(`Erreur: ${err.message || 'Une erreur est survenue lors de la réservation'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 🔒 si l'URL est incomplète, on renvoie vers séances
  if (!showtimeId || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 pt-28 pb-12">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-lg font-semibold mb-2">Informations manquantes</p>
            <p className="text-gray-300 mb-4">
              Impossible de finaliser la réservation sans séance et sièges.
            </p>
            <button
              onClick={() => navigate('/seances')}
              className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold"
            >
              Retour aux séances
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // ✅ Optionnel: écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-12">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-gray-200">Chargement de la séance...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <p className="text-lg font-semibold mb-2">Erreur</p>
            <p className="text-gray-200 mb-4">{loadError}</p>
            <button
              onClick={() => navigate('/seances')}
              className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold"
            >
              Retour aux séances
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-12">
        <h1 className="text-3xl md:text-4xl font-serif mb-8">Finaliser votre réservation</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Infos */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Vos informations</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Prénom *</label>
                  <input
                    value={userInfo.firstName}
                    onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/40 border border-white/15 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Nom *</label>
                  <input
                    value={userInfo.lastName}
                    onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/40 border border-white/15 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/40 border border-white/15 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Téléphone *</label>
                  <input
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/40 border border-white/15 focus:outline-none"
                    placeholder="Ex: 3712-3456"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-200">
                  💡 Conseil : créez un compte pour retrouver facilement vos réservations.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/auth/register')}
                  className="mt-2 text-sm text-yellow-400 underline"
                >
                  Créer un compte maintenant
                </button>
              </div>
            </div>

            {/* Paiement */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Choisir votre méthode de paiement</h2>

              <div className="space-y-3">
                {(['moncash', 'natcash', 'cash'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMethod(m)
                      setTransactionNumber('')
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition ${
                      selectedPaymentMethod === m
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {m === 'moncash' ? 'MonCash' : m === 'natcash' ? 'NatCash' : "Cash à l'entrée"}
                        </div>
                        <div className="text-sm text-gray-300">
                          {m === 'cash' ? 'Payez au guichet avant la séance' : 'Paiement mobile'}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border ${
                          selectedPaymentMethod === m
                            ? 'bg-yellow-500 border-yellow-500'
                            : 'border-white/30'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {selectedPaymentMethod && (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {(selectedPaymentMethod === 'moncash' || selectedPaymentMethod === 'natcash') && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-sm text-gray-200 mb-2">Envoyez le montant au numéro :</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {paymentNumbers[selectedPaymentMethod]}
                      </p>

                      <label className="block text-sm mt-4 mb-2">Numéro de transaction *</label>
                      <input
                        value={transactionNumber}
                        onChange={(e) => {
                          const txnClean = e.target.value.replace(/[^A-Za-z0-9]/g, '')
                          setTransactionNumber(txnClean)
                          
                          // Validation et mise à jour de l'erreur
                          if (txnClean && (txnClean.length < 8 || txnClean.length > 50)) {
                            setTxnError('Le numéro doit contenir entre 8 et 50 caractères alphanumériques')
                          } else if (txnClean && !/^[A-Za-z0-9]+$/.test(txnClean)) {
                            setTxnError('Caractères non autorisés')
                          } else {
                            setTxnError('')
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-md bg-black/40 border focus:outline-none ${
                          txnError ? 'border-red-500' : 'border-white/15'
                        }`}
                        placeholder="Ex: ABC123XYZ"
                        required
                      />
                      {txnError && (
                        <p className="text-xs text-red-400 mt-1">{txnError}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        La réservation sera confirmée après validation.
                      </p>
                    </div>
                  )}

                  {selectedPaymentMethod === 'cash' && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-sm text-gray-200">
                        Paiement au guichet avant la séance (arrivez 15–30 min en avance).
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isFormValid() || isProcessing}
                    className={`w-full py-3 rounded-lg font-semibold ${
                      isFormValid() && !isProcessing
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing
                      ? 'Traitement...'
                      : selectedPaymentMethod === 'cash'
                      ? 'Confirmer la réservation'
                      : "J'ai payé"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 text-black">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📋 Récapitulatif</h2>

              {movie && showtime && (
                <div className="space-y-4">
                  {/* Film */}
                  <div className="flex gap-4 border-b pb-4">
                    <img
                      src={movie.poster_url || movie.poster || '/placeholder.jpg'}
                      alt={movie.title}
                      className="w-20 h-28 object-cover rounded-md shadow"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-yellow-600">{movie.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>⏱ {movie.duration || '—'} min</p>
                        <p>⭐ {movie.rating || '—'}/10</p>
                      </div>
                    </div>
                  </div>

                  {/* Séance */}
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">📅 Séance</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {(() => {
                        const dateStr = showtime?.show_date
                        const timeStr = showtime?.show_time
                        const dt = dateStr && timeStr ? new Date(`${dateStr}T${timeStr}`) : null
                        
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Date :</span>
                              <span className="font-medium">
                                {dt ? dt.toLocaleDateString('fr-FR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                }) : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Heure :</span>
                              <span className="font-medium">
                                {dt ? dt.toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) : (timeStr ? String(timeStr).slice(0,5) : '—')}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                      <div className="flex justify-between">
                        <span>Salle :</span>
                        <span className="font-medium">{room?.name || room?.label || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sièges */}
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-2">💺 Sièges sélectionnés</h4>
                    <div className="space-y-2">
                      {(selectedSeats || []).map((seat: string, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>🎟 Place {seat}</span>
                          <span className="font-medium">{Number(unitPrice || 0).toLocaleString()} HTG</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold text-yellow-600">
                        {Number(totalPrice || 0).toLocaleString()} HTG
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedSeats.length} siège{selectedSeats.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Conditions */}
                  <div className="bg-gray-50 rounded-lg p-4 mt-4 text-xs text-gray-600 space-y-1">
                    <p>• Billets non échangeables ni remboursables</p>
                    <p>• Arrivée recommandée 15 min avant</p>
                    <p>• Confirmation par email</p>
                    <p>• Présenter la confirmation au guichet</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}