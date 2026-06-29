import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../../components/feature/Navbar';
import Footer from '../../../components/feature/Footer';
import { supabase } from '../../../lib/supabaseClient';

export default function FilmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { navigate('/films', { replace: true }); return; }

    const load = async () => {
      setLoading(true);
      setError(null);

      const [movieRes, showtimesRes] = await Promise.all([
        supabase.from('movies').select('*').eq('id', id).single(),
        supabase
          .from('showtimes')
          .select('id, show_date, show_time, base_price_htg, available_seats, status, rooms(name)')
          .eq('movie_id', id)
          .gte('show_date', new Date().toISOString().slice(0, 10))
          .order('show_date', { ascending: true })
          .order('show_time', { ascending: true }),
      ]);

      if (movieRes.error || !movieRes.data) {
        setError('Film introuvable');
      } else {
        setMovie(movieRes.data);
        setShowtimes(showtimesRes.data ?? []);
      }
      setLoading(false);
    };

    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="text-gray-400">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-12 text-center">
          <p className="text-red-400 text-xl mb-6">{error || 'Film introuvable'}</p>
          <Link to="/films" className="bg-gold text-black px-6 py-3 rounded-full font-semibold">
            Retour aux films
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const statusLabel = movie.status === 'A_L_AFFICHE' ? "À l'affiche" : movie.status === 'BIENTOT' ? 'Bientôt' : 'Archivé';
  const hours = Math.floor(movie.duration_minutes / 60);
  const mins = movie.duration_minutes % 60;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-20">
        {movie.poster_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url(${movie.poster_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />

        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Affiche */}
            <div className="flex-shrink-0">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-48 h-72 object-cover rounded-2xl shadow-2xl ring-2 ring-gold/30"
                />
              ) : (
                <div className="w-48 h-72 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <i className="ri-film-line text-5xl text-gray-600"></i>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  movie.status === 'A_L_AFFICHE' ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
                  movie.status === 'BIENTOT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                  'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                }`}>{statusLabel}</span>
                {movie.rating && (
                  <span className="px-3 py-1 bg-gold/20 text-gold border border-gold/40 rounded-full text-xs font-semibold">
                    {movie.rating}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{movie.title}</h1>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-gray-400 text-lg italic mb-4">{movie.original_title}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-6">
                <span><i className="ri-time-line mr-1 text-gold"></i>{hours}h{mins > 0 ? ` ${mins}min` : ''}</span>
                <span><i className="ri-movie-2-line mr-1 text-gold"></i>{movie.genre}</span>
                {movie.language && <span><i className="ri-translate-2 mr-1 text-gold"></i>{movie.language}</span>}
                {movie.director && <span><i className="ri-user-line mr-1 text-gold"></i>{movie.director}</span>}
                {movie.release_date && (
                  <span><i className="ri-calendar-line mr-1 text-gold"></i>
                    {new Date(movie.release_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>

              {movie.synopsis && (
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">{movie.synopsis}</p>
              )}

              {movie.actors && (
                <p className="text-gray-400 text-sm mb-6">
                  <span className="text-white font-medium">Avec :</span> {movie.actors}
                </p>
              )}

              <div className="flex gap-4">
                {movie.trailer_url && (
                  <a
                    href={movie.trailer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors"
                  >
                    <i className="ri-play-circle-line text-xl"></i>
                    Bande-annonce
                  </a>
                )}
                {showtimes.length > 0 && (
                  <a
                    href="#seances"
                    className="flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors"
                  >
                    <i className="ri-ticket-2-line text-xl"></i>
                    Réserver
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Séances disponibles */}
      <section id="seances" className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-serif font-bold text-white mb-6">
          Séances disponibles
        </h2>

        {showtimes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <i className="ri-calendar-close-line text-5xl text-gray-600 mb-4"></i>
            <p className="text-gray-400 text-lg">Aucune séance programmée pour ce film</p>
            <Link to="/seances" className="inline-block mt-4 text-gold hover:underline">
              Voir toutes les séances
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {showtimes.map((s) => {
              const date = new Date(`${s.show_date}T${s.show_time}`);
              const isAvailable = s.status === 'ACTIF' && s.available_seats > 0;

              return (
                <div
                  key={s.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-gold/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-gold font-bold text-xl">
                        {s.show_time.slice(0, 5)}
                      </p>
                    </div>
                    {s.status === 'COMPLET' ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">Complet</span>
                    ) : s.status === 'ANNULE' ? (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/30">Annulé</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">{s.available_seats} places</span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-3">
                    <i className="ri-building-line mr-1"></i>
                    {(s.rooms as any)?.name || 'Salle'}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold">{Number(s.base_price_htg).toLocaleString()} HTG</p>
                    <button
                      onClick={() => navigate(`/reservation/seat-selection/${s.id}`)}
                      disabled={!isAvailable}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        isAvailable
                          ? 'bg-gold text-black hover:bg-yellow-400'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isAvailable ? 'Choisir' : s.status === 'COMPLET' ? 'Complet' : 'Indisponible'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
