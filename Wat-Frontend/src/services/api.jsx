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
            streamingInfo: generateStreamingInfo({ attributes: { titles: { en: anime.title } } }, country)
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