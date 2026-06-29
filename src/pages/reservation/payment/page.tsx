// src/pages/reservation/payment/page.tsx
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams, Navigate } from "react-router-dom";

import Navbar from "../../../components/feature/Navbar";
import Footer from "../../../components/feature/Footer";
import Button from "../../../components/base/Button";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { reservationId } = useParams<{ reservationId: string }>();
  const [searchParams] = useSearchParams();

  const showtimeId = searchParams.get("showtimeId") || "";
  const seatsRaw = searchParams.get("seats") || "";

  const seats = useMemo(() => {
    if (!seatsRaw) return [];
    return decodeURIComponent(seatsRaw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [seatsRaw]);

  // ✅ Autoriser 2 modes :
  // - /reservation/payment/:reservationId
  // - /reservation/payment?showtimeId=...&seats=...
  const hasEnoughInfo = Boolean(reservationId) || (Boolean(showtimeId) && seats.length > 0);

  if (!hasEnoughInfo) {
    return <Navigate to="/seances" replace />;
  }

  const handlePay = () => {
  if (!showtimeId) return

  const seatsParam = Array.isArray(seats) ? seats.join(',') : (seats || '')

  navigate(
    `/reservation/checkout?showtimeId=${showtimeId}&seats=${encodeURIComponent(seatsParam)}`
  )
}

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">
          Paiement
        </h1>

        {!reservationId && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <p className="text-gray-300">
              Séance : <span className="text-gold font-semibold">{showtimeId}</span>
            </p>
            <p className="text-gray-300 mt-2">
              Sièges : <span className="text-gold font-semibold">{seats.join(", ")}</span>
            </p>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-gray-300 mb-6">
            (Mock) Ici tu mettras Stripe / MonCash / etc.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() =>
                showtimeId
                  ? navigate(`/reservation/seat-selection/${showtimeId}`)
                  : navigate("/seances")
              }
            >
              Retour
            </Button>

            <Button size="lg" onClick={handlePay} className="w-full sm:w-auto">
              Payer et confirmer
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}