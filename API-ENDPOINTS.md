# 🔌 API Endpoints - JAJE Ciné

Documentation complète de tous les endpoints API avec exemples JSON.

---

## 🔐 AUTHENTIFICATION

### **POST /api/auth/register**
Inscription d'un nouveau client

**Auth:** Aucune

**Request:**
```json
{
  "email": "client@example.com",
  "password": "SecurePass123!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+509 1234-5678",
  "dateOfBirth": "1990-05-15"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "client@example.com",
    "role": "CLIENT",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400` - Email déjà utilisé
- `422` - Validation échouée (mot de passe faible, email invalide)

---

### **POST /api/auth/login**
Connexion utilisateur

**Auth:** Aucune

**Request:**
```json
{
  "email": "admin@jajecine.ht",
  "password": "Admin2025!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-456",
      "email": "admin@jajecine.ht",
      "firstName": "Admin",
      "lastName": "JAJE",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

**Errors:**
- `401` - Email ou mot de passe incorrect
- `403` - Compte suspendu

---

### **POST /api/auth/logout**
Déconnexion

**Auth:** Bearer Token

**Request:** Aucun body

**Response 200:**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

### **POST /api/auth/refresh**
Rafraîchir le token

**Auth:** Refresh Token

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

## 🎬 FILMS

### **GET /api/movies**
Liste tous les films

**Auth:** Aucune

**Query Params:**
- `status` (optional): `A_L_AFFICHE` | `BIENTOT` | `ARCHIVE`
- `genre` (optional): string
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "movies": [
      {
        "id": "uuid-789",
        "title": "Avatar: La Voie de l'Eau",
        "originalTitle": "Avatar: The Way of Water",
        "synopsis": "Jake Sully et Neytiri...",
        "director": "James Cameron",
        "actors": ["Sam Worthington", "Zoe Saldana"],
        "genre": "Science-Fiction",
        "durationMinutes": 192,
        "releaseDate": "2024-01-15",
        "rating": "PG-13",
        "language": "français",
        "subtitles": "français, créole",
        "posterUrl": "https://...",
        "trailerUrl": "https://youtube.com/...",
        "status": "A_L_AFFICHE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### **GET /api/movies/:id**
Détail d'un film

**Auth:** Aucune

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-789",
    "title": "Avatar: La Voie de l'Eau",
    "synopsis": "...",
    "director": "James Cameron",
    "actors": ["Sam Worthington", "Zoe Saldana"],
    "genre": "Science-Fiction",
    "durationMinutes": 192,
    "releaseDate": "2024-01-15",
    "rating": "PG-13",
    "posterUrl": "https://...",
    "trailerUrl": "https://...",
    "status": "A_L_AFFICHE",
    "showtimes": [
      {
        "id": "st-001",
        "showDate": "2025-02-15",
        "showTime": "14:00",
        "roomName": "Salle 1",
        "availableSeats": 142,
        "capacity": 160,
        "basePriceHtg": 600
      }
    ]
  }
}
```

**Errors:**
- `404` - Film non trouvé

---

### **POST /api/movies**
Créer un film

**Auth:** Bearer Token (ADMIN uniquement)

**Request:**
```json
{
  "title": "Dune: Deuxième Partie",
  "originalTitle": "Dune: Part Two",
  "synopsis": "Paul Atreides s'unit à Chani...",
  "director": "Denis Villeneuve",
  "actors": ["Timothée Chalamet", "Zendaya"],
  "genre": "Science-Fiction",
  "durationMinutes": 166,
  "releaseDate": "2025-03-01",
  "rating": "PG-13",
  "language": "français",
  "subtitles": "français",
  "posterUrl": "https://...",
  "trailerUrl": "https://...",
  "status": "BIENTOT"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "title": "Dune: Deuxième Partie",
    "createdAt": "2025-02-10T10:30:00Z"
  }
}
```

**Errors:**
- `401` - Non authentifié
- `403` - Rôle insuffisant (CLIENT/STAFF)
- `422` - Validation échouée

---

### **PUT /api/movies/:id**
Modifier un film

**Auth:** Bearer Token (ADMIN uniquement)

