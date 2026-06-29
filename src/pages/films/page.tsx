import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/feature/Navbar';
import { Footer } from '../../components/feature/Footer';
import MovieCard from '../../components/feature/MovieCard';
import { supabase } from '../../lib/supabaseClient';

export default function Films() {
  const [activeFilter, setActiveFilter] = useState('tous');
  const [selectedGenre, setSelectedGenre] = useState('tous');
  const [selectedDuration, setSelectedDuration] = useState('tous');
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovies = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('[MOVIES RAW FROM SUPABASE]', data);

    if (error) {
      console.error('Erreur chargement films:', error);
      setError("Impossible de charger les films.");
      setMovies([]);
    } else {
      // Mapping DB vers UI avec conversion des statuts
      const statusMap = {
        "A_L_AFFICHE": "MAINTENANT",
        "BIENTOT": "BIENTOT", 
        "ARCHIVE": "ARCHIVE",
      };

      const mapped = (data || []).map(m => ({
        ...m,
        duration: m.duration_minutes,
        poster: m.poster_url,
        trailerUrl: m.trailer_url,
        status: statusMap[m.status as keyof typeof statusMap] || m.status,
      }));
      setMovies(mapped);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadMovies();
  }, []);
  
  const genres = ['tous', 'Action', 'Aventure', 'Animation', 'Drame', 'Thriller', 'Crime'];
  const durations = [
    { value: 'tous', label: 'Toutes durées' },
    { value: 'court', label: 'Moins de 2h' },
    { value: 'moyen', label: '2h à 2h30' },
    { value: 'long', label: 'Plus de 2h30' }
  ];

  const filterMovies = () => {
    let filtered = movies;

    // Filtre par statut
    if (activeFilter !== 'tous') {
      filtered = filtered.filter(movie => {
        if (activeFilter === 'affiche') return movie.status === 'MAINTENANT';
        if (activeFilter === 'bientot') return movie.status === 'BIENTOT';
        return true;
      });
    }

    // Filtre par genre
    if (selectedGenre !== 'tous') {
      filtered = filtered.filter(movie => 
        movie.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    // Filtre par durée
    if (selectedDuration !== 'tous') {
      filtered = filtered.filter(movie => {
        const duration = parseInt(movie.duration);
        if (selectedDuration === 'court') return duration < 120;
        if (selectedDuration === 'moyen') return duration >= 120 && duration <= 150;
        if (selectedDuration === 'long') return duration > 150;
        return true;
      });
    }

    return filtered;
  };

  const filteredMovies = filterMovies();

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* En-tête de page */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-dark-gray to-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-block bg-gold/20 rounded-full px-4 py-2 mb-4">
              <span className="text-gold text-sm font-semibold tracking-wider uppercase">Notre Programmation</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Tous nos Films</h1>
            <p className="text-light-gray text-lg max-w-2xl mx-auto">
              Découvrez notre sélection complète de films à l'affiche et à venir
            </p>
          </div>
        </div>
      </section>

      {/* Barre de filtres sticky */}
      <div className="sticky top-20 bg-black/95 backdrop-blur-md border-b border-gray-800 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtres de statut */}
            <div className="flex items-center space-x-3">
              {[
                { value: 'tous', label: 'Tous' },
                { value: 'affiche', label: 'À l\'Affiche' },
                { value: 'bientot', label: 'À Venir' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                    activeFilter === filter.value
                      ? 'bg-gold text-black'
                      : 'bg-dark-gray text-white hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Séparateur */}
            <div className="h-6 w-px bg-gray-600"></div>

            {/* Filtre par genre */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-dark-gray text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-gold appearance-none pr-8"
              >
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre === 'tous' ? 'Tous les genres' : genre}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-white pointer-events-none"></i>
            </div>

            {/* Filtre par durée */}
            <div className="relative">
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="bg-dark-gray text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-gold appearance-none pr-8"
              >
                {durations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
              <i className="ri-time-line absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray"></i>
              <i className="ri-arrow-down-s-line absolute right-2 top-1/2 transform -translate-y-1/2 text-white pointer-events-none"></i>
            </div>

            {/* Nombre de résultats */}
            <div className="ml-auto text-light-gray text-sm">
              {filteredMovies.length} film{filteredMovies.length !== 1 ? 's' : ''} trouvé{filteredMovies.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Grille de films */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-light-gray">Chargement des films...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400">Impossible de charger les films.</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-20">
              <i className="ri-film-line text-6xl text-gray-600 mb-6"></i>
              <h3 className="text-2xl font-semibold text-white mb-4">Aucun film trouvé</h3>
              <p className="text-light-gray mb-8">
                Essayez de modifier vos critères de recherche ou explorez d'autres catégories
              </p>
              <button
                onClick={() => {
                  setActiveFilter('tous');
                  setSelectedGenre('tous');
                  setSelectedDuration('tous');
                }}
                className="bg-gold text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-400 transition-colors duration-300"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredMovies.map((movie) => (
                <Link key={movie.id} to={`/films/${movie.id}`}>
                  <MovieCard movie={movie} variant="grid" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}