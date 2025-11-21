// Utility to build provider/platform links for an anime
// Input: provider (object or string), title (string), country (e.g. 'FR')
// Returns an href string (may be external)

export function buildProviderHref(provider, title = '', country = 'FR') {
  const q = encodeURIComponent(title || '');
  // provider may be a string name or an object with normalized_name/provider_name/name/link/provider_id
  const raw = typeof provider === 'string' ? provider : (provider.normalized_name || provider.provider_name || provider.name || '');
  const name = (raw || '').toString().toLowerCase();

  // prefer explicit link/url if provided
  if (provider && typeof provider === 'object') {
    if (provider.link) return provider.link;
    if (provider.url) return provider.url;
  }

  // mapping for known providers
  if (name.includes('crunchy')) {
    // User requested Crunchyroll FR format like:
    // https://www.crunchyroll.com/fr/search?from=search&q=Shabake
    if (country === 'FR') return `https://www.crunchyroll.com/fr/search?from=search&q=${q}`;
    return `https://www.crunchyroll.com/search?from=search&q=${q}`;
  }
  if (name.includes('netflix')) return `https://www.netflix.com/search?q=${q}`;
  if (name.includes('prime') || name.includes('amazon')) return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`;
  if (name.includes('disney')) return `https://www.disneyplus.com/search?q=${q}`;
  if (name.includes('hulu')) return `https://www.hulu.com/search?q=${q}`;
  if (name.includes('funimation')) return `https://www.funimation.com/search/?q=${q}`;
  if (name.includes('adn') || name.includes('anime-digital-network') || name.includes('animedigitalnetwork')) return `https://www.adnanime.com/recherche/?q=${q}`;
  if (name.includes('hidive')) return `https://www.hidive.com/search?q=${q}`;
  if (name.includes('hbo')) return `https://www.hbomax.com/search?q=${q}`;
  if (name.includes('paramount')) return `https://www.paramountplus.com/search/?q=${q}`;
  if (name.includes('apple')) return `https://tv.apple.com/search?term=${q}`;

  // If we have a provider_id (from TMDB), fallback to its provider page
  if (provider && typeof provider === 'object' && provider.provider_id) {
    return `https://www.themoviedb.org/provider/${provider.provider_id}`;
  }

  // If we know a likely domain for the provider, do a site: Google search
  const domainMap = {
    'crunchyroll': 'crunchyroll.com',
    'netflix': 'netflix.com',
    'prime video': 'primevideo.com',
    'hulu': 'hulu.com',
    'funimation': 'funimation.com',
    'disney+': 'disneyplus.com',
    'disney plus': 'disneyplus.com',
    'adn': 'adnanime.com',
    'hidive': 'hidive.com',
    'hbo max': 'hbomax.com',
    'paramount+': 'paramountplus.com',
    'apple tv+': 'tv.apple.com',
    'appletv': 'tv.apple.com'
  };

  for (const key of Object.keys(domainMap)) {
    if (name.includes(key)) {
      return `https://www.google.com/search?q=site:${domainMap[key]}+${q}`;
    }
  }

  // Last resort: generic google search for title + provider name
  const providerName = (provider && provider.provider_name) || (provider && provider.normalized_name) || name || '';
  return provider && provider.link ? provider.link : `https://www.google.com/search?q=${q}+${encodeURIComponent(providerName)}`;
}

export default buildProviderHref;
