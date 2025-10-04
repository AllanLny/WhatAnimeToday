/**
 * 🌍 Composant LanguageSelector - Sélecteur de langue
 * Permet de changer la langue de l'application
 */

import React from 'react';
import { useWATTranslation, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../../hooks/useWATTranslation';
import './LanguageSelector.scss';

const LanguageSelector = ({ className = '', showText = true, compact = false }) => {
  const { getCurrentLanguage, changeLanguage, getSupportedLanguages, t } = useWATTranslation();
  
  const currentLanguage = getCurrentLanguage();
  const supportedLanguages = getSupportedLanguages();

  const handleLanguageChange = (newLanguage) => {
    if (newLanguage !== currentLanguage) {
      changeLanguage(newLanguage);
    }
  };

  if (compact) {
    // Mode compact : dropdown simple
    return (
      <div className={`language-selector compact ${className}`}>
        <select 
          value={currentLanguage} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="language-select"
          aria-label={t('settings.language', 'Changer de langue')}
        >
          {supportedLanguages.map(lang => (
            <option key={lang} value={lang}>
              {LANGUAGE_FLAGS[lang]} {LANGUAGE_NAMES[lang]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Mode normal : boutons avec animation
  return (
    <div className={`language-selector ${className}`}>
      {showText && (
        <span className="language-label">
          🌍 {t('settings.language', 'Langue')}
        </span>
      )}
      
      <div className="language-buttons">
        {supportedLanguages.map(lang => (
          <button
            key={lang}
            className={`language-btn ${currentLanguage === lang ? 'active' : ''}`}
            onClick={() => handleLanguageChange(lang)}
            aria-label={t('ui.changeToLanguage', `Changer vers ${LANGUAGE_NAMES[lang]}`, { language: LANGUAGE_NAMES[lang] })}
            title={LANGUAGE_NAMES[lang]}
          >
            <span className="language-flag">{LANGUAGE_FLAGS[lang]}</span>
            {showText && (
              <span className="language-name">{LANGUAGE_NAMES[lang]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;