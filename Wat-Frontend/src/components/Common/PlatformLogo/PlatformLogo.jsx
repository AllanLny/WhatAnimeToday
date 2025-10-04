import React from 'react';
import './PlatformLogo.scss';

// Import des SVG depuis les assets
import NetflixLogo from '../../../assets/Netflix_2015_N_logo.svg';
import CrunchyrollLogo from '../../../assets/Crunchyroll_Logo.svg';
import ADNLogo from '../../../assets/Logo_Anime-Digital-Network.svg';
import PrimeVideoLogo from '../../../assets/Amazon_Prime_Video_logo.svg';
import DisneyPlusLogo from '../../../assets/Disney+_logo.svg';

// Composant pour afficher le logo d'une plateforme de streaming
function PlatformLogo({ platform, size = 'medium' }) {
  // Map des plateformes vers leurs logos
  const renderPlatformLogo = (platform) => {
    const normalizedPlatform = platform.toLowerCase();
    
    switch(normalizedPlatform) {
      case 'netflix':
        return (
          <img 
            src={NetflixLogo} 
            alt="Netflix"
            className="platform-svg"
          />
        );

      case 'crunchyroll':
        return (
          <img 
            src={CrunchyrollLogo} 
            alt="Crunchyroll"
            className="platform-svg"
          />
        );

      case 'adn':
        return (
          <img 
            src={ADNLogo} 
            alt="Anime Digital Network"
            className="platform-svg"
          />
        );

      case 'prime video':
        return (
          <img 
            src={PrimeVideoLogo} 
            alt="Amazon Prime Video"
            className="platform-svg"
          />
        );

      case 'disney+':
        return (
          <img 
            src={DisneyPlusLogo} 
            alt="Disney+"
            className="platform-svg"
          />
        );

      // Pour les plateformes sans SVG, utiliser des initiales stylées
      case 'funimation':
        return (
          <div className="platform-text" style={{ backgroundColor: '#5c2a9d', color: 'white' }}>
            FUN
          </div>
        );

      case 'wakanim':
        return (
          <div className="platform-text" style={{ backgroundColor: '#00bcd4', color: 'white' }}>
            WAK
          </div>
        );

      case 'hulu':
        return (
          <div className="platform-text" style={{ backgroundColor: '#1ce783', color: 'white' }}>
            HULU
          </div>
        );

      case 'hidive':
        return (
          <div className="platform-text" style={{ backgroundColor: '#ff1744', color: 'white' }}>
            HiDive
          </div>
        );

      case 'hbo max':
        return (
          <div className="platform-text" style={{ backgroundColor: '#702f8a', color: 'white' }}>
            HBO
          </div>
        );

      case 'paramount+':
        return (
          <div className="platform-text" style={{ backgroundColor: '#0064ff', color: 'white' }}>
            P+
          </div>
        );

      case 'apple tv+':
        return (
          <div className="platform-text" style={{ backgroundColor: '#000000', color: 'white' }}>
            TV+
          </div>
        );

      case 'peacock':
        return (
          <div className="platform-text" style={{ backgroundColor: '#00b4d8', color: 'white' }}>
            NBC
          </div>
        );

      default:
        return (
          <div className="platform-text default-logo" style={{ backgroundColor: '#666', color: 'white' }}>
            {platform.substring(0, 2).toUpperCase()}
          </div>
        );
    }
  };

  // Fonction principale qui retourne le JSX complet
  return (
    <div className={`platform-logo ${size}`} title={platform}>
      {renderPlatformLogo(platform)}
    </div>
  );
}

export default PlatformLogo;