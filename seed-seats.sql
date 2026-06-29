-- ===============================================================
-- JAJE CINÉ — SEED SIÈGES
-- Génère les sièges pour chaque salle existante
-- À exécuter dans Supabase SQL Editor
-- ===============================================================

-- 1. CRÉER LA SALLE "Grande Salle" SI ELLE N'EXISTE PAS
INSERT INTO rooms (name, capacity, rows, seats_per_row, screen_type, sound_system, status)
SELECT 'Grande Salle', 100, 10, 10, 'STANDARD', 'STEREO', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = 'Grande Salle');

-- 2. CRÉER LA ZONE DE PRIX STANDARD
INSERT INTO seat_zones (room_id, name, color, price_htg, row_start, row_end)
SELECT r.id, 'Standard', '#D4AF37', 500.00, 'A', 'J'
FROM rooms r
WHERE r.name = 'Grande Salle'
  AND NOT EXISTS (SELECT 1 FROM seat_zones sz WHERE sz.room_id = r.id AND sz.name = 'Standard');

-- 3. GÉNÉRER LES 100 SIÈGES (Rangées A-J, 10 sièges par rangée)
DO $$
DECLARE
  v_room_id UUID;
  v_zone_id UUID;
  v_rows TEXT[] := ARRAY['A','B','C','D','E','F','G','H','I','J'];
  v_row TEXT;
  v_num INTEGER;
BEGIN
  SELECT id INTO v_room_id FROM rooms WHERE name = 'Grande Salle' LIMIT 1;
  SELECT id INTO v_zone_id FROM seat_zones WHERE room_id = v_room_id AND name = 'Standard' LIMIT 1;

  IF v_room_id IS NULL THEN
    RAISE NOTICE 'Salle Grande Salle introuvable';
    RETURN;
  END IF;

  FOREACH v_row IN ARRAY v_rows LOOP
    FOR v_num IN 1..10 LOOP
      INSERT INTO seats (room_id, zone_id, row_letter, seat_number, status)
      VALUES (v_room_id, v_zone_id, v_row, v_num, 'AVAILABLE')
      ON CONFLICT (room_id, row_letter, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Sièges générés pour la Grande Salle';
END $$;


-- 4. SÉANCE DE TEST (modifier les dates selon vos besoins)
-- D'abord créer un film si nécessaire
INSERT INTO movies (
  title, synopsis, director, genre, duration_minutes, release_date, rating,
  language, poster_url, status
)
SELECT
  'Film Test Jaje Ciné',
  'Séance de test pour valider le parcours complet de réservation.',
  'Réalisateur Test',
  'Événement',
  120,
  CURRENT_DATE,
  'G',
  'français',
  'https://placehold.co/300x450/1a1a1a/D4AF37?text=Jaje+Ciné',
  'A_L_AFFICHE'
WHERE NOT EXISTS (
  SELECT 1 FROM movies WHERE title = 'Film Test Jaje Ciné'
);

-- Créer une séance dans 7 jours
INSERT INTO showtimes (
  movie_id, room_id, show_date, show_time,
  base_price_htg, multiplier, language, status,
  capacity, available_seats
)
SELECT
  m.id,
  r.id,
  CURRENT_DATE + INTERVAL '7 days',
  '19:00',
  500.00,
  1.00,
  'français',
  'ACTIF',
  100,
  100
FROM movies m, rooms r
WHERE m.title = 'Film Test Jaje Ciné'
  AND r.name = 'Grande Salle'
  AND NOT EXISTS (
    SELECT 1 FROM showtimes s
    WHERE s.movie_id = m.id
      AND s.room_id = r.id
      AND s.show_date = CURRENT_DATE + INTERVAL '7 days'
  );


-- ===============================================================
-- RÉSUMÉ
-- ✅ Salle "Grande Salle" créée (100 places)
-- ✅ Zone "Standard" à 500 HTG
-- ✅ 100 sièges générés (A1-J10)
-- ✅ Film test créé
-- ✅ Séance test créée dans 7 jours à 19h00
-- ===============================================================
