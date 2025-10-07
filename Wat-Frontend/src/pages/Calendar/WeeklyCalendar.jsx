import { useState } from 'react';
import { useUserContext } from '../../context/UserContext';
import { useWeeklyReleases, useStreamingInfo } from '../../services/api';
import { PlatformLogo } from '../../components/Common';
import './WeeklyCalendar.scss';
// ...existing imports...

// Small helper to render streaming platforms for a given anime using backend data
const WeeklyStreamingPlatforms = ({ anime }) => {
  const { country } = useUserContext();
  const animeId = anime.title || anime.canonicalTitle || anime.mal_id || anime.id || anime.slug;
  const { data: platforms = [], isLoading } = useStreamingInfo(animeId, country);
  if (isLoading) return null;
  if (!platforms || platforms.length === 0) return null;

  return (
    <>
      {platforms.slice(0, 4).map((p, i) => (
        <PlatformLogo key={i} platform={p.normalized_name || p.provider_name} size="small" />
      ))}
      {platforms.length > 4 && <span className="more-platforms">+{platforms.length - 4}</span>}
    </>
  );
};

function WeeklyCalendar() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const { country } = useUserContext();
  
  // Utilisation du hook TanStack Query pour récupérer le calendrier hebdomadaire
  const { 
    data: weeklyData,
    isLoading,
    isError,
    error
  } = useWeeklyReleases();
  
  // Construction du calendrier avec les informations de streaming
  // Avec TanStack Query, les données de streaming sont déjà incluses
  if (isLoading) return <div className="loading-spinner">Chargement du calendrier...</div>;
  if (isError) return <div className="error-message">{error?.message || "Erreur lors de la récupération du calendrier. Veuillez réessayer plus tard."}</div>;

  // Les données sont disponibles
  const weeklySchedule = weeklyData || {
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: []
  };

  // Jours de la semaine en français
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const daysLower = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Jour actuel pour le mettre en évidence
  const currentDay = new Date().getDay();
  
  // Fonction pour gérer le clic sur un anime
  const handleAnimeClick = (anime) => {
    // Déterminer la plateforme préférée parmi celles disponibles
    const availablePlatforms = Object.entries(anime.streamingInfo || {})
      .filter(([, info]) => info.available)
      .map(([platform]) => platform);
    
    if (availablePlatforms.length === 0) return;
    
    // Si un filtre de plateforme est actif et que l'anime est disponible sur cette plateforme
    if (selectedPlatform !== 'all' && anime.streamingInfo?.[selectedPlatform]?.available) {
      window.open(anime.streamingInfo[selectedPlatform].url, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Ordre de préférence: la plateforme sélectionnée, puis Crunchyroll, Netflix, ADN, Prime Video, Disney+
    const priorityOrder = ['crunchyroll', 'netflix', 'adn', 'prime video', 'disney plus'];
    
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
          
          <button 
            className={selectedPlatform === 'disney plus' ? 'active' : ''} 
            onClick={() => setSelectedPlatform('disney plus')}
          >
            <PlatformLogo platform="disney plus" size="small" /> Disney+
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
                    key={anime.occurrenceId || anime.mal_id} 
                    className="calendar-anime-card"
                    onClick={() => handleAnimeClick(anime)}
                  >
                      <picture>
                        {anime.images?.webp?.image_url && (
                          <source srcSet={anime.images.webp.image_url} type="image/webp" />
                        )}
                        {anime.images?.jpg?.image_url && (
                          <source srcSet={anime.images.jpg.image_url} type="image/jpeg" />
                        )}
                        <img
                          src={anime.images?.webp?.image_url || anime.images?.jpg?.image_url || '/placeholder-anime.jpg'}
                          alt={anime.title}
                          className="calendar-anime-image"
                          loading="lazy"
                          width="160"
                          height="240"
                        />
                      </picture>
                    <div className="calendar-anime-info">
                      <h3>{anime.title}</h3>
                      <p>Épisode: {anime.broadcast?.string || 'Horaire non précisé'}</p>
                      <div className="available-platforms">
                        <WeeklyStreamingPlatforms anime={anime} />
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
