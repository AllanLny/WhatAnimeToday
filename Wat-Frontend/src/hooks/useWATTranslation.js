/**
 * 🌍 Hook personnalisé pour la traduction WAT
 * Simplifie l'utilisation d'i18next dans les composants
 */

import { useTranslation } from 'react-i18next';

/**
 * Hook personnalisé pour la traduction
 * @param {string} namespace - Namespace optionnel pour les clés
 * @returns {object} Fonctions et état de traduction
 */
export const useWATTranslation = (namespace = 'translation') => {
  const { t, i18n } = useTranslation(namespace);

  /**
   * Change la langue de l'application
   * @param {string} lng - Code de langue (fr, en, etc.)
   */
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  /**
   * Récupère la langue actuelle
   * @returns {string} Code de langue actuel
   */
  const getCurrentLanguage = () => i18n.language;

  /**
   * Vérifie si une langue est supportée
   * @param {string} lng - Code de langue à vérifier
   * @returns {boolean} True si supportée
   */
  const isLanguageSupported = (lng) => {
    return i18n.options.supportedLngs?.includes(lng) || false;
  };

  /**
   * Récupère toutes les langues supportées
   * @returns {array} Liste des codes de langue supportés
   */
  const getSupportedLanguages = () => {
    return i18n.options.supportedLngs?.filter(lng => lng !== 'cimode') || [];
  };

  /**
   * Formate une date selon la locale actuelle
   * @param {Date|string} date - Date à formater
   * @param {object} options - Options de formatage Intl.DateTimeFormat
   * @returns {string} Date formatée
   */
  const formatDate = (date, options = {}) => {
    const locale = getCurrentLanguage() === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...options
    }).format(new Date(date));
  };

  /**
   * Formate un nombre selon la locale actuelle
   * @param {number} number - Nombre à formater
   * @param {object} options - Options de formatage Intl.NumberFormat
   * @returns {string} Nombre formaté
   */
  const formatNumber = (number, options = {}) => {
    const locale = getCurrentLanguage() === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  };

  return {
    t, // Fonction de traduction principale
    changeLanguage,
    getCurrentLanguage,
    isLanguageSupported,
    getSupportedLanguages,
    formatDate,
    formatNumber,
    isReady: i18n.isInitialized, // État d'initialisation
    language: i18n.language // Langue actuelle (reactive)
  };
};

/**
 * Mappings des codes de langue vers les noms affichables
 */
export const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English'
};

/**
 * Mappings des codes de langue vers les drapeaux emoji
 */
export const LANGUAGE_FLAGS = {
  fr: '🇫🇷',
  en: '🇺🇸'
};

export default useWATTranslation;