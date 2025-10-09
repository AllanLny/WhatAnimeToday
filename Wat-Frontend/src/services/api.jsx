import { useQuery } from '@tanstack/react-query';
import { useUserContext } from '../context/UserContext';

// Configuration de l'API backend
// Par défaut utiliser des URL relatives pour profiter du proxy Vite (/api -> backend)
// Si VITE_BACKEND_URL est défini, l'utiliser (utile en production ou debug)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Fonction auxiliaire pour construire les URLs du backend
function buildBackendUrl(endpoint, params = {}) {
  // If BACKEND_URL is empty, use relative path so Vite dev server proxy handles it
  const base = BACKEND_URL || window.location.origin;
  const url = new URL(`${base}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  // If BACKEND_URL was empty, return the relative path instead of absolute origin to let Vite proxy work
  if (!BACKEND_URL) {
    const relative = endpoint + (Object.keys(params).length ? `?${url.searchParams.toString()}` : '');
    return relative;
  }
  return url.toString();
}

// Fonction helper pour générer les informations de streaming
// Streaming availability is now fetched from backend; local simulator removed.

// Fonction pour organiser les animes par jour de la semaine (Jikan API via backend)
function organizaByWeekDay(animes) {
  const weekDays = {
    'monday': [],
    'tuesday': [],
    'wednesday': [],
    'thursday': [],
    'friday': [],
    'saturday': [],
    'sunday': []
  };

  animes.forEach(anime => {
    // Pour Jikan, utiliser les données de broadcast pour déterminer le jour
    const broadcast = anime.broadcast || {};
    const dayName = broadcast.day?.toLowerCase();
    
    if (dayName && weekDays[dayName]) {
      const formattedAnime = {
        mal_id: anime.mal_id,
        title: anime.title || anime.title_english || 'Titre non disponible',
        synopsis: anime.synopsis || 'Aucune description disponible',
        // Preserve both webp and jpg variants returned by the backend (Jikan)
        images: {
          webp: {
            large_image_url: anime.images?.webp?.large_image_url || null,
            small_image_url: anime.images?.webp?.small_image_url || null,
            image_url: anime.images?.webp?.image_url || null
          },
          jpg: {
            large_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
            small_image_url: anime.images?.jpg?.small_image_url || null,
            image_url: anime.images?.jpg?.image_url || null
          }
        },
        score: anime.score || 0,
        year: anime.year || new Date().getFullYear(),
        first_air_date: anime.aired?.from,
        origin_country: ['JP'],
        popularity: anime.popularity || 0,
        status: anime.status,
        episode_count: anime.episodes,
        // streamingInfo now provided by backend per-anime; leave empty here
        streamingInfo: {}
      };
      
      weekDays[dayName].push(formattedAnime);
    }
  });

  return weekDays;
}

// Hook pour les sorties du jour (utilise le backend avec Kitsu API)
export const useTodayReleases = (options = {}) => {
  const { country } = useUserContext?.() || { country: 'FR' };
  const enabled = options.enabled ?? true;
  
  return useQuery({
    queryKey: ['todayReleases', country],
    enabled,
    queryFn: async () => {
      try {
        const url = buildBackendUrl('/api/anime/today', { country });
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Erreur lors de la récupération des données');
        }
        
  if (import.meta.env.DEV) console.log('📊 Données brutes du backend:', data);
        
        // Les données viennent maintenant de Jikan (via le backend) et sont déjà au bon format
        const animesArray = data.data.data || []; // data.data.data car le backend structure ses réponses comme {success, data: jikanResponse}
        
  if (import.meta.env.DEV) console.log('🎌 Animes bruts depuis Jikan:', animesArray);
        
        // Adapter le format Jikan API (qui est déjà au bon format) avec streamingInfo
  const formattedData = animesArray.map(anime => {
          if (import.meta.env.DEV) console.log('📝 Anime individuel:', anime);
          
          // Streaming handled by backend; do not simulate here
          const streamingArray = [];
          const streamingInfo = {};
          
          const formattedAnime = {
            mal_id: anime.mal_id,
            // Keep both title and title_english if provided by backend
            title: anime.title || anime.title_english || 'Titre non disponible',
            title_english: anime.title_english || null,
            titles: anime.titles || [],
            // Provide localized descriptions if backend enriched them
            description_en: anime.description_en || null,
            description_fr: anime.description_fr || null,
            synopsis: anime.synopsis || anime.description_en || anime.description_fr || 'Aucune description disponible',
            // Preserve webp + jpg variants for the card component to choose from
            images: {
              webp: {
                large_image_url: anime.images?.webp?.large_image_url || null,
                small_image_url: anime.images?.webp?.small_image_url || null,
                image_url: anime.images?.webp?.image_url || null
              },
              jpg: {
                large_image_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
                small_image_url: anime.images?.jpg?.small_image_url || null,
                image_url: anime.images?.jpg?.image_url || null
              }
            },
            score: anime.score || 0,
            year: anime.year || new Date().getFullYear(),
            first_air_date: anime.aired?.from,
            origin_country: ['JP'], // Les données Jikan sont principalement japonaises
            popularity: anime.popularity || 0,
            status: anime.status,
            episode_count: anime.episodes,
            episodes: anime.episodes,
            genres: anime.genres || [],
            broadcast: anime.broadcast || {},
            streaming: streamingArray, // Array des plateformes disponibles (fetched from backend)
            streamingInfo: streamingInfo // Garde aussi l'objet complet pour compatibilité
          };
          
            if (import.meta.env.DEV) console.log('✅ Anime formaté:', formattedAnime);
          return formattedAnime;
        });
        
  if (import.meta.env.DEV) console.log('📋 Total des animes formatés:', formattedData.length);
        return formattedData;
        
      } catch (error) {
        console.error('Erreur lors de la récupération des sorties du jour:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 heures
    cacheTime: 1000 * 60 * 60 * 24, // 24 heures
  });
};

// Hook pour le calendrier hebdomadaire (utilise le backend avec Kitsu API)
export const useWeeklyReleases = (options = {}) => {
  const { country } = useUserContext?.() || { country: 'FR' };
  const enabled = options.enabled ?? true;
  
  return useQuery({
    queryKey: ['weeklyReleases', country],
    enabled,
    queryFn: async () => {
      try {
        const url = buildBackendUrl('/api/anime/weekly', { country });
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Erreur lors de la récupération du calendrier');
        }
        
        // Pour le calendrier, on organise les données Jikan par jour de la semaine
        const weeklyData = organizaByWeekDay(data.data.data || [], country);
        
        return weeklyData;
        
      } catch (error) {
        console.error('Erreur lors de la récupération du calendrier:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 heures
    cacheTime: 1000 * 60 * 60 * 24, // 24 heures
  });
};

// Hook pour les informations de streaming (fonction legacy)
export const useStreamingInfo = (animeId, country = 'FR', options = {}) => {
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: ['animePlatforms', animeId, country],
    queryFn: async () => {
      try {
        if (!animeId) return [];
        const path = `/api/anime/anime/${encodeURIComponent(animeId)}/platforms`;
        const url = buildBackendUrl(path, { country });
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!data || !data.platforms || !data.platforms.data) return [];
        return data.platforms.data;
      } catch (e) {
        console.error('Erreur fetching anime platforms:', e);
        return [];
      }
    },
    enabled,
    staleTime: 1000 * 60 * 60, // 1 heure
    cacheTime: 1000 * 60 * 60 * 6, // 6 heures
    retry: 1
  });
};

// New hook: fetch streaming platforms by TMDB id (preferred flow)
export const useStreamingByTmdb = (tmdbId, country = 'FR', options = {}) => {
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: ['animePlatformsByTmdb', tmdbId, country],
    enabled: enabled && !!tmdbId,
    queryFn: async () => {
      try {
        if (!tmdbId) return [];
        const path = `/api/anime/tmdb/${encodeURIComponent(tmdbId)}/platforms`;
        const url = buildBackendUrl(path, { country });
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!data || !data.platforms || !data.platforms.data) return [];
        return data.platforms.data;
      } catch (e) {
        console.error('Erreur fetching anime platforms by TMDB id:', e);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 heure
    cacheTime: 1000 * 60 * 60 * 6, // 6 heures
    retry: 1
  });
};

// Hook: resolve a title -> TMDB id using backend resolver
export const useResolveTmdb = (title, year = null, country = 'FR', options = {}) => {
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: ['resolveTmdb', title, year, country],
    enabled: enabled && !!title,
    queryFn: async () => {
      try {
        const params = {};
        params.q = title;
        if (year) params.year = year;
        params.country = country;
        const url = buildBackendUrl('/api/anime/tmdb/resolve', params);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        // backend: returns out.data.best
        const best = json.data?.best || json.best || null;
        return best && best.id ? String(best.id) : null;
      } catch (e) {
        console.error('Erreur resolving tmdb id:', e);
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // 1h
    cacheTime: 1000 * 60 * 60 * 6,
    retry: 1
  });
};

// 📊 Hook pour récupérer les statistiques globales
export const useGlobalStats = (country = 'FR', options = {}) => {
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: ['globalStats', country],
    enabled,
    queryFn: async () => {
      try {
        // Appel vers notre backend pour récupérer les statistiques
        const response = await fetch(buildBackendUrl('/api/anime/stats', { country }));
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 Réponse backend stats:', result);
        
        // Le backend retourne soit data.data soit directement data selon l'endpoint
        const data = result.data || result;
        
        return {
          todayReleases: data.todayReleases || 0,
          totalAnimes: data.totalAnimes || 0,
          activeWeek: data.activeWeek || 0, // Animes avec nouveaux épisodes cette semaine
          totalEpisodes: data.totalEpisodes || 0, // Episodes sortis ce mois
          apiStatus: data.apiStatus || 'OK', // État de l'API
          success: data.success !== false // Par défaut true sauf si explicitement false
        };
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        
        // Fallback avec des données simulées réalistes basées sur le pays
        const countryMultiplier = {
          'FR': { base: 1.0, episodes: 850 },
          'US': { base: 1.3, episodes: 1100 },
          'JP': { base: 1.5, episodes: 1300 },
          'UK': { base: 0.9, episodes: 750 },
          'DE': { base: 0.8, episodes: 680 },
          'ES': { base: 0.7, episodes: 600 },
          'IT': { base: 0.6, episodes: 520 }
        };
        
        const multiplier = countryMultiplier[country] || countryMultiplier['FR'];
        
        return {
          todayReleases: Math.floor((Math.random() * 15 + 5) * multiplier.base), // 5-20 animes par jour
          totalAnimes: Math.floor((1247 + Math.random() * 100) * multiplier.base), // Base + variation
          activeWeek: Math.floor((Math.random() * 80 + 40) * multiplier.base), // 40-120 animes actifs par semaine  
          totalEpisodes: Math.floor(multiplier.episodes + Math.random() * 200), // Episodes par mois avec variation
          apiStatus: 'ERROR', // API en erreur, données de fallback
          success: false
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - les stats ne changent pas souvent
    cacheTime: 30 * 60 * 1000, // 30 minutes en cache
    refetchOnWindowFocus: false, // Pas besoin de refetch au focus
    retry: 2
  });
};

// Export des anciennes fonctions pour compatibilité (deprecated)
export const getTodayReleases = async () => {
  console.warn('getTodayReleases est deprecated, utilisez useTodayReleases hook');
  return [];
};

export const getWeeklyReleases = async () => {
  console.warn('getWeeklyReleases est deprecated, utilisez useWeeklyReleases hook');
  return {};
};

export const getStreamingInfo = async () => {
  console.warn('getStreamingInfo est deprecated, utilisez useStreamingInfo hook');
  return { availableOn: [] };
};