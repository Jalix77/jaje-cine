-- ===============================================================
-- JAJE CINÉ - MIGRATIONS CORRECTIFS
-- À exécuter dans Supabase SQL Editor
-- ===============================================================

-- ---------------------------------------------------------------
-- 1. SUPPRIMER LA CONTRAINTE future_showtime
--    (bloque la création de séances de test par l'admin)
-- ---------------------------------------------------------------
ALTER TABLE showtimes DROP CONSTRAINT IF EXISTS future_showtime;


-- ---------------------------------------------------------------
-- 2. CORRIGER LE STATUS ROOMS : 'CLOSED' → 'FERME'
--    Le code UI utilise 'FERME' mais le schéma avait 'CLOSED'
-- ---------------------------------------------------------------
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE rooms ADD CONSTRAINT rooms_status_check
  CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'FERME', 'CLOSED'));

-- Migration des données existantes si nécessaire
UPDATE rooms SET status = 'FERME' WHERE status = 'CLOSED';


-- ---------------------------------------------------------------
-- 3. ACTIVER RLS SUR LES TABLES PUBLIQUES
-- ---------------------------------------------------------------
ALTER TABLE movies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_zones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_locks  ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------
-- 4. RLS POLICIES — MOVIES (lecture publique)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS movies_public_read   ON movies;
DROP POLICY IF EXISTS movies_admin_all     ON movies;

CREATE POLICY movies_public_read ON movies
  FOR SELECT USING (true);

CREATE POLICY movies_admin_all ON movies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 5. RLS POLICIES — ROOMS (lecture publique)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS rooms_public_read ON rooms;
DROP POLICY IF EXISTS rooms_admin_all   ON rooms;

CREATE POLICY rooms_public_read ON rooms
  FOR SELECT USING (true);

CREATE POLICY rooms_admin_all ON rooms
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 6. RLS POLICIES — SEATS (lecture publique)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS seats_public_read ON seats;
DROP POLICY IF EXISTS seats_admin_all   ON seats;

CREATE POLICY seats_public_read ON seats
  FOR SELECT USING (true);

CREATE POLICY seats_admin_all ON seats
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 7. RLS POLICIES — SEAT_ZONES (lecture publique)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS seat_zones_public_read ON seat_zones;
DROP POLICY IF EXISTS seat_zones_admin_all   ON seat_zones;

CREATE POLICY seat_zones_public_read ON seat_zones
  FOR SELECT USING (true);

CREATE POLICY seat_zones_admin_all ON seat_zones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 8. RLS POLICIES — SHOWTIMES (lecture publique)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS showtimes_public_read ON showtimes;
DROP POLICY IF EXISTS showtimes_admin_all   ON showtimes;

CREATE POLICY showtimes_public_read ON showtimes
  FOR SELECT USING (true);

CREATE POLICY showtimes_admin_all ON showtimes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 9. RLS POLICIES — RESERVATION_SEATS
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS res_seats_public_read  ON reservation_seats;
DROP POLICY IF EXISTS res_seats_auth_insert  ON reservation_seats;
DROP POLICY IF EXISTS res_seats_admin_all    ON reservation_seats;

-- Lecture publique (pour afficher les sièges pris)
CREATE POLICY res_seats_public_read ON reservation_seats
  FOR SELECT USING (true);

-- Insert par tout utilisateur (y compris anonyme via service_role ou authenticated)
CREATE POLICY res_seats_auth_insert ON reservation_seats
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admin peut tout faire
CREATE POLICY res_seats_admin_all ON reservation_seats
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 10. RLS POLICIES — SEAT_LOCKS
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS seat_locks_public_read   ON seat_locks;
DROP POLICY IF EXISTS seat_locks_auth_write    ON seat_locks;
DROP POLICY IF EXISTS seat_locks_admin_all     ON seat_locks;

CREATE POLICY seat_locks_public_read ON seat_locks
  FOR SELECT USING (true);

CREATE POLICY seat_locks_auth_write ON seat_locks
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY seat_locks_admin_all ON seat_locks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 11. PERMETTRE LES RÉSERVATIONS ANONYMES (guest checkout)
--     Les guests ne sont pas authentifiés → besoin d'une policy
--     plus permissive sur reservations + reservation_seats
-- ---------------------------------------------------------------

-- Supprimer l'ancienne policy restrictive et la remplacer
DROP POLICY IF EXISTS reservation_owner_insert ON reservations;

CREATE POLICY reservation_guest_insert ON reservations
  FOR INSERT
  WITH CHECK (true);  -- Tout le monde peut créer une réservation (guest inclus)

-- Idem pour reservation_seats (INSERT depuis le checkout page sans auth)
DROP POLICY IF EXISTS res_seats_auth_insert ON reservation_seats;

CREATE POLICY res_seats_guest_insert ON reservation_seats
  FOR INSERT
  WITH CHECK (true);

-- Idem pour seat_locks depuis la sélection de siège (guest)
DROP POLICY IF EXISTS seat_locks_auth_write ON seat_locks;

CREATE POLICY seat_locks_guest_write ON seat_locks
  FOR INSERT
  WITH CHECK (true);

-- Delete propre après expiration (pour cleanup)
CREATE POLICY seat_locks_self_delete ON seat_locks
  FOR DELETE
  USING (
    session_id IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF')
    )
  );


-- ---------------------------------------------------------------
-- 12. AJOUTER COLONNE `paid` DANS RESERVATIONS
--     Pour le statut simplifié : pending/paid/confirmed/cancelled
-- ---------------------------------------------------------------
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('PENDING', 'PAID', 'CONFIRMED', 'CANCELLED', 'EXPIRED'));

-- Migration : ancienne valeur 'CONFIRMED' → 'CONFIRMED' (OK),
-- on ajoute 'PAID' comme nouveau statut entre PENDING et CONFIRMED
-- Aucune migration de données nécessaire (les valeurs existantes sont compatibles)


-- ---------------------------------------------------------------
-- 13. SEED DATA : Salle d'église par défaut (si vide)
-- ---------------------------------------------------------------
INSERT INTO rooms (name, capacity, rows, seats_per_row, screen_type, sound_system, status)
SELECT 'Grande Salle', 100, 10, 10, 'STANDARD', 'STEREO', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM rooms LIMIT 1);


-- ---------------------------------------------------------------
-- 14. SEED DATA : Zones de prix pour la salle d'église
-- ---------------------------------------------------------------
INSERT INTO seat_zones (room_id, name, color, price_htg, row_start, row_end)
SELECT
  r.id,
  'Standard',
  '#3B82F6',
  500.00,
  'A',
  'J'
FROM rooms r
WHERE r.name = 'Grande Salle'
  AND NOT EXISTS (
    SELECT 1 FROM seat_zones sz WHERE sz.room_id = r.id
  );


-- ---------------------------------------------------------------
-- FIN DE LA MIGRATION
-- ---------------------------------------------------------------
-- RÉSUMÉ :
-- ✅ Contrainte future_showtime supprimée
-- ✅ Status rooms aligné (FERME)
-- ✅ RLS activé sur toutes les tables
-- ✅ Lecture publique pour movies, rooms, seats, showtimes
-- ✅ INSERT guest pour reservations, reservation_seats, seat_locks
-- ✅ Status PAID ajouté dans reservations
-- ✅ Salle d'église par défaut créée
