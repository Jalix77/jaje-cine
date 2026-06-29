import { Component, useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/feature/Navbar';
import { Footer } from '../../components/feature/Footer';
import Button from '../../components/base/Button';
import { supabase } from '../../lib/supabaseClient';

// ── Types Supabase ──────────────────────────────────────────────────────────
// NB: `rating` peut être un nombre (note /10) OU une string (classification G/PG/R…)
interface DbMovie {
  id: string;
  title: string | null;
  genre: string | null;
  duration_minutes: number | null;
  rating: number | string | null;
  poster_url: string | null;
  status: string;
  release_date: string | null;
}

// ── Error Boundary — empêche une carte de faire crasher toute la page ───────
class MovieCardErrorBoundary extends Component<
  { children: ReactNode; title?: string | null },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; title?: string | null }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) {
    console.error('[MovieCard] erreur rendu:', err.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-shrink-0 w-72 aspect-[2/3] bg-gray-800 rounded-2xl flex items-center justify-center border border-dashed border-gray-700">
          <div className="text-center p-4">
            <i className="ri-image-line text-3xl text-gray-600 mb-2 block" />
            <p className="text-gray-500 text-sm">Affiche non disponible</p>
            {this.props.title && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{this.props.title}</p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Composant MovieCard ─────────────────────────────────────────────────────
function MovieCard({ movie, variant = 'carousel' }: {
  movie: DbMovie;
  variant?: 'carousel' | 'grid';
}) {
  const [hovered, setHovered] = useState(false);

  // ── Fallbacks sécurisés ──────────────────────────────────────────────────
  const safeTitle  = movie.title  ?? 'Film sans titre';
  const safeGenre  = movie.genre  ?? 'Non classé';
  const safeStatus = movie.status ?? '';

  const durationLabel = movie.duration_minutes
    ? `${movie.duration_minutes} min`
    : 'Durée non précisée';

  // rating peut être un nombre (ex: 8.2) OU une classification (ex: "G", "PG-13")
  const isNumericRating = typeof movie.rating === 'number';
  const ratingDisplay = (() => {
    if (movie.rating == null) return null;
    if (isNumericRating) return `★ ${(movie.rating as number).toFixed(1)}`;
    return movie.rating as string; // classification textuelle
  })();

  const posterFallback =
    'https://placehold.co/400x600/1a1a1a/888888?text=Affiche+non+disponible';

  const statusLabel =
    safeStatus === 'A_L_AFFICHE' ? "À l'affiche" :
    safeStatus === 'BIENTOT'     ? 'Bientôt'     : '';

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 ${
        variant === 'carousel' ? 'flex-shrink-0 w-72' : 'w-full'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/films/${movie.id}`}>
        <div
          className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
            hovered ? 'scale-105 shadow-2xl shadow-yellow-500/20' : ''
          }`}
        >
          <div className="relative aspect-[2/3]">
            <img
              src={movie.poster_url || posterFallback}
              alt={safeTitle}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = posterFallback;
              }}
            />

            {/* Badge classification (G, PG, R…) */}
            {ratingDisplay && !isNumericRating && (
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                {ratingDisplay}
              </div>
            )}

            {/* Badge date de sortie */}
            {safeStatus === 'BIENTOT' && movie.release_date && (
              <div className="absolute top-4 left-4 bg-coral text-white px-3 py-1 rounded-full text-sm font-semibold">
                {(() => {
                  try {
                    return (
                      'Dès le ' +
                      new Date(movie.release_date!).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })
                    );
                  } catch {
                    return 'Bientôt';
                  }
                })()}
              </div>
            )}

            {/* Overlay dégradé */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${
                hovered ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                  {safeTitle}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-300 mb-3 flex-wrap">
                  <span>{durationLabel}</span>
                  {safeGenre !== 'Non classé' && <span>{safeGenre}</span>}
                  {isNumericRating && ratingDisplay && (
                    <span className="text-yellow-400 font-semibold">{ratingDisplay}</span>
                  )}
                </div>
                {hovered && (
                  <span className="inline-block bg-yellow-500 text-black text-sm font-semibold px-4 py-1.5 rounded-lg">
                    {safeStatus === 'A_L_AFFICHE' ? 'Voir les séances' : 'En savoir plus'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Label statut sous la carte (variant grid) */}
      {variant === 'grid' && statusLabel && (
        <p className="mt-2 text-xs text-center text-gray-400">{statusLabel}</p>
      )}
    </div>
  );
}

// ── Page d'accueil ──────────────────────────────────────────────────────────
export default function Home() {
  const [nowShowing, setNowShowing] = useState<DbMovie[]>([]);
  const [comingSoon, setComingSoon] = useState<DbMovie[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: now } = await supabase
          .from('movies')
          .select('id, title, genre, duration_minutes, rating, poster_url, status, release_date')
          .eq('status', 'A_L_AFFICHE')
          .order('created_at', { ascending: false });

        const { data: soon } = await supabase
          .from('movies')
          .select('id, title, genre, duration_minutes, rating, poster_url, status, release_date')
          .eq('status', 'BIENTOT')
          .order('release_date', { ascending: true });

        setNowShowing(now ?? []);
        setComingSoon(soon ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const howItWorksSteps = [
    { number: 1, icon: 'ri-film-line',           title: 'Choisir un Film',         description: "Découvrez notre sélection de films à l'affiche ou à venir" },
    { number: 2, icon: 'ri-calendar-check-line', title: 'Sélectionner une Séance', description: "Choisissez l'horaire qui vous convient le mieux" },
    { number: 3, icon: 'ri-government-line',     title: 'Choisir vos Sièges',      description: 'Sélectionnez vos places préférées dans la salle' },
    { number: 4, icon: 'ri-secure-payment-line', title: 'Payer et Profiter',        description: 'Payez facilement et profitez de votre film' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20luxury%20cinema%20theater%20interior%20with%20comfortable%20red%20velvet%20seats%20elegant%20lighting%20dark%20atmosphere%20premium%20movie%20theater%20design%20architectural%20photography&width=1920&height=1080&seq=hero1&orientation=landscape')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

        <div className="relative z-10 text-center max-w-4xl px-6">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
            <i className="ri-movie-2-line text-gold text-xl" />
            <span className="text-white text-sm font-medium">Nouveau à Port-au-Prince</span>
          </div>

          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Vivez le Cinéma<br />
            <span className="text-gold">Comme Jamais</span><br />
            Auparavant
          </h1>

          <p className="text-light-gray text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Découvrez l'expérience cinématographique ultime à Port-au-Prince avec les derniers
            blockbusters dans un cadre moderne et confortable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/seances">
              <Button size="lg" className="transform hover:scale-105">
                <i className="ri-calendar-line mr-2" />
                Voir les Séances
              </Button>
            </Link>
            <Link to="/films">
              <Button variant="outline" size="lg" className="transform hover:scale-105">
                <i className="ri-movie-line mr-2" />
                Films à l'Affiche
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <i className="ri-arrow-down-line text-white text-2xl opacity-60" />
        </div>
      </section>

      {/* ── À l'affiche ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block bg-dark-gray rounded-full px-4 py-2 mb-4">
              <span className="text-gold text-sm font-semibold tracking-wider uppercase">
                Maintenant au Cinéma
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">À l'Affiche</h2>
            <p className="text-light-gray text-lg max-w-2xl mx-auto">
              Découvrez les films actuellement diffusés dans nos salles
            </p>
          </div>

          {loading ? (
            <div className="flex gap-6 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-72 aspect-[2/3] bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : nowShowing.length > 0 ? (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
              {nowShowing.map((movie) => (
                <MovieCardErrorBoundary key={movie.id} title={movie.title}>
                  <MovieCard movie={movie} variant="carousel" />
                </MovieCardErrorBoundary>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl">
              <i className="ri-film-line text-5xl text-gray-600 mb-3 block" />
              <p className="text-gray-400 text-lg font-medium">Aucun film à l'affiche</p>
              <p className="text-gray-500 text-sm mt-1">
                Revenez bientôt ou{' '}
                <Link to="/admin/films" className="text-yellow-400 hover:underline">
                  ajoutez des films depuis l'admin
                </Link>
              </p>
            </div>
          )}

          {nowShowing.length > 0 && (
            <div className="text-center mt-12">
              <Link to="/films">
                <Button variant="outline">
                  Voir Tous les Films
                  <i className="ri-arrow-right-line ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Bientôt à l'affiche ───────────────────────────────────────────── */}
      <section className="py-20 bg-dark-gray">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block bg-coral rounded-full px-4 py-2 mb-4">
              <span className="text-white text-sm font-semibold tracking-wider uppercase">
                Prochainement
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              Bientôt à l'Affiche
            </h2>
            <p className="text-light-gray text-lg max-w-2xl mx-auto">
              Ne manquez pas les prochaines sorties et réservez vos places à l'avance
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[2/3] bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : comingSoon.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {comingSoon.map((movie) => (
                <MovieCardErrorBoundary key={movie.id} title={movie.title}>
                  <MovieCard movie={movie} variant="grid" />
                </MovieCardErrorBoundary>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl">
              <i className="ri-calendar-line text-5xl text-gray-600 mb-3 block" />
              <p className="text-gray-400 text-lg font-medium">Aucune sortie programmée</p>
              <p className="text-gray-500 text-sm mt-1">
                Les prochains films apparaîtront ici
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-dark-gray rounded-full px-4 py-2 mb-4">
              <span className="text-gold text-sm font-semibold tracking-wider uppercase">
                Simple et Rapide
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              Comment ça Marche
            </h2>
            <p className="text-light-gray text-lg max-w-2xl mx-auto">
              Réservez vos places en quelques clics seulement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step) => (
              <div key={step.number} className="text-center group">
                <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold text-black">{step.number}</span>
                </div>
                <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <i className={`${step.icon} text-4xl text-white group-hover:text-gold transition-colors duration-300`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-light-gray text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
