import React, { useState } from 'react';
import AdminLayout from '../../../components/feature/AdminLayout';

interface ContentSection {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  updatedBy: string;
}

const AdminContent: React.FC = () => {
  const [contentSections, setContentSections] = useState<ContentSection[]>([
    {
      id: 'hero-title',
      title: 'Titre principal (Hero)',
      content: 'Découvrez le Cinéma Premium',
      lastUpdated: '2025-01-14T10:30:00Z',
      updatedBy: 'Admin'
    },
    {
      id: 'hero-subtitle',
      title: 'Sous-titre (Hero)',
      content: 'Vivez une expérience cinématographique exceptionnelle avec les derniers blockbusters et un confort premium.',
      lastUpdated: '2025-01-14T10:30:00Z',
      updatedBy: 'Admin'
    },
    {
      id: 'about-title',
      title: 'Titre À Propos',
      content: 'Pourquoi choisir JAJE Ciné ?',
      lastUpdated: '2025-01-13T15:20:00Z',
      updatedBy: 'Staff'
    },
    {
      id: 'about-description',
      title: 'Description À Propos',
      content: 'JAJE Ciné vous offre une expérience unique avec nos salles climatisées, nos sièges confortables et notre technologie de pointe. Nous proposons les derniers films en haute qualité avec un son exceptionnel.',
      lastUpdated: '2025-01-13T15:20:00Z',
      updatedBy: 'Staff'
    },
    {
      id: 'contact-phone',
      title: 'Téléphone de contact',
      content: '47 94 5556',
      lastUpdated: '2025-01-12T09:15:00Z',
      updatedBy: 'Admin'
    },
    {
      id: 'contact-address',
      title: 'Adresse',
      content: 'Port-au-Prince, Haïti',
      lastUpdated: '2025-01-12T09:15:00Z',
      updatedBy: 'Admin'
    },
    {
      id: 'opening-hours',
      title: 'Heures d\'ouverture',
      content: 'Lundi - Dimanche: 13h00 - 23h00',
      lastUpdated: '2025-01-12T09:15:00Z',
      updatedBy: 'Admin'
    }
  ]);

  const [faqItems, setFaqItems] = useState([
    {
      id: 1,
      question: 'Comment réserver mes places ?',
      answer: 'Vous pouvez réserver vos places directement sur notre site web en sélectionnant votre film, vos sièges et votre méthode de paiement.',
      isActive: true
    },
    {
      id: 2,
      question: 'Quels modes de paiement acceptez-vous ?',
      answer: 'Nous acceptons MonCash, NatCash et les paiements en espèces à l\'arrivée au cinéma.',
      isActive: true
    },
    {
      id: 3,
      question: 'Puis-je annuler ma réservation ?',
      answer: 'Oui, vous pouvez annuler votre réservation jusqu\'à 2 heures avant le début de la séance. Contactez-nous pour plus d\'informations.',
      isActive: true
    },
    {
      id: 4,
      question: 'Proposez-vous des tarifs réduits ?',
      answer: 'Oui, nous proposons des tarifs réduits pour les étudiants et les groupes de plus de 10 personnes.',
      isActive: false
    }
  ]);

  const [selectedSection, setSelectedSection] = useState<ContentSection | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', isActive: true });

  const handleEditContent = (section: ContentSection) => {
    setSelectedSection(section);
    setEditContent(section.content);
    setIsEditModalOpen(true);
  };

  const handleSaveContent = () => {
    if (selectedSection) {
      setContentSections(prev => prev.map(section =>
        section.id === selectedSection.id
          ? {
              ...section,
              content: editContent,
              lastUpdated: new Date().toISOString(),
              updatedBy: 'Admin'
            }
          : section
      ));
      setIsEditModalOpen(false);
      setSelectedSection(null);
      setEditContent('');
    }
  };

  const handleEditFaq = (faq: any = null) => {
    setEditingFaq(faq);
    if (faq) {
      setFaqForm({
        question: faq.question,
        answer: faq.answer,
        isActive: faq.isActive
      });
    } else {
      setFaqForm({ question: '', answer: '', isActive: true });
    }
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = () => {
    if (editingFaq) {
      setFaqItems(prev => prev.map(item =>
        item.id === editingFaq.id
          ? { ...item, ...faqForm }
          : item
      ));
    } else {
      const newFaq = {
        id: Date.now(),
        ...faqForm
      };
      setFaqItems(prev => [...prev, newFaq]);
    }
    setIsFaqModalOpen(false);
    setEditingFaq(null);
  };

  const handleDeleteFaq = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      setFaqItems(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestion du Contenu</h1>
          <p className="text-gray-400">Modifiez les textes de votre site web et gérez la FAQ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contenu du site */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Contenu du site</h2>
              <i className="ri-file-text-line text-xl text-blue-400"></i>
            </div>

            <div className="space-y-4">
              {contentSections.map((section) => (
                <div key={section.id} className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-2">{section.title}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-3">{section.content}</p>
                      <div className="flex items-center text-xs text-gray-400">
                        <i className="ri-time-line mr-1"></i>
                        <span>Modifié le {new Date(section.lastUpdated).toLocaleDateString('fr-FR')} par {section.updatedBy}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditContent(section)}
                      className="ml-4 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Questions Fréquentes</h2>
              <button
                onClick={() => handleEditFaq()}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold px-4 py-2 rounded-xl transition-all duration-300 text-sm whitespace-nowrap"
              >
                <i className="ri-add-line mr-1"></i>
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq) => (
                <div key={faq.id} className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-white font-medium">{faq.question}</h3>
                        {faq.isActive ? (
                          <span className="ml-2 px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs border border-green-600/30">Actif</span>
                        ) : (
                          <span className="ml-2 px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs border border-gray-600/30">Inactif</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{faq.answer}</p>
                    </div>
                    <div className="ml-4 flex space-x-1">
                      <button
                        onClick={() => handleEditFaq(faq)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-300"
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paramètres avancés */}
        <div className="mt-8 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-bold text-white mb-6">Paramètres avancés</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Maintenance du site</h3>
              <p className="text-gray-400 text-sm mb-4">Activez le mode maintenance pour effectuer des mises à jour.</p>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="maintenance" className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400" />
                <label htmlFor="maintenance" className="text-white text-sm">Mode maintenance</label>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Réseaux sociaux</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Facebook</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/jajecine"
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Instagram</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/jajecine"
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal d'édition de contenu */}
        {isEditModalOpen && selectedSection && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Modifier: {selectedSection.title}</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenu
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Entrez le contenu..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveContent}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal FAQ */}
        {isFaqModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700/50 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingFaq ? 'Modifier la question' : 'Ajouter une question'}
                </h2>
                <button
                  onClick={() => setIsFaqModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    placeholder="Entrez la question..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Réponse
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Entrez la réponse..."
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="faq-active"
                    checked={faqForm.isActive}
                    onChange={(e) => setFaqForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
                  />
                  <label htmlFor="faq-active" className="text-white text-sm">Question active</label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsFaqModalOpen(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveFaq}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold rounded-xl transition-all duration-300 whitespace-nowrap"
                  >
                    {editingFaq ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContent;