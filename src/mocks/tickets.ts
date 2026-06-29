import { supabase } from "@/lib/supabaseClient";

export interface Ticket {
  id: string;
  reservation_id: string;
  confirmation_code: string;
  show_date: string;
  show_time: string;
  room: string;
  movie_title: string;
  movie_poster: string;
  seats: string[];
  total_price: number;
  status: "CONFIRMED" | "TO_PAY" | "CANCELLED" | "USED";
  booking_date: string;
}

export async function getMyTickets(userId: string): Promise<Ticket[]> {
  // 1. Charger les réservations de l'utilisateur
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id,
      confirmation_code,
      created_at,
      showtime_id,
      showtimes (
        show_date,
        show_time,
        rooms ( name ),
        movies ( title, poster_url )
      ),
      reservation_seats (
        seats ( seat_number ),
        price_htg
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement tickets:", error);
    return [];
  }

  if (!reservations) return [];

  // 2. Mapper en format Ticket
  const tickets: Ticket[] = reservations.map((r: any) => {
    const seats = r.reservation_seats?.map((s: any) => s.seats.seat_number) || [];
    const total = r.reservation_seats?.reduce(
      (sum: number, s: any) => sum + Number(s.price_htg || 0),
      0
    ) || 0;

    return {
      id: r.id,
      reservation_id: r.id,
      confirmation_code: r.confirmation_code,
      show_date: r.showtimes?.show_date,
      show_time: r.showtimes?.show_time,
      room: r.showtimes?.rooms?.name,
      movie_title: r.showtimes?.movies?.title,
      movie_poster: r.showtimes?.movies?.poster_url,
      seats,
      total_price: total,
      status: "CONFIRMED", // on améliorera après avec un vrai champ status
      booking_date: r.created_at,
    };
  });

  return tickets;
}