import { useWATTranslation } from '../../hooks/useWATTranslation';
import { useUserContext } from '../../context/UserContext';
import { useWeeklyReleases, useStreamingInfo } from '../../services/api';
import { PlatformLogo, CountrySelector } from '../../components/Common';
import './WeeklyCalendar.scss';
import { useEffect, useRef } from 'react';
import buildProviderHref from '../../lib/providerLinks';


// Small helper to render streaming platforms for a given anime using backend data
const WeeklyStreamingPlatforms = ({ anime }) => {
  const { country } = useUserContext();
  const animeId = anime.title || anime.canonicalTitle || anime.mal_id || anime.id || anime.slug;
  const { data: platforms = [], isLoading } = useStreamingInfo(animeId, country);
  if (isLoading) return null;
  if (!platforms || platforms.length === 0) return null;
  return (
    <>
      {platforms.slice(0, 4).map((p, i) => {
        const title = anime.title_english || anime.title || anime.canonicalTitle || '';
        const href = buildProviderHref(p, title, country);
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <PlatformLogo platform={p.normalized_name || p.provider_name} size="small" />
          </a>
        );
      })}
      {platforms.length > 4 && <span className="more-platforms">+{platforms.length - 4}</span>}
    </>
  );
};

// Platform filtering removed — keep UI simple

function WeeklyCalendar() {
  // platform filters removed — show all by default
  const { country, setCountry } = useUserContext();
  const { t } = useWATTranslation();

  // Jours de la semaine en français (déclarés en haut pour être disponibles pendant le skeleton load)
  // Utiliser i18n pour traduire les jours (fallback géré par i18n.js)
  const days = [
    t('calendar.days.sunday'),
    t('calendar.days.monday'),
    t('calendar.days.tuesday'),
    t('calendar.days.wednesday'),
    t('calendar.days.thursday'),
    t('calendar.days.friday'),
    t('calendar.days.saturday')
  ];
  const daysLower = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  // Jour actuel pour le mettre en évidence
  const currentDay = new Date().getDay();

  const handleCountryChange = (newCountry) => {
    // update context country and reset platform filter
    // no platform filter state
    if (setCountry) setCountry(newCountry);
  };
  
  // Utilisation du hook TanStack Query pour récupérer le calendrier hebdomadaire
  const { 
    data: weeklyData,
    isLoading,
    isError,
    error
  } = useWeeklyReleases();
  // platform prefetching removed
  // Ref to calendar grid to control scroll and gradient hint
  const gridRef = useRef(null);

  // When weeklyData changes, auto-scroll the current day into view (attempt to center it)
  useEffect(() => {
    if (!gridRef.current) return;
    if (!weeklyData) return;
    const gridEl = gridRef.current;
    const dayEl = gridEl.querySelector('.day-column.current-day');
    if (!dayEl) return;

    const dayCenter = dayEl.offsetLeft + (dayEl.offsetWidth / 2);
    const targetScrollLeft = Math.max(0, Math.round(dayCenter - (gridEl.clientWidth / 2)));

    if ('scrollTo' in gridEl) {
      try { gridEl.scrollTo({ left: targetScrollLeft, behavior: 'smooth' }); } catch { gridEl.scrollLeft = targetScrollLeft; }
    } else {
      gridEl.scrollLeft = targetScrollLeft;
    }

    gridEl.classList.add('centered');
    const onUserScroll = () => gridEl.classList.remove('centered');
    gridEl.addEventListener('scroll', onUserScroll, { passive: true });
    return () => gridEl.removeEventListener('scroll', onUserScroll);
  }, [weeklyData]);


  // Construction du calendrier avec les informations de streaming
  // Avec TanStack Query, les données de streaming sont déjà incluses
  // Pendant le chargement, afficher la grille du calendrier avec des squelettes
  if (isLoading) {
    const skeletonCountPerDay = 3;
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

        <div className="calendar-grid loading-calendar" ref={gridRef} aria-busy="true">
          {days.map((day, dIdx) => (
            <div className={`day-column ${dIdx === currentDay ? 'current-day' : ''} loading`} key={day} aria-hidden="true">
              <h2>{day}</h2>
              <div className="anime-list">
                {Array.from({ length: skeletonCountPerDay }).map((_, i) => (
                  <div className="calendar-anime-card skeleton" key={i} style={{ animationDelay: `${(dIdx * 20) + (i * 80)}ms` }}>
                    <div className="calendar-anime-image skeleton-item" />
                    <div className="calendar-anime-info">
                      <div className="skeleton-lines">
                        <div className="skeleton-line" style={{ width: '70%' }} />
                        <div className="skeleton-line" style={{ width: '50%', marginTop: 8 }} />
                      </div>
                    </div>
                  </div>
                ))}
                {skeletonCountPerDay === 0 && <p className="no-anime-message">Aucune sortie</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
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

  // flat list of all animes removed as platform filtering was removed

  

  

  // Fonction pour gérer le clic sur un anime — ouvre la première plateforme disponible par priorité
  const handleAnimeClick = (anime) => {
    const availablePlatforms = [];
    if (anime.streamingInfo && typeof anime.streamingInfo === 'object' && !Array.isArray(anime.streamingInfo)) {
      Object.entries(anime.streamingInfo || {}).forEach(([k, v]) => { if (v && (v.available || v.url || v.link)) availablePlatforms.push(k); });
    }
    if (Array.isArray(anime.streaming) && anime.streaming.length) availablePlatforms.push(...anime.streaming.map(p => (p.normalized_name || p.provider_name || p.name).toString().toLowerCase()));
    if (Array.isArray(anime.platforms) && anime.platforms.length) availablePlatforms.push(...anime.platforms.map(p => (p.normalized_name || p.provider_name || p.name).toString().toLowerCase()));

    if (availablePlatforms.length === 0) return;

    const priorityOrder = ['crunchyroll', 'netflix', 'adn', 'prime video', 'disney+'];
    const platformToUse = priorityOrder.find(p => availablePlatforms.includes(p)) || availablePlatforms[0];
    if (!platformToUse) return;

    // try streamingInfo url first
    if (anime.streamingInfo && anime.streamingInfo[platformToUse] && anime.streamingInfo[platformToUse].url) {
      window.open(anime.streamingInfo[platformToUse].url, '_blank', 'noopener,noreferrer');
      return;
    }
    const platformObj = (anime.platforms || anime.streaming || []).find(p => ((p.normalized_name || p.provider_name || p.name)||'').toString().toLowerCase() === platformToUse);
    if (platformObj) {
      const url = platformObj.link && !platformObj.link.includes('themoviedb.org/provider') ? platformObj.link : (`https://www.themoviedb.org/provider/${platformObj.provider_id}`);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getFilteredAnimes = (animes) => animes || [];

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

      {/* platform filter removed */}
      
  <div className="calendar-grid" ref={gridRef}>
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
                          alt={anime.title_english || anime.title}
                          className="calendar-anime-image"
                          loading="lazy"
                          width="160"
                          height="240"
                        />
                      </picture>
                    <div className="calendar-anime-info">
                      <h3>{anime.title_english || anime.title}</h3>
                      <p>Épisode: {anime.broadcast?.string || 'Horaire non précisé'}</p>
                      <div className="available-platforms">
                        <WeeklyStreamingPlatforms anime={anime} />
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="no-anime-message">Aucune sortie</p>
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
