import { useState } from 'react';
import { useUserContext } from '../../context/UserContext';
import './Settings.scss'; 

function Settings() {
  const { country, setCountry } = useUserContext();
  const [selectedCountry, setSelectedCountry] = useState(country);

  const countries = [
    'France', 
    'Belgique',
    'Suisse', 
    'Canada', 
    'États-Unis', 
    'Royaume-Uni',
    'Japon',
    'Allemagne',
    'Espagne',
    'Italie'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setCountry(selectedCountry);
    alert('Pays mis à jour avec succès!');
  };

  return (
    <div className="settings-container">
      <h1>Paramètres</h1>
      
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="country">Sélectionnez votre pays:</label>
          <select 
            id="country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="country-select"
          >
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <p className="settings-info">
          Le choix du pays permet d'afficher les sorties d'anime et manga 
          disponibles spécifiquement dans votre région sur les différentes 
          plateformes de streaming.
        </p>
        
        <button type="submit" className="save-button">
          Enregistrer
        </button>
      </form>
    </div>
  );
}

export default Settings;