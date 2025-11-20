import { useState } from 'react';
import { useWATTranslation } from '../../hooks/useWATTranslation';
import { useUserContext } from '../../context/UserContext';
import { useWeeklyReleases, useStreamingInfo } from '../../services/api';
import { PlatformLogo, CountrySelector } from '../../components/Common';
import './WeeklyCalendar.scss';


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
        <a key={i} href={p.link || (`https://www.themoviedb.org/provider/${p.provider_id}`)} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()}>
          <PlatformLogo platform={p.normalized_name || p.provider_name} size="small" />
        </a>
      ))}
      {platforms.length > 4 && <span className="more-platforms">+{platforms.length - 4}</span>}
    </>
  );
};

// List of platforms to show in the filter bar (order matters for UX)
const CONFIGURED_PLATFORMS = [
  'all',
  'netflix',
  'crunchyroll',
  'adn',
  'prime video',
  'disney+',
  'hidive',
  'hbo max',
  'paramount+',
  'apple tv',
  'funimation',
  'hulu'
];

// Normalize platform names for comparison (should match PlatformLogo heuristics)
const normalizePlatform = (raw) => {
  if (!raw) return '';
  const s = raw.toString().toLowerCase();
  if (s.includes('crunchy')) return 'crunchyroll';
  if (s.includes('netflix')) return 'netflix';
  if (s.includes('prime') || s.includes('amazon')) return 'prime video';
  if (s.includes('disney')) return 'disney+';
  if (s.includes('hidive')) return 'hidive';
  if (s.includes('hbo')) return 'hbo max';
  if (s.includes('paramount')) return 'paramount+';
  if (s.includes('apple')) return 'apple tv';
  if (s.includes('funimation')) return 'funimation';
  if (s.includes('hulu')) return 'hulu';
  if (s.includes('anime') && s.includes('digital')) return 'adn';
  // fallback: remove punctuation and collapse spaces
  return s.replace(/[^a-z0-9+ ]/gi, ' ').replace(/\s+/g, ' ').trim();
};

function WeeklyCalendar() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const { country, setCountry } = useUserContext();
  const { t } = useWATTranslation();

  const handleCountryChange = (newCountry) => {
    // update context country and reset platform filter
    setSelectedPlatform('all');
    if (setCountry) setCountry(newCountry);
  };
  
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

  // Compute platform availability counts across the week (used for badges)
  const platformCounts = CONFIGURED_PLATFORMS.reduce((acc, p) => { acc[p] = 0; return acc; }, {});
  const allAnimes = Object.values(weeklySchedule).flat();

  const extractProviderName = (p) => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    return (p.normalized_name || p.provider_name || p.provider || p.name || '').toString();
  };

  const getAvailablePlatformsForAnime = (anime) => {
    const available = new Set();
    if (!anime) return available;

    // streamingInfo can be an object with keys for providers or TMDB-like objects
    if (anime.streamingInfo && typeof anime.streamingInfo === 'object') {
      Object.entries(anime.streamingInfo).forEach(([k, v]) => {
        if (!k) return;
        // If value is an array with items, consider provider available
        if (Array.isArray(v) && v.length > 0) {
          available.add(normalizePlatform(k));
          return;
        }
        // If value has an 'available' flag or contains links/offers, consider available
        if (v && (v.available === true || v.available === 'true' || v.available === 1 || v.url || v.link || v.offers || v.flatrate || v.buy)) {
          available.add(normalizePlatform(k));
          return;
        }
      });
    }

    // streaming and platforms are often arrays of provider objects
    const arrays = [];
    if (Array.isArray(anime.streaming)) arrays.push(...anime.streaming);
    if (Array.isArray(anime.platforms)) arrays.push(...anime.platforms);
    arrays.forEach(p => {
      const name = extractProviderName(p);
      if (name) available.add(normalizePlatform(name));
    });

    return available;
  };

  allAnimes.forEach(anime => {
    const available = getAvailablePlatformsForAnime(anime);
    CONFIGURED_PLATFORMS.forEach(p => {
      if (p === 'all') return;
      if (available.has(p)) platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
  });

  // Jours de la semaine en français
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const daysLower = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Jour actuel pour le mettre en évidence
  const currentDay = new Date().getDay();
  
  // Fonction pour gérer le clic sur un anime
  const handleAnimeClick = (anime) => {
    // Déterminer la plateforme préférée parmi celles disponibles
    // If backend provided an explicit streamingInfo object, prefer it; otherwise, try to fetch platforms array
    let availablePlatforms = [];
    if (anime.streamingInfo && typeof anime.streamingInfo === 'object' && !Array.isArray(anime.streamingInfo)) {
      availablePlatforms = Object.entries(anime.streamingInfo || {})
        .filter(([, info]) => info.available)
        .map(([platform]) => platform);
    } else if (anime.streaming && Array.isArray(anime.streaming) && anime.streaming.length) {
      availablePlatforms = anime.streaming.map(p => (p.normalized_name || p.provider_name).toString().toLowerCase());
    } else if (anime.platforms && Array.isArray(anime.platforms) && anime.platforms.length) {
      availablePlatforms = anime.platforms.map(p => (p.normalized_name || p.provider_name).toString().toLowerCase());
    }
    
    if (availablePlatforms.length === 0) return;
    
    // Si un filtre de plateforme est actif et que l'anime est disponible sur cette plateforme
    if (selectedPlatform !== 'all') {
      // try to use streamingInfo object first
      if (anime.streamingInfo && anime.streamingInfo[selectedPlatform] && anime.streamingInfo[selectedPlatform].available) {
        window.open(anime.streamingInfo[selectedPlatform].url, '_blank', 'noopener,noreferrer');
        return;
      }
      // otherwise, try to find platform in arrays and open its link
      const platformObj = (anime.platforms || anime.streaming || []).find(p => ((p.normalized_name || p.provider_name)||'').toString().toLowerCase() === selectedPlatform);
      if (platformObj && (platformObj.link || platformObj.provider_id)) {
        const url = platformObj.link && !platformObj.link.includes('themoviedb.org/provider') ? platformObj.link : (`https://www.themoviedb.org/provider/${platformObj.provider_id}`);
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    
    // Ordre de préférence: la plateforme sélectionnée, puis Crunchyroll, Netflix, ADN, Prime Video, Disney+
    const priorityOrder = ['crunchyroll', 'netflix', 'adn', 'prime video', 'disney plus'];
    
    // Trouver la première plateforme disponible selon l'ordre de priorité
    const platformToUse = priorityOrder.find(p => availablePlatforms.includes(p)) || availablePlatforms[0];
    
    if (platformToUse) {
      // prefer explicit streamingInfo url
      if (anime.streamingInfo && anime.streamingInfo[platformToUse] && anime.streamingInfo[platformToUse].url) {
        window.open(anime.streamingInfo[platformToUse].url, '_blank', 'noopener,noreferrer');
        return;
      }
      const platformObj = (anime.platforms || anime.streaming || []).find(p => ((p.normalized_name || p.provider_name)||'').toString().toLowerCase() === platformToUse);
      if (platformObj) {
        const url = platformObj.link && !platformObj.link.includes('themoviedb.org/provider') ? platformObj.link : (`https://www.themoviedb.org/provider/${platformObj.provider_id}`);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Filtrer les animes selon la plateforme sélectionnée
  const getFilteredAnimes = (animes) => {
    if (!animes) return [];
    if (selectedPlatform === 'all') return animes;
    const wanted = normalizePlatform(selectedPlatform);
    return animes.filter(anime => {
      const available = getAvailablePlatformsForAnime(anime);
      return available.has(wanted);
    });
  };

  return (
    <div className="weekly-calendar">
      <div className="calendar-header">
        <h2 className="section-title">{t('calendar.title', { defaultValue: 'Calendrier des sorties' })}</h2>
        <div className="section-controls">
          <CountrySelector
            value={country}
            onChange={handleCountryChange}
            showLabel={false}
            compact={true}
          />
        </div>
      </div>

      <div className="platform-filter">
        <span>{t('calendar.filter_by_platform', { defaultValue: 'Filtrer par plateforme:' })}</span>
        <div className="filter-buttons">
          {CONFIGURED_PLATFORMS.map((p) => {
            const isAll = p === 'all';
            const count = isAll ? allAnimes.length : (platformCounts[p] || 0);
            const label = isAll ? t('calendar.all', { defaultValue: 'Toutes' }) : p[0].toUpperCase() + p.slice(1);
            return (
              <button
                key={p}
                className={selectedPlatform === p ? 'active' : ''}
                onClick={() => setSelectedPlatform(p)}
                title={isAll ? label : `${label} — ${count}`}
              >
                {!isAll ? <PlatformLogo platform={p} size="small" /> : null}
                <span className="filter-label">{label}</span>
                <span className="filter-count">{count > 0 ? ` ${count}` : ''}</span>
              </button>
            );
          })}
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
