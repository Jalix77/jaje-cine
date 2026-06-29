
-- ===============================================
-- SCHÉMA DE BASE DE DONNÉES JAJE CINÉ
-- Version Supabase Auth + Profiles
-- ===============================================

-- Extension pour UUID (disponible sur Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- 1. TABLE PROFILES (liée à auth.users)
-- ===============================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL, -- Copié depuis auth.users pour facilité
    role VARCHAR(20) NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'STAFF', 'ADMIN')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    preferred_language VARCHAR(5) DEFAULT 'fr',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0
);

-- Index pour performances
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

-- ===============================================
-- 2. TABLE MOVIES (Films) - INCHANGÉE
-- ===============================================
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    synopsis TEXT NOT NULL,
    director VARCHAR(255),
    actors TEXT,
    genre VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    release_date DATE NOT NULL,
    rating VARCHAR(10) NOT NULL CHECK (rating IN ('G', 'PG', 'PG-13', 'R', 'NC-17')),
    language VARCHAR(50) DEFAULT 'français',
    subtitles VARCHAR(100),
    poster_url TEXT,
    trailer_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'BIENTOT' CHECK (status IN ('A_L_AFFICHE', 'BIENTOT', 'ARCHIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Index pour recherche et filtres
CREATE INDEX idx_movies_status ON movies(status);
CREATE INDEX idx_movies_genre ON movies(genre);
CREATE INDEX idx_movies_release_date ON movies(release_date);
CREATE INDEX idx_movies_title ON movies USING gin(to_tsvector('french', title));

-- ===============================================
-- 3. TABLE ROOMS (Salles)
-- ===============================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    rows INTEGER NOT NULL CHECK (rows > 0),
    seats_per_row INTEGER NOT NULL CHECK (seats_per_row > 0),
    screen_type VARCHAR(50) DEFAULT 'STANDARD',
    sound_system VARCHAR(50) DEFAULT 'STEREO',
    accessibility_features TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    
    -- Contrainte de cohérence
    CONSTRAINT capacity_check CHECK (capacity = rows * seats_per_row)
);

-- ===============================================
-- 4. TABLE SEAT_ZONES (Zones de prix)
-- ===============================================
CREATE TABLE seat_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- 'Premium', 'Standard', 'Économique'
    color VARCHAR(7) NOT NULL, -- Couleur hex pour affichage
    price_htg NUMERIC(10,2) NOT NULL CHECK (price_htg > 0),
    row_start VARCHAR(2) NOT NULL, -- 'A'
    row_end VARCHAR(2) NOT NULL,   -- 'C'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(room_id, name),
    UNIQUE(room_id, row_start, row_end)
);

-- ===============================================
-- 5. TABLE SEATS (Sièges individuels)
-- ===============================================
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES seat_zones(id) ON DELETE CASCADE,
    row_letter VARCHAR(2) NOT NULL,
    seat_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BLOCKED', 'MAINTENANCE')),
    is_wheelchair_accessible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(room_id, row_letter, seat_number)
);

-- Index pour performances
CREATE INDEX idx_seats_room_status ON seats(room_id, status);

-- ===============================================
-- 6. TABLE SHOWTIMES (Séances)
-- ===============================================
CREATE TABLE showtimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    base_price_htg NUMERIC(10,2) NOT NULL CHECK (base_price_htg > 0),
    multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00, -- 1.0 = normal, 1.5 = soirée
    language VARCHAR(50) DEFAULT 'français',
    subtitles VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (status IN ('ACTIF', 'COMPLET', 'ANNULE')),
    capacity INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    
    -- Contraintes métier
    CONSTRAINT available_seats_check CHECK (available_seats >= 0 AND available_seats <= capacity),
    CONSTRAINT future_showtime CHECK (show_date >= CURRENT_DATE),
    UNIQUE(room_id, show_date, show_time) -- Anti-conflit de programmation
);

-- Index pour performances
CREATE INDEX idx_showtimes_movie_date ON showtimes(movie_id, show_date);
CREATE INDEX idx_showtimes_room_datetime ON showtimes(room_id, show_date, show_time);
CREATE INDEX idx_showtimes_status ON showtimes(status);
CREATE INDEX idx_showtimes_available ON showtimes(available_seats) WHERE status = 'ACTIF';

-- ===============================================
-- 7. TABLE RESERVATIONS (Réservations) - MODIFIÉE
-- ===============================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_code VARCHAR(20) UNIQUE NOT NULL, -- JC-2025-123456
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Référence profiles au lieu de users
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    
    -- Informations client (pour invités)
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    guest_name VARCHAR(200),
    
    -- Détails réservation
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    total_price_htg NUMERIC(10,2) NOT NULL CHECK (total_price_htg > 0),
    
    -- Statuts
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION' CHECK (payment_status IN ('EN_ATTENTE_VALIDATION', 'PAYE', 'CASH_A_LARRIVEE', 'REFUSE', 'ANNULE')),
    
    -- Paiement
    payment_method VARCHAR(20) CHECK (payment_method IN ('MONCASH', 'NATCASH', 'CASH', 'CARD')),
    transaction_reference VARCHAR(100),
    payment_proof_url TEXT,
    payment_validated_by UUID REFERENCES profiles(id),
    payment_validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Scan à l'entrée
    used_at TIMESTAMP WITH TIME ZONE,
    scanned_by UUID REFERENCES profiles(id),
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'), -- Timeout sélection
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES profiles(id),
    cancel_reason TEXT,
    
    -- Contraintes métier
    CONSTRAINT guest_or_user_check CHECK (user_id IS NOT NULL OR (guest_email IS NOT NULL AND guest_name IS NOT NULL)),
    CONSTRAINT payment_reference_check CHECK (
        (payment_method IN ('MONCASH', 'NATCASH') AND transaction_reference IS NOT NULL) OR
        (payment_method IN ('CASH', 'CARD') AND transaction_reference IS NULL) OR
        (payment_method IS NULL)
    )
);

-- Index pour performances
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_showtime ON reservations(showtime_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX idx_reservations_confirmation_code ON reservations(confirmation_code);
CREATE INDEX idx_reservations_expires_at ON reservations(expires_at) WHERE status = 'PENDING';

-- ===============================================
-- 8. TABLE RESERVATION_SEATS (Sièges réservés) - CORRIGÉE
-- ===============================================
CREATE TABLE reservation_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE, -- AJOUTÉ pour index anti-double-booking
    price_htg NUMERIC(10,2) NOT NULL CHECK (price_htg > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- CONTRAINTE ANTI-DOUBLE-BOOKING CORRIGÉE
    UNIQUE(seat_id, reservation_id),
    UNIQUE(showtime_id, seat_id) -- Empêche la réservation du même siège pour la même séance
);

-- Index pour performances
CREATE INDEX idx_reservation_seats_reservation ON reservation_seats(reservation_id);
CREATE INDEX idx_reservation_seats_showtime_seat ON reservation_seats(showtime_id, seat_id);

-- ===============================================
-- 9. TABLE SEAT_LOCKS (Verrous temporaires)
-- ===============================================
CREATE TABLE seat_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    locked_by UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Référence profiles
    session_id VARCHAR(255) NOT NULL, -- ID de session pour invités
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
    
    -- CONTRAINTE ANTI-DOUBLE-SÉLECTION
    UNIQUE(seat_id, showtime_id)
);

-- Index pour nettoyage automatique
CREATE INDEX idx_seat_locks_expires_at ON seat_locks(expires_at);
CREATE INDEX idx_seat_locks_session ON seat_locks(session_id);

-- ===============================================
-- 10. TABLE SUPPORT_TICKETS (Support client)
-- ===============================================
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- SUP-2025-001234
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Référence profiles
    
    -- Informations contact
    contact_name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    
    -- Ticket
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'RESERVATION', 'PAYMENT', 'TECHNICAL', 'COMPLAINT')),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMALE' CHECK (priority IN ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE')),
    status VARCHAR(20) NOT NULL DEFAULT 'NOUVEAU' CHECK (status IN ('NOUVEAU', 'EN_COURS', 'RESOLU', 'FERME')),
    
    -- Assignation
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Résolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_response_at TIMESTAMP WITH TIME ZONE
);

-- Index pour gestion des tickets
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);

-- ===============================================
-- 11. TABLE SUPPORT_RESPONSES (Réponses support)
-- ===============================================
CREATE TABLE support_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Référence profiles
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Note interne ou réponse client
    attachments TEXT[], -- URLs des pièces jointes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 12. TABLE CONTENT_MANAGEMENT (Gestion contenu)
-- ===============================================
CREATE TABLE content_management (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL, -- 'hero_title', 'hero_subtitle', etc.
    category VARCHAR(50) NOT NULL, -- 'homepage', 'footer', 'contact', etc.
    content_type VARCHAR(20) NOT NULL DEFAULT 'TEXT' CHECK (content_type IN ('TEXT', 'HTML', 'URL', 'JSON', 'BOOLEAN')),
    content_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- ===============================================
-- 13. TABLE AUDIT_LOGS (Journal d'audit)
-- ===============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Action
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    
    -- Utilisateur
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Référence profiles
    user_email VARCHAR(255),
    user_role VARCHAR(20),
    
    -- Données
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Contexte
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    additional_info JSONB
);

-- Index pour requêtes d'audit
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_changed_fields ON audit_logs USING gin(changed_fields);

-- ===============================================
-- 14. TABLE SYSTEM_SETTINGS (Paramètres système)
-- ===============================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'STRING' CHECK (data_type IN ('STRING', 'INTEGER', 'BOOLEAN', 'JSON')),
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Visible côté client
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Paramètres par défaut
INSERT INTO system_settings (key, value, data_type, category, description, is_public) VALUES
('seat_lock_duration_minutes', '15', 'INTEGER', 'RESERVATION', 'Durée de verrouillage des sièges en minutes', FALSE),
('reservation_expiry_hours', '24', 'INTEGER', 'RESERVATION', 'Délai d''expiration des réservations non payées', FALSE),
('cinema_name', 'JAJE Ciné', 'STRING', 'GENERAL', 'Nom du cinéma', TRUE),
('cinema_phone', '+509 XXXX-XXXX', 'STRING', 'CONTACT', 'Téléphone du cinéma', TRUE),
('cinema_email', 'contact@jajecine.ht', 'STRING', 'CONTACT', 'Email du cinéma', TRUE),
('maintenance_mode', 'false', 'BOOLEAN', 'SYSTEM', 'Mode maintenance activé', FALSE);

-- ===============================================
-- TRIGGERS ET FONCTIONS
-- ===============================================

-- Fonction de mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application aux tables principales
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_showtimes_updated_at BEFORE UPDATE ON showtimes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_content_management_updated_at BEFORE UPDATE ON content_management FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===============================================
-- FONCTION ANTI-DOUBLE-BOOKING CORRIGÉE
-- ===============================================
CREATE OR REPLACE FUNCTION check_seat_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier si le siège est déjà réservé pour cette séance
    IF EXISTS (
        SELECT 1 
        FROM reservation_seats rs
        JOIN reservations r ON rs.reservation_id = r.id
        WHERE rs.seat_id = NEW.seat_id
        AND rs.showtime_id = NEW.showtime_id
        AND r.status IN ('PENDING', 'CONFIRMED')
        AND rs.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid) -- Exclude self pour les updates
    ) THEN
        RAISE EXCEPTION 'Siège déjà réservé pour cette séance';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger anti-double-booking
CREATE TRIGGER prevent_double_booking 
    BEFORE INSERT OR UPDATE ON reservation_seats 
    FOR EACH ROW EXECUTE FUNCTION check_seat_availability();

-- ===============================================
-- FONCTION DE MISE À JOUR DES SIÈGES DISPONIBLES
-- ===============================================
CREATE OR REPLACE FUNCTION update_showtime_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_showtime_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_showtime_id := NEW.showtime_id;
        -- Diminuer les sièges disponibles
        UPDATE showtimes 
        SET available_seats = available_seats - 1
        WHERE id = v_showtime_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_showtime_id := OLD.showtime_id;
        -- Augmenter les sièges disponibles
        UPDATE showtimes 
        SET available_seats = available_seats + 1
        WHERE id = v_showtime_id;
    END IF;
    
    -- Mettre à jour le statut de la séance
    UPDATE showtimes 
    SET status = CASE 
        WHEN available_seats = 0 THEN 'COMPLET'
        WHEN available_seats > 0 AND status = 'COMPLET' THEN 'ACTIF'
        ELSE status
    END
    WHERE id = v_showtime_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique
CREATE TRIGGER update_seat_availability 
    AFTER INSERT OR DELETE ON reservation_seats 
    FOR EACH ROW EXECUTE FUNCTION update_showtime_availability();

-- ===============================================
-- FONCTION DE NETTOYAGE DES VERROUS EXPIRÉS
-- ===============================================
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM seat_locks WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- FONCTION D'AUDIT AUTOMATIQUE
-- ===============================================
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    audit_action VARCHAR(10);
    user_info RECORD;
BEGIN
    -- Déterminer l'action
    IF TG_OP = 'DELETE' THEN
        audit_action = 'DELETE';
    ELSIF TG_OP = 'UPDATE' THEN
        audit_action = 'UPDATE';
    ELSE
        audit_action = 'CREATE';
    END IF;
    
    -- Récupérer les infos utilisateur (si disponible)
    SELECT id, email, role INTO user_info 
    FROM profiles 
    WHERE id = COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by);
    
    -- Insérer dans audit_logs
    INSERT INTO audit_logs (
        action, table_name, record_id,
        user_id, user_email, user_role,
        old_values, new_values,
        ip_address
    ) VALUES (
        audit_action, TG_TABLE_NAME, 
        COALESCE(NEW.id, OLD.id),
        user_info.id, user_info.email, user_info.role,
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Application de l'audit sur les tables critiques
CREATE TRIGGER audit_movies AFTER INSERT OR UPDATE OR DELETE ON movies FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_showtimes AFTER INSERT OR UPDATE OR DELETE ON showtimes FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_reservations AFTER INSERT OR UPDATE OR DELETE ON reservations FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_rooms AFTER INSERT OR UPDATE OR DELETE ON rooms FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ===============================================
-- FONCTION DE RÉSERVATION COMPLÈTE - CORRIGÉE
-- ===============================================
CREATE OR REPLACE FUNCTION create_reservation(
    p_showtime_id UUID,
    p_seat_ids UUID[],
    p_user_id UUID DEFAULT NULL,
    p_guest_email VARCHAR DEFAULT NULL,
    p_guest_name VARCHAR DEFAULT NULL,
    p_payment_method VARCHAR DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    reservation_id UUID;
    confirmation_code VARCHAR(20);
    seat_id UUID;
    seat_price NUMERIC(10,2);
    total_price NUMERIC(10,2) := 0;
    result JSON;
BEGIN
    -- Générer code de confirmation unique
    confirmation_code := 'JC-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Vérifier disponibilité des sièges
    FOR seat_id IN SELECT unnest(p_seat_ids) LOOP
        IF EXISTS (
            SELECT 1 FROM reservation_seats rs
            JOIN reservations r ON rs.reservation_id = r.id
            WHERE rs.seat_id = seat_id
            AND rs.showtime_id = p_showtime_id
            AND r.status IN ('PENDING', 'CONFIRMED')
        ) THEN
            RAISE EXCEPTION 'Siège % déjà réservé', seat_id;
        END IF;
    END LOOP;
    
    -- Créer la réservation
    INSERT INTO reservations (
        user_id, guest_email, guest_name, showtime_id,
        confirmation_code, total_seats, total_price_htg, payment_method
    ) VALUES (
        p_user_id, p_guest_email, p_guest_name, p_showtime_id,
        confirmation_code, array_length(p_seat_ids, 1), 0, p_payment_method
    ) RETURNING id INTO reservation_id;
    
    -- Réserver les sièges et calculer le prix
    FOR seat_id IN SELECT unnest(p_seat_ids) LOOP
        -- Récupérer le prix du siège avec calcul NUMERIC corrigé
        SELECT ROUND(sz.price_htg * s.multiplier, 2) INTO seat_price
        FROM seats st
        JOIN seat_zones sz ON st.zone_id = sz.id
        JOIN showtimes s ON s.id = p_showtime_id
        WHERE st.id = seat_id;
        
        -- Ajouter le siège à la réservation avec showtime_id
        INSERT INTO reservation_seats (reservation_id, seat_id, showtime_id, price_htg)
        VALUES (reservation_id, seat_id, p_showtime_id, seat_price);
        
        total_price := total_price + seat_price;
    END LOOP;
    
    -- Mettre à jour le prix total
    UPDATE reservations SET total_price_htg = total_price WHERE id = reservation_id;
    
    -- Retourner le résultat
    SELECT json_build_object(
        'reservation_id', reservation_id,
        'confirmation_code', confirmation_code,
        'total_price', total_price
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- POLITIQUE RLS (Row Level Security) - ADAPTÉES POUR SUPABASE AUTH
-- ===============================================

-- Activer RLS sur les tables sensibles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
-- Politique SELECT : Users peuvent voir leur propre profil, STAFF/ADMIN voient tout
CREATE POLICY profiles_own_profile_select ON profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'STAFF')
        )
    );

