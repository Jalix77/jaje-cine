# 📊 Mapping des Statuts - JAJE Ciné

Correspondance normalisée entre les statuts de réservation, paiement et ticket.

---

## 🔄 TABLE DE MAPPING COMPLÈTE

| reservation.status | payment.status | payment.method | ticket.status | Description |
|-------------------|----------------|----------------|---------------|-------------|
| **DRAFT** | - | - | **TO_PAY** | Sièges sélectionnés, paiement non initié |
| **PENDING_PAYMENT** | **PENDING** | MONCASH/NATCASH | **PENDING** | Paiement mobile soumis, en attente validation |
| **PENDING_PAYMENT** | **PENDING** | CASH_ON_ARRIVAL | **VALID** | Paiement à l'arrivée confirmé |
| **CONFIRMED** | **VALIDATED** | MONCASH/NATCASH | **VALID** | Paiement validé par admin |
| **CONFIRMED** | **VALIDATED** | CASH_ON_ARRIVAL | **VALID** | Paiement effectué au cinéma |
| **CANCELLED** | **REJECTED** | Tous | **CANCELLED** | Paiement rejeté par admin |
| **CANCELLED** | **REFUNDED** | Tous | **CANCELLED** | Réservation annulée avec remboursement |
| **EXPIRED** | - | - | **EXPIRED** | Timeout 15 min dépassé |
| **CONFIRMED** | **VALIDATED** | Tous | **USED** | Ticket scanné à l'entrée |
| **CONFIRMED** | **VALIDATED** | Tous | **EXPIRED** | Séance passée sans présentation |

---

## 🎯 MODÈLE FINAL NORMALISÉ

### **1. CASH_ON_ARRIVAL = Méthode de Paiement (PAS un statut)**

```typescript
// ✅ CORRECT
interface Payment {
  id: string;
  reservationId: string;
  method: 'MONCASH' | 'NATCASH' | 'CASH_ON_ARRIVAL' | 'CARD';
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'REFUNDED';
  transactionReference?: string;
  amountHtg: number;
  validatedAt?: Date;
  validatedBy?: string;
}

// ❌ INCORRECT (ancien modèle)
interface Payment {
  status: 'PENDING' | 'VALIDATED' | 'CASH_ON_ARRIVAL'; // ❌ Mélange méthode et statut
}
```

---

## 📋 SCHÉMA DE BASE DE DONNÉES FINAL

