export interface Showtime {
  id: string;
  movieId: number;
  date: string;
  times: {
    id: string;
    time: string;
    room: string;
    price: number;
    capacity: number;
    available: number;
  }[];
}

export const showtimes: Showtime[] = [
  {
    id: 'show-1',
    movieId: 1,
    date: '2025-02-15',
    times: [
      { id: 'st-1', time: '14:00', room: 'Salle 1', price: 600, capacity: 160, available: 98 },
      { id: 'st-2', time: '17:30', room: 'Salle 2', price: 600, capacity: 160, available: 45 },
      { id: 'st-3', time: '20:00', room: 'Salle 1', price: 800, capacity: 160, available: 12 }
    ]
  },
  {
    id: 'show-2',
    movieId: 2,
    date: '2025-02-15',
    times: [
      { id: 'st-4', time: '15:00', room: 'Salle 3', price: 600, capacity: 160, available: 87 },
      { id: 'st-5', time: '18:30', room: 'Salle 1', price: 600, capacity: 160, available: 56 },
      { id: 'st-6', time: '21:00', room: 'Salle 2', price: 800, capacity: 160, available: 23 }
    ]
  },
  {
    id: 'show-3',
    movieId: 3,
    date: '2025-02-15',
    times: [
      { id: 'st-7', time: '13:30', room: 'Salle 2', price: 600, capacity: 160, available: 102 },
      { id: 'st-8', time: '16:00', room: 'Salle 3', price: 600, capacity: 160, available: 78 },
      { id: 'st-9', time: '19:30', room: 'Salle 3', price: 800, capacity: 160, available: 34 }
    ]
  },
  {
    id: 'show-4',
    movieId: 4,
    date: '2025-02-15',
    times: [
      { id: 'st-10', time: '14:30', room: 'Salle 4', price: 600, capacity: 160, available: 91 },
      { id: 'st-11', time: '17:00', room: 'Salle 4', price: 600, capacity: 160, available: 67 },
      { id: 'st-12', time: '20:30', room: 'Salle 4', price: 800, capacity: 160, available: 18 }
    ]
  },
  {
    id: 'show-5',
    movieId: 1,
    date: '2025-02-16',
    times: [
      { id: 'st-13', time: '14:00', room: 'Salle 1', price: 600, capacity: 160, available: 125 },
      { id: 'st-14', time: '17:30', room: 'Salle 2', price: 600, capacity: 160, available: 89 },
      { id: 'st-15', time: '20:00', room: 'Salle 1', price: 800, capacity: 160, available: 45 }
    ]
  },
  {
    id: 'show-6',
    movieId: 2,
    date: '2025-02-16',
    times: [
      { id: 'st-16', time: '15:00', room: 'Salle 3', price: 600, capacity: 160, available: 134 },
      { id: 'st-17', time: '18:30', room: 'Salle 1', price: 600, capacity: 160, available: 98 },
      { id: 'st-18', time: '21:00', room: 'Salle 2', price: 800, capacity: 160, available: 56 }
    ]
  }
];

// Fonction helper pour trouver une séance par ID
export const getShowtimeById = (showtimeId: string) => {
  for (const show of showtimes) {
    const time = show.times.find(t => t.id === showtimeId);
    if (time) {
      return {
        ...time,
        movieId: show.movieId,
        date: show.date
      };
    }
  }
  return null;
};
