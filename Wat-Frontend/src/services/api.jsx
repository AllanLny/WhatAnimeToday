import { useQuery } from '@tanstack/react-query';
import { useUserContext } from '../context/UserContext';

// Configuration de l'API backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Fonction auxiliaire pour construire les URLs du backend
function buildBackendUrl(endpoint, params = {}) {
  const url = new URL(`${BACKEND_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

// Fonction helper pour générer les informations de streaming
function generateStreamingInfo(anime, country) {
  const title = anime.attributes?.titles?.en || anime.title || 'Unknown';
  
  return {
    crunchyroll: {
      available: true, // Crunchyroll a la plupart des animes
      url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`
    },
    netflix: {
      available: Math.random() > 0.6, // Simulation aléatoire
      url: `https://www.netflix.com/search?q=${encodeURIComponent(title)}`
    },
    'prime video': {
      available: Math.random() > 0.7,
      url: `https://www.primevideo.com/search/ref=atv_nb_sr?query=${encodeURIComponent(title)}`
    },
    'disney+': {
      available: Math.random() > 0.8,
      url: `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`
    },
    funimation: {
      available: country === 'US' && Math.random() > 0.7,
      url: `https://www.funimation.com/search/?q=${encodeURIComponent(title)}`
    },
    adn: {
      available: country === 'FR' && Math.random() > 0.5,
      url: `https://animationdigitalnetwork.fr/recherche?q=${encodeURIComponent(title)}`
    },
    wakanim: {
      available: country === 'FR' && Math.random() > 0.8,
      url: `https://www.wakanim.tv/fr/v2/search?q=${encodeURIComponent(title)}`
    },
    hulu: {
      available: country === 'US' && Math.random() > 0.6,
      url: `https://www.hulu.com/search?q=${encodeURIComponent(title)}`
    },
    'hbo max': {
      available: country === 'US' && Math.random() > 0.8,
      url: `https://www.hbomax.com/search?q=${encodeURIComponent(title)}`
    },
    'paramount+': {
      available: Math.random() > 0.9,
      url: `https://www.paramountplus.com/search?query=${encodeURIComponent(title)}`
    },
    'apple tv+': {
      available: Math.random() > 0.9,
      url: `https://tv.apple.com/search?term=${encodeURIComponent(title)}`
    },
    peacock: {
      available: country === 'US' && Math.random() > 0.85,
      url: `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`
    },
    hidive: {
      available: Math.random() > 0.8,
      url: `https://www.hidive.com/search?q=${encodeURIComponent(title)}`
    },
    aniplus: {
      available: (country === 'KR' || country === 'JP') && Math.random() > 0.7,
      url: `https://www.aniplus-asia.com/search?q=${encodeURIComponent(title)}`
    }
  };
}

// Fonction pour organiser les animes par jour de la semaine (Jikan API via backend)
function organizaByWeekDay(animes, country = 'FR') {
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
        images: {
          jpg: {
            image_url: anime.images?.jpg?.large_image_url || 
                      anime.images?.jpg?.image_url || 
                      'https://via.placeholder.com/500x750?text=No+Image'
          }
        },
        score: anime.score || 0,
        year: anime.year || new Date().getFullYear(),
        first_air_date: anime.aired?.from,
        origin_country: ['JP'],
        popularity: anime.popularity || 0,
        status: anime.status,
        episode_count: anime.episodes,
        streamingInfo: generateStreamingInfo({ title: anime.title }, country)
      };
      
      weekDays[dayName].push(formattedAnime);
    }
  });

  return weekDays;
}

// Hook pour les sorties du jour (utilise le backend avec Kitsu API)
export const useTodayReleases = () => {
  const { country } = useUserContext?.() || { country: 'FR' };
  
  return useQuery({
    queryKey: ['todayReleases', country],
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
        
        console.log('📊 Données brutes du backend:', data);
        
        // Les données viennent maintenant de Jikan (via le backend) et sont déjà au bon format
        const animesArray = data.data.data || []; // data.data.data car le backend structure ses réponses comme {success, data: jikanResponse}
        
        console.log('🎌 Animes bruts depuis Jikan:', animesArray);
        
        // Adapter le format Jikan API (qui est déjà au bon format) avec streamingInfo
        const formattedData = animesArray.map(anime => {
          console.log('📝 Anime individuel:', anime);
          
          // Générer les infos de streaming
          const streamingInfo = generateStreamingInfo({ attributes: { titles: { en: anime.title } } }, country);
          
          // Convertir streamingInfo en array pour AnimeCard
          const streamingArray = Object.entries(streamingInfo)
            .filter(([, info]) => info.available)
            .map(([platform, info]) => ({
              name: platform,
              url: info.url,
              logo: platform // Le composant PlatformLogo utilisera ce nom
            }));
          
          const formattedAnime = {
            mal_id: anime.mal_id,
            title: anime.title || anime.title_english || 'Titre non disponible',
            synopsis: anime.synopsis || 'Aucune description disponible',
            images: {
              jpg: {
                image_url: anime.images?.jpg?.large_image_url || 
                          anime.images?.jpg?.image_url || 
                          'https://via.placeholder.com/500x750?text=No+Image'
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
            streaming: streamingArray, // Array des plateformes disponibles
            streamingInfo: streamingInfo // Garde aussi l'objet complet pour compatibilité
          };
          
          console.log('✅ Anime formaté:', formattedAnime);
          return formattedAnime;
        });
        
        console.log('📋 Total des animes formatés:', formattedData.length);
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
export const useWeeklyReleases = () => {
  const { country } = useUserContext?.() || { country: 'FR' };
  
  return useQuery({
    queryKey: ['weeklyReleases', country],
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
export const useStreamingInfo = (animeId, country = 'FR') => {
  return useQuery({
    queryKey: ['streamingInfo', animeId, country],
    queryFn: () => {
      return {
        availableOn: ['Crunchyroll', 'Netflix'],
        country: country
      };
    }
  });
};

// 📊 Hook pour récupérer les statistiques globales
export const useGlobalStats = (country = 'FR') => {
  return useQuery({
    queryKey: ['globalStats', country],
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