# 🖼️ Inventaire des Assets - JAJE Ciné

Liste complète de tous les assets visuels avec sources et stratégie de stockage.

---

## 📁 STRUCTURE DES ASSETS

```
supabase-storage/
└── jaje-cine/
    ├── posters/           # Affiches de films
    ├── backgrounds/       # Images de fond
    ├── logos/            # Logos du cinéma
    ├── icons/            # Icônes personnalisées
    ├── qr-codes/         # QR codes des tickets
    ├── payment-proofs/   # Preuves de paiement
    └── content/          # Images de contenu (hero, about, etc.)
```

---

## 🎬 AFFICHES DE FILMS (Posters)

### **Films à l'Affiche**

| Film | Nom du Fichier | Dimensions | Source |
|------|----------------|------------|--------|
| Avatar: La Voie de l'Eau | `avatar-2-poster.jpg` | 2000x3000px | Stable Diffusion |
| Dune: Deuxième Partie | `dune-2-poster.jpg` | 2000x3000px | Stable Diffusion |
| Oppenheimer | `oppenheimer-poster.jpg` | 2000x3000px | Stable Diffusion |
| Barbie | `barbie-poster.jpg` | 2000x3000px | Stable Diffusion |
| Mission Impossible 7 | `mission-impossible-7-poster.jpg` | 2000x3000px | Stable Diffusion |
| Guardians of the Galaxy 3 | `guardians-3-poster.jpg` | 2000x3000px | Stable Diffusion |

### **Films à Venir**

| Film | Nom du Fichier | Dimensions | Source |
|------|----------------|------------|--------|
| Deadpool 3 | `deadpool-3-poster.jpg` | 2000x3000px | Stable Diffusion |
| Gladiator 2 | `gladiator-2-poster.jpg` | 2000x3000px | Stable Diffusion |
| Joker 2 | `joker-2-poster.jpg` | 2000x3000px | Stable Diffusion |
| Wicked | `wicked-poster.jpg` | 2000x3000px | Stable Diffusion |

### **Prompts Stable Diffusion pour Posters**

```
Prompt général :
"Professional movie poster design, cinematic composition, dramatic lighting, 
high quality digital art, theatrical release poster style, clean background, 
focused on main character, vibrant colors, professional typography space at bottom, 
2000x3000 resolution, ultra detailed"

Exemples spécifiques :

Avatar 2:
"Epic sci-fi movie poster, blue alien Na'vi warrior underwater, bioluminescent ocean, 
floating islands in background, dramatic blue and teal color palette, cinematic lighting, 
professional movie poster design, clean composition, space for title at bottom"

Dune 2:
"Epic desert movie poster, lone figure in stillsuit walking on sand dunes, 
giant sandworm emerging in background, orange and gold sunset, dramatic shadows, 
cinematic composition, professional movie poster style, minimalist design"

Oppenheimer:
"Dramatic historical movie poster, scientist silhouette against nuclear explosion, 
black and white with orange fire accents, intense atmosphere, professional portrait, 
cinematic lighting, clean background, space for title"
```

### **URLs Stable Diffusion**

```javascript
// Exemple d'URL générée
const posterUrl = `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28prompt%29%7D&width=2000&height=3000&seq=${movieId}&orientation=portrait`;

// Exemples concrets
const avatarPoster = "https://readdy.ai/api/search-image?query=Epic%20sci-fi%20movie%20poster%20blue%20alien%20Navi%20warrior%20underwater%20bioluminescent%20ocean%20floating%20islands%20dramatic%20blue%20teal%20color%20palette%20cinematic%20lighting%20professional%20movie%20poster%20design%20clean%20composition%20space%20for%20title%20at%20bottom&width=2000&height=3000&seq=avatar-2&orientation=portrait";
```

---

## 🌄 IMAGES DE FOND (Backgrounds)

### **Hero Section (Page d'Accueil)**