**Request:** Mêmes champs que POST (tous optionnels)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-789",
    "title": "Avatar: La Voie de l'Eau (Version Longue)",
    "updatedAt": "2025-02-10T11:00:00Z"
  }
}
```

---

### **DELETE /api/movies/:id**
Supprimer un film

**Auth:** Bearer Token (ADMIN uniquement)

**Response 200:**
```json
{
  "success": true,
  "message": "Film supprimé avec succès"
}
```

**Errors:**
- `409` - Impossible de supprimer (séances actives liées)

---

## 📅 SÉANCES

### **GET /api/showtimes**
Liste toutes les séances

**Auth:** Aucune

**Query Params:**
- `movieId` (optional): uuid
- `date` (optional): YYYY-MM-DD
- `roomId` (optional): uuid
- `status` (optional): `ACTIF` | `COMPLET` | `ANNULE`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "st-001",
      "movieId": "uuid-789",
      "movieTitle": "Avatar: La Voie de l'Eau",
      "moviePoster": "https://...",
      "roomId": "room-001",
      "roomName": "Salle 1",
      "showDate": "2025-02-15",
      "showTime": "14:00",
      "basePriceHtg": 600,
      "multiplier": 1.0,
      "capacity": 160,
      "availableSeats": 142,
      "status": "ACTIF"
    }
  ]
}
```

---

### **GET /api/showtimes/:id**
Détail d'une séance

**Auth:** Aucune

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "st-001",
    "movie": {
      "id": "uuid-789",
      "title": "Avatar: La Voie de l'Eau",
      "poster": "https://...",
      "duration": 192,
      "rating": "PG-13"
    },
    "room": {
      "id": "room-001",
      "name": "Salle 1",
      "capacity": 160
    },
    "showDate": "2025-02-15",
    "showTime": "14:00",
    "basePriceHtg": 600,
    "multiplier": 1.0,
    "availableSeats": 142,
    "status": "ACTIF"
  }
}
```

---

### **GET /api/showtimes/:id/seats**
Plan des sièges d'une séance

**Auth:** Aucune

**Response 200:**
```json
{
  "success": true,
  "data": {
    "showtimeId": "st-001",
    "capacity": 160,
    "availableSeats": 142,
    "zones": [
      {
        "name": "Premium",
        "color": "#D4AF37",
        "priceHtg": 800,
        "rows": ["A", "B", "C"]
      },
      {
        "name": "Standard",
        "color": "#4A90E2",
        "priceHtg": 600,
        "rows": ["D", "E", "F", "G"]
      },
      {
        "name": "Économique",
        "color": "#7ED321",
        "priceHtg": 400,
        "rows": ["H", "I", "J"]
      }
    ],
    "seats": [
      {
        "id": "seat-001",
        "row": "A",
        "number": 1,
        "zone": "Premium",
        "priceHtg": 800,
        "status": "FREE",
        "isWheelchairAccessible": false
      },
      {
        "id": "seat-002",
        "row": "A",
        "number": 2,
        "zone": "Premium",
        "priceHtg": 800,
        "status": "SOLD",
        "isWheelchairAccessible": false
      }
    ]
  }
}
```

---

### **POST /api/showtimes**
Créer une séance

**Auth:** Bearer Token (ADMIN uniquement)

**Request:**
```json
{
  "movieId": "uuid-789",
  "roomId": "room-001",
  "showDate": "2025-02-20",
  "showTime": "19:30",
  "basePriceHtg": 600,
  "multiplier": 1.5,
  "language": "français",
  "subtitles": "français, créole"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "st-new",
    "showDate": "2025-02-20",
    "showTime": "19:30",
    "status": "ACTIF"
  }
}
```

**Errors:**
- `409` - Conflit de programmation (salle déjà occupée à cette heure)

---

## 🎫 RÉSERVATIONS

### **POST /api/reservations**
Créer une réservation (DRAFT)

**Auth:** Bearer Token (optionnel pour invités)

**Request:**
```json
{
  "showtimeId": "st-001",
  "seatIds": ["seat-045", "seat-046"],
  "guestEmail": "guest@example.com",
  "guestName": "Marie Dubois",
  "guestPhone": "+509 9876-5432"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "res-001",
    "confirmationCode": "JC-2025-123456",
    "status": "DRAFT",
    "showtimeId": "st-001",
    "movieTitle": "Avatar: La Voie de l'Eau",
    "showDate": "2025-02-15",
    "showTime": "14:00",
    "roomName": "Salle 1",
    "seats": [
      {
        "id": "seat-045",
        "row": "C",
        "number": 13,
        "priceHtg": 800
      },
      {
        "id": "seat-046",
        "row": "C",
        "number": 14,
        "priceHtg": 800
      }
    ],
    "totalSeats": 2,
    "totalPriceHtg": 1600,
    "expiresAt": "2025-02-10T11:15:00Z"
  }
}
```

**Errors:**
- `409` - Un ou plusieurs sièges déjà réservés
- `422` - Séance complète ou annulée

---

### **GET /api/reservations/:id**
Détail d'une réservation

**Auth:** Bearer Token (propriétaire) ou STAFF/ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "res-001",
    "confirmationCode": "JC-2025-123456",
    "status": "CONFIRMED",
    "paymentStatus": "VALIDATED",
    "paymentMethod": "MONCASH",
    "transactionReference": "MC-789456",
    "userId": "uuid-client",
    "customerName": "Jean Dupont",
    "customerEmail": "client@example.com",
    "customerPhone": "+509 1234-5678",
    "showtime": {
      "id": "st-001",
      "movieTitle": "Avatar: La Voie de l'Eau",
      "showDate": "2025-02-15",
      "showTime": "14:00",
      "roomName": "Salle 1"
    },
    "seats": [
      {
        "row": "C",
        "number": 13,
        "priceHtg": 800
      },
      {
        "row": "C",
        "number": 14,
        "priceHtg": 800
      }
    ],
    "totalSeats": 2,
    "totalPriceHtg": 1600,
    "createdAt": "2025-02-10T11:00:00Z",
    "expiresAt": "2025-02-10T11:15:00Z"
  }
}
```

