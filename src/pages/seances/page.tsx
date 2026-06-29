import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/feature/Navbar";
import Footer from "../../components/feature/Footer";
import { supabase } from "../../lib/supabaseClient";

export default function SeancesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showtimes, setShowtimes] = useState<any[]>([]);

  useEffect(() => {
    loadShowtimes();
  }, []);

  const loadShowtimes = async () => {
    setLoading(true);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { data, error } = await supabase
      .from("showtimes")
      .select(`
        id,
        show_date,
        show_time,
        base_price_htg,
        movies ( id, title, poster_url ),
        rooms ( name )
      `)
      .gte("show_date", today)
      .order("show_date", { ascending: true })
      .order("show_time", { ascending: true });

    if (error) {
      console.error("Erreur chargement séances:", error);
    } else {
      console.log("SHOWTIMES:", data);
      setShowtimes(data || []);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-24 flex-1">
        <h1 className="text-4xl font-bold text-white mb-8">
          Toutes les séances
        </h1>

        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : showtimes.length === 0 ? (
          <div className="text-center text-gray-400">
            <p className="text-lg">Aucune séance trouvée</p>
            <p className="text-sm mt-2">
              Vérifie que des showtimes existent dans Supabase (show_date ≥ aujourd’hui)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {showtimes.map((s) => (
              <div
                key={s.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-center"
              >
                {/* Poster */}
                <div className="w-20">
                  {s.movies?.poster_url ? (
                    <img
                      src={s.movies.poster_url}
                      alt=""
                      className="w-20 h-28 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-gray-700 rounded" />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">
                    {s.movies?.title || "Film"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {s.show_date} • {s.show_time}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Salle: {s.rooms?.name || "?"}
                  </p>
                  <p className="text-gold font-bold">
                    {s.base_price_htg} HTG
                  </p>
                </div>

                {/* Bouton */}
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold"
                  onClick={() => navigate(`/reservation/seat-selection/${s.id}`)}
                >
                  Réserver
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
