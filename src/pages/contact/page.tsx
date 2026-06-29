
import React, { useState } from 'react';
import { Navbar } from '../../components/feature/Navbar';
import { Footer } from '../../components/feature/Footer';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('message', formData.message);

      await fetch('https://readdy.ai/api/form/d5q119etc768qf4bq4s0', {
        method: 'POST',
        body: formDataToSend
      });

      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du formulaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Une question ? Besoin d'aide ? Contactez-nous.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Formulaire de contact */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
                <h2 className="text-3xl font-bold text-yellow-400 mb-6">
                  Envoyez-nous un message
                </h2>
                
                {isSubmitted ? (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-check-line text-3xl text-green-400"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-green-400 mb-2">Message envoyé !</h3>
                    <p className="text-gray-300">Nous vous répondrons dans les plus brefs délais.</p>
                  </div>
                ) : (
                  <form id="contact-form" data-readdy-form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                          placeholder="Votre nom"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                        placeholder="47 94 5556"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        maxLength={500}
                        rows={6}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 resize-none"
                        placeholder="Votre message..."
                      ></textarea>
                      <p className="text-sm text-gray-400 mt-2">
                        {formData.message.length}/500 caractères
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Envoi en cours...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <i className="ri-send-plane-line mr-2"></i>
                          Envoyer le message
                        </span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Informations de contact */}
            <div className="space-y-8">
              {/* Nos coordonnées */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50 shadow-2xl">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6">
                  Nos coordonnées
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mr-4">
                      <i className="ri-phone-line text-xl text-yellow-400"></i>
                    </div>
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-gray-300">47 94 5556</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mr-4">
                      <i className="ri-map-pin-line text-xl text-yellow-400"></i>
                    </div>
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-gray-300">Port-au-Prince, Haïti</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support rapide */}
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm rounded-3xl p-6 border border-blue-700/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-blue-400 mb-4">
                  Support rapide
                </h3>
                <p className="text-gray-300 mb-4">
                  Besoin d'une réponse immédiate ? Utilisez notre chat en direct !
                </p>
                <div className="flex items-center text-sm text-blue-300">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-chat-3-line text-blue-400"></i>
                  </div>
                  <span>Cliquez sur le bouton de chat en bas à droite</span>
                </div>
              </div>

              {/* Heures d'ouverture */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50 shadow-2xl">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6">
                  Heures d'ouverture
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Lundi - Jeudi</span>
                    <span className="font-medium">14h - 23h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Vendredi - Dimanche</span>
                    <span className="font-medium">12h - 24h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