---

### **POST /api/reservations/:id/confirm**
Confirmer une réservation (passage DRAFT → PENDING_PAYMENT)

**Auth:** Bearer Token (propriétaire) ou STAFF/ADMIN

**Request:**
```json
{
  "paymentMethod": "MONCASH",
  "transactionReference": "MC-789456",
  "paymentProofUrl": "https://storage.supabase.co/..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "res-001",
    "confirmationCode": "JC-2025-123456",
    "status": "PENDING_PAYMENT",
    "paymentStatus": "PENDING",
    "message": "Réservation en attente de validation du paiement"
  }
}
```

---

### **DELETE /api/reservations/:id**
Annuler une réservation

**Auth:** Bearer Token (propriétaire) ou STAFF/ADMIN

**Request:**
```json
{
  "cancelReason": "Changement de plans"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Réservation annulée avec succès",
  "data": {
    "id": "res-001",
    "status": "CANCELLED",
    "refundAmount": 1600
  }
}
```

---

### **GET /api/reservations/user/:userId**
Réservations d'un utilisateur

**Auth:** Bearer Token (propriétaire) ou STAFF/ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "res-001",
      "confirmationCode": "JC-2025-123456",
      "status": "CONFIRMED",
      "movieTitle": "Avatar: La Voie de l'Eau",
      "showDate": "2025-02-15",
      "showTime": "14:00",
      "totalSeats": 2,
      "totalPriceHtg": 1600,
      "createdAt": "2025-02-10T11:00:00Z"
    }
  ]
}
```

---

## 💳 PAIEMENTS

### **POST /api/payments/:reservationId/validate**
Valider un paiement

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Request:**
```json
{
  "notes": "Paiement MonCash vérifié - Référence valide"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reservationId": "res-001",
    "paymentStatus": "VALIDATED",
    "reservationStatus": "CONFIRMED",
    "validatedBy": "uuid-staff",
    "validatedAt": "2025-02-10T12:00:00Z"
  }
}
```

---

### **POST /api/payments/:reservationId/reject**
Rejeter un paiement

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Request:**
```json
{
  "reason": "Référence de transaction invalide"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reservationId": "res-001",
    "paymentStatus": "REJECTED",
    "reservationStatus": "CANCELLED",
    "rejectedBy": "uuid-staff",
    "rejectedAt": "2025-02-10T12:00:00Z"
  }
}
```

---

### **GET /api/payments/pending**
Liste des paiements en attente

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "reservationId": "res-002",
      "confirmationCode": "JC-2025-123457",
      "customerName": "Marie Dubois",
      "paymentMethod": "NATCASH",
      "transactionReference": "NC-456789",
      "paymentProofUrl": "https://...",
      "totalPriceHtg": 1200,
      "createdAt": "2025-02-10T11:30:00Z"
    }
  ]
}
```

---

## 🎟️ TICKETS

### **GET /api/tickets/user/:userId**
Tickets d'un utilisateur

**Auth:** Bearer Token (propriétaire) ou STAFF/ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket-001",
      "confirmationCode": "JC-2025-123456",
      "status": "VALID",
      "qrCode": "data:image/png;base64,...",
      "movie": {
        "title": "Avatar: La Voie de l'Eau",
        "poster": "https://..."
      },
      "showtime": {
        "date": "2025-02-15",
        "time": "14:00",
        "room": "Salle 1"
      },
      "seats": ["C13", "C14"],
      "totalPriceHtg": 1600
    }
  ]
}
```

---

### **POST /api/tickets/:confirmationCode/validate**
Valider un ticket à l'entrée (scan)

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Request:**
```json
{
  "scannedBy": "uuid-staff"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "confirmationCode": "JC-2025-123456",
    "status": "USED",
    "scannedAt": "2025-02-15T13:45:00Z",
    "movieTitle": "Avatar: La Voie de l'Eau",
    "seats": ["C13", "C14"]
  }
}
```

**Errors:**
- `400` - Ticket déjà utilisé
- `404` - Ticket non trouvé
- `422` - Ticket expiré ou annulé

---

## 💺 SIÈGES

### **POST /api/seats/lock**
Verrouiller des sièges (15 min)

**Auth:** Bearer Token (optionnel)

**Request:**
```json
{
  "showtimeId": "st-001",
  "seatIds": ["seat-045", "seat-046"],
  "sessionId": "session-abc123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "lockIds": ["lock-001", "lock-002"],
    "expiresAt": "2025-02-10T11:15:00Z"
  }
}
```

---

### **POST /api/seats/unlock**
Déverrouiller des sièges

**Auth:** Bearer Token (optionnel)

**Request:**
```json
{
  "lockIds": ["lock-001", "lock-002"]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Sièges déverrouillés"
}
```

---

## 🏛️ SALLES

### **GET /api/rooms**
Liste toutes les salles

**Auth:** Aucune

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "room-001",
      "name": "Salle 1 - Premium",
      "capacity": 160,
      "rows": 10,
      "seatsPerRow": 16,
      "screenType": "IMAX",
      "soundSystem": "Dolby Atmos",
      "status": "ACTIVE"
    }
  ]
}
```

---

### **POST /api/rooms**
Créer une salle

**Auth:** Bearer Token (ADMIN uniquement)

**Request:**
```json
{
  "name": "Salle 5 - VIP",
  "capacity": 80,
  "rows": 8,
  "seatsPerRow": 10,
  "screenType": "4K",
  "soundSystem": "Dolby Atmos",
  "zones": [
    {
      "name": "Premium",
      "color": "#D4AF37",
      "priceHtg": 1000,
      "rowStart": "A",
      "rowEnd": "C"
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "room-005",
    "name": "Salle 5 - VIP",
    "capacity": 80,
    "seatsGenerated": 80
  }
}
```

---

## 📞 SUPPORT

### **POST /api/support/tickets**
Créer un ticket de support

**Auth:** Aucune

**Request:**
```json
{
  "contactName": "Jean Dupont",
  "contactEmail": "jean@example.com",
  "contactPhone": "+509 1234-5678",
  "subject": "Problème de paiement",
  "message": "Je n'arrive pas à finaliser mon paiement MonCash...",
  "category": "PAYMENT"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "ticket-001",
    "ticketNumber": "SUP-2025-001234",
    "status": "NEW",
    "priority": "NORMAL",
    "createdAt": "2025-02-10T11:00:00Z"
  }
}
```

---

### **GET /api/support/tickets**
Liste des tickets

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Query Params:**
- `status` (optional): `NEW` | `IN_PROGRESS` | `RESOLVED` | `CLOSED`
- `priority` (optional): `LOW` | `NORMAL` | `HIGH` | `URGENT`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket-001",
      "ticketNumber": "SUP-2025-001234",
      "contactName": "Jean Dupont",
      "subject": "Problème de paiement",
      "category": "PAYMENT",
      "priority": "NORMAL",
      "status": "NEW",
      "createdAt": "2025-02-10T11:00:00Z"
    }
  ]
}
```

---

### **POST /api/support/tickets/:id/respond**
Répondre à un ticket

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Request:**
```json
{
  "message": "Bonjour Jean, nous avons vérifié votre paiement...",
  "isInternal": false
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ticketId": "ticket-001",
    "responseId": "response-001",
    "status": "IN_PROGRESS"
  }
}
```

---

### **PUT /api/support/tickets/:id/close**
Fermer un ticket

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Request:**
```json
{
  "resolutionNotes": "Problème résolu - Paiement validé manuellement"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ticketId": "ticket-001",
    "status": "CLOSED",
    "resolvedAt": "2025-02-10T12:00:00Z"
  }
}
```

---

## 📊 ADMIN

### **GET /api/admin/stats**
Statistiques globales

**Auth:** Bearer Token (STAFF/ADMIN uniquement)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reservations": {
      "total": 1247,
      "today": 23,
      "pending": 8
    },
    "revenue": {
      "total": 748200,
      "today": 13800,
      "thisMonth": 248600
    },
    "occupancy": {
      "average": 78.5,
      "today": 82.3
    },
    "support": {
      "new": 5,
      "inProgress": 12,
      "urgent": 2
    }
  }
}
```

