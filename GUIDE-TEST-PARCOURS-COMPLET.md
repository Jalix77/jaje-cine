# Jaje CinÃ© â€” Guide de test du parcours complet

## PrÃ©requis : ExÃ©cuter les migrations SQL

Avant de tester, exÃ©cuter ces deux fichiers dans **Supabase â†’ SQL Editor** :

1. `migration-fixes.sql` â€” Corrige le schÃ©ma et active les RLS policies
2. `seed-seats.sql` â€” CrÃ©e la salle, les siÃ¨ges et une sÃ©ance de test

---

## Parcours utilisateur complet

### Ã‰tape 1 : Voir les films
- URL : `/films`
- La page charge les films depuis la table `movies`
- Filtres par statut, genre, durÃ©e

### Ã‰tape 2 : DÃ©tail d'un film
- URL : `/films/:id`
- Affiche synopsis, durÃ©e, rÃ©alisateur, bande-annonce
- Liste les sÃ©ances disponibles
- Bouton "Choisir" â†’ redirige vers sÃ©lection des siÃ¨ges

### Ã‰tape 3 : SÃ©lection des siÃ¨ges
- URL : `/reservation/seat-selection/:showtimeId`
- Charge les siÃ¨ges depuis Supabase (`seats` table)
- Les siÃ¨ges pris (table `reservation_seats`) apparaissent en rouge
- Les siÃ¨ges en cours de sÃ©lection (table `seat_locks`) en orange
- Cliquer sur un siÃ¨ge pose un verrou de 15 minutes
- Bouton "Continuer" â†’ checkout

### Ã‰tape 4 : Checkout / Finalisation
- URL : `/reservation/checkout?showtimeId=XXX&seats=A1,B2`
- Formulaire : prÃ©nom, nom, email, tÃ©lÃ©phone
- Choix mÃ©thode de paiement :
  - **MonCash** : numÃ©ro affichÃ©, saisir le numÃ©ro de transaction
  - **NatCash** : numÃ©ro affichÃ©, saisir le numÃ©ro de transaction
  - **Cash Ã  l'arrivÃ©e** : confirmer directement
- Validation :
  1. CrÃ©e la rÃ©servation dans `reservations`
  2. RÃ©sout les labels ("A1") â†’ UUID via table `seats`
  3. InsÃ¨re dans `reservation_seats`
  4. Redirige vers confirmation

### Ã‰tape 5 : Confirmation
- URL : `/reservation/confirmation/:reservationId`
- Affiche le rÃ©capitulatif complet
- QR code du code de confirmation
- Bouton "Voir mon ticket" â†’ `/ticket/:id`

### Ã‰tape 6 : Ticket avec QR Code
- URL : `/ticket/:id`
- Ticket complet imprimable
- QR code (contient JSON avec toutes les infos)
- Bouton "Imprimer"
- Design propre noir/blanc pour l'impression

---

## Parcours Admin

### Connexion admin
- URL : `/admin/login`
- L'utilisateur doit avoir `role = 'ADMIN'` dans la table `profiles`
- Pour crÃ©er un admin : dans Supabase Auth, crÃ©er un user, puis dans `profiles` mettre `role = 'ADMIN'`

### Dashboard
- URL : `/admin/dashboard`
- Stats en temps rÃ©el (total rÃ©servations, en attente, aujourd'hui)
- ActivitÃ© rÃ©cente

### Gestion des films
- URL : `/admin/films`
- CRUD complet connectÃ© Ã  Supabase
- Champs : titre, genre, durÃ©e, classification, statut, affiche, synopsis

### Gestion des sÃ©ances
- URL : `/admin/seances`
- CRUD complet connectÃ© Ã  Supabase
- SÃ©lection film + salle depuis les tables DB
- **Important** : la contrainte `future_showtime` est supprimÃ©e par la migration

### Gestion des salles
- URL : `/admin/salles`
- CRUD complet connectÃ© Ã  Supabase
- Plan de salle visuel gÃ©nÃ©rÃ© automatiquement

### Gestion des rÃ©servations
- URL : `/admin/reservations`
- DonnÃ©es en temps rÃ©el depuis la vue `reservation_complete`
- Actions : Valider paiement, Refuser, Annuler
- Filtres par statut et mÃ©thode de paiement

---

## MÃ©thodes de paiement

| MÃ©thode | Comportement | Statut initial |
|---------|-------------|----------------|
| MonCash | Saisir numÃ©ro transaction | EN_ATTENTE_VALIDATION |
| NatCash | Saisir numÃ©ro transaction | EN_ATTENTE_VALIDATION |
| Cash | Payer au guichet | CASH_A_LARRIVEE |

L'admin valide les paiements MonCash/NatCash depuis `/admin/reservations`.

---

## Variables d'environnement (.env.local)

```
VITE_SUPABASE_URL=https://hvpglfvvowvkrimntnou.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Commandes de dÃ©veloppement

```bash
# DÃ©marrer le projet
npm run dev

# Build production
npm run build
```

Le projet tourne sur `http://localhost:3000`

---

## Structure des URLs

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/films` | Liste des films |
| `/films/:id` | DÃ©tail d'un film |
| `/seances` | Toutes les sÃ©ances |
| `/reservation/seat-selection/:showtimeId` | Choix des siÃ¨ges |
| `/reservation/checkout` | Finalisation + paiement |
| `/reservation/confirmation/:reservationId` | Confirmation |
| `/ticket/:id` | Ticket imprimable avec QR |
| `/compte/tickets` | Mes tickets (auth requis) |
| `/admin/login` | Connexion admin |
| `/admin/dashboard` | Tableau de bord |
| `/admin/films` | Gestion films |
| `/admin/seances` | Gestion sÃ©ances |
| `/admin/salles` | Gestion salles |
| `/admin/reservations` | Gestion rÃ©servations |
