export interface Reservation {
  id: string;
  showtimeId: string;
  movieId: number;
  date: string;
  time: string;
  room: string;
  selectedSeats: {
    id: string;
    row: string;
    number: number;
    price: number;
  }[];
  totalPrice: number;
  paymentMethod?: 'moncash' | 'natcash' | 'cash';
  transactionReference?: string;
  confirmationNumber?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

// Stockage temporaire des réservations (en production, utiliser Supabase)
const reservations: Map<string, Reservation> = new Map();

export const createReservation = (data: Omit<Reservation, 'id' | 'status' | 'createdAt'>): string => {
  const id = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const reservation: Reservation = {
    ...data,
    id,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  reservations.set(id, reservation);
  return id;
};

export const getReservationById = (id: string): Reservation | null => {
  return reservations.get(id) || null;
};

export const updateReservation = (id: string, data: Partial<Reservation>): boolean => {
  const reservation = reservations.get(id);
  if (!reservation) return false;
  
  reservations.set(id, { ...reservation, ...data });
  return true;
};

export const getAllReservations = (): Reservation[] => {
  return Array.from(reservations.values());
};