| Section | Nom du Fichier | Dimensions | Prompt |
|---------|----------------|------------|--------|
| Hero Principal | `hero-main.jpg` | 1920x1080px | "Luxurious cinema interior, red velvet seats, golden accents, dramatic stage lighting, empty theater view from back, cinematic atmosphere, professional photography, dark ambient lighting with spotlight on screen" |
| Hero Alternatif 1 | `hero-cinema-exterior.jpg` | 1920x1080px | "Modern cinema building exterior at night, neon lights, art deco architecture, golden and red lighting, urban setting, professional architectural photography, dramatic sky" |
| Hero Alternatif 2 | `hero-popcorn.jpg` | 1920x1080px | "Cinematic still life, popcorn bucket with golden lighting, movie tickets, 3D glasses, dark background with bokeh lights, professional product photography, warm color palette" |

### **Sections de Contenu**

| Section | Nom du Fichier | Dimensions | Prompt |
|---------|----------------|------------|--------|
| À Propos | `about-section.jpg` | 1600x900px | "Elegant cinema lobby, modern interior design, comfortable seating area, warm lighting, plants, minimalist decor, professional interior photography" |
| Contact | `contact-background.jpg` | 1600x900px | "Abstract golden and black gradient, elegant texture, luxury background, subtle film strip pattern, professional graphic design" |

---

## 🎨 LOGOS

### **Logo Principal**

| Variante | Nom du Fichier | Dimensions | Format | Usage |
|----------|----------------|------------|--------|-------|
| Logo Complet Couleur | `jaje-logo-full-color.svg` | Variable | SVG | Navbar, Footer |
| Logo Complet Blanc | `jaje-logo-full-white.svg` | Variable | SVG | Fond sombre |
| Logo Complet Noir | `jaje-logo-full-black.svg` | Variable | SVG | Fond clair |
| Icône Seule | `jaje-icon.svg` | 512x512px | SVG | Favicon, App Icon |
| Logo PNG Haute Résolution | `jaje-logo-full-color.png` | 2000x800px | PNG | Emails, Documents |

### **Spécifications du Logo**

```
Nom : JAJE CINÉ
Police : Playfair Display (Bold) pour "JAJE"
        Inter (Regular) pour "CINÉ"
Couleurs : 
  - Or : #D4AF37
  - Noir : #000000
  - Blanc : #FFFFFF

Icône : Pellicule de film stylisée avec les lettres "JC"
```

### **Génération du Logo**

```html
<!-- Logo SVG inline (à optimiser) -->
<svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
  <!-- Pellicule de film -->
  <rect x="10" y="20" width="40" height="40" fill="none" stroke="#D4AF37" stroke-width="2"/>
  <rect x="15" y="25" width="5" height="5" fill="#D4AF37"/>
  <rect x="40" y="25" width="5" height="5" fill="#D4AF37"/>
  <rect x="15" y="50" width="5" height="5" fill="#D4AF37"/>
  <rect x="40" y="50" width="5" height="5" fill="#D4AF37"/>
  
  <!-- Texte JAJE -->
  <text x="60" y="45" font-family="Playfair Display" font-size="32" font-weight="bold" fill="#D4AF37">JAJE</text>
  
  <!-- Texte CINÉ -->
  <text x="60" y="65" font-family="Inter" font-size="16" fill="#FFFFFF">CINÉ</text>
</svg>
```

---

## 🎯 ICÔNES

### **Icônes de Navigation**

| Icône | Bibliothèque | Classe | Usage |
|-------|--------------|--------|-------|
| Accueil | Remix Icon | `ri-home-line` | Menu principal |
| Films | Remix Icon | `ri-film-line` | Menu principal |
| Séances | Remix Icon | `ri-calendar-event-line` | Menu principal |
| Contact | Remix Icon | `ri-mail-line` | Menu principal |
| Compte | Remix Icon | `ri-user-line` | Menu principal |
| Panier | Remix Icon | `ri-shopping-cart-line` | Réservation |
| Recherche | Remix Icon | `ri-search-line` | Filtres |

### **Icônes de Fonctionnalités**

| Icône | Bibliothèque | Classe | Usage |
|-------|--------------|--------|-------|
| Siège Libre | Remix Icon | `ri-checkbox-blank-line` | Plan de salle |
| Siège Sélectionné | Remix Icon | `ri-checkbox-fill` | Plan de salle |
| Siège Occupé | Remix Icon | `ri-close-circle-fill` | Plan de salle |
| Paiement | Remix Icon | `ri-bank-card-line` | Checkout |
| Confirmation | Remix Icon | `ri-check-double-line` | Confirmation |
| QR Code | Remix Icon | `ri-qr-code-line` | Ticket |
| Télécharger | Remix Icon | `ri-download-line` | Ticket PDF |
| Partager | Remix Icon | `ri-share-line` | Partage |

### **Icônes Admin**

| Icône | Bibliothèque | Classe | Usage |
|-------|--------------|--------|-------|
| Dashboard | Remix Icon | `ri-dashboard-line` | Menu admin |
| Films | Remix Icon | `ri-movie-line` | Gestion films |
| Séances | Remix Icon | `ri-calendar-line` | Gestion séances |
| Réservations | Remix Icon | `ri-ticket-line` | Gestion réservations |
| Salles | Remix Icon | `ri-building-line` | Gestion salles |
| Support | Remix Icon | `ri-customer-service-line` | Support client |
| Contenu | Remix Icon | `ri-file-text-line` | Gestion contenu |
| Audit | Remix Icon | `ri-history-line` | Journal d'audit |

---

## 🎫 QR CODES

### **Génération Dynamique**

```typescript
// Utilisation de la bibliothèque qrcode
import QRCode from 'qrcode';

async function generateTicketQRCode(confirmationCode: string): Promise<string> {
  const qrData = JSON.stringify({
    code: confirmationCode,
    type: 'JAJE_TICKET',
    timestamp: Date.now()
  });
  
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrCodeDataUrl;
}
```

### **Stockage**

```
Nom du fichier : qr-codes/{confirmationCode}.png
Exemple : qr-codes/JC-2025-123456.png
Dimensions : 400x400px
Format : PNG avec fond transparent
```

---

## 💳 PREUVES DE PAIEMENT

### **Upload Client**

```
Chemin : payment-proofs/{reservationId}/{timestamp}-{filename}
Exemple : payment-proofs/res-001/1707566400-moncash-proof.jpg
Formats acceptés : JPG, PNG, PDF
Taille max : 5 MB
```

---

## 🎨 IMAGES DE CONTENU

### **Page d'Accueil**

| Section | Fichier | Dimensions | Prompt |
|---------|---------|------------|--------|
| Hero Background | `home-hero-bg.jpg` | 1920x1080px | "Luxurious cinema interior with red velvet seats and golden accents, dramatic lighting, empty theater from back view, cinematic atmosphere, professional photography" |
| Films à l'Affiche | `now-showing-bg.jpg` | 1600x600px | "Abstract film strip pattern, golden and black gradient, elegant texture, professional graphic design" |
| À Propos | `about-cinema.jpg` | 1200x800px | "Modern cinema building exterior, art deco architecture, neon lights, night photography, urban setting" |

### **Page Films**

| Section | Fichier | Dimensions | Prompt |
|---------|---------|------------|--------|
| Header Background | `films-header-bg.jpg` | 1920x400px | "Cinema screen with light rays, dark theater, dramatic lighting, abstract composition" |

### **Page Contact**

| Section | Fichier | Dimensions | Prompt |
|---------|---------|------------|--------|
| Contact Background | `contact-bg.jpg` | 1600x900px | "Elegant abstract background, golden and black gradient, subtle texture, professional design" |

---

## 📦 STRATÉGIE DE STOCKAGE SUPABASE

### **Configuration des Buckets**

```sql
-- Créer les buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('posters', 'posters', true),
  ('backgrounds', 'backgrounds', true),
  ('logos', 'logos', true),
  ('qr-codes', 'qr-codes', false),
  ('payment-proofs', 'payment-proofs', false),
  ('content', 'content', true);

-- Politiques d'accès
-- Posters : Lecture publique, écriture admin
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'posters');

CREATE POLICY "Admin write access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'posters' 
    AND auth.jwt() ->> 'role' = 'ADMIN'
  );

-- QR Codes : Accès privé (propriétaire uniquement)
CREATE POLICY "User read own QR codes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'qr-codes'
    AND (storage.foldername(name))[1] IN (
      SELECT confirmation_code FROM reservations 
      WHERE user_id = auth.uid()
    )
  );

-- Payment Proofs : Accès privé (propriétaire + staff/admin)
CREATE POLICY "User upload payment proof" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM reservations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff view payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs'
    AND auth.jwt() ->> 'role' IN ('STAFF', 'ADMIN')
  );
```

### **Fonctions Helper**

```typescript
// src/utils/storage.ts
import { supabase } from './supabase';

export async function uploadPoster(
  movieId: string, 
  file: File
): Promise<string> {
  const fileName = `${movieId}-${Date.now()}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('posters')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('posters')
    .getPublicUrl(fileName);
  
  return publicUrl;
}

export async function uploadPaymentProof(
  reservationId: string,
  file: File
): Promise<string> {
  const fileName = `${reservationId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  return fileName;
}

export async function generateAndUploadQRCode(
  confirmationCode: string
): Promise<string> {
  const qrCodeDataUrl = await generateTicketQRCode(confirmationCode);
  
  // Convertir data URL en Blob
  const response = await fetch(qrCodeDataUrl);
  const blob = await response.blob();
  
  const fileName = `${confirmationCode}.png`;
  
  const { data, error } = await supabase.storage
    .from('qr-codes')
    .upload(fileName, blob, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
```

---

## 📊 OPTIMISATION DES IMAGES

### **Compression et Formats**

| Type | Format Original | Format Optimisé | Compression |
|------|----------------|-----------------|-------------|
| Posters | JPG | WebP + JPG fallback | 80% qualité |
| Backgrounds | JPG | WebP + JPG fallback | 75% qualité |
| Logos | SVG | SVG (optimisé) | - |
| QR Codes | PNG | PNG | Lossless |
| Payment Proofs | JPG/PNG/PDF | Original | - |

### **Responsive Images**

```typescript
// Générer plusieurs tailles
const imageSizes = {
  thumbnail: { width: 300, height: 450 },
  medium: { width: 600, height: 900 },
  large: { width: 1000, height: 1500 },
  original: { width: 2000, height: 3000 }
};

// Utilisation dans le code
<picture>
  <source 
    srcSet={`${posterUrl}?width=300 300w, ${posterUrl}?width=600 600w`}
    type="image/webp"
  />
  <img 
    src={posterUrl} 
    alt={movieTitle}
    loading="lazy"
  />
</picture>
```

---

## 🔒 SÉCURITÉ DES ASSETS

### **Règles de Validation**

```typescript
// Validation des uploads
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File, allowedTypes: string[]): boolean {
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Type de fichier non autorisé');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fichier trop volumineux (max 5 MB)');
  }
  
  return true;
}
```

### **Nettoyage Automatique**

```sql
-- Supprimer les preuves de paiement après 90 jours
CREATE OR REPLACE FUNCTION cleanup_old_payment_proofs()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'payment-proofs'
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Planifier le nettoyage
SELECT cron.schedule(
  'cleanup-payment-proofs',
  '0 3 * * 0', -- Dimanche à 3h
  'SELECT cleanup_old_payment_proofs();'
);
```

---

## 📋 CHECKLIST DE MIGRATION

### **Étapes pour Migrer vers Supabase Storage**

- [ ] Créer les buckets dans Supabase
- [ ] Configurer les politiques RLS
- [ ] Uploader les logos et assets statiques
- [ ] Générer les posters avec Stable Diffusion
- [ ] Uploader les backgrounds
- [ ] Tester les uploads de preuves de paiement
- [ ] Implémenter la génération de QR codes
- [ ] Configurer le CDN (optionnel)
- [ ] Tester les performances
- [ ] Mettre en place le monitoring

---

Fin du document