### **Table : reservations**

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_code VARCHAR(20) UNIQUE NOT NULL,
  
  -- Relations
  user_id UUID REFERENCES users(id),
  showtime_id UUID NOT NULL REFERENCES showtimes(id),
  
  -- Informations client (pour invités)
  guest_email VARCHAR(255),
  guest_name VARCHAR(255),
  guest_phone VARCHAR(20),
  
  -- Statut de la réservation
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  -- Valeurs possibles : DRAFT, PENDING_PAYMENT, CONFIRMED, CANCELLED, EXPIRED
  
  -- Montants
  total_price_htg DECIMAL(10, 2) NOT NULL,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Pour DRAFT (15 min)
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Contraintes
  CONSTRAINT guest_or_user_check CHECK (
    (user_id IS NOT NULL) OR 
    (guest_email IS NOT NULL AND guest_name IS NOT NULL)
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED')
  )
);

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_showtime ON reservations(showtime_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_confirmation ON reservations(confirmation_code);
```

---

### **Table : payments**

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- Méthode de paiement (NORMALISÉ)
  method VARCHAR(20) NOT NULL,
  -- Valeurs possibles : MONCASH, NATCASH, CASH_ON_ARRIVAL, CARD
  
  -- Statut du paiement (NORMALISÉ)
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- Valeurs possibles : PENDING, VALIDATED, REJECTED, REFUNDED
  
  -- Détails de la transaction
  transaction_reference VARCHAR(100),
  amount_htg DECIMAL(10, 2) NOT NULL,
  payment_proof_url TEXT,
  
  -- Validation
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- Remboursement
  refunded_at TIMESTAMPTZ,
  refunded_by UUID REFERENCES users(id),
  refund_amount_htg DECIMAL(10, 2),
  refund_reference VARCHAR(100),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_method CHECK (
    method IN ('MONCASH', 'NATCASH', 'CASH_ON_ARRIVAL', 'CARD')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('PENDING', 'VALIDATED', 'REJECTED', 'REFUNDED')
  ),
  CONSTRAINT transaction_ref_required CHECK (
    (method = 'CASH_ON_ARRIVAL') OR 
    (transaction_reference IS NOT NULL)
  )
);

CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
```

---

### **Vue : tickets (Vue Virtuelle)**

```sql
CREATE VIEW tickets AS
SELECT 
  r.id AS ticket_id,
  r.confirmation_code,
  
  -- Statut du ticket (calculé)
  CASE
    WHEN r.status = 'DRAFT' THEN 'TO_PAY'
    WHEN r.status = 'PENDING_PAYMENT' AND p.method = 'CASH_ON_ARRIVAL' THEN 'VALID'
    WHEN r.status = 'PENDING_PAYMENT' AND p.status = 'PENDING' THEN 'PENDING'
    WHEN r.status = 'CONFIRMED' AND r.used_at IS NOT NULL THEN 'USED'
    WHEN r.status = 'CONFIRMED' AND s.show_date + s.show_time < NOW() THEN 'EXPIRED'
    WHEN r.status = 'CONFIRMED' THEN 'VALID'
    WHEN r.status IN ('CANCELLED', 'EXPIRED') THEN r.status
  END AS status,
  
  -- Informations client
  COALESCE(u.first_name || ' ' || u.last_name, r.guest_name) AS customer_name,
  COALESCE(u.email, r.guest_email) AS customer_email,
  
  -- Informations séance
  m.title AS movie_title,
  m.poster_url AS movie_poster,
  s.show_date,
  s.show_time,
  rm.name AS room_name,
  
  -- Sièges
  STRING_AGG(st.row || st.number, ', ' ORDER BY st.row, st.number) AS seats,
  COUNT(rs.seat_id) AS total_seats,
  
  -- Paiement
  r.total_price_htg,
  p.method AS payment_method,
  p.status AS payment_status,
  
  -- QR Code
  r.qr_code_url,
  
  -- Dates
  r.created_at,
  r.confirmed_at,
  r.used_at
  
FROM reservations r
LEFT JOIN users u ON r.user_id = u.id
JOIN showtimes s ON r.showtime_id = s.id
JOIN movies m ON s.movie_id = m.id
JOIN rooms rm ON s.room_id = rm.id
LEFT JOIN payments p ON r.id = p.reservation_id
LEFT JOIN reservation_seats rs ON r.id = rs.reservation_id
LEFT JOIN seats st ON rs.seat_id = st.id
GROUP BY 
  r.id, r.confirmation_code, r.status, r.guest_name, r.guest_email,
  u.first_name, u.last_name, u.email,
  m.title, m.poster_url, s.show_date, s.show_time, rm.name,
  r.total_price_htg, p.method, p.status, r.qr_code_url,
  r.created_at, r.confirmed_at, r.used_at;
```

---

## 🔄 FLUX DE STATUTS DÉTAILLÉ

### **Scénario 1 : Paiement Mobile (MonCash/NatCash)**

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Sélection des sièges                              │
└─────────────────────────────────────────────────────────────┘
reservation.status = DRAFT
payment = NULL
ticket.status = TO_PAY

┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Soumission du paiement mobile                     │
└─────────────────────────────────────────────────────────────┘
reservation.status = PENDING_PAYMENT
payment.method = MONCASH
payment.status = PENDING
payment.transaction_reference = "MC-123456"
ticket.status = PENDING

┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3A : Admin VALIDE le paiement                         │
└─────────────────────────────────────────────────────────────┘
reservation.status = CONFIRMED
payment.status = VALIDATED
payment.validated_at = NOW()
payment.validated_by = admin_id
ticket.status = VALID

┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3B : Admin REJETTE le paiement                        │
└─────────────────────────────────────────────────────────────┘
reservation.status = CANCELLED
payment.status = REJECTED
payment.rejection_reason = "Référence invalide"
ticket.status = CANCELLED

┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : Client se présente au cinéma                      │
└─────────────────────────────────────────────────────────────┘
reservation.status = CONFIRMED
reservation.used_at = NOW()
payment.status = VALIDATED
ticket.status = USED
```

---

### **Scénario 2 : Paiement à l'Arrivée (Cash)**

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Sélection des sièges                              │
└─────────────────────────────────────────────────────────────┘
reservation.status = DRAFT
payment = NULL
ticket.status = TO_PAY

┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Sélection "Paiement à l'arrivée"                  │
└─────────────────────────────────────────────────────────────┘
reservation.status = PENDING_PAYMENT
payment.method = CASH_ON_ARRIVAL
payment.status = PENDING
payment.transaction_reference = NULL
ticket.status = VALID ✅ (Directement valide)

┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : Client paie au cinéma                             │
└─────────────────────────────────────────────────────────────┘
reservation.status = CONFIRMED
payment.status = VALIDATED
payment.validated_at = NOW()
payment.validated_by = staff_id
ticket.status = VALID

┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : Scan du ticket à l'entrée                         │
└─────────────────────────────────────────────────────────────┘
reservation.status = CONFIRMED
reservation.used_at = NOW()
payment.status = VALIDATED
ticket.status = USED
```

---

### **Scénario 3 : Annulation**

```
┌─────────────────────────────────────────────────────────────┐
│ Annulation AVANT validation du paiement                     │
└─────────────────────────────────────────────────────────────┘
reservation.status = CANCELLED
payment.status = REJECTED (si existant)
ticket.status = CANCELLED
refund_amount = 0 HTG

┌─────────────────────────────────────────────────────────────┐
│ Annulation APRÈS validation du paiement                     │
└─────────────────────────────────────────────────────────────┘
reservation.status = CANCELLED
payment.status = REFUNDED
payment.refund_amount_htg = total_price_htg
payment.refunded_at = NOW()
ticket.status = CANCELLED
```

---

### **Scénario 4 : Expiration**

```
┌─────────────────────────────────────────────────────────────┐
│ Timeout 15 minutes (DRAFT)                                  │
└─────────────────────────────────────────────────────────────┘
reservation.status = EXPIRED
payment = NULL
ticket.status = EXPIRED
→ Sièges libérés automatiquement

┌─────────────────────────────────────────────────────────────┐
│ Séance passée sans présentation                             │
└─────────────────────────────────────────────────────────────┘
reservation.status = CONFIRMED (inchangé)
payment.status = VALIDATED (inchangé)
ticket.status = EXPIRED ⚠️ (calculé par la vue)
```

---

## 🔧 FONCTIONS DE TRANSITION

### **Fonction 1 : Confirmer le Paiement**

```typescript
async function confirmPayment(
  reservationId: string,
  method: 'MONCASH' | 'NATCASH' | 'CASH_ON_ARRIVAL',
  transactionReference?: string,
  paymentProofUrl?: string
): Promise<void> {
  // 1. Créer le paiement
  const payment = await supabase
    .from('payments')
    .insert({
      reservation_id: reservationId,
      method: method,
      status: 'PENDING',
      transaction_reference: transactionReference,
      payment_proof_url: paymentProofUrl,
      amount_htg: reservation.total_price_htg
    });
  
  // 2. Mettre à jour la réservation
  await supabase
    .from('reservations')
    .update({
      status: 'PENDING_PAYMENT'
    })
    .eq('id', reservationId);
  
  // 3. Si CASH_ON_ARRIVAL, ticket directement valide
  // (géré par la vue tickets)
}
```

---

### **Fonction 2 : Valider le Paiement (Admin)**

```typescript
async function validatePayment(
  reservationId: string,
  adminId: string,
  notes?: string
): Promise<void> {
  // Transaction atomique
  await supabase.rpc('validate_payment_transaction', {
    p_reservation_id: reservationId,
    p_admin_id: adminId,
    p_notes: notes
  });
}

-- Fonction SQL
CREATE OR REPLACE FUNCTION validate_payment_transaction(
  p_reservation_id UUID,
  p_admin_id UUID,
  p_notes TEXT
) RETURNS void AS $$
BEGIN
  -- 1. Valider le paiement
  UPDATE payments
  SET 
    status = 'VALIDATED',
    validated_at = NOW(),
    validated_by = p_admin_id
  WHERE reservation_id = p_reservation_id;
  
  -- 2. Confirmer la réservation
  UPDATE reservations
  SET 
    status = 'CONFIRMED',
    confirmed_at = NOW()
  WHERE id = p_reservation_id;
  
  -- 3. Générer le QR code (via trigger)
  -- 4. Envoyer l'email de confirmation (via trigger)
END;
$$ LANGUAGE plpgsql;
```

---

### **Fonction 3 : Rejeter le Paiement (Admin)**

```typescript
async function rejectPayment(
  reservationId: string,
  adminId: string,
  reason: string
): Promise<void> {
  await supabase.rpc('reject_payment_transaction', {
    p_reservation_id: reservationId,
    p_admin_id: adminId,
    p_reason: reason
  });
}

-- Fonction SQL
CREATE OR REPLACE FUNCTION reject_payment_transaction(
  p_reservation_id UUID,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS void AS $$
BEGIN
  -- 1. Rejeter le paiement
  UPDATE payments
  SET 
    status = 'REJECTED',
    rejection_reason = p_reason,
    validated_by = p_admin_id,
    validated_at = NOW()
  WHERE reservation_id = p_reservation_id;
  
  -- 2. Annuler la réservation
  UPDATE reservations
  SET 
    status = 'CANCELLED',
    cancelled_at = NOW(),
    cancellation_reason = 'Paiement rejeté: ' || p_reason
  WHERE id = p_reservation_id;
  
  -- 3. Libérer les sièges
  UPDATE seats
  SET status = 'FREE'
  WHERE id IN (
    SELECT seat_id FROM reservation_seats 
    WHERE reservation_id = p_reservation_id
  );
  
  -- 4. Envoyer l'email de rejet (via trigger)
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 REQUÊTES UTILES

### **Obtenir le Statut Complet d'une Réservation**

```sql
SELECT 
  r.confirmation_code,
  r.status AS reservation_status,
  p.method AS payment_method,
  p.status AS payment_status,
  t.status AS ticket_status,
  t.customer_name,
  t.movie_title,
  t.show_date,
  t.show_time,
  t.seats
FROM reservations r
LEFT JOIN payments p ON r.id = p.reservation_id
LEFT JOIN tickets t ON r.confirmation_code = t.confirmation_code
WHERE r.id = $1;
```

---

### **Statistiques des Paiements par Méthode**

```sql
SELECT 
  p.method,
  p.status,
  COUNT(*) AS count,
  SUM(p.amount_htg) AS total_amount
FROM payments p
WHERE p.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.method, p.status
ORDER BY p.method, p.status;
```

---

### **Tickets Valides pour une Séance**

```sql
SELECT 
  t.confirmation_code,
  t.customer_name,
  t.seats,
  t.status
FROM tickets t
WHERE t.show_date = $1
AND t.show_time = $2
AND t.room_name = $3
AND t.status IN ('VALID', 'USED')
ORDER BY t.seats;
```

---

## ✅ AVANTAGES DU MODÈLE FINAL

### **1. Séparation Claire des Responsabilités**

- **`reservation.status`** : État de la réservation
- **`payment.method`** : Comment le client paie
- **`payment.status`** : État du paiement
- **`ticket.status`** : Vue client (calculée)

### **2. Flexibilité**

- Facile d'ajouter de nouvelles méthodes de paiement
- Gestion des remboursements intégrée
- Historique complet des transactions

### **3. Cohérence**

- Pas de confusion entre méthode et statut
- Transitions logiques et prévisibles
- Audit trail complet

### **4. Performance**

- Index optimisés
- Vue matérialisée pour les tickets (optionnel)
- Requêtes efficaces

---

Fin du document
