import { useState } from 'react';
import { useUserContext } from '../../context/UserContext';
import { useWATTranslation, LANGUAGE_NAMES } from '../../hooks/useWATTranslation';
import { LanguageSelector } from '../../components/Common';
import './Settings.scss'; 

function Settings() {
  const { t, getCurrentLanguage } = useWATTranslation();
  const { country, setCountry } = useUserContext();
  const [selectedCountry, setSelectedCountry] = useState(country);

  const countries = [
    { code: 'FR', name: 'France' },
    { code: 'US', name: 'États-Unis' },
    { code: 'JP', name: 'Japon' },
    { code: 'UK', name: 'Royaume-Uni' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'ES', name: 'Espagne' },
    { code: 'IT', name: 'Italie' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setCountry(selectedCountry);
    alert(t('settings.countryUpdated', 'Pays mis à jour avec succès!'));
  };

  return (
    <div className="settings-container">
      <h1>{t('settings.title')}</h1>
      
      {/* Section Langue */}
      <div className="settings-section">
        <h2>🌍 {t('settings.language')}</h2>
        <p>{t('settings.languageDesc', 'Choisissez votre langue préférée')}</p>
        <LanguageSelector showText={true} />
        <p className="current-setting">
          {t('settings.currentLanguage', 'Langue actuelle')}: {LANGUAGE_NAMES[getCurrentLanguage()]}
        </p>
      </div>
      
      {/* Section Région */}
      <div className="settings-section">
        <h2>🌎 {t('settings.region')}</h2>
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="country">{t('settings.selectCountry', 'Sélectionnez votre pays')}:</label>
            <select 
              id="country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="country-select"
            >
              {countries.map(({ code, name }) => (
                <option key={code} value={code}>{t(`countries.${code}`, name)}</option>
              ))}
            </select>
          </div>
          
          <p className="settings-info">
            {t('settings.countryInfo', 'Le choix du pays permet d\'afficher les sorties d\'anime spécifiques à votre région.')}
          </p>
          
          <button type="submit" className="save-button">
            {t('ui.save', 'Enregistrer')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;