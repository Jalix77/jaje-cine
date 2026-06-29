import { Link } from 'react-router-dom';

export default function ConfidentialitePage() {
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
          
          <h1 className="text-5xl font-bold text-gold mb-4">Politique de Confidentialité</h1>
          <p className="text-gray-500 text-base">Dernière mise à jour : 15 janvier 2025</p>
        </div>

        <div className="space-y-10 text-[#222] leading-relaxed">
          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">1. Données Collectées</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              JAJE Ciné collecte les informations suivantes pour assurer le bon fonctionnement du service :
            </p>
            <div className="bg-gray-50 p-8 rounded-lg border-2 border-gray-200 mb-5">
              <h3 className="text-xl font-semibold text-gold mb-4">Informations personnelles :</h3>
              <ul className="list-disc pl-6 space-y-2 text-[17px] leading-[1.8] text-[#333]">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Date de naissance (si fournie)</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg border-2 border-gray-200 mb-5">
              <h3 className="text-xl font-semibold text-gold mb-4">Données de réservation :</h3>
              <ul className="list-disc pl-6 space-y-2 text-[17px] leading-[1.8] text-[#333]">
                <li>Historique des réservations</li>
                <li>Préférences de sièges</li>
                <li>Méthodes de paiement utilisées</li>
                <li>Numéros de transaction (MonCash/NatCash)</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg border-2 border-gray-200">
              <h3 className="text-xl font-semibold text-gold mb-4">Logs techniques :</h3>
              <ul className="list-disc pl-6 space-y-2 text-[17px] leading-[1.8] text-[#333]">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
                <li>Pages visitées</li>
                <li>Temps de connexion</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">2. Utilisation des Données</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">Vos données personnelles sont utilisées pour :</p>
            <ul className="list-disc pl-6 mb-5 space-y-3 text-[17px] leading-[1.8] text-[#333]">
              <li><strong className="text-[#111] font-semibold">Traitement des réservations</strong> : confirmation, validation des paiements</li>
              <li><strong className="text-[#111] font-semibold">Communication</strong> : envoi de confirmations, notifications importantes</li>
              <li><strong className="text-[#111] font-semibold">Support client</strong> : assistance et résolution de problèmes</li>
              <li><strong className="text-[#111] font-semibold">Amélioration du service</strong> : analyse des préférences et statistiques d'usage</li>
              <li><strong className="text-[#111] font-semibold">Sécurité</strong> : prévention de la fraude et protection du système</li>
            </ul>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Nous n'utilisons jamais vos données à des fins commerciales non liées au service cinéma 
              et ne les vendons pas à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">3. Conservation des Données</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              <strong className="text-[#111] font-semibold">Comptes actifs :</strong> Les données sont conservées tant que votre compte reste actif 
              et pendant une période de 3 ans après la dernière activité.
            </p>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              <strong className="text-[#111] font-semibold">Réservations sans compte :</strong> Les informations de réservation sont conservées 
              pendant 2 ans pour des raisons comptables et de support client.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              <strong className="text-[#111] font-semibold">Logs techniques :</strong> Conservés pendant 12 mois maximum pour la sécurité 
              et les analyses statistiques.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">4. Partage des Données</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              JAJE Ciné ne partage vos données personnelles qu'avec :
            </p>
            <ul className="list-disc pl-6 mb-5 space-y-3 text-[17px] leading-[1.8] text-[#333]">
              <li><strong className="text-[#111] font-semibold">Prestataires de paiement</strong> : MonCash et NatCash pour le traitement des transactions</li>
              <li><strong className="text-[#111] font-semibold">Fournisseurs techniques</strong> : hébergement web et services de sauvegarde</li>
              <li><strong className="text-[#111] font-semibold">Autorités légales</strong> : uniquement si requis par la loi haïtienne</li>
            </ul>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Tous nos partenaires sont tenus par des accords de confidentialité stricts et ne peuvent 
              utiliser vos données que pour les services demandés.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">5. Vos Droits</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">Vous disposez des droits suivants sur vos données personnelles :</p>
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-gold font-semibold mb-3 text-lg">Droit d'accès</h3>
                <p className="text-base leading-[1.7] text-[#333]">Consulter les données que nous détenons sur vous</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-gold font-semibold mb-3 text-lg">Droit de rectification</h3>
                <p className="text-base leading-[1.7] text-[#333]">Corriger des informations inexactes ou incomplètes</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-gold font-semibold mb-3 text-lg">Droit de suppression</h3>
                <p className="text-base leading-[1.7] text-[#333]">Demander l'effacement de vos données personnelles</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-gold font-semibold mb-3 text-lg">Droit d'opposition</h3>
                <p className="text-base leading-[1.7] text-[#333]">Vous opposer à certains traitements de vos données</p>
              </div>
            </div>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Pour exercer ces droits, contactez-nous aux coordonnées indiquées en bas de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">6. Sécurité des Données</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              JAJE Ciné met en œuvre des mesures de sécurité appropriées pour protéger vos données :
            </p>
            <ul className="list-disc pl-6 mb-5 space-y-3 text-[17px] leading-[1.8] text-[#333]">
              <li>Chiffrement des données sensibles (SSL/TLS)</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Surveillance et logging des accès</li>
              <li>Sauvegardes sécurisées régulières</li>
              <li>Formation du personnel sur la protection des données</li>
            </ul>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Cependant, aucun système n'est totalement sécurisé. Nous vous encourageons à utiliser 
              des mots de passe forts et à nous signaler toute activité suspecte.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">7. Cookies et Technologies Similaires</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Notre site utilise des cookies pour améliorer votre expérience :
            </p>
            <ul className="list-disc pl-6 mb-5 space-y-3 text-[17px] leading-[1.8] text-[#333]">
              <li><strong className="text-[#111] font-semibold">Cookies essentiels</strong> : maintien de la session, panier de réservation</li>
              <li><strong className="text-[#111] font-semibold">Cookies analytiques</strong> : statistiques d'usage anonymisées</li>
              <li><strong className="text-[#111] font-semibold">Cookies de préférence</strong> : mémorisation de vos choix (langue, sièges préférés)</li>
            </ul>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines 
              fonctionnalités du site pourraient ne plus fonctionner correctement.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">8. Modifications de la Politique</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Cette politique de confidentialité peut être modifiée pour refléter les changements 
              dans nos pratiques ou la législation.
            </p>
            <p className="text-[17px] leading-[1.8] text-[#333]">
              En cas de modification importante, nous vous informerons par email (si vous avez un compte) 
              ou par notification sur le site. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-[#111] mb-5">9. Contact</h2>
            <p className="mb-5 text-[17px] leading-[1.8] text-[#333]">
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits :
            </p>
            <div className="bg-gray-50 p-8 rounded-lg border-2 border-gray-200">
              <p className="mb-3 text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Responsable des données :</strong> JAJE Ciné
              </p>
              <p className="mb-3 text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Email :</strong> privacy@jajecine.ht
              </p>
              <p className="mb-3 text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Email général :</strong> contact@jajecine.ht
              </p>
              <p className="mb-3 text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Téléphone :</strong> +509 2222-3333
              </p>
              <p className="text-[17px] leading-[1.8] text-[#222]">
                <strong className="text-[#111] font-semibold">Adresse :</strong> Delmas 83, Port-au-Prince, Haïti
              </p>
            </div>
            <p className="mt-5 text-base leading-[1.7] text-[#444]">
              Nous nous engageons à répondre à vos demandes dans un délai maximum de 30 jours.
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
