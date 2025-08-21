import { useState, useEffect } from 'react';
import { useUserContext } from '../../context/UserContext';
import { getStreamingInfo, getWeeklyReleases } from '../../services/api';
import PlatformLogo from '../../components/Common/PlatformLogo/PlatformLogo';
import './WeeklyCalendar.scss';

function WeeklyCalendar() {
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const { country } = useUserContext();
  
  useEffect(() => {
    const fetchWeeklySchedule = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données pour la semaine en utilisant notre nouvelle fonction TMDB
        const weeklyData = await getWeeklyReleases();
        
        if (!weeklyData) {
          throw new Error("Aucune donnée retournée par l'API");
        }
        
        // Traiter les données pour ajouter les informations de streaming
        const processedData = {};
        
        for (const day of Object.keys(weeklyData)) {
          // Création d'un tableau pour stocker les animes avec les informations de streaming
          const animesWithStreaming = [];
          
          // Limiter à 10 animes par jour pour éviter trop de requêtes API
          const limitedAnimes = weeklyData[day].slice(0, 10);
          
          for (let i = 0; i < limitedAnimes.length; i++) {
            const anime = limitedAnimes[i];
            try {
              // Récupérer les informations de streaming pour cet anime
              const streamingInfo = await getStreamingInfo(anime.mal_id, country);
              
              // Ajouter l'anime avec les informations de streaming et un identifiant unique
              animesWithStreaming.push({
                ...anime,
                streamingInfo,
                occurrenceId: `${anime.mal_id}_${i}_${day}`
              });
            } catch (err) {
              console.error(`Erreur lors de la récupération des infos de streaming pour ${anime.title}:`, err);
              // Continuer avec les autres animes même si un échoue
            }
          }
          
          processedData[day] = animesWithStreaming;
        }
        
        setWeeklySchedule(processedData);
        setError(null);
      } catch (err) {
        setError("Erreur lors de la récupération du calendrier. Veuillez réessayer plus tard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklySchedule();
  }, [country]);

  if (loading) return <div className="loading-spinner">Chargement du calendrier...</div>;
  if (error) return <div className="error-message">{error}</div>;

  // Jours de la semaine en français
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const daysLower = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Jour actuel pour le mettre en évidence
  const currentDay = new Date().getDay();
  
  // Fonction pour gérer le clic sur un anime
  const handleAnimeClick = (anime) => {
    // Déterminer la plateforme préférée parmi celles disponibles
    const availablePlatforms = Object.entries(anime.streamingInfo || {})
      .filter(([_, info]) => info.available)
      .map(([platform]) => platform);
    
    if (availablePlatforms.length === 0) return;
    
    // Si un filtre de plateforme est actif et que l'anime est disponible sur cette plateforme
    if (selectedPlatform !== 'all' && anime.streamingInfo?.[selectedPlatform]?.available) {
      window.open(anime.streamingInfo[selectedPlatform].url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Ordre de préférence: la plateforme sélectionnée, puis Crunchyroll, Netflix, ADN, Prime Video
    const priorityOrder = ['crunchyroll', 'netflix', 'adn', 'prime video'];
    
    // Trouver la première plateforme disponible selon l'ordre de priorité
    const platformToUse = priorityOrder.find(p => availablePlatforms.includes(p)) || availablePlatforms[0];
    
    if (platformToUse) {
      window.open(anime.streamingInfo[platformToUse].url, '_blank', 'noopener,noreferrer');
    }
  };

  // Filtrer les animes selon la plateforme sélectionnée
  const getFilteredAnimes = (animes) => {
    if (!animes) return [];
    if (selectedPlatform === 'all') return animes;
    
    return animes.filter(anime => anime.streamingInfo && anime.streamingInfo[selectedPlatform]?.available);
  };

  return (
    <div className="weekly-calendar">
      <h1>Calendrier des sorties de la semaine</h1>
      <p className="country-indicator">Pays sélectionné: <span>{country}</span></p>
      
      <div className="platform-filter">
        <span>Filtrer par plateforme:</span>
        <div className="filter-buttons">
          <button 
            className={selectedPlatform === 'all' ? 'active' : ''} 
            onClick={() => setSelectedPlatform('all')}
          >
            Toutes
          </button>
          
          <button 
            className={selectedPlatform === 'netflix' ? 'active' : ''} 
            onClick={() => setSelectedPlatform('netflix')}
          >
            <PlatformLogo platform="netflix" size="small" /> Netflix
          </button>
          
          <button 
            className={selectedPlatform === 'crunchyroll' ? 'active' : ''} 
            onClick={() => setSelectedPlatform('crunchyroll')}
          >
            <PlatformLogo platform="crunchyroll" size="small" /> Crunchyroll
          </button>
          
          <button 
            className={selectedPlatform === 'adn' ? 'active' : ''} 
            onClick={() => setSelectedPlatform('adn')}
          >
            <PlatformLogo platform="adn" size="small" /> ADN
          </button>
          
          <button 
            className={selectedPlatform === 'prime video' ? 'active' : ''} 
            onClick={() => setSelectedPlatform('prime video')}
          >
            <PlatformLogo platform="prime video" size="small" /> Prime Video
          </button>
        </div>
      </div>
      
      <div className="calendar-grid">
        {days.map((day, index) => {
          const dayLower = daysLower[index];
          const dayAnimes = getFilteredAnimes(weeklySchedule[dayLower]);
          
          return (
            <div 
              key={day} 
              className={`day-column ${index === currentDay ? 'current-day' : ''}`}
            >
              <h2>{day}</h2>
              <div className="anime-list">
                {dayAnimes && dayAnimes.length > 0 ? dayAnimes.map(anime => (
                  <div 
                    key={anime.occurrenceId} 
                    className="calendar-anime-card"
                    onClick={() => handleAnimeClick(anime)}
                  >
                    <img 
                      src={anime.images.jpg.image_url} 
                      alt={anime.title} 
                      className="calendar-anime-image" 
                    />
                    <div className="calendar-anime-info">
                      <h3>{anime.title}</h3>
                      <p>Épisode: {anime.broadcast?.string || 'Horaire non précisé'}</p>
                      <div className="available-platforms">
                        {Object.entries(anime.streamingInfo || {})
                          .filter(([_, info]) => info.available)
                          .map(([platform]) => (
                            <PlatformLogo key={platform} platform={platform} size="small" />
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="no-anime-message">Aucune sortie {selectedPlatform !== 'all' ? `sur ${selectedPlatform}` : ''}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeeklyCalendar;