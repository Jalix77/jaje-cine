import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';
import { supabase } from '../../../lib/supabaseClient';

type ShowtimeStatus = 'ACTIF' | 'COMPLET' | 'ANNULE';

interface ShowtimeDB {
  id: string;
  movie_id: string;
  room_id: string;
  show_date: string;
  show_time: string;
  base_price_htg: number;
  multiplier: number;
  language: string;
  subtitles: string | null;
  status: ShowtimeStatus;
  capacity: number;
  available_seats: number;
  created_at: string | null;
  updated_at: string | null;
  movie?: { id: string; title: string } | null;
  room?: { id: string; name: string } | null;
}

interface ShowtimeRow {
  id: string;
  movieId: string;
  movieTitle: string;
  roomId: string;
  roomName: string;
  showDate: string;
  showTime: string;
  basePriceHtg: number;
  multiplier: number;
  language: string;
  subtitles: string | null;
  status: ShowtimeStatus;
  capacity: number;
  availableSeats: number;
}

interface Seance {
  id: string;
  movieId: string; // UUID
  movieTitle: string;
  date: string;
  time: string;
  room: string;
  price: number;
  capacity: number;
  bookedSeats: number;
  status: 'ACTIVE' | 'COMPLET' | 'ANNULE';
}

type DbMovie = {
  id: string;
  title: string;
};

type DbRoom = {
  id: string;
  name: string;
  capacity: number;
};

const AdminSeances: React.FC = () => {
  const [seances] = useState<Seance[]>([]);

  const [dbMovies, setDbMovies] = useState<DbMovie[]>([]);
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([]);
  const [showtimes, setShowtimes] = useState<ShowtimeRow[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [showtimesError, setShowtimesError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeance, setEditingSeance] = useState<Seance | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    movieId: '',
    roomId: '',
    date: '',
    time: '',
    price: 800,
    capacity: 120,
    status: 'ACTIVE' as const
  });

  // ✅ Load movies from Supabase
  const loadShowtimes = useCallback(async () => {
    setLoadingShowtimes(true);
    setShowtimesError(null);
    try {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          room_id,
          show_date,
          show_time,
          base_price_htg,
          multiplier,
          language,
          subtitles,
          status,
          capacity,
          available_seats,
          created_at,
          updated_at,
          movie:movies(id,title),
          room:rooms(id,name)
        `)
        .order('show_date', { ascending: false })
        .order('show_time', { ascending: false });

      if (error) throw error;

      const rows: ShowtimeRow[] = (data ?? []).map((s: ShowtimeDB) => ({
        id: s.id,
        movieId: s.movie_id,
        movieTitle: s.movie?.title ?? `ID: ${s.movie_id}`,
        roomId: s.room_id,
        roomName: s.room?.name ?? `ID: ${s.room_id}`,
        showDate: s.show_date,
        showTime: s.show_time,
        basePriceHtg: s.base_price_htg,
        multiplier: s.multiplier,
        language: s.language,
        subtitles: s.subtitles,
        status: s.status,
        capacity: s.capacity,
        availableSeats: s.available_seats,
      }));

      setShowtimes(rows);
    } catch (e: any) {
      setShowtimesError(e?.message ?? 'Erreur lors du chargement des séances');
    } finally {
      setLoadingShowtimes(false);
    }
  }, []);

  const loadMovies = useCallback(async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title')
      .order('title', { ascending: true });

    if (error) {
      setDbMovies([]);
      return;
    }

    setDbMovies((data ?? []) as DbMovie[]);
  }, []);

  const loadRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name, capacity')
      .order('name', { ascending: true });

    if (error) {
      setDbRooms([]);
      return;
    }

    setDbRooms((data ?? []) as DbRoom[]);
  }, []);

  useEffect(() => {
    Promise.all([loadShowtimes(), loadMovies(), loadRooms()]);
  }, [loadShowtimes, loadMovies, loadRooms]);

  const timeSlots = ['14:30', '16:00', '18:00', '20:30', '22:00'];

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(showtime => {
      const matchesSearch =
        showtime.movieTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        showtime.roomName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || showtime.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [showtimes, searchTerm, statusFilter]);

  const todayCount = showtimes.filter(s => s.showDate === todayStr).length;
  const activeCount = showtimes.filter(s => s.status === 'ACTIF').length;
  const completeCount = showtimes.filter(s => s.status === 'COMPLET').length;
  
  const totalCapacity = showtimes.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupied = showtimes.reduce((acc, s) => acc + (s.capacity - s.availableSeats), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const handleDeleteShowtime = async (id: string) => {
    if (!confirm("Supprimer cette séance ?")) return;
    setLoadingShowtimes(true);
    setShowtimesError(null);
    try {
      const { error } = await supabase.from('showtimes').delete().eq('id', id);
      if (error) throw error;
      await loadShowtimes();
    } catch (e: any) {
      setShowtimesError(e?.message ?? "Erreur suppression séance");
    } finally {
      setLoadingShowtimes(false);
    }
  };

  const handleEditOpen = (showtime: ShowtimeRow) => {
    setEditingSeance({
      id: showtime.id,
      movieId: showtime.movieId,
      movieTitle: showtime.movieTitle,
      date: showtime.showDate,
      time: showtime.showTime,
      room: showtime.roomName,
      price: Math.round(showtime.basePriceHtg * showtime.multiplier),
      capacity: showtime.capacity,
      bookedSeats: showtime.capacity - showtime.availableSeats,
      status: showtime.status as any
    });
    
    setFormData({
      movieId: showtime.movieId,
      roomId: showtime.roomId,
      date: showtime.showDate,
      time: showtime.showTime,
      price: Math.round(showtime.basePriceHtg * showtime.multiplier),
      capacity: showtime.capacity,
      status: showtime.status as any
    });
    
    setIsModalOpen(true);
  };

  const handleOpenModal = (seance?: Seance) => {
    if (seance) {
      setEditingSeance(seance);
      setFormData({
        movieId: seance.movieId,
        roomId: '',
        date: seance.date,
        time: seance.time,
        price: seance.price,
        capacity: seance.capacity,
        status: seance.status as any
      });
    } else {
      setEditingSeance(null);
      setFormData({
        movieId: '',
        roomId: '',
        date: '',
        time: '',
        price: 800,
        capacity: 120,
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSeance(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'capacity' ? Number(value) || 0 : value
    }));
  };

  const handleCreateShowtime = async () => {
    if (!formData.movieId || !formData.roomId || !formData.date || !formData.time || !formData.capacity || !formData.price) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoadingShowtimes(true);
    setShowtimesError(null);
    try {
      const payload = {
        movie_id: formData.movieId,
        room_id: formData.roomId,
        show_date: formData.date,
        show_time: formData.time,
        base_price_htg: Number(formData.price),
        multiplier: 1,
        language: 'français',
        subtitles: null,
        status: 'ACTIF' as const,
        capacity: Number(formData.capacity),
        available_seats: Number(formData.capacity)
      };

      const { error } = await supabase.from('showtimes').insert(payload);
      if (error) throw error;

      handleCloseModal();
      await loadShowtimes();
    } catch (e: any) {
      setShowtimesError(e?.message ?? "Erreur création séance");
    } finally {
      setLoadingShowtimes(false);
    }
  };

  const handleUpdateShowtime = async (id: string) => {
    if (!formData.movieId || !formData.roomId || !formData.date || !formData.time || !formData.capacity || !formData.price) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoadingShowtimes(true);
    setShowtimesError(null);
    try {
      const currentShowtime = showtimes.find(s => s.id === id);
      const newCapacity = Number(formData.capacity);
      
      let availableSeats = currentShowtime?.availableSeats || 0;
      if (newCapacity < availableSeats) {
        availableSeats = newCapacity;
      }

      const payload = {
        movie_id: formData.movieId,
        room_id: formData.roomId,
        show_date: formData.date,
        show_time: formData.time,
        base_price_htg: Number(formData.price),
        multiplier: 1,
        language: 'français',
        subtitles: null,
        status: formData.status as ShowtimeStatus,
        capacity: newCapacity,
        available_seats: availableSeats
      };

      const { error } = await supabase.from('showtimes').update(payload).eq('id', id);
      if (error) throw error;

      handleCloseModal();
      await loadShowtimes();
    } catch (e: any) {
      setShowtimesError(e?.message ?? "Erreur modification séance");
    } finally {
      setLoadingShowtimes(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSeance) {
      handleCreateShowtime();
      return;
    }
    
    handleUpdateShowtime(editingSeance.id);
  };

  const getStatusBadge = (status: string, bookedSeats: number, capacity: number) => {
    const occupancyRate = (bookedSeats / capacity) * 100;

    switch (status) {
      case 'ACTIVE':
        if (occupancyRate >= 100) {
          return (
            <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm border border-red-600/30">
              Complet
            </span>
          );
        } else if (occupancyRate >= 80) {
          return (
            <span className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded-full text-sm border border-orange-600/30">
              Presque complet
            </span>
          );
        } else {
          return (
            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm border border-green-600/30">
              Actif
            </span>
          );
        }
      case 'COMPLET':
        return (
          <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm border border-red-600/30">
            Complet
          </span>
        );
      case 'ANNULE':
        return (
          <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-sm border border-gray-600/30">
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion des Séances</h1>
            <p className="text-gray-400">Planifiez et gérez vos séances de cinéma</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Ajouter une séance
          </button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Séances aujourd'hui</p>
                <p className="text-2xl font-bold text-white mt-1">{loadingShowtimes ? '...' : todayCount}</p>
              </div>
              <i className="ri-calendar-line text-2xl text-blue-400"></i>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Séances actives</p>
                <p className="text-2xl font-bold text-white mt-1">{loadingShowtimes ? '...' : activeCount}</p>
              </div>
              <i className="ri-play-circle-line text-2xl text-green-400"></i>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium">Séances complètes</p>
                <p className="text-2xl font-bold text-white mt-1">{loadingShowtimes ? '...' : completeCount}</p>
              </div>
              <i className="ri-user-fill text-2xl text-red-400"></i>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Taux d'occupation</p>
                <p className="text-2xl font-bold text-white mt-1">{loadingShowtimes ? '...' : `${occupancyRate}%`}</p>
              </div>
              <i className="ri-pie-chart-line text-2xl text-purple-400"></i>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Rechercher une séance..."
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
              <option value="ACTIF">Actif</option>
              <option value="COMPLET">Complet</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>

        {/* Liste des séances */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          {loadingShowtimes ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Chargement des séances...</p>
            </div>
          ) : showtimesError ? (
            <div className="text-center py-12">
              <p className="text-red-400">{showtimesError}</p>
            </div>
          ) : filteredShowtimes.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-calendar-line text-4xl text-gray-600 mb-4"></i>
              <p className="text-gray-400 text-lg mb-4">
                {showtimes.length === 0 ? 'Aucune séance pour le moment' : 'Aucune séance ne correspond à votre recherche'}
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Ajouter une séance
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left p-6 text-gray-300 font-medium">Film</th>
                    <th className="text-left p-6 text-gray-300 font-medium">Date & Heure</th>
                    <th className="text-left p-6 text-gray-300 font-medium">Salle</th>
                    <th className="text-left p-6 text-gray-300 font-medium">Prix</th>
                    <th className="text-left p-6 text-gray-300 font-medium">Occupation</th>
                    <th className="text-left p-6 text-gray-300 font-medium">Statut</th>
                    <th className="text-center p-6 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShowtimes.map((showtime) => (
                    <tr key={showtime.id} className="border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors duration-300">
                      <td className="p-6">
                        <div>
                          <p className="text-white font-medium">{showtime.movieTitle}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <div>
                          <p className="text-white">{new Date(showtime.showDate).toLocaleDateString('fr-FR')}</p>
                          <p className="text-gray-400 text-sm">{showtime.showTime}</p>
                        </div>
                      </td>
                      <td className="p-6 text-gray-300">{showtime.roomName}</td>
                      <td className="p-6 text-gray-300">{Math.round(showtime.basePriceHtg * showtime.multiplier)} HTG</td>
                      <td className="p-6">
                        <div>
                          <p className="text-white">
                            {showtime.capacity - showtime.availableSeats} / {showtime.capacity}
                          </p>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${((showtime.capacity - showtime.availableSeats) / showtime.capacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">{getStatusBadge(showtime.status, showtime.availableSeats, showtime.capacity)}</td>
                      <td className="p-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditOpen(showtime)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
                            title="Modifier"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          {showtime.status === 'ACTIF' && showtime.availableSeats > 0 && (
                            <button
                              onClick={() => {}}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                              title="Marquer comme complet"
                            >
                              <i className="ri-user-fill text-lg"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteShowtime(showtime.id)}
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
          )}

        </div>

        {/* Modal d'ajout/modification */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{editingSeance ? 'Modifier la séance' : 'Ajouter une séance'}</h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors duration-300">
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Film</label>
                    <select
                      name="movieId"
                      value={formData.movieId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Sélectionner un film</option>
                      {dbMovies.map((movie) => (
                        <option key={movie.id} value={movie.id}>
                          {movie.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Salle</label>
                    <select
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Sélectionner une salle</option>
                      {dbRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Heure</label>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Sélectionner l'heure</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prix (HTG)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Capacité</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
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
                    {editingSeance ? 'Modifier' : 'Ajouter'}
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

export default AdminSeances;