// Utility to build provider/platform links for an anime
// Input: provider (object or string), title (string), country (e.g. 'FR')
// Returns an href string (may be external)

export function buildProviderHref(provider, title = '', country = 'FR') {
  const q = encodeURIComponent(title || '');
  // provider may be a string name or an object with normalized_name/provider_name/name/link/provider_id
  const raw = typeof provider === 'string' ? provider : (provider.normalized_name || provider.provider_name || provider.name || '');
  const name = (raw || '').toString().toLowerCase();

  // Debug pour identifier les noms de plateformes exacts
  console.log('🔍 buildProviderHref - provider:', provider);
  console.log('🔍 buildProviderHref - name:', name);

  // Ne plus utiliser les liens/urls fournis par TMDB car ils pointent vers des pages provider génériques
  // Toujours utiliser nos URLs de recherche optimisées ci-dessous

  // mapping for known providers
  if (name.includes('crunchy')) {
    // User requested Crunchyroll FR format like:
    // https://www.crunchyroll.com/fr/search?from=search&q=Shabake
    if (country === 'FR') return `https://www.crunchyroll.com/fr/search?from=search&q=${q}`;
    return `https://www.crunchyroll.com/search?from=search&q=${q}`;
  }
  if (name.includes('netflix')) {
    // Netflix utilise un système de recherche simple
    return `https://www.netflix.com/search?q=${q}`;
  }
  if (name.includes('prime') || name.includes('amazon')) {
    // Amazon Prime Video - ne pas changer car fonctionne parfaitement
    return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`;
  }
  if (name.includes('disney')) {
    // Disney+ utilise une URL de recherche directe
    return `https://www.disneyplus.com/fr-fr/search/${q}`;
  }
  if (name.includes('hulu')) {
    // Hulu utilise un paramètre q simple
    return `https://www.hulu.com/search?q=${q}`;
  }
  if (name.includes('funimation')) {
    // Funimation (maintenant Crunchyroll) utilise q comme paramètre
    return `https://www.crunchyroll.com/search?q=${q}`;
  }
  if (name.includes('adn') || name.includes('anime-digital-network') || name.includes('animedigitalnetwork') || name.includes('animation digital network') || name.includes('animationdigitalnetwork')) {
    // ADN utilise le paramètre search pour la recherche
    console.log('✅ ADN détecté, redirection vers animationdigitalnetwork.com');
    return `https://animationdigitalnetwork.com/video?search=${q}`;
  }
  if (name.includes('wakanim')) {
    // Wakanim utilise q comme paramètre
    return `https://www.wakanim.tv/fr/v2/catalogue/search?q=${q}`;
  }
  if (name.includes('hidive')) {
    // Wakanim utilise q comme paramètre
    return `https://www.wakanim.tv/fr/v2/catalogue/search?q=${q}`;
  }
  if (name.includes('hidive')) {
    // HiDive utilise query comme paramètre
    return `https://www.hidive.com/search?query=${q}`;
  }
  if (name.includes('hbo') || name.includes('max')) {
    // HBO Max (maintenant Max) utilise q
    return `https://play.max.com/search?q=${q}`;
  }
  if (name.includes('paramount')) {
    // Paramount+ utilise query
    return `https://www.paramountplus.com/search?query=${q}`;
  }
  if (name.includes('apple')) {
    // Apple TV+ utilise term
    return `https://tv.apple.com/search?term=${q}`;
  }
  if (name.includes('peacock')) {
    // Peacock utilise query
    return `https://www.peacocktv.com/search?query=${q}`;
  }
  if (name.includes('starz')) {
    // Starz utilise q
    return `https://www.starz.com/search?q=${q}`;
  }
  if (name.includes('showtime')) {
    // Showtime utilise term
    return `https://www.showtime.com/search?term=${q}`;
  }
  if (name.includes('espn')) {
    // ESPN+ utilise query
    return `https://plus.espn.com/search?query=${q}`;
  }
  if (name.includes('discovery')) {
    // Discovery+ utilise q
    return `https://www.discoveryplus.com/search?q=${q}`;
  }
  if (name.includes('vudu')) {
    // Vudu utilise search
    return `https://www.vudu.com/content/movies/search/?query=${q}`;
  }
  if (name.includes('tubi')) {
    // Tubi utilise q
    return `https://tubitv.com/search/${q}`;
  }
  if (name.includes('youtube') && (name.includes('tv') || name.includes('premium'))) {
    // YouTube TV utilise q
    return `https://tv.youtube.com/search?q=${q}`;
  }
  if (name.includes('pluto')) {
    // Pluto TV utilise term
    return `https://pluto.tv/search?term=${q}`;
  }
  if (name.includes('imdb') || name.includes('imdb tv') || name.includes('freevee')) {
    // Amazon Freevee (ex-IMDb TV)
    return `https://www.amazon.com/adlp/freevee/search?phrase=${q}`;
  }
  if (name.includes('roku')) {
    // Roku Channel
    return `https://therokuchannel.roku.com/search/${q}`;
  }
  if (name.includes('viki')) {
    // Viki utilise q
    return `https://www.viki.com/search?q=${q}`;
  }
  if (name.includes('iqiyi')) {
    // iQIYI utilise query
    return `https://www.iq.com/search/${q}`;
  }
  if (name.includes('wetv')) {
    // WeTV utilise query
    return `https://wetv.vip/search?query=${q}`;
  }
  if (name.includes('mubi')) {
    // MUBI utilise query
    return `https://mubi.com/films?query=${q}`;
  }
  if (name.includes('kanopy')) {
    // Kanopy utilise query
    return `https://www.kanopy.com/search?query=${q}`;
  }
  if (name.includes('hoopla')) {
    // Hoopla utilise q
    return `https://www.hoopladigital.com/search?q=${q}`;
  }

  // Ne plus utiliser le fallback vers TMDB provider page
  // Aller directement vers la logique de recherche par domaine ou Google search

  // If we know a likely domain for the provider, do a site: Google search
  const domainMap = {
    'crunchyroll': 'crunchyroll.com',
    'netflix': 'netflix.com',
    'prime video': 'primevideo.com',
    'amazon prime': 'primevideo.com',
    'hulu': 'hulu.com',
    'funimation': 'crunchyroll.com',
    'disney+': 'disneyplus.com',
    'disney plus': 'disneyplus.com',
    'adn': 'animationdigitalnetwork.com',
    'anime digital network': 'animationdigitalnetwork.com',
    'animation digital network': 'animationdigitalnetwork.com',
    'animedigitalnetwork': 'animationdigitalnetwork.com',
    'animationdigitalnetwork': 'animationdigitalnetwork.com',
    'wakanim': 'wakanim.tv',
    'hidive': 'hidive.com',
    'hbo max': 'play.max.com',
    'max': 'play.max.com',
    'paramount+': 'paramountplus.com',
    'paramount plus': 'paramountplus.com',
    'apple tv+': 'tv.apple.com',
    'appletv': 'tv.apple.com',
    'peacock': 'peacocktv.com',
    'starz': 'starz.com',
    'showtime': 'showtime.com',
    'espn+': 'plus.espn.com',
    'espn plus': 'plus.espn.com',
    'discovery+': 'discoveryplus.com',
    'discovery plus': 'discoveryplus.com',
    'vudu': 'vudu.com',
    'tubi': 'tubitv.com',
    'youtube tv': 'tv.youtube.com',
    'pluto tv': 'pluto.tv',
    'freevee': 'amazon.com',
    'imdb tv': 'amazon.com',
    'roku': 'therokuchannel.roku.com',
    'viki': 'viki.com',
    'iqiyi': 'iq.com',
    'wetv': 'wetv.vip',
    'mubi': 'mubi.com',
    'kanopy': 'kanopy.com',
    'hoopla': 'hoopladigital.com'
  };

  for (const key of Object.keys(domainMap)) {
    if (name.includes(key)) {
      return `https://www.google.com/search?q=site:${domainMap[key]}+${q}`;
    }
  }

  // Last resort: generic google search for title + provider name
  const providerName = (provider && provider.provider_name) || (provider && provider.normalized_name) || name || '';
  return `https://www.google.com/search?q=${q}+${encodeURIComponent(providerName)}`;
}

export default buildProviderHref;
