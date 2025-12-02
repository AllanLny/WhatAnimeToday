import React, { useState, useEffect, Suspense, useRef } from 'react';
import './WatchList.scss';
import { CountrySelector, Loading, ErrorMessage } from '../../components/Common';
const AnimeCard = React.lazy(() => import('../../components/Common/Cards/AnimeCard/AnimeCard'));
import { useWATTranslation } from '../../hooks/useWATTranslation';
import { useUserContext } from '../../context/UserContext';
import { readLocalWatchlist, writeLocalWatchlist, fetchServerWatchlist, removeFromServerWatchlist, clearServerWatchlist, readWatchlistDetails, writeWatchlistDetails, addAnimeDetails } from '../../lib/watchlist';
import { fetchAnimeDetailsById } from '../../services/api';
import { Link } from 'react-router-dom';

function WatchList() {
  const { t } = useWATTranslation();
  const { country } = useUserContext();
  const [viewMode, setViewMode] = useState('grid');
  const [items, setItems] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const containerRef = useRef(null);

  const { user, isAuthenticated } = useUserContext() || { user: null, isAuthenticated: false };

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (isAuthenticated) {
        const srv = await fetchServerWatchlist();
        if (!mounted) return;
        
        // Enrichir les animes avec les détails manquants
        const enriched = await enrichAnimeDetails(srv);
        if (!mounted) return;
        setItems(enriched || []);
      } else {
        // Load watchlist from localStorage
        const list = readLocalWatchlist();
        if (!mounted) return;
        setItems(list);
      }
    };
    load().catch(() => { if (mounted) setItems([]); });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleRemove = async (malId) => {
    const next = (items || []).filter(i => (i.mal_id || i.id || i.slug) !== malId);
    setItems(next);
    if (isAuthenticated) {
      try { await removeFromServerWatchlist(malId); } catch (e) { /* ignore */ }
    } else {
      writeLocalWatchlist(next);
    }
  };

  const handleClear = async () => {
    setItems([]);
    if (isAuthenticated) {
      try { await clearServerWatchlist(); } catch (e) { /* ignore */ }
    } else {
      writeLocalWatchlist([]);
    }
  };

  const renderEmpty = () => (
    <div className="empty-state">
      <div className="empty-icon">📚</div>
      <h3 className="empty-title">{t('nav.watchlist', 'Ma Liste')}</h3>
      <p className="empty-message">{t('home.noReleases', 'Aucune entrée dans votre watchlist pour le moment.')}</p>
      <Link to="/" className="cta-button">{t('home.todayReleases', 'Voir les sorties du jour')}</Link>
    </div>
  );

  if (items === null || isEnriching) {
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
          <CountrySelector value={country} onChange={() => {}} showLabel={false} compact={true} />
          <div className={`view-toggle ${viewMode ? 'has-active ' + (viewMode === 'grid' ? 'grid-active' : 'list-active') : ''}`}>
            <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} aria-label={t('ui.gridView', 'Vue grille')}>▦</button>
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} aria-label={t('ui.listView', 'Vue liste')}>≡</button>
          </div>
          <button className="clear-btn" onClick={handleClear} title="Vider la watchlist">{t('ui.refresh', 'Vider')}</button>
        </div>
      </div>

      <div className="page-content" ref={containerRef}>
        {(!items || items.length === 0) ? renderEmpty() : (
          <div className={`anime-grid ${viewMode}-view`}>
            {items.map((anime) => (
              <div key={anime.mal_id || anime.id || anime.slug} className="watchlist-item">
                <Suspense fallback={<div style={{width: 240, height: 360}} />}>
                  <AnimeCard anime={anime} variant={viewMode === 'list' ? 'list' : 'default'} country={country} skipFiltering={true} />
                </Suspense>
                <div className="watchlist-actions">
                  <button className="remove-btn" onClick={() => handleRemove(anime.mal_id || anime.id || anime.slug)}>{t('anime.remove', 'Retirer')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchList;
