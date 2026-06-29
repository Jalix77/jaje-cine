# 📧 Emails et Notifications - JAJE Ciné

Liste complète de tous les emails automatiques avec déclencheurs et templates.

---

## 📨 EMAILS DE RÉSERVATION

### **1. Confirmation de Réservation (Paiement en Attente)**

**Déclencheur :** Réservation créée avec statut `PENDING_PAYMENT`

**Destinataire :** Client

**Objet :** `Réservation en attente - ${confirmationCode}`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #000; color: #D4AF37; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .ticket { background: #1A1A1A; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .code { font-size: 24px; font-weight: bold; color: #D4AF37; text-align: center; padding: 15px; background: #000; border-radius: 4px; }
    .button { background: #D4AF37; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; }
    .footer { background: #1A1A1A; color: #B0B0B0; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p>Votre réservation est en attente de validation</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${customerName}</strong>,</p>
      
      <p>Nous avons bien reçu votre réservation. Votre paiement est en cours de validation par notre équipe.</p>
      
      <div class="ticket">
        <h2 style="color: #D4AF37; margin-top: 0;">📋 Détails de votre réservation</h2>
        
        <div class="code">${confirmationCode}</div>
        
        <table style="width: 100%; margin-top: 20px; color: white;">
          <tr>
            <td><strong>Film :</strong></td>
            <td>${movieTitle}</td>
          </tr>
          <tr>
            <td><strong>Date :</strong></td>
            <td>${showDate}</td>
          </tr>
          <tr>
            <td><strong>Heure :</strong></td>
            <td>${showTime}</td>
          </tr>
          <tr>
            <td><strong>Salle :</strong></td>
            <td>${roomName}</td>
          </tr>
          <tr>
            <td><strong>Sièges :</strong></td>
            <td>${seats}</td>
          </tr>
          <tr>
            <td><strong>Prix total :</strong></td>
            <td style="color: #D4AF37; font-size: 18px; font-weight: bold;">${totalPrice} HTG</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
        <strong>⏳ Paiement en attente</strong>
        <p style="margin: 5px 0 0 0;">Méthode : <strong>${paymentMethod}</strong></p>
        <p style="margin: 5px 0 0 0;">Référence : <strong>${transactionReference}</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Nous validons votre paiement sous 24 heures. Vous recevrez un email de confirmation dès validation.</p>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${websiteUrl}/compte" class="button">Voir mes réservations</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>JAJE CINÉ</strong></p>
      <p>123 Rue du Cinéma, Port-au-Prince, Haïti</p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
      <p style="margin-top: 15px;">
        <a href="${websiteUrl}" style="color: #D4AF37;">Site Web</a> | 
        <a href="${websiteUrl}/contact" style="color: #D4AF37;">Contact</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

### **2. Paiement Validé (Confirmation Finale)**

**Déclencheur :** Admin valide le paiement → `VALIDATED`

**Destinataire :** Client

**Objet :** `✅ Réservation confirmée - ${confirmationCode}`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Mêmes styles que ci-dessus */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p style="color: #7ED321; font-size: 20px;">✅ Réservation Confirmée !</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${customerName}</strong>,</p>
      
      <p>Excellente nouvelle ! Votre paiement a été validé avec succès. Votre réservation est maintenant confirmée.</p>
      
      <div class="ticket">
        <h2 style="color: #D4AF37; margin-top: 0;">🎟️ Votre Ticket</h2>
        
        <div class="code">${confirmationCode}</div>
        
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; background: white; padding: 10px; border-radius: 8px;">
          <p style="font-size: 12px; color: #B0B0B0; margin-top: 10px;">Présentez ce QR code à l'entrée</p>
        </div>
        
        <table style="width: 100%; margin-top: 20px; color: white;">
          <tr>
            <td><strong>Film :</strong></td>
            <td>${movieTitle}</td>
          </tr>
          <tr>
            <td><strong>Date :</strong></td>
            <td>${showDate}</td>
          </tr>
          <tr>
            <td><strong>Heure :</strong></td>
            <td>${showTime}</td>
          </tr>
          <tr>
            <td><strong>Salle :</strong></td>
            <td>${roomName}</td>
          </tr>
          <tr>
            <td><strong>Sièges :</strong></td>
            <td>${seats}</td>
          </tr>
          <tr>
            <td><strong>Prix payé :</strong></td>
            <td style="color: #7ED321; font-size: 18px; font-weight: bold;">${totalPrice} HTG ✓</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #D4EDDA; border-left: 4px solid #28A745; padding: 15px; margin: 20px 0;">
        <strong>✅ Paiement confirmé</strong>
        <p style="margin: 5px 0 0 0;">Méthode : <strong>${paymentMethod}</strong></p>
        <p style="margin: 5px 0 0 0;">Référence : <strong>${transactionReference}</strong></p>
      </div>
      
      <div style="background: #E7F3FF; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <strong>📍 Informations pratiques</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Arrivez 15 minutes avant la séance</li>
          <li>Présentez votre QR code ou code de confirmation à l'entrée</li>
          <li>Les portes ferment 5 minutes après le début du film</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${websiteUrl}/compte" class="button">Voir mon ticket</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>JAJE CINÉ</strong></p>
      <p>123 Rue du Cinéma, Port-au-Prince, Haïti</p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
      <p style="margin-top: 15px;">Bon film ! 🍿</p>
    </div>
  </div>
</body>
</html>
```

---

### **3. Paiement Rejeté**

**Déclencheur :** Admin rejette le paiement → `REJECTED`

**Destinataire :** Client

**Objet :** `❌ Paiement non validé - ${confirmationCode}`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Mêmes styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p style="color: #FF6B6B;">Problème avec votre paiement</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${customerName}</strong>,</p>
      
      <p>Malheureusement, nous n'avons pas pu valider votre paiement pour la réservation <strong>${confirmationCode}</strong>.</p>
      
      <div style="background: #F8D7DA; border-left: 4px solid #DC3545; padding: 15px; margin: 20px 0;">
        <strong>❌ Raison du rejet</strong>
        <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
      </div>
      
      <div class="ticket">
        <h2 style="color: #FF6B6B; margin-top: 0;">📋 Réservation annulée</h2>
        
        <table style="width: 100%; color: white;">
          <tr>
            <td><strong>Film :</strong></td>
            <td>${movieTitle}</td>
          </tr>
          <tr>
            <td><strong>Date :</strong></td>
            <td>${showDate}</td>
          </tr>
          <tr>
            <td><strong>Heure :</strong></td>
            <td>${showTime}</td>
          </tr>
          <tr>
            <td><strong>Sièges :</strong></td>
            <td>${seats}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #E7F3FF; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <strong>💡 Que faire maintenant ?</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Vérifiez votre référence de transaction</li>
          <li>Contactez votre service de paiement mobile</li>
          <li>Effectuez une nouvelle réservation avec le bon montant</li>
          <li>Contactez-nous pour toute question</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${websiteUrl}/films/${movieId}" class="button">Réserver à nouveau</a>
      </p>
      
      <p style="text-align: center; margin-top: 15px;">
        <a href="${websiteUrl}/contact" style="color: #2196F3;">Contactez le support</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>JAJE CINÉ</strong></p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
    </div>
  </div>
</body>
</html>
```

---

### **4. Annulation de Réservation**

**Déclencheur :** Client ou admin annule la réservation

**Destinataire :** Client

**Objet :** `Réservation annulée - ${confirmationCode}`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Mêmes styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p>Annulation de réservation</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${customerName}</strong>,</p>
      
      <p>Votre réservation <strong>${confirmationCode}</strong> a été annulée.</p>
      
      <div class="ticket">
        <h2 style="color: #FF6B6B; margin-top: 0;">📋 Réservation annulée</h2>
        
        <table style="width: 100%; color: white;">
          <tr>
            <td><strong>Film :</strong></td>
            <td>${movieTitle}</td>
          </tr>
          <tr>
            <td><strong>Date :</strong></td>
            <td>${showDate}</td>
          </tr>
          <tr>
            <td><strong>Heure :</strong></td>
            <td>${showTime}</td>
          </tr>
          <tr>
            <td><strong>Sièges :</strong></td>
            <td>${seats}</td>
          </tr>
          <tr>
            <td><strong>Montant :</strong></td>
            <td>${totalPrice} HTG</td>
          </tr>
        </table>
      </div>
      
      ${refundAmount > 0 ? `
      <div style="background: #D4EDDA; border-left: 4px solid #28A745; padding: 15px; margin: 20px 0;">
        <strong>💰 Remboursement</strong>
        <p style="margin: 10px 0 0 0;">Un remboursement de <strong>${refundAmount} HTG</strong> sera effectué sous 5-7 jours ouvrables.</p>
      </div>
      ` : ''}
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${websiteUrl}/films" class="button">Découvrir d'autres films</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>JAJE CINÉ</strong></p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
    </div>
  </div>
</body>
</html>
```

---

### **5. Rappel Avant Séance (2 heures avant)**

**Déclencheur :** Job automatique 2 heures avant la séance

**Destinataire :** Client

**Objet :** `🎬 Rappel : Votre séance commence dans 2 heures !`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Mêmes styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p style="font-size: 22px;">⏰ Votre séance commence bientôt !</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${customerName}</strong>,</p>
      
      <p style="font-size: 18px;">Votre séance de <strong>${movieTitle}</strong> commence dans <strong style="color: #D4AF37;">2 heures</strong> !</p>
      
      <div class="ticket">
        <h2 style="color: #D4AF37; margin-top: 0;">🎟️ Votre Ticket</h2>
        
        <div class="code">${confirmationCode}</div>
        
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; background: white; padding: 10px; border-radius: 8px;">
        </div>
        
        <table style="width: 100%; color: white;">
          <tr>
            <td><strong>🎬 Film :</strong></td>
            <td>${movieTitle}</td>
          </tr>
          <tr>
            <td><strong>📅 Date :</strong></td>
            <td>${showDate}</td>
          </tr>
          <tr>
            <td><strong>🕐 Heure :</strong></td>
            <td style="color: #D4AF37; font-size: 20px; font-weight: bold;">${showTime}</td>
          </tr>
          <tr>
            <td><strong>🏛️ Salle :</strong></td>
            <td>${roomName}</td>
          </tr>
          <tr>
            <td><strong>💺 Sièges :</strong></td>
            <td>${seats}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
        <strong>⏰ N'oubliez pas !</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Arrivez <strong>15 minutes avant</strong> la séance</li>
          <li>Présentez votre <strong>QR code</strong> à l'entrée</li>
          <li>Les portes ferment <strong>5 minutes après</strong> le début</li>
        </ul>
      </div>
      
      <div style="background: #E7F3FF; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <strong>📍 Adresse</strong>
        <p style="margin: 10px 0 0 0;">JAJE CINÉ<br>123 Rue du Cinéma<br>Port-au-Prince, Haïti</p>
        <p style="margin-top: 10px;">
          <a href="https://maps.google.com/?q=JAJE+Ciné" style="color: #2196F3;">📍 Voir sur Google Maps</a>
        </p>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${websiteUrl}/compte" class="button">Voir mon ticket</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>À tout de suite ! 🍿</strong></p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
    </div>
  </div>
</body>
</html>
```

---

## 📞 EMAILS DE SUPPORT

### **6. Confirmation de Réception du Message**

**Déclencheur :** Client envoie un message via le formulaire de contact

**Destinataire :** Client

**Objet :** `Message reçu - Ticket ${ticketNumber}`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Mêmes styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p>Support Client</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${contactName}</strong>,</p>
      
      <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
      
      <div style="background: #E7F3FF; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <strong>📋 Numéro de ticket</strong>
        <p style="font-size: 20px; font-weight: bold; color: #2196F3; margin: 10px 0;">${ticketNumber}</p>
        <p style="margin: 0; font-size: 14px;">Conservez ce numéro pour suivre votre demande</p>
      </div>
      
      <div style="background: #F5F5F5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <strong>Votre message :</strong>
        <p style="margin: 10px 0 0 0; font-style: italic;">"${message}"</p>
      </div>
      
      <p>Notre équipe traitera votre demande dans les plus brefs délais. Vous recevrez une réponse par email.</p>
      
      <div style="background: #D4EDDA; border-left: 4px solid #28A745; padding: 15px; margin: 20px 0;">
        <strong>⏱️ Délai de réponse estimé</strong>
        <p style="margin: 10px 0 0 0;">
          ${priority === 'URGENT' ? '1 heure' : 
            priority === 'HIGH' ? '4 heures' : 
            priority === 'NORMAL' ? '24 heures' : '48 heures'}
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>JAJE CINÉ - Support Client</strong></p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
    </div>
  </div>
</body>
</html>
```

---

### **7. Réponse du Support**

**Déclencheur :** Staff/Admin répond au ticket

**Destinataire :** Client

**Objet :** `Réponse à votre demande - ${ticketNumber}`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Mêmes styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p>Réponse du Support</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${contactName}</strong>,</p>
      
      <p>Nous avons une réponse concernant votre demande <strong>${ticketNumber}</strong>.</p>
      
      <div style="background: #F5F5F5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <strong>Votre message :</strong>
        <p style="margin: 10px 0 0 0; font-style: italic; color: #666;">"${originalMessage}"</p>
      </div>
      
      <div style="background: #E7F3FF; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <strong>📝 Notre réponse :</strong>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${responseMessage}</p>
        <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
          Répondu par ${staffName} le ${responseDate}
        </p>
      </div>
      
      <p>Si vous avez d'autres questions, n'hésitez pas à répondre à cet email.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="mailto:contact@jajecine.ht?subject=Re: ${ticketNumber}" class="button">Répondre</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>JAJE CINÉ - Support Client</strong></p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
    </div>
  </div>
</body>
</html>
```

---

## 👤 EMAILS UTILISATEUR

### **8. Bienvenue (Inscription)**

**Déclencheur :** Nouvel utilisateur s'inscrit

**Destinataire :** Nouvel utilisateur

**Objet :** `Bienvenue chez JAJE Ciné ! 🎬`

**Template :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Mêmes styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 JAJE CINÉ</h1>
      <p style="font-size: 24px;">Bienvenue dans la famille !</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${firstName}</strong>,</p>
      
      <p style="font-size: 18px;">Bienvenue chez <strong>JAJE Ciné</strong>, votre nouveau cinéma préféré ! 🍿</p>
      
      <div style="background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <h2 style="color: #000; margin: 0;">🎉 Compte créé avec succès !</h2>
        <p style="color: #000; margin: 10px 0 0 0;">Vous pouvez maintenant réserver vos places en ligne</p>
      </div>
      
      <div style="background: #E7F3FF; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <strong>✨ Avantages de votre compte :</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Réservation rapide en ligne</li>
          <li>Historique de vos tickets</li>
          <li>Notifications avant vos séances</li>
          <li>Offres exclusives (bientôt)</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="${websiteUrl}/films" class="button">Découvrir les films à l'affiche</a>
      </p>
      
      <p style="text-align: center; margin-top: 15px;">
        <a href="${websiteUrl}/compte" style="color: #2196F3;">Accéder à mon compte</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>JAJE CINÉ</strong></p>
      <p>123 Rue du Cinéma, Port-au-Prince, Haïti</p>
      <p>📞 +509 1234-5678 | 📧 contact@jajecine.ht</p>
      <p style="margin-top: 15px;">Bon film ! 🎬</p>
    </div>
  </div>
</body>
</html>
```

---

## 📊 RÉSUMÉ DES EMAILS

| Email | Déclencheur | Destinataire | Priorité |
|-------|-------------|--------------|----------|
| **Confirmation Réservation** | Réservation créée (PENDING_PAYMENT) | Client | Haute |
| **Paiement Validé** | Admin valide paiement | Client | Haute |
| **Paiement Rejeté** | Admin rejette paiement | Client | Haute |
| **Annulation** | Réservation annulée | Client | Normale |
| **Rappel Séance** | 2h avant séance (job auto) | Client | Haute |
| **Message Reçu** | Contact form soumis | Client | Normale |
| **Réponse Support** | Staff répond au ticket | Client | Normale |
| **Bienvenue** | Inscription utilisateur | Nouvel utilisateur | Basse |

---

## 🔔 NOTIFICATIONS SMS (OPTIONNEL)

### **Messages SMS Courts**

**1. Paiement Validé**
```
JAJE Ciné: Votre réservation ${confirmationCode} est confirmée ! 
Film: ${movieTitle}
Date: ${showDate} à ${showTime}
Salle: ${roomName}
Sièges: ${seats}
Présentez ce code à l'entrée. Bon film! 🎬
```

**2. Rappel Séance**
```
JAJE Ciné: Rappel! Votre séance de ${movieTitle} commence dans 2h (${showTime}).
Code: ${confirmationCode}
Arrivez 15 min avant. À bientôt! 🍿
```

---

## 🛠️ IMPLÉMENTATION TECHNIQUE

### **Edge Function : Envoi d'Emails**

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  const { 
    to, 
    subject, 
    template, 
    data 
  } = await req.json();
  
  // Charger le template HTML
  const htmlContent = renderTemplate(template, data);
  
  // Envoyer via Resend
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'JAJE Ciné <noreply@jajecine.ht>',
      to: [to],
      subject: subject,
      html: htmlContent
    })
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

Fin du document
