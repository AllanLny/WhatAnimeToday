/**
 * 🌍 Composant CountrySelector - Sélecteur de pays/région
 * Composant réutilisable pour choisir la région des animes
 */

import React from 'react';
import { useWATTranslation } from '../../hooks/useWATTranslation';
import './CountrySelector.scss';

const CountrySelector = ({ 
  value, 
  onChange, 
  className = '',
  compact = false,
  showLabel = true 
}) => {
  const { t } = useWATTranslation();

  // Liste des pays supportés
  const supportedCountries = [
    { code: 'FR', flag: '🇫🇷' },
    { code: 'US', flag: '🇺🇸' },
    { code: 'JP', flag: '🇯🇵' },
    { code: 'UK', flag: '🇬🇧' },
    { code: 'DE', flag: '🇩🇪' },
    { code: 'ES', flag: '🇪🇸' },
    { code: 'IT', flag: '🇮🇹' }
  ];

  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className={`country-selector ${compact ? 'compact' : ''} ${className}`}>
      {showLabel && !compact && (
        <label className="country-label">
          🌍 {t('settings.region', 'Région')}
        </label>
      )}
      
      <select 
        className="country-select"
        value={value} 
        onChange={handleChange}
        aria-label={t('settings.region', 'Choisir une région')}
      >
        {supportedCountries.map(country => (
          <option key={country.code} value={country.code}>
            {country.flag} {t(`countries.${country.code}`)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CountrySelector;