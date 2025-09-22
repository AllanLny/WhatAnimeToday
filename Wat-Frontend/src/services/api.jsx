import { useQuery } from '@tanstack/react-query';
import { useUserContext } from '../context/UserContext';

// Utilisation des variables d'environnement TMDB uniquement
const API_URL = import.meta.env.VITE_TMDB_API_URL || 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

// Fonction auxiliaire pour ajouter la clé API aux URLs
function addApiKey(url) {
  return `${url}${url.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
}

// Hooks pour TanStack Query
// ========================

// Hook pour les animes saisonniers
export const useSeasonalAnime = (season, year) => {
  return useQuery({
    queryKey: ['seasonalAnime', season, year],
    queryFn: () => getSeasonalAnime(season, year),
  });
};

// Hook pour les sorties du jour avec streaming info
export const useTodayReleases = () => {
  const { country } = useUserContext?.() || { country: 'France' };
  
  return useQuery({
    queryKey: ['todayReleases', country],
    queryFn: async () => {
      // Récupérer les sorties du jour
      const releases = await getTodayReleases();
      
      // Pour chaque anime, récupérer ses plateformes de diffusion
      const releasesWithStreaming = await Promise.all(
        releases.map(async (anime) => {
          const streamingInfo = await getStreamingInfo(anime.mal_id, country);
          return { ...anime, streamingInfo };
        })
      );
      
      return releasesWithStreaming;
    },
  });
};

// Hook pour le calendrier hebdomadaire avec streaming info
export const useWeeklyReleases = () => {
  const { country } = useUserContext?.() || { country: 'France' };
  
  return useQuery({
    queryKey: ['weeklyReleases', country],
    queryFn: async () => {
      // Récupérer les données brutes du calendrier
      const weeklyData = await getWeeklyReleases();
      
      // Traiter chaque jour pour ajouter les informations de streaming
      const processedData = {};
      
      for (const day of Object.keys(weeklyData)) {
        // Limiter à 10 animes par jour pour éviter trop de requêtes API
        const limitedAnimes = weeklyData[day].slice(0, 10);
        const animesWithStreaming = [];
        
        // Récupérer les infos de streaming pour chaque anime
        for (let i = 0; i < limitedAnimes.length; i++) {
          const anime = limitedAnimes[i];
          try {
            const streamingInfo = await getStreamingInfo(anime.mal_id, country);
            animesWithStreaming.push({
              ...anime,
              streamingInfo,
              occurrenceId: `${anime.mal_id}_${i}_${day}`
            });
          } catch (err) {
            console.error(`Erreur streaming info pour ${anime.title}:`, err);
            // Continuer avec les autres animes même si un échoue
            animesWithStreaming.push({
              ...anime,
              streamingInfo: {},
              occurrenceId: `${anime.mal_id}_${i}_${day}`
            });
          }
        }
        
        processedData[day] = animesWithStreaming;
      }
      
      return processedData;
    },
  });
};

// Hook pour les informations de streaming
export const useStreamingInfo = (animeId, country = 'France') => {
  return useQuery({
    queryKey: ['streamingInfo', animeId, country],
    queryFn: () => getStreamingInfo(animeId, country),
  });
}

// Récupérer les anime en cours avec filtre par saison
export const getSeasonalAnime = async (season, year) => {
  try {
    // Conversion de la saison au format TMDB
    const airDateGte = getSeasonStartDate(season, year);
    const airDateLte = getSeasonEndDate(season, year);

    // Récupérer les séries d'animation japonaise diffusées pendant cette saison
    const url = addApiKey(`${API_URL}/discover/tv?include_adult=false&language=fr-FR&sort_by=popularity.desc&with_genres=16&with_origin_country=JP&air_date.gte=${airDateGte}&air_date.lte=${airDateLte}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.status_message || "Erreur lors de la récupération des données");
    }
    
    // Adapter le format des données pour correspondre à l'ancienne structure
    return data.results.map(show => ({
      mal_id: show.id,
      title: show.name,
      synopsis: show.overview,
      images: {
        jpg: {
          image_url: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'
        }
      },
      score: show.vote_average,
      year: parseInt(show.first_air_date?.split('-')[0]) || year
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des animes saisonniers:', error);
    throw error;
  }
};

// Récupérer les sorties du jour
export const getTodayReleases = async () => {
  try {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Récupérer les séries d'animation japonaise diffusées aujourd'hui
    const url = addApiKey(`${API_URL}/discover/tv?include_adult=false&language=fr-FR&sort_by=popularity.desc&with_genres=16&with_origin_country=JP&air_date.gte=${formattedDate}&air_date.lte=${formattedDate}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.status_message || "Erreur lors de la récupération des données");
    }

    // Si pas assez de résultats pour aujourd'hui spécifiquement, récupérons les plus populaires récemment
    if (data.results.length < 5) {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const lastWeekDate = lastWeek.toISOString().split('T')[0];
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextWeekDate = nextWeek.toISOString().split('T')[0];
      
      const backupUrl = addApiKey(`${API_URL}/discover/tv?include_adult=false&language=fr-FR&sort_by=popularity.desc&with_genres=16&with_origin_country=JP&air_date.gte=${lastWeekDate}&air_date.lte=${nextWeekDate}`);
      
      const backupResponse = await fetch(backupUrl);
      const backupData = await backupResponse.json();
      
      if (backupResponse.ok) {
        return backupData.results.map(show => ({
          mal_id: show.id,
          title: show.name,
          synopsis: show.overview,
          images: {
            jpg: {
              image_url: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'
            }
          },
          broadcast: {
            string: `${getDayName(today.getDay())} à ${formatTime(show.first_air_date)}`
          }
        }));
      }
    }
    
    // Adapter le format des données pour correspondre à l'ancienne structure
    return data.results.map(show => ({
      mal_id: show.id,
      title: show.name,
      synopsis: show.overview,
      images: {
        jpg: {
          image_url: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'
        }
      },
      broadcast: {
        string: `${getDayName(today.getDay())} à ${formatTime(show.first_air_date)}`
      }
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des sorties du jour:', error);
    throw error;
  }
};

// Récupérer les animes pour le calendrier hebdomadaire
export const getWeeklyReleases = async () => {
  try {
    // Récupérer les 100 animes les plus populaires pour répartir sur la semaine
    const url = addApiKey(`${API_URL}/discover/tv?include_adult=false&language=fr-FR&sort_by=popularity.desc&with_genres=16&with_origin_country=JP&page=1&vote_count.gte=10`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.status_message || "Erreur lors de la récupération des données");
    }
    
    // Adapter le format des données et organiser par jour
    const weeklySchedule = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };
    
    // Répartir les animes sur les jours de la semaine
    // On utilise l'ID de l'anime pour déterminer le jour (pour avoir une répartition stable)
    data.results.forEach(show => {
      const dayIndex = show.id % 7;
      const day = Object.keys(weeklySchedule)[dayIndex];
      
      weeklySchedule[day].push({
        mal_id: show.id,
        title: show.name,
        synopsis: show.overview,
        images: {
          jpg: {
            image_url: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'
          }
        },
        broadcast: {
          string: `${getDayNameByIndex(dayIndex)} à ${formatTime(show.first_air_date)}`
        }
      });
    });
    
    return weeklySchedule;
  } catch (error) {
    console.error('Erreur lors de la récupération du calendrier hebdomadaire:', error);
    throw error;
  }
};

// Base URLs pour les plateformes de streaming par pays
const streamingPlatformUrls = {
  'France': {
    'netflix': 'https://www.netflix.com/fr/',
    'crunchyroll': 'https://www.crunchyroll.com/fr/',
    'adn': 'https://animedigitalnetwork.fr/',
    'prime video': 'https://www.primevideo.com/storefront/'
  },
  'Belgique': {
    'netflix': 'https://www.netflix.com/be-fr/',
    'crunchyroll': 'https://www.crunchyroll.com/fr/',
    'adn': 'https://animedigitalnetwork.fr/',
    'prime video': 'https://www.primevideo.com/storefront/'
  },
  'Suisse': {
    'netflix': 'https://www.netflix.com/ch-fr/',
    'crunchyroll': 'https://www.crunchyroll.com/fr/',
    'adn': 'https://animedigitalnetwork.fr/',
    'prime video': 'https://www.primevideo.com/storefront/'
  },
  'Canada': {
    'netflix': 'https://www.netflix.com/ca-fr/',
    'crunchyroll': 'https://www.crunchyroll.com/fr/',
    'adn': null, // Non disponible
    'prime video': 'https://www.primevideo.com/storefront/'
  },
  'default': {
    'netflix': 'https://www.netflix.com/',
    'crunchyroll': 'https://www.crunchyroll.com/',
    'adn': null,
    'prime video': 'https://www.primevideo.com/storefront/'
  }
};

// Correspondance des providers TMDB avec nos plateformes
const providerMapping = {
  8: 'netflix',       // Netflix
  283: 'crunchyroll', // Crunchyroll
  531: 'adn',         // ADN (Animation Digital Network)
  119: 'prime video', // Amazon Prime Video
};

// Récupérer les informations de disponibilité sur les plateformes avec les liens
export const getStreamingInfo = async (animeId, country = 'France') => {
  try {
    // Récupérer les informations de l'anime depuis TMDB
    const url = addApiKey(`${API_URL}/tv/${animeId}?language=fr-FR`);
    const response = await fetch(url);
    
    const animeData = await response.json();
    
    if (!response.ok) {
      throw new Error(animeData.status_message || "Erreur lors de la récupération des données");
    }

    // Récupérer les plateformes de streaming disponibles pour cet anime
    const providersUrl = addApiKey(`${API_URL}/tv/${animeId}/watch/providers`);
    const providersResponse = await fetch(providersUrl);
    
    const providersData = await providersResponse.json();
    
    // Obtenir les URLs de base pour le pays sélectionné
    const countryUrls = streamingPlatformUrls[country] || streamingPlatformUrls['default'];
    
    // Identifiants TMDB des pays
    const countryMapping = {
      'France': 'FR',
      'Belgique': 'BE',
      'Suisse': 'CH',
      'Canada': 'CA',
      'États-Unis': 'US',
      'Royaume-Uni': 'GB',
      'Japon': 'JP',
      'Allemagne': 'DE',
      'Espagne': 'ES',
      'Italie': 'IT'
    };
    
    const countryCode = countryMapping[country] || 'FR';
    
    // Extraire les plateformes disponibles dans le pays demandé
    const countryProviders = providersData.results?.[countryCode]?.flatrate || [];
    
    // Initialiser les informations de streaming avec toutes les plateformes à non disponibles
    const streamingInfo = {
      'netflix': {
        available: false,
        url: null
      },
      'crunchyroll': {
        available: false,
        url: null
      },
      'adn': {
        available: false,
        url: null
      },
      'prime video': {
        available: false,
        url: null
      }
    };
    
    // Mettre à jour les plateformes disponibles selon TMDB
    countryProviders.forEach(provider => {
      const platform = providerMapping[provider.provider_id];
      
      if (platform && countryUrls[platform]) {
        streamingInfo[platform] = {
          available: true,
          url: `${countryUrls[platform]}search?q=${encodeURIComponent(animeData.name)}`
        };
      }
    });
    
    // Si TMDB ne renvoie pas d'informations de fournisseur, simuler la disponibilité pour les tests
    if (countryProviders.length === 0) {
      // Simulation basée sur l'ID comme avant
      const idSum = animeId.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
      
      streamingInfo['netflix'].available = idSum % 2 === 0;
      streamingInfo['crunchyroll'].available = idSum % 3 !== 0;
      streamingInfo['adn'].available = idSum % 5 === 0 && countryUrls['adn'] !== null;
      streamingInfo['prime video'].available = idSum % 4 !== 0;
      
      // Ajouter les URLs pour les plateformes disponibles
      Object.entries(streamingInfo).forEach(([platform, info]) => {
        if (info.available && countryUrls[platform]) {
          streamingInfo[platform].url = `${countryUrls[platform]}search?q=${encodeURIComponent(animeData.name)}`;
        }
      });
    }
    
    return streamingInfo;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de streaming:', error);
    throw error;
  }
};

// Fonctions utilitaires
function getSeasonStartDate(season, year) {
  switch (season.toLowerCase()) {
    case 'winter': return `${year}-01-01`;
    case 'spring': return `${year}-04-01`;
    case 'summer': return `${year}-07-01`;
    case 'fall': return `${year}-10-01`;
    default: return `${year}-01-01`;
  }
}

function getSeasonEndDate(season, year) {
  switch (season.toLowerCase()) {
    case 'winter': return `${year}-03-31`;
    case 'spring': return `${year}-06-30`;
    case 'summer': return `${year}-09-30`;
    case 'fall': return `${year}-12-31`;
    default: return `${year}-12-31`;
  }
}

function getDayName(dayIndex) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayIndex];
}

function getDayNameByIndex(dayIndex) {
  return getDayName(dayIndex);
}

function formatTime(dateString) {
  if (!dateString) return "Heure inconnue";
  
  // Générer une heure aléatoire mais stable pour le même anime
  const hash = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hours = (hash % 24).toString().padStart(2, '0');
  const minutes = ((hash * 13) % 60).toString().padStart(2, '0');
  
  return `${hours}h${minutes}`;
}

export default {
  getSeasonalAnime,
  getTodayReleases,
  getWeeklyReleases,
  getStreamingInfo,
  useSeasonalAnime,
  useTodayReleases,
  useWeeklyReleases,
  useStreamingInfo
};