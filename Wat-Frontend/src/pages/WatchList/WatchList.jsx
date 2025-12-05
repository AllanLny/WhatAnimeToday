import React, { useState, useEffect, Suspense, useRef } from 'react';
import './WatchList.scss';
import { Loading, ErrorMessage, ViewToggle } from '../../components/Common';
const AnimeCard = React.lazy(() => import('../../components/Common/Cards/AnimeCard/AnimeCard'));
import { useWATTranslation } from '../../hooks/useWATTranslation';
import { useUserContext } from '../../context/UserContext';
import { useWatchlist } from '../../hooks/useWatchlist';
import { readWatchlistDetails, writeWatchlistDetails, addAnimeDetails } from '../../lib/watchlist';
import { fetchAnimeDetailsById } from '../../services/api';
import { Link } from 'react-router-dom';

function WatchList() {
  const { t } = useWATTranslation();
  const { country } = useUserContext();
  const [viewMode, setViewMode] = useState('grid');
  const [isEnriching, setIsEnriching] = useState(false);
  const containerRef = useRef(null);

  const { user, isAuthenticated } = useUserContext() || { user: null, isAuthenticated: false };
  const { watchlist, isLoading } = useWatchlist();

  // Enrichir les animes avec les détails manquants
  const enrichAnimeDetails = async (animes) => {
    if (!Array.isArray(animes) || animes.length === 0) return animes;
    
    setIsEnriching(true);
    const details = readWatchlistDetails();
    let needsUpdate = false;
    
    // Pour chaque anime, vérifier s'il a besoin des détails
    const enrichedAnimes = await Promise.all(animes.map(async (anime) => {
      const animeId = anime.mal_id || anime.id;
      
      // Si on a déjà les détails, pas besoin de fetcher
      if (anime.title && anime.images) {
        return anime;
      }
      
      // Si les détails sont en cache local, les utiliser
      if (details[animeId] && details[animeId].title) {
        return { ...anime, ...details[animeId] };
      }
      
      // Sinon, fetcher depuis l'API
      try {
        const animeDetails = await fetchAnimeDetailsById(animeId);
        if (animeDetails) {
          // Sauvegarder en cache local
          addAnimeDetails(animeId, animeDetails);
          needsUpdate = true;
          return { ...anime, ...animeDetails };
        }
      } catch (err) {
        console.warn(`Failed to fetch details for anime ${animeId}:`, err);
      }
      
      return anime;
    }));
    
    setIsEnriching(false);
    return enrichedAnimes;
  };

  const renderEmpty = () => (
    <div className="empty-state">
      <div className="empty-icon">📚</div>
      <h3 className="empty-title">{t('nav.watchlist', 'Ma Liste')}</h3>
      <p className="empty-message">{t('home.noReleases', 'Aucune entrée dans votre watchlist pour le moment.')}</p>
      <Link to="/" className="cta-button">{t('home.todayReleases', 'Voir les sorties du jour')}</Link>
    </div>
  );

  if (isLoading || isEnriching) {
    return (
      <div className="watchlist-page">
        <div className="page-header">
          <h1>{t('nav.watchlist', 'Ma Liste')}</h1>
        </div>
        <div className="page-content">
          <Loading message={isEnriching ? t('loading.enriching', 'Chargement des animes...') || 'Enrichissement des données...' : t('loading.default', 'Chargement...')} />
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <div className="page-header">
        <h1>{t('nav.watchlist', 'Ma Liste')}</h1>
        <div className="header-controls">
          <ViewToggle 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      <div className="page-content" ref={containerRef}>
        {isLoading ? (
          <Loading message={t('watchlist.loading', 'Chargement de votre liste...')} size="large" />
        ) : (!watchlist || watchlist.length === 0) ? renderEmpty() : (
          <div className={`anime-grid ${viewMode}-view`}>
            {watchlist.map((anime) => (
              <Suspense key={anime.mal_id || anime.id || anime.slug} fallback={<div style={{width: 240, height: 360}} />}>
                <AnimeCard anime={anime} variant={viewMode === 'list' ? 'list' : 'default'} country={country} skipFiltering={true} />
              </Suspense>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchList;
