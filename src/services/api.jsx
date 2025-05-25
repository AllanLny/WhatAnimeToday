// Utilisation des variables d'environnement
const API_URLS = {
  JIKAN: import.meta.env.VITE_JIKAN_API_URL,
  TMDB: import.meta.env.VITE_TMDB_API_URL,
};

// Clé API pour TMDB récupérée depuis les variables d'environnement
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Récupérer les anime en cours avec filtre par saison
export const getSeasonalAnime = async (season, year) => {
  try {
    const response = await fetch(`${API_URLS.JIKAN}/seasons/${year}/${season}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des animes saisonniers:', error);
    throw error;
  }
};

// Récupérer les sorties du jour
export const getTodayReleases = async () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  try {
    const response = await fetch(`${API_URLS.JIKAN}/schedules?filter=${getDayName(dayOfWeek)}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des sorties du jour:', error);
    throw error;
  }
};

// Récupérer les informations de disponibilité sur les plateformes
export const getStreamingInfo = async (animeId) => {
  // Cette fonction est à implémenter avec une API comme WatchMode
  // Pour l'exemple, on retourne des données fictives
  return {
    netflix: true,
    crunchyroll: true,
    'disney+': false,
    'amazon prime': true
  };
};

// Fonction auxiliaire pour obtenir le nom du jour en anglais
const getDayName = (dayIndex) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
};

export default {
  getSeasonalAnime,
  getTodayReleases,
  getStreamingInfo
};