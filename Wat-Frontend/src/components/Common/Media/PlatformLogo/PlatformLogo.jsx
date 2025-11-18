import React from 'react';
import './PlatformLogo.scss';

// Import des SVG depuis les assets (Vite: import.meta.glob)
const logoModules = import.meta.glob('/src/assets/*.{svg,png,webp}', { eager: true });

// Construire une map de logos par mot-clé détecté dans le nom de fichier
const logosMap = {};
Object.entries(logoModules).forEach(([path, mod]) => {
  const filename = path.split('/').pop();
  const resolved = mod?.default || mod;
  if (!resolved) return;
  const lname = filename.replace(/\.(svg|png|webp)$/i, '').toLowerCase();

  // Keep a direct key based on filename simplified
  const fileKey = lname.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  logosMap[fileKey] = resolved;

  // Heuristic keywords -> map them to the resolved asset so frontend can just use backend normalized names
  if (lname.includes('netflix')) logosMap['netflix'] = resolved;
  if (lname.includes('crunchy')) logosMap['crunchyroll'] = resolved;
  if (lname.includes('amazon') || lname.includes('prime')) logosMap['prime video'] = resolved;
  if (lname.includes('disney')) {
    logosMap['disney+'] = resolved;
    logosMap['disney plus'] = resolved;
  }
  if (lname.includes('anime') && lname.includes('digital')) logosMap['adn'] = resolved;
  if (lname.includes('hidive')) logosMap['hidive'] = resolved;
  if (lname.includes('hbo')) logosMap['hbo max'] = resolved;
  if (lname.includes('paramount')) logosMap['paramount+'] = resolved;
  if (lname.includes('apple')) logosMap['apple tv'] = resolved;
  if (lname.includes('funimation')) logosMap['funimation'] = resolved;
  if (lname.includes('hulu')) logosMap['hulu'] = resolved;
});

// Composant pour afficher le logo d'une plateforme - attend un nom déjà normalisé côté backend
function PlatformLogo({ platform, size = 'medium' }) {
  const p = (platform || '').toString().trim();
  const key = p.toLowerCase();
  // Canonicalize common composite provider names (e.g. "Crunchyroll Amazon Channel")
  const canonicalKeyFromPlatform = (raw) => {
    if (!raw) return '';
    const s = raw.toLowerCase();
    if (s.includes('crunchy')) return 'crunchyroll';
    if (s.includes('netflix')) return 'netflix';
    if (s.includes('prime') || s.includes('amazon')) return 'prime video';
    if (s.includes('disney')) return 'disney+';
    if (s.includes('hbo')) return 'hbo max';
    if (s.includes('paramount')) return 'paramount+';
    if (s.includes('apple')) return 'apple tv';
    if (s.includes('funimation')) return 'funimation';
    if (s.includes('hulu')) return 'hulu';
    if (s.includes('hidive')) return 'hidive';
    if (s.includes('anime') && s.includes('digital')) return 'adn';
    return raw.replace(/[^a-z0-9+ ]/gi, ' ').replace(/\s+/g, ' ').trim();
  };
  // small alias table to map common provider name variants to our preferred keys
  const alias = {
    'anime digital network': 'adn',
    'anime-digital-network': 'adn',
    'animation digital network': 'adn',
    'adn': 'adn',
    'disney plus': 'disney+',
    'disney+': 'disney+',
    'primevideo': 'prime video',
    'prime video': 'prime video',
    'prime': 'prime video',
    'apple tv': 'apple tv',
    'appletv': 'apple tv',
  };

  // Resolve alias if present
  const resolvedAliasKey = alias[key] || alias[key.replace(/\s+/g, '')] || null;
  const canonical = canonicalKeyFromPlatform(key);
  const lookupKey = resolvedAliasKey || canonical || key;

  // Direct lookup: backend should supply normalized names like 'Netflix', 'Crunchyroll', 'Prime Video', 'Disney+', 'ADN', 'HiDive', 'HBO Max', 'Paramount+', 'Apple TV', 'Funimation', 'Hulu'
  if (lookupKey && logosMap[lookupKey]) {
    return (
      <div className={`platform-logo ${size}`} title={platform}>
        <img src={logosMap[lookupKey]} alt={platform} className="platform-svg" />
      </div>
    );
  }

  // Try some fallback variants
  const compact = key.replace(/\s+/g, ' ').trim();
  if (logosMap[compact]) {
    return (
      <div className={`platform-logo ${size}`} title={platform}>
        <img src={logosMap[compact]} alt={platform} className="platform-svg" />
      </div>
    );
  }

  const compactNoSpace = compact.replace(/\s+/g, '');
  if (logosMap[compactNoSpace]) {
    return (
      <div className={`platform-logo ${size}`} title={platform}>
        <img src={logosMap[compactNoSpace]} alt={platform} className="platform-svg" />
      </div>
    );
  }

  // Last resort: try to find an asset whose filename contains a keyword from the platform name
  for (const k of Object.keys(logosMap)) {
    if (!k) continue;
    // prefer exact inclusion of whole keyword
    if (key.includes(k)) {
      return (
        <div className={`platform-logo ${size}`} title={platform}>
          <img src={logosMap[k]} alt={platform} className="platform-svg" />
        </div>
      );
    }
  }

  // Default fallback: short badge
  return (
    <div className={`platform-logo ${size}`} title={platform}>
      <div className="platform-text default-logo" style={{ backgroundColor: '#666', color: 'white' }}>
        {p.substring(0, 2).toUpperCase()}
      </div>
    </div>
  );
}

export default PlatformLogo;