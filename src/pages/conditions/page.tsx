import { Link } from 'react-router-dom';

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <div className="mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center text-gold hover:text-gold-light transition-colors duration-300 mb-8 text-base font-medium"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Retour à l'accueil
          </Link>
          
          <h1 className="text-5xl font-bold text-gold mb-4">Conditions d'Utilisation</h1>
          <p className="text-gray-500 text-base">Dernière mise à jour : 15 janvier 2025</p>
        </div>

        <div className="space-y-10 text-[#222] leading-relaxed">
          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">1. Utilisation du Service</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              JAJE Ciné met à votre disposition une plateforme de réservation en ligne pour les séances de cinéma. 
              En utilisant ce service, vous acceptez de respecter les présentes conditions d'utilisation.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Vous vous engagez à fournir des informations exactes et à jour lors de vos réservations et à 
              utiliser le service de manière responsable.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">2. Réservations et Paiements</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Les réservations peuvent être effectuées en ligne avec paiement par :
            </p>
            <ul className="list-disc pl-6 mb-5 space-y-3 text-[17px] leading-[1.8] text-[#333]">
              <li><strong className="text-[#111] font-semibold">MonCash</strong> : Paiement mobile au numéro 3750-0000</li>
              <li><strong className="text-[#111] font-semibold">NatCash</strong> : Paiement mobile au numéro 7777-0000</li>
              <li><strong className="text-[#111] font-semibold">Cash à l'entrée</strong> : Paiement au guichet du cinéma</li>
            </ul>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Pour les paiements MonCash et NatCash, votre réservation sera confirmée après validation 
              par un agent. Les réservations "Cash à l'entrée" doivent être réglées au moins 30 minutes 
              avant le début de la séance.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Les réservations non confirmées expirent automatiquement après un délai de 24 heures.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">3. Annulation et Non-Remboursement</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              <strong className="text-[#111] font-semibold">Les tickets ne sont pas remboursables</strong>, sauf en cas d'annulation de la séance 
              par le cinéma pour des raisons techniques ou de force majeure.
            </p>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              En cas d'annulation par JAJE Ciné, vous serez remboursé intégralement ou pourrez reporter 
              votre réservation sur une autre séance.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Les modifications de réservation ne sont pas possibles une fois le paiement confirmé. 
              Veuillez vérifier soigneusement vos choix avant de finaliser votre commande.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">4. Compte Utilisateur</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Vous pouvez créer un compte pour faciliter vos réservations futures et accéder à 
              l'historique de vos achats.
            </p>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Vous êtes responsable de la confidentialité de vos identifiants de connexion et 
              de toutes les activités effectuées avec votre compte.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Il est également possible de réserver sans créer de compte, en tant qu'invité.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">5. Responsabilités</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              JAJE Ciné s'efforce de maintenir la disponibilité du service et l'exactitude des 
              informations affichées (horaires, disponibilités, tarifs).
            </p>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Cependant, nous ne pouvons garantir l'absence d'interruptions techniques ou d'erreurs. 
              En cas de problème, nous nous engageons à trouver une solution satisfaisante dans les 
              meilleurs délais.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              L'utilisateur est responsable de sa connexion internet et de la vérification des 
              informations de sa réservation.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">6. Propriété Intellectuelle</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Tous les contenus présents sur le site (textes, images, logos, films) sont protégés 
              par des droits d'auteur et appartiennent à JAJE Ciné ou à leurs ayants droit respectifs.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Toute reproduction, distribution ou utilisation commerciale non autorisée est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">7. Limitation de Responsabilité</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              JAJE Ciné ne saurait être tenu responsable des dommages directs ou indirects résultant 
              de l'utilisation du service, notamment en cas de :
            </p>
            <ul className="list-disc pl-6 mb-5 space-y-2 text-[17px] leading-[1.8] text-[#333]">
              <li>Interruption technique du service</li>
              <li>Perte de données</li>
              <li>Problèmes de connexion internet</li>
              <li>Utilisation frauduleuse de vos informations par des tiers</li>
            </ul>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Notre responsabilité est limitée au montant des tickets concernés par le problème.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">8. Contact</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Pour toute question concernant ces conditions d'utilisation ou pour signaler un problème :
            </p>
            <div className="bg-gray-50 p-8 rounded-lg border-2 border-gray-200">
              <p className="mb-3 text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Email :</strong> contact@jajecine.ht
              </p>
              <p className="mb-3 text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Téléphone :</strong> +509 2222-3333
              </p>
              <p className="text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Adresse :</strong> Delmas 83, Port-au-Prince, Haïti
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">9. Modifications</h2>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              JAJE Ciné se réserve le droit de modifier ces conditions d'utilisation à tout moment. 
              Les modifications entreront en vigueur dès leur publication sur le site. 
              Nous vous encourageons à consulter régulièrement cette page.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t-2 border-gray-200">
          <Link 
            to="/" 
            className="inline-flex items-center text-gold hover:text-gold-light transition-colors duration-300 text-base font-medium"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
