/**
 * 🌍 Composant CountrySelector - Sélecteur de pays/région
 * Composant réutilisable pour choisir la région des animes
 */

import React from 'react';
import { useWATTranslation } from '../../../../hooks/useWATTranslation';
import './CountrySelector.scss';

const CountrySelector = ({ 
  value, 
  onChange, 
  className = '',
  compact = false
}) => {
  const { t } = useWATTranslation();

  // Liste des pays supportés (sans drapeaux)
  const supportedCountries = [
    { code: 'FR' },
    { code: 'US' },
    { code: 'JP' },
    { code: 'UK' },
    { code: 'DE' },
    { code: 'ES' },
    { code: 'IT' },
    { code: 'WW' } // Worldwide option
  ];

  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <select 
      className={`country-select ${compact ? 'compact' : ''} ${className}`}
      value={value} 
      onChange={handleChange}
      aria-label={t('settings.region', 'Choisir une région')}
    >
      {supportedCountries.map(country => (
        <option key={country.code} value={country.code}>
          {t(`countries.${country.code}`, country.code === 'WW' ? 'Worldwide' : undefined)}
        </option>
      ))}
    </select>
  );
};

export default CountrySelector;