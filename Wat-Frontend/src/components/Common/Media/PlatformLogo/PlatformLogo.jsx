import React from 'react';
import './PlatformLogo.scss';

// Import des SVG depuis les assets
// Charger dynamiquement tous les assets du dossier `src/assets`
// Utiliser import.meta.glob avec { eager: true } (compatible avec Vite et certains environnements)
const logoModules = import.meta.glob('/src/assets/*.{svg,png,webp}', { eager: true });

// Construire une map normalisée { 'netflix': '/src/assets/Netflix_2015_N_logo.svg', ... }
const logosMap = {};
Object.entries(logoModules).forEach(([path, mod]) => {
  const filename = path.split('/').pop(); // e.g. 'Netflix_2015_N_logo.svg'
  let name = filename.replace(/\.(svg|png|webp)$/i, '');
  // retirer préfixes communs
  name = name.replace(/^cdnlogo\.com_/, '');
  // certains fichiers contiennent suffixes comme .wine in the name
  name = name.replace(/\.wine$/i, '');
  // normaliser caractères
  name = name.replace(/[_\-.]/g, ' ');
  name = name.replace(/logo/ig, '');
  name = name.replace(/seeklogo/ig, '');
  name = name.replace(/icon/ig, '');
  name = name.replace(/\d+/g, '');
  name = name.trim().toLowerCase().replace(/\s+/g, ' ');

  const resolved = mod?.default || mod;
  if (!resolved) return;

  // clé principale
  logosMap[name] = resolved;

  // alias utiles
  if (name.includes('amazon') && name.includes('prime')) logosMap['prime video'] = resolved;
  if (name === 'paramount' || name.includes('paramount')) logosMap['paramount+'] = resolved;
  if (name === 'disney' || name.includes('disney')) {
    logosMap['disney plus'] = resolved;
    logosMap['disney+'] = resolved;
  }
  if (name === 'hbo' || name.includes('hbo')) logosMap['hbo max'] = resolved;
  if (name === 'hidive') logosMap['hidive'] = resolved;
  if (name === 'funimation') logosMap['funimation'] = resolved;
  if (name === 'hulu') logosMap['hulu'] = resolved;
});

// Composant pour afficher le logo d'une plateforme de streaming
function PlatformLogo({ platform, size = 'medium' }) {
  // Normalise le nom de la plateforme pour gérer variantes et alias
  const normalizePlatform = (name = '') => {
    const n = name.toString().trim().toLowerCase();
    // enlever signes et espaces courants
    const compact = n.replace(/\s+/g, ' ').replace(/\+/g, 'plus').replace(/[-_]/g, ' ');
    // quelques alias connus
    const aliases = {
      'disney plus': 'disney plus',
      'disney+': 'disney plus',
      'hbo max': 'hbo max',
      'hbomax': 'hbo max',
      'paramount+': 'paramount+',
      'paramount plus': 'paramount+',
      'apple tv+': 'apple tv+',
      'appletvplus': 'apple tv+',
      'prime video': 'prime video',
      'primevideo': 'prime video',
      'hi dive': 'hidive',
      'hi-dive': 'hidive'
    };

    return aliases[compact] || compact;
  };

  // Map des plateformes vers leurs logos
  const renderPlatformLogo = (platform) => {
    const normalizedPlatform = normalizePlatform(platform);
    
    // si un logo existe pour cette plateforme (dynamique), le rendre
    if (logosMap[normalizedPlatform]) {
      return (
        <img src={logosMap[normalizedPlatform]} alt={platform} className="platform-svg" />
      );
    }

    switch(normalizedPlatform) {
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