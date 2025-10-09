import React from 'react';
import './PlatformLogo.scss';

// Import des SVG depuis les assets
// Charger dynamiquement tous les assets du dossier `src/assets`
// Utiliser import.meta.glob avec { eager: true } (compatible avec Vite et certains environnements)
const logoModules = import.meta.glob('/src/assets/*.{svg,png,webp}', { eager: true });

// Construire une map simple { 'netflix': '/src/assets/Netflix_2015_N_logo.svg', ... }
const logosMap = {};
Object.entries(logoModules).forEach(([path, mod]) => {
  const filename = path.split('/').pop();
  const name = filename.replace(/\.(svg|png|webp)$/i, '').toLowerCase();
  const resolved = mod?.default || mod;
  if (!resolved) return;
  // minimal normalization: remove extension leftovers and underscores
  const key = name.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  logosMap[key] = resolved;
  logosMap[key.replace(/\s+/g, '')] = resolved; // compact key
});

// Composant pour afficher le logo d'une plateforme de streaming
function PlatformLogo({ platform, size = 'medium' }) {
  // Normalise le nom de la plateforme en version simple
  const normalizePlatform = (name = '') => {
    if (!name) return '';
    const n = name.toString().trim().toLowerCase();
    // basic cleanup
    let compact = n.replace(/[\\/]+/g, ' ').replace(/\s+/g, ' ').replace(/[-_]/g, ' ').trim();
    compact = compact.replace(/[()]/g, '').trim();
    // small alias map to cover known backend variants
    const alias = {
      'disney+': 'disney plus',
      'paramount+': 'paramount+',
      'appletv': 'apple tv',
      'appletvplus': 'apple tv',
      'primevideo': 'prime video',
      'animation digital network': 'adn',
      'anime digital network': 'adn'
    };
    if (alias[compact]) return alias[compact];
    return compact;
  };

  // Map des plateformes vers leurs logos
  const renderPlatformLogo = (platform) => {
    const normalizedPlatform = normalizePlatform(platform);

    // Try a few candidate keys to find a matching SVG in logosMap
    const candidates = [normalizedPlatform, normalizedPlatform.replace(/\s+/g, ''), normalizedPlatform.replace(/\s+/g, ' ')];
    for (const key of candidates) {
      if (key && logosMap[key]) {
        return <img src={logosMap[key]} alt={platform} className="platform-svg" />;
      }
    }

    // Fallbacks lisibles : Apple TV (afficher label clair), Peacock, ou badge court
    const lower = (platform || '').toString().toLowerCase();
    if (lower.startsWith('apple tv')) {
      return (
        <div className="platform-text apple-logo" style={{ backgroundColor: '#000', color: 'white' }}>
          {platform}
        </div>
      );
    }

    if (lower.includes('peacock')) {
      return (
        <div className="platform-text" style={{ backgroundColor: '#00b4d8', color: 'white' }}>
          NBC
        </div>
      );
    }

    // Default: deux lettres en fallback
    return (
      <div className="platform-text default-logo" style={{ backgroundColor: '#666', color: 'white' }}>
        {(platform || '').toString().substring(0, 2).toUpperCase()}
      </div>
    );
  };

  // Fonction principale qui retourne le JSX complet
  return (
    <div className={`platform-logo ${size}`} title={platform}>
      {renderPlatformLogo(platform)}
    </div>
  );
}

export default PlatformLogo;