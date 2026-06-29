// src/pages/reservation/page.tsx
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/feature/Navbar';
import { Footer } from '../../components/feature/Footer';
import Button from '../../components/base/Button';

export default function ReservationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold mb-6">
            <span>🎫</span>
            <span>RÉSERVATION EN LIGNE</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">Réservez vos places</h1>

          <p className="text-gray-300 max-w-2xl mx-auto mb-10">
            Réservez vos billets en quelques clics et profitez d'une expérience cinéma exceptionnelle au JAJE Ciné.
            Choisissez votre film, votre séance et vos sièges préférés.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-3">🎬</div>
              <h3 className="font-semibold mb-2">1. Choisir un film</h3>
              <p className="text-gray-400 text-sm">Parcourez notre sélection de films à l'affiche et à venir</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-3">📅</div>
              <h3 className="font-semibold mb-2">2. Sélectionner une séance</h3>
              <p className="text-gray-400 text-sm">Choisissez la date et l'horaire qui vous conviennent</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-3">💺</div>
              <h3 className="font-semibold mb-2">3. Choisir vos sièges</h3>
              <p className="text-gray-400 text-sm">Sélectionnez vos places préférées dans la salle</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/seances')} size="lg">
              <i className="ri-calendar-check-line mr-2"></i>
              Choisir une séance
            </Button>

            <Button onClick={() => navigate('/films')} variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-black">
              <i className="ri-movie-2-line mr-2"></i>
              Voir les films
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}