# ⚙️ Triggers et Jobs Automatiques - JAJE Ciné

Liste complète de tous les automatismes du système.

---

## 🔄 TRIGGERS DE BASE DE DONNÉES

### **1. Audit Log Automatique**

**Déclencheur :** Toute modification sur les tables critiques

**Tables concernées :**
- `users`
- `movies`
- `showtimes`
- `reservations`
- `reservation_seats`
- `rooms`
- `seats`
- `support_tickets`

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    action,
    table_name,
    record_id,
    user_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    TG_OP, -- INSERT, UPDATE, DELETE
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    current_setting('app.current_user_id', true)::uuid,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    current_setting('app.client_ip', true),
    current_setting('app.user_agent', true)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables
CREATE TRIGGER audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_reservations
AFTER INSERT OR UPDATE OR DELETE ON reservations
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- ... (répéter pour chaque table)
```

---

### **2. Vérification Anti-Double-Booking**

**Déclencheur :** Avant insertion dans `reservation_seats`

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION check_seat_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_showtime_id uuid;
  v_existing_count int;
BEGIN
  -- Récupérer le showtime_id de la réservation
  SELECT showtime_id INTO v_showtime_id
  FROM reservations
  WHERE id = NEW.reservation_id;
  
  -- Vérifier si le siège est déjà réservé pour cette séance
  SELECT COUNT(*) INTO v_existing_count
  FROM reservation_seats rs
  JOIN reservations r ON rs.reservation_id = r.id
  WHERE rs.seat_id = NEW.seat_id
  AND r.showtime_id = v_showtime_id
  AND r.status IN ('PENDING_PAYMENT', 'CONFIRMED');
  
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Siège déjà réservé pour cette séance';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_double_booking
BEFORE INSERT ON reservation_seats
FOR EACH ROW EXECUTE FUNCTION check_seat_availability();
```

---

### **3. Mise à Jour Automatique des Sièges Disponibles**

**Déclencheur :** Après modification de `reservation_seats`

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION update_available_seats()
RETURNS TRIGGER AS $$
DECLARE
  v_showtime_id uuid;
BEGIN
  -- Récupérer le showtime_id
  SELECT showtime_id INTO v_showtime_id
  FROM reservations
  WHERE id = COALESCE(NEW.reservation_id, OLD.reservation_id);
  
  -- Recalculer les sièges disponibles
  UPDATE showtimes
  SET available_seats = capacity - (
    SELECT COUNT(DISTINCT rs.seat_id)
    FROM reservation_seats rs
    JOIN reservations r ON rs.reservation_id = r.id
    WHERE r.showtime_id = v_showtime_id
    AND r.status IN ('PENDING_PAYMENT', 'CONFIRMED')
  )
  WHERE id = v_showtime_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_showtime_availability
AFTER INSERT OR DELETE ON reservation_seats
FOR EACH ROW EXECUTE FUNCTION update_available_seats();
```

---

### **4. Génération Automatique du Code de Confirmation**

**Déclencheur :** Avant insertion dans `reservations`

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := 'JC-' || 
      TO_CHAR(NOW(), 'YYYY') || '-' || 
      LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_confirmation_code
BEFORE INSERT ON reservations
FOR EACH ROW EXECUTE FUNCTION generate_confirmation_code();
```

---

### **5. Mise à Jour du Statut de Séance (COMPLET)**

**Déclencheur :** Après modification de `showtimes.available_seats`

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION update_showtime_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_seats = 0 AND NEW.status = 'ACTIF' THEN
    NEW.status := 'COMPLET';
  ELSIF NEW.available_seats > 0 AND NEW.status = 'COMPLET' THEN
    NEW.status := 'ACTIF';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_showtime_full
BEFORE UPDATE OF available_seats ON showtimes
FOR EACH ROW EXECUTE FUNCTION update_showtime_status();
```

---

## ⏰ JOBS PLANIFIÉS (CRON)

### **1. Nettoyage des Verrous Expirés**

**Fréquence :** Toutes les 1 minute

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  -- Libérer les sièges
  UPDATE seats 
  SET status = 'FREE'
  WHERE id IN (
    SELECT seat_id FROM seat_locks 
    WHERE expires_at <= NOW()
  );
  
  -- Supprimer les verrous
  DELETE FROM seat_locks 
  WHERE expires_at <= NOW();
  
  RAISE NOTICE 'Verrous expirés nettoyés: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Planification
SELECT cron.schedule(
  'cleanup-expired-locks',
  '* * * * *', -- Chaque minute
  'SELECT cleanup_expired_locks();'
);
```

---

### **2. Expiration des Réservations DRAFT**

**Fréquence :** Toutes les 5 minutes

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION expire_draft_reservations()
RETURNS void AS $$
DECLARE
  v_expired_count int;
BEGIN
  -- Expirer les réservations DRAFT de plus de 15 minutes
  WITH expired AS (
    UPDATE reservations
    SET status = 'EXPIRED'
    WHERE status = 'DRAFT'
    AND created_at < NOW() - INTERVAL '15 minutes'
    RETURNING id, showtime_id
  )
  -- Libérer les sièges associés
  UPDATE seats
  SET status = 'FREE'
  WHERE id IN (
    SELECT rs.seat_id
    FROM reservation_seats rs
    JOIN expired e ON rs.reservation_id = e.id
  );
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RAISE NOTICE 'Réservations expirées: %', v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Planification
SELECT cron.schedule(
  'expire-draft-reservations',
  '*/5 * * * *', -- Toutes les 5 minutes
  'SELECT expire_draft_reservations();'
);
```

---

### **3. Expiration des Tickets Après Séance**

**Fréquence :** Toutes les heures

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION expire_past_tickets()
RETURNS void AS $$
BEGIN
  -- Expirer les tickets dont la séance est passée
  UPDATE reservations r
  SET status = 'EXPIRED'
  FROM showtimes s
  WHERE r.showtime_id = s.id
  AND r.status = 'CONFIRMED'
  AND (s.show_date + s.show_time) < NOW()
  AND r.status != 'USED';
  
  RAISE NOTICE 'Tickets expirés: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Planification
SELECT cron.schedule(
  'expire-past-tickets',
  '0 * * * *', -- Toutes les heures
  'SELECT expire_past_tickets();'
);
```

---

### **4. Fermeture Automatique des Tickets Support Résolus**

**Fréquence :** Tous les jours à 2h du matin

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION auto_close_resolved_tickets()
RETURNS void AS $$
BEGIN
  -- Fermer les tickets résolus depuis plus de 7 jours
  UPDATE support_tickets
  SET status = 'CLOSED'
  WHERE status = 'RESOLVED'
  AND updated_at < NOW() - INTERVAL '7 days';
  
  RAISE NOTICE 'Tickets fermés automatiquement: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Planification
SELECT cron.schedule(
  'auto-close-support-tickets',
  '0 2 * * *', -- Tous les jours à 2h
  'SELECT auto_close_resolved_tickets();'
);
```

---

### **5. Purge des Logs d'Audit Anciens**

**Fréquence :** Tous les dimanches à 3h du matin

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION purge_old_audit_logs()
RETURNS void AS $$
DECLARE
  v_deleted_count int;
BEGIN
  -- Supprimer les logs de plus de 1 an
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Logs d''audit purgés: %', v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Planification
SELECT cron.schedule(
  'purge-old-audit-logs',
  '0 3 * * 0', -- Dimanche à 3h
  'SELECT purge_old_audit_logs();'
);
```

---

### **6. Rappel Avant Séance (Notifications)**

**Fréquence :** Toutes les 30 minutes

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION send_showtime_reminders()
RETURNS void AS $$
DECLARE
  v_reminder RECORD;
BEGIN
  -- Trouver les réservations dont la séance est dans 2 heures
  FOR v_reminder IN
    SELECT 
      r.id,
      r.confirmation_code,
      u.email,
      u.first_name,
      m.title AS movie_title,
      s.show_date,
      s.show_time,
      rm.name AS room_name
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN showtimes s ON r.showtime_id = s.id
    JOIN movies m ON s.movie_id = m.id
    JOIN rooms rm ON s.room_id = rm.id
    WHERE r.status = 'CONFIRMED'
    AND (s.show_date + s.show_time) BETWEEN NOW() + INTERVAL '2 hours' AND NOW() + INTERVAL '2 hours 30 minutes'
    AND r.reminder_sent = false
  LOOP
    -- Envoyer l'email (via Edge Function)
    PERFORM net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-reminder-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'email', v_reminder.email,
        'firstName', v_reminder.first_name,
        'confirmationCode', v_reminder.confirmation_code,
        'movieTitle', v_reminder.movie_title,
        'showDate', v_reminder.show_date,
        'showTime', v_reminder.show_time,
        'roomName', v_reminder.room_name
      )::text
    );
    
    -- Marquer comme envoyé
    UPDATE reservations
    SET reminder_sent = true
    WHERE id = v_reminder.id;
  END LOOP;
  
  RAISE NOTICE 'Rappels envoyés: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Planification
SELECT cron.schedule(
  'send-showtime-reminders',
  '*/30 * * * *', -- Toutes les 30 minutes
  'SELECT send_showtime_reminders();'
);
```

---

### **7. Mise à Jour Automatique du Statut des Films**

**Fréquence :** Tous les jours à 1h du matin

**Fonction :**
```sql
CREATE OR REPLACE FUNCTION update_movie_statuses()
RETURNS void AS $$
BEGIN
  -- Passer les films "BIENTOT" à "A_L_AFFICHE" si la date de sortie est atteinte
  UPDATE movies
  SET status = 'A_L_AFFICHE'
  WHERE status = 'BIENTOT'
  AND release_date <= CURRENT_DATE;
  
  RAISE NOTICE 'Films mis à jour: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Planification
SELECT cron.schedule(
  'update-movie-statuses',
  '0 1 * * *', -- Tous les jours à 1h
  'SELECT update_movie_statuses();'
);
```

---

## 📊 RÉSUMÉ DES AUTOMATISMES

| Type | Nom | Fréquence | Objectif |
|------|-----|-----------|----------|
| **Trigger** | Audit Log | Temps réel | Traçabilité complète |
| **Trigger** | Anti-Double-Booking | Temps réel | Empêcher conflits |
| **Trigger** | Sièges Disponibles | Temps réel | Mise à jour capacité |
| **Trigger** | Code Confirmation | Temps réel | Génération automatique |
| **Trigger** | Statut Séance | Temps réel | ACTIF ↔ COMPLET |
| **Job** | Nettoyage Verrous | 1 min | Libérer sièges |
| **Job** | Expiration DRAFT | 5 min | Libérer réservations |
| **Job** | Expiration Tickets | 1 heure | Séances passées |
| **Job** | Fermeture Support | 1 jour | Tickets résolus |
| **Job** | Purge Logs | 1 semaine | Nettoyage base |
| **Job** | Rappels Séances | 30 min | Notifications clients |
| **Job** | Statut Films | 1 jour | BIENTOT → A_L_AFFICHE |

---

Fin du document