---

### **GET /api/content**
Contenu du site

**Auth:** Aucune

**Response 200:**
```json
{
  "success": true,
  "data": {
    "hero": {
      "title": "Bienvenue à JAJE Ciné",
      "subtitle": "Vivez l'expérience cinéma ultime"
    },
    "about": {
      "title": "À propos de nous",
      "content": "JAJE Ciné est le premier cinéma..."
    },
    "faq": [
      {
        "question": "Comment réserver mes places ?",
        "answer": "Vous pouvez réserver en ligne...",
        "isActive": true
      }
    ]
  }
}
```

---

### **PUT /api/content**
Modifier le contenu

**Auth:** Bearer Token (ADMIN uniquement)

**Request:**
```json
{
  "hero": {
    "title": "Nouveau titre",
    "subtitle": "Nouveau sous-titre"
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Contenu mis à jour"
}
```

---

### **GET /api/audit/logs**
Journal d'audit

**Auth:** Bearer Token (ADMIN uniquement)

**Query Params:**
- `action` (optional): `CREATE` | `UPDATE` | `DELETE`
- `tableName` (optional): string
- `userId` (optional): uuid
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-001",
      "action": "UPDATE",
      "tableName": "reservations",
      "recordId": "res-001",
      "userEmail": "staff@jajecine.ht",
      "userRole": "STAFF",
      "oldValues": {
        "paymentStatus": "PENDING"
      },
      "newValues": {
        "paymentStatus": "VALIDATED"
      },
      "ipAddress": "192.168.1.100",
      "createdAt": "2025-02-10T12:00:00Z"
    }
  ]
}
```

---

### **GET /api/audit/export**
Exporter les logs en CSV

**Auth:** Bearer Token (ADMIN uniquement)

**Response 200:**
```csv
id,action,table,record_id,user_email,created_at
log-001,UPDATE,reservations,res-001,staff@jajecine.ht,2025-02-10T12:00:00Z
```

---

## 🔒 CODES D'ERREUR STANDARDS

| Code | Signification | Description |
|------|---------------|-------------|
| **200** | OK | Requête réussie |
| **201** | Created | Ressource créée |
| **400** | Bad Request | Données invalides |
| **401** | Unauthorized | Non authentifié |
| **403** | Forbidden | Accès refusé (rôle insuffisant) |
| **404** | Not Found | Ressource non trouvée |
| **409** | Conflict | Conflit (ex: siège déjà réservé) |
| **422** | Unprocessable Entity | Validation échouée |
| **500** | Internal Server Error | Erreur serveur |

---

## 🔐 RÈGLES D'AUTHENTIFICATION

### **Endpoints Publics (Aucune auth)**
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/showtimes`
- `GET /api/showtimes/:id`
- `GET /api/showtimes/:id/seats`
- `GET /api/content`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/support/tickets`

### **Endpoints Authentifiés (Bearer Token)**
- Tous les autres endpoints nécessitent un token JWT valide

### **Endpoints STAFF/ADMIN**
- `POST /api/payments/:id/validate`
- `POST /api/payments/:id/reject`
- `GET /api/payments/pending`
- `POST /api/tickets/:code/validate`
- `GET /api/support/tickets`
- `POST /api/support/tickets/:id/respond`
- `GET /api/admin/stats`

### **Endpoints ADMIN Uniquement**
- `POST /api/movies`
- `PUT /api/movies/:id`
- `DELETE /api/movies/:id`
- `POST /api/showtimes`
- `PUT /api/showtimes/:id`
- `DELETE /api/showtimes/:id`
- `POST /api/rooms`
- `PUT /api/rooms/:id`
- `DELETE /api/rooms/:id`
- `PUT /api/content`
- `GET /api/audit/logs`
- `GET /api/audit/export`

---

## 📝 FORMAT DES TOKENS

### **Access Token (JWT)**
```
Header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Payload:
{
  "sub": "uuid-user",
  "email": "user@example.com",
  "role": "CLIENT",
  "iat": 1707566400,
  "exp": 1707570000
}
```

**Durée de vie:** 1 heure

### **Refresh Token**
**Durée de vie:** 7 jours

---

Fin de la documentation API
