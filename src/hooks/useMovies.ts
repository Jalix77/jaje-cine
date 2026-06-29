import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // ajuste si ton chemin est différent

type Movie = {
  id: string;
  title: string;
  status: string;
  poster_url: string | null;
  genre: string;
  duration_minutes: number;
  rating: string;
};

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("movies")
        .select("id,title,status,poster_url,genre,duration_minutes,rating")
        .order("title", { ascending: true });

      if (!alive) return;

      if (error) {
        setError(error.message);
        setMovies([]);
      } else {
        setMovies((data ?? []) as Movie[]);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { movies, loading, error };
}