import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../base/Button';

interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: string;
  rating?: number;
  poster: string;
  status: string;
  showtimes?: string[];
  releaseDate?: string;
}

interface MovieCardProps {
  movie: Movie;
  variant?: 'carousel' | 'grid';
}

export default function MovieCard({ movie, variant = 'carousel' }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/films/${movie.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (movie.status === 'À l\'affiche') {
      navigate('/seances');
    } else if (movie.status === 'Bientôt') {
      // Action de notification à implémenter
      console.log('Notification demandée pour:', movie.title);
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${
        variant === 'carousel' ? 'flex-shrink-0 w-80' : 'w-full'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className={`relative overflow-hidden rounded-2xl ${
        isHovered ? 'transform scale-105 shadow-2xl shadow-gold/20' : ''
      } transition-all duration-300`}>
        {/* Affiche du film */}
        <div className="relative aspect-[2/3]">
          <img 
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover object-top"
          />
          
          {/* Badge de statut */}
          {movie.status === 'Complet' && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              COMPLET
            </div>
          )}
          
          {movie.status === 'Bientôt' && movie.releaseDate && (
            <div className="absolute top-4 left-4 bg-coral text-white px-3 py-1 rounded-full text-sm font-semibold">
              Dès le {new Date(movie.releaseDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
          )}

          {/* Overlay avec informations */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-60'
          }`}>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{movie.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-light-gray mb-3">
                <span>{movie.duration}</span>
                <span>{movie.genre}</span>
                {movie.rating && (
                  <div className="flex items-center space-x-1">
                    <i className="ri-star-fill text-gold text-base"></i>
                    <span className="text-gold font-semibold">{movie.rating}/10</span>
                  </div>
                )}
              </div>
              
              {/* Bouton d'action qui apparaît au hover */}
              {isHovered && (
                <div className="transform translate-y-0 opacity-100 transition-all duration-300">
                  {movie.status === 'À l\'affiche' ? (
                    <Button size="sm" className="animate-fade-in" onClick={handleActionClick}>
                      <i className="ri-calendar-line mr-2"></i>
                      Voir les Séances
                    </Button>
                  ) : movie.status === 'Bientôt' ? (
                    <Button variant="outline" size="sm" className="animate-fade-in" onClick={handleActionClick}>
                      <i className="ri-notification-line mr-2"></i>
                      Me Notifier
                    </Button>
                  ) : (
                    <div className="text-red-400 font-semibold text-sm">
                      <i className="ri-close-circle-line mr-1"></i>
                      Séances complètes
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}