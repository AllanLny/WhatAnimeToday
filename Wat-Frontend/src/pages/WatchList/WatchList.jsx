import React, { useState, Suspense, useRef } from 'react';
import './WatchList.scss';
import { Loading, ErrorMessage, ViewToggle } from '../../components/Common';
const AnimeCard = React.lazy(() => import('../../components/Common/Cards/AnimeCard/AnimeCard'));
const SkeletonCard = React.lazy(() => import('../../components/Common/Cards/SkeletonCard/SkeletonCard'));
import { useWATTranslation } from '../../hooks/useWATTranslation';
import { useUserContext } from '../../context/UserContext';
import { useWatchlist, useClearWatchlist } from '../../hooks/useWatchlist';
import { useWatchlistProgressive } from '../../hooks/useWatchlistProgressive';
import { Link } from 'react-router-dom';
import { Lock, BookOpen, Rocket } from 'lucide-react';

function WatchList() {
  const { t } = useWATTranslation();
  const { country, isAuthenticated } = useUserContext();
  const [viewMode, setViewMode] = useState('grid');
  const containerRef = useRef(null);

  // Utiliser le hook progressif pour la watchlist
  const { 
    watchlist, 
    isLoading, 
    error, 
    getAnimeLoadingState, 
    totalCount,
    isFullyLoaded 
  } = useWatchlistProgressive();
  const clearMutation = useClearWatchlist();

  const handleClearWatchlist = () => {
    if (confirm(t('watchlist.confirmClear', 'Êtes-vous sûr de vouloir vider votre liste ?'))) {
      clearMutation.mutate();
    }
  };

  const renderEmpty = () => (
    <div className="empty-state">
      <div className="empty-icon">
        {!isAuthenticated ? <Lock size={48} /> : <BookOpen size={48} />}
      </div>
      <h3 className="empty-title">{!isAuthenticated ? t('watchlist.loginRequired', 'Connexion requise') : t('nav.watchlist', 'Ma Liste')}</h3>
      <p className="empty-message">
        {!isAuthenticated 
          ? t('watchlist.loginPrompt', 'Connectez-vous avec Discord pour créer votre liste personnalisée d\'animes et synchroniser vos favoris sur tous vos appareils.')
          : t('watchlist.empty', 'Aucune entrée dans votre watchlist pour le moment. Commencez par ajouter quelques animes depuis la page d\'accueil !')
        }
      </p>
      {!isAuthenticated ? (
        <Link to="/login" className="cta-button primary">
          {t('auth.loginWithDiscord', 'Se connecter avec Discord')} <Rocket size={16} />
        </Link>
      ) : (
        <Link to="/" className="cta-button">
          {t('home.todayReleases', 'Découvrir les sorties du jour')}
        </Link>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="watchlist-page">
        <div className="page-header">
          <h1>{t('nav.watchlist', 'Ma Liste')}</h1>
        </div>
        <div className="page-content">
          {renderEmpty()}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="watchlist-page">
        <div className="page-header">
          <h1>{t('nav.watchlist', 'Ma Liste')}</h1>
        </div>
        <div className="page-content">
          <Loading message={t('loading.default', 'Chargement...')} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="watchlist-page">
        <div className="page-header">
          <h1>{t('nav.watchlist', 'Ma Liste')}</h1>
        </div>
        <div className="page-content">
          <ErrorMessage 
            message={t('watchlist.error', 'Erreur lors du chargement de la watchlist')} 
            onRetry={reloadWatchlist}
          />
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
          {watchlist && watchlist.length > 0 && (
            <button 
              className="clear-button"
              onClick={handleClearWatchlist}
              disabled={clearMutation.isLoading}
            >
              {clearMutation.isLoading ? t('loading.clearing', 'Suppression...') : t('watchlist.clear', 'Vider la liste')}
            </button>
          )}
        </div>
      </div>

      <div className="page-content" ref={containerRef}>
        {totalCount === 0 ? renderEmpty() : (
          <div className={`anime-grid ${viewMode}-view`}>
            {Array.from({ length: Math.max(totalCount, 3) }).map((_, index) => {
              const { isLoaded, shouldShowSkeleton, anime, skeletonDelay } = getAnimeLoadingState(index);
              
              if (shouldShowSkeleton) {
                return (
                  <Suspense key={`skeleton-${index}`} fallback={<div style={{width: 240, height: 360}} />}>
                    <SkeletonCard 
                      variant={viewMode === 'list' ? 'list' : 'default'}
                      delay={skeletonDelay}
                    />
                  </Suspense>
                );
              }
              
              if (isLoaded && anime) {
                return (
                  <Suspense key={anime.anime_id || anime.mal_id || anime.id} fallback={<div style={{width: 240, height: 360}} />}>
                    <AnimeCard 
                      anime={anime} 
                      variant={viewMode === 'list' ? 'list' : 'default'} 
                      country={country} 
                      skipFiltering={true} 
                    />
                  </Suspense>
                );
              }
              
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchList;