-- Politique UPDATE : Users peuvent modifier leur propre profil, ADMIN peut tout modifier
CREATE POLICY profiles_own_profile_update ON profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    )
    WITH CHECK (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- ========== RESERVATIONS ==========
-- Politique SELECT : Les clients ne voient que leurs réservations, STAFF/ADMIN voient tout
CREATE POLICY reservation_owner_select ON reservations
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'STAFF')
        )
    );

-- Politique INSERT : Les clients peuvent créer des réservations
CREATE POLICY reservation_owner_insert ON reservations
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        user_id IS NULL OR -- Pour les invités
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'STAFF')
        )
    );

-- Politique UPDATE : Seuls les admins/staff peuvent modifier les réservations
CREATE POLICY reservation_admin_update ON reservations
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'STAFF')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'STAFF')
        )
    );

-- Politique DELETE : Seuls les admins peuvent supprimer
CREATE POLICY reservation_admin_delete ON reservations
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- ========== SUPPORT TICKETS ==========
-- Support Tickets : Clients voient leurs tickets, staff voit tout
CREATE POLICY support_tickets_select ON support_tickets
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'STAFF')
        )
    );

CREATE POLICY support_tickets_insert ON support_tickets
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        user_id IS NULL OR -- Pour les invités
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'STAFF')
        )
    );

-- ========== AUDIT LOGS ==========
-- Audit Logs : Seuls les admins
CREATE POLICY audit_logs_admin_only ON audit_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- ===============================================
-- VUES POUR FACILITER LES REQUÊTES - ADAPTÉES
-- ===============================================

-- Vue des séances avec détails film
CREATE VIEW showtime_details AS
SELECT 
    s.id,
    s.show_date,
    s.show_time,
    s.status,
    s.capacity,
    s.available_seats,
    s.base_price_htg,
    s.multiplier,
    m.title as movie_title,
    m.poster_url,
    m.duration_minutes,
    m.rating,
    r.name as room_name
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN rooms r ON s.room_id = r.id;

-- Vue des réservations complètes - ADAPTÉE
CREATE VIEW reservation_complete AS
SELECT 
    res.id,
    res.confirmation_code,
    res.status,
    res.payment_status,
    res.total_seats,
    res.total_price_htg,
    res.created_at,
    p.email as user_email,
    COALESCE(p.first_name || ' ' || p.last_name, res.guest_name) as customer_name,
    m.title as movie_title,
    s.show_date,
    s.show_time,
    room.name as room_name,
    string_agg(seat.row_letter || seat.seat_number, ', ' ORDER BY seat.row_letter, seat.seat_number) as seats
FROM reservations res
LEFT JOIN profiles p ON res.user_id = p.id
JOIN showtimes s ON res.showtime_id = s.id
JOIN movies m ON s.movie_id = m.id
JOIN rooms room ON s.room_id = room.id
JOIN reservation_seats rs ON res.id = rs.reservation_id
JOIN seats seat ON rs.seat_id = seat.id
GROUP BY res.id, p.email, p.first_name, p.last_name, res.guest_name, 
         m.title, s.show_date, s.show_time, room.name;

-- ===============================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ===============================================

COMMENT ON TABLE profiles IS 'Profils utilisateurs liés à auth.users de Supabase';
COMMENT ON TABLE reservations IS 'Réservations de sièges avec gestion des invités et timeout';
COMMENT ON TABLE seat_locks IS 'Verrous temporaires pour éviter les conflits de sélection';
COMMENT ON TABLE reservation_seats IS 'Table de liaison avec contrainte anti-double-booking via showtime_id+seat_id';
COMMENT ON TABLE audit_logs IS 'Journal d''audit complet avec JSONB pour flexibilité';

COMMENT ON COLUMN reservations.expires_at IS 'Expiration automatique après 15 min pour libérer les sièges';
COMMENT ON COLUMN seat_locks.session_id IS 'ID de session pour gérer les utilisateurs non connectés';
COMMENT ON COLUMN reservation_seats.showtime_id IS 'Copié depuis reservations pour contrainte unique anti-double-booking';

-- ===============================================
-- FIN DU SCHÉMA SUPABASE AUTH
-- ===============================================