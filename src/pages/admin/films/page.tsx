import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { supabase } from '../../../lib/supabaseClient';

interface Film {
  id: string; // Changé de number à string pour UUID
  title: string;
  synopsis: string;
  duration: number;
  genre: string;
  rating: string;
  status: 'MAINTENANT' | 'BIENTOT' | 'ARCHIVE';
  poster: string;
  trailerUrl?: string;
}

const reverseStatusMap: Record<string, string> = {
  "A_L_AFFICHE": "À l'affiche",
  "BIENTOT": "Bientôt",
  "ARCHIVE": "Archivé",
};

const reverseRatingMap: Record<string, string> = {
  "G": "Tous publics",
  "PG": "PG",
  "PG-13": "PG-13",
  "R": "R",
  "NC-17": "NC-17",
};

const AdminFilms: React.FC = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFilms = async () => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading films:', error);
        return;
      }

      const mappedFilms: Film[] = (data || []).map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        synopsis: movie.synopsis,
        duration: movie.duration_minutes,
        genre: movie.genre,
        rating: reverseRatingMap[movie.rating] ?? movie.rating,
        status: (reverseStatusMap[movie.status] ?? movie.status) as Film['status'],
        poster: movie.poster_url,
        trailerUrl: movie.trailer_url,
      }));

      setFilms(mappedFilms);
    } catch (error) {
      console.error('Unexpected error loading films:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilms();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    duration: '',
    genre: '',
    rating: '',
    status: 'MAINTENANT',
    poster: '',
    trailerUrl: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Mapping UI vers DB
  const statusMap = {
    "À l'affiche": "A_L_AFFICHE",
    "Bientôt": "BIENTOT", 
    "Archivé": "ARCHIVE",
  };

  const ratingMap = {
    "Tous publics": "G",
    "PG": "PG",
    "PG-13": "PG-13",
    "R": "R",
    "NC-17": "NC-17",
  };

  // Mapping DB vers UI (pour l'affichage)
  const reverseStatusMap = {
    "A_L_AFFICHE": "À l'affiche",
    "BIENTOT": "Bientôt",
    "ARCHIVE": "Archivé",
  };

  const reverseRatingMap = {
    "G": "Tous publics",
    "PG": "PG",
    "PG-13": "PG-13",
    "R": "R",
    "NC-17": "NC-17",
  };

  // Effet pour nettoyer les erreurs quand le modal s'ouvre
  useEffect(() => {
    if (isModalOpen) {
      setFormError(null);
    }
  }, [isModalOpen]);

  // Effet pour nettoyer les erreurs quand les champs du formulaire changent
  useEffect(() => {
    if (formError && formData.duration.trim() !== '' && !isNaN(Number(formData.duration)) && Number(formData.duration) > 0) {
      setFormError(null);
    }
  }, [formData.duration, formError]);

  const filteredFilms = films.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         film.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || film.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (film?: Film) => {
    if (film) {
      setEditingFilm(film);
      setFormData({
        title: film.title,
        synopsis: film.synopsis,
        duration: film.duration.toString(),
        genre: film.genre,
        rating: reverseRatingMap[film.rating as keyof typeof reverseRatingMap] || 'Tous publics',
        status: reverseStatusMap[film.status as keyof typeof reverseStatusMap] || 'À l\'affiche',
        poster: film.poster,
        trailerUrl: film.trailerUrl || ''
      });
    } else {
      setEditingFilm(null);
      setFormData({
        title: '',
        synopsis: '',
        duration: '',
        genre: '',
        rating: '',
        status: 'MAINTENANT',
        poster: '',
        trailerUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFilm(null);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? value : value // Garder comme string pour le champ durée
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validation des champs requis
    if (!formData.title.trim()) {
      const error = 'Le titre est requis';
      console.error('[AdminFilms]', error);
      setFormError(error);
      return;
    }
    
    // Validation de la durée - seulement si le champ est rempli
    if (formData.duration.trim() === '') {
      const error = 'La durée est requise';
      console.error('[AdminFilms]', error);
      setFormError(error);
      return;
    }
    
    const durationNum = Number(formData.duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      const error = 'La durée doit être un nombre positif';
      console.error('[AdminFilms]', error);
      setFormError(error);
      return;
    }
    
    try {
      // Mapping UI vers DB avec les contraintes PostgreSQL
      const movieData = {
        title: formData.title.trim(),
        synopsis: formData.synopsis.trim(),
        genre: formData.genre.trim(),
        rating: ratingMap[formData.rating as keyof typeof ratingMap] || 'G',
        status: statusMap[formData.status as keyof typeof statusMap] || 'A_L_AFFICHE',
        poster_url: formData.poster.trim() || null,
        trailer_url: formData.trailerUrl.trim() || null,
        duration_minutes: durationNum,
        release_date: new Date().toISOString().slice(0, 10), // Date du jour au format YYYY-MM-DD
      };

      console.log('[AdminFilms] Payload envoyé à Supabase:', movieData);

      if (editingFilm) {
        // UPDATE existing film
        const { data, error } = await supabase
          .from('movies')
          .update(movieData)
          .eq('id', editingFilm.id)
          .select();

        if (error) {
          console.error('[AdminFilms] Error updating film:', error);
          setFormError(`Erreur de mise à jour: ${error.message}`);
          return;
        }
        console.log('[AdminFilms] Film mis à jour:', data);
      } else {
        // INSERT new film
        const { data, error } = await supabase
          .from('movies')
          .insert(movieData)
          .select();

        if (error) {
          console.error('[AdminFilms] Error adding film:', error);
          setFormError(`Erreur d'ajout: ${error.message}`);
          return;
        }
        console.log('[AdminFilms] Film ajouté:', data);
      }
      
      // Reload films list
      await loadFilms();
      handleCloseModal();
    } catch (error) {
      console.error('[AdminFilms] Unexpected error:', error);
      setFormError('Erreur inattendue. Veuillez réessayer.');
    }
  };

  const handleDelete = async (id: string) => { // Changé de number à string
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce film ?')) {
      try {
        const { error } = await supabase
          .from('movies')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting film:', error);
          return;
        }

        // Reload films list
        await loadFilms();
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'À l\'affiche': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
      'Bientôt': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
      'Archivé': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Archivé'];
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion des Films</h1>
            <p className="text-gray-400">Gérez votre catalogue de films</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Ajouter un film
          </button>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Rechercher un film..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="MAINTENANT">À l'affiche</option>
              <option value="BIENTOT">Bientôt</option>
              <option value="ARCHIVE">Archivé</option>
            </select>
          </div>
        </div>

        {/* Liste des films */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Chargement des films...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left p-6 text-gray-300 font-medium">Film</th>
                      <th className="text-left p-6 text-gray-300 font-medium">Genre</th>
                      <th className="text-left p-6 text-gray-300 font-medium">Durée</th>
                      <th className="text-left p-6 text-gray-300 font-medium">Classification</th>
                      <th className="text-left p-6 text-gray-300 font-medium">Statut</th>
                      <th className="text-center p-6 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFilms.map((film) => (
                      <tr key={film.id} className="border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors duration-300">
                        <td className="p-6">
                          <div className="flex items-center space-x-4">
                            <img
                              src={film.poster}
                              alt={film.title}
                              className="w-12 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <p className="text-white font-medium">{film.title}</p>
                              <p className="text-gray-400 text-sm line-clamp-1">{film.synopsis}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-gray-300">{film.genre}</td>
                        <td className="p-6 text-gray-300">{film.duration} min</td>
                        <td className="p-6 text-gray-300">{film.rating}</td>
                        <td className="p-6">
                          {getStatusBadge(film.status)}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenModal(film)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
                              title="Modifier"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(film.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                              title="Supprimer"
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Modal d'ajout/modification */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingFilm ? 'Modifier le film' : 'Ajouter un film'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Affichage des erreurs */}
                {formError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{formError}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre du film
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                      placeholder="Titre du film"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Genre
                    </label>
                    <input
                      type="text"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                      placeholder="Action, Drame, Comédie..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Durée (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Classification
                    </label>
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Tous publics">Tous publics</option>
                      <option value="PG">PG</option>
                      <option value="PG-13">PG-13</option>
                      <option value="R">R</option>
                      <option value="NC-17">NC-17</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Statut
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="À l'affiche">À l'affiche</option>
                      <option value="Bientôt">Bientôt</option>
                      <option value="Archivé">Archivé</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL de l'affiche
                    </label>
                    <input
                      type="url"
                      name="poster"
                      value={formData.poster}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Synopsis
                  </label>
                  <textarea
                    name="synopsis"
                    value={formData.synopsis}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Résumé du film..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL de la bande-annonce (optionnel)
                  </label>
                  <input
                    type="url"
                    name="trailerUrl"
                    value={formData.trailerUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    {editingFilm ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFilms;