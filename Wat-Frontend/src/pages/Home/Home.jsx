import React, { useState, useEffect, Suspense, useRef } from 'react';
import './Home.scss';
import { Loading, ErrorMessage, CountrySelector } from '../../components/Common';
const AnimeCard = React.lazy(() => import('../../components/Common/Cards/AnimeCard/AnimeCard'));
import { useTodayReleases, useGlobalStats } from '../../services/api';
import { useUserContext } from '../../context/UserContext';
import { useWATTranslation } from '../../hooks/useWATTranslation';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';

const Home = () => {
  const { t, formatNumber } = useWATTranslation();
  const { country, setCountry } = useUserContext() || { country: 'FR', setCountry: () => {} };
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  // Fetch today's releases using the custom hook (deferred to avoid blocking LCP)
  const { data: animesAujourdhui, isLoading, error, refetch } = useTodayReleases({ enabled: false });
  
  // Fetch global statistics from backend (deferred)
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useGlobalStats(country, { enabled: false });

  // Default stats si les données ne sont pas encore chargées ou si erreur
  const displayStats = stats || {
    todayReleases: animesAujourdhui?.length || 0, // Fallback sur les données actuelles
    totalAnimes: 0,
    activeWeek: 0,
    totalEpisodes: 0
  };

  // 🎯 Animations des compteurs avec délais échelonnés
  const hasValidData = displayStats.apiStatus === 'OK' || displayStats.apiStatus === undefined;
  const shouldAnimate = !statsLoading && hasValidData;
  
  const animatedTodayReleases = useCounterAnimation(
    displayStats.todayReleases, 
    1200, 
    shouldAnimate, 
    'easeOut'
  );
  
  const animatedActiveWeek = useCounterAnimation(
    displayStats.activeWeek, 
    1200, 
    shouldAnimate, 
    'easeOut'
  );
  
  const animatedTotalEpisodes = useCounterAnimation(
    displayStats.totalEpisodes, 
    1200, 
    shouldAnimate, 
    'easeOut'
  );
  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleRetry = () => {
    refetch();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Loading 
          message={t('home.loading')} 
          size="large" 
        />
      );
    }

    if (error) {
      return (
        <ErrorMessage 
          message={t('home.errorDesc')}
          type="error"
          onRetry={handleRetry}
        />
      );
    }

    if (!animesAujourdhui || animesAujourdhui.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📺</div>
          <h3 className="empty-title">{t('home.noReleases')}</h3>
          <p className="empty-message">
            {t('home.noReleasesDesc', { country: t(`countries.${country}`) })}
          </p>
        </div>
      );
    }

    // If small list, keep simple rendering to avoid virtualization overhead
    if (animesAujourdhui.length < 12) {
      return (
        <div className={`anime-grid ${viewMode}-view`} ref={containerRef}>
          {animesAujourdhui.map((anime) => (
            <Suspense key={anime.mal_id} fallback={<div style={{width: 220, height: 320}} />}>
              <AnimeCard 
                anime={anime} 
                variant={viewMode === 'list' ? 'list' : 'default'}
                country={country}
              />
            </Suspense>
          ))}
        </div>
      );
    }

    if (viewMode === 'list') {
      // Render a full list so the page height grows naturally
      return (
        <div className="anime-list" ref={containerRef}>
          {animesAujourdhui.map((anime) => (
            <div key={anime.mal_id || anime.id || anime.title} style={{ marginBottom: 12 }}>
              <Suspense fallback={<div style={{width: '100%', height: 120}} />}>
                <AnimeCard anime={anime} variant={'list'} country={country} />
              </Suspense>
            </div>
          ))}
        </div>
      );
    }

    // Grid rendering: prefer normal grid so the page grows with content
    // Virtualize only for very large datasets to avoid inner scrollbars
    const VIRTUALIZE_THRESHOLD = 120;
    if (animesAujourdhui.length > VIRTUALIZE_THRESHOLD) {
      const rowCount = Math.ceil(animesAujourdhui.length / columns);
      const gridHeight = Math.min(900, window.innerHeight - 200);
      return (
        <div ref={containerRef} style={{ width: '100%', height: gridHeight }}>
          <FixedSizeGrid
            columnCount={columns}
            columnWidth={CARD_WIDTH + gutter}
            height={gridHeight}
            rowCount={rowCount}
            rowHeight={CARD_HEIGHT + gutter}
            width={containerWidth || 800}
            itemData={animesAujourdhui}
          >
            {GridCell}
          </FixedSizeGrid>
        </div>
      );
    }

    // Default: render full grid so the page expands with content
    return (
      <div className={`anime-grid ${viewMode}-view`} ref={containerRef}>
        {animesAujourdhui.map((anime) => (
          <Suspense key={anime.mal_id || anime.id || anime.title} fallback={<div style={{width: CARD_WIDTH, height: CARD_HEIGHT}} />}>
            <AnimeCard 
              anime={anime} 
              variant={viewMode === 'list' ? 'list' : 'default'}
              country={country}
            />
          </Suspense>
        ))}
      </div>
    );
  };

  // Prefetch streaming info for the first few items to improve perceived performance
  useEffect(() => {
    // Trigger data fetch after first paint / when browser is idle to reduce LCP impact
    const startFetch = () => {
      try {
        refetch();
        refetchStats();
      } catch (err) {
        // Debug only: ne pas casser l'expérience utilisateur
        console.debug('Deferred fetch failed', err);
      }
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(startFetch, { timeout: 1000 });
      return () => window.cancelIdleCallback && window.cancelIdleCallback(id);
    }

    // Fallback: schedule after paint
    const t = setTimeout(startFetch, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  // Prefetch streaming info for the first few items when the browser is idle
  useEffect(() => {
    if (!animesAujourdhui || animesAujourdhui.length === 0) return;
    const doPrefetch = () => {
      import('../../lib/queryClient').then(({ queryClient }) => {
        const prefetchCount = 3; // keep small
        animesAujourdhui.slice(0, prefetchCount).forEach(anime => {
          const animeId = anime.title || anime.canonicalTitle || anime.mal_id || anime.id || anime.slug;
          queryClient.prefetchQuery(['animePlatforms', animeId, country], () => fetch(`/api/anime/anime/${encodeURIComponent(animeId)}/platforms?country=${country}`).then(r => r.json()), {
            staleTime: 1000 * 60 * 60,
            cacheTime: 1000 * 60 * 60
          });
        });
      }).catch(()=>{});
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(doPrefetch, { timeout: 2000 });
      return () => window.cancelIdleCallback && window.cancelIdleCallback(id);
    }

    const t = setTimeout(doPrefetch, 1500);
    return () => clearTimeout(t);
  }, [animesAujourdhui, country]);

  // --- Virtualization helpers ---
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef]);

  const CARD_WIDTH = 240;
  const CARD_HEIGHT = 360;
  const gutter = 12;
  const columns = Math.max(1, Math.floor(containerWidth / (CARD_WIDTH + gutter)));

  const GridCell = ({ columnIndex, rowIndex, style, data }) => {
    const index = rowIndex * columns + columnIndex;
    const anime = data[index];
    if (!anime) return null;
    const cellStyle = { ...style, left: style.left + gutter, top: style.top + gutter };
    return (
      <div style={cellStyle}>
        <Suspense fallback={<div style={{width: CARD_WIDTH, height: CARD_HEIGHT}} />}>
          <AnimeCard anime={anime} variant={viewMode === 'list' ? 'list' : 'default'} country={country} />
        </Suspense>
      </div>
    );
  };

  const ListRow = ({ index, style, data }) => {
    const anime = data[index];
    if (!anime) return null;
    return (
      <div style={style}>
        <Suspense fallback={<div style={{width: '100%', height: 120}} />}>
          <AnimeCard anime={anime} variant={'list'} country={country} />
        </Suspense>
      </div>
    );
  };

  return (
    <>
      <main className="home">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              {t('home.title')}
            </h1>
            <p className="hero-subtitle">
              {t('home.subtitle')}
            </p>
            
            <div className="hero-stats">
              <div className={`stat-item ${displayStats.apiStatus !== 'OK' ? 'unavailable' : ''}`}>
                <span className="stat-number">
                  {statsLoading ? '...' : 
                   displayStats.apiStatus !== 'OK' ? '—' :
                   formatNumber(animatedTodayReleases)}
                </span>
                <span className="stat-label">{t('home.stats.todayReleases')}</span>
              </div>
              <div className={`stat-item ${displayStats.apiStatus !== 'OK' ? 'unavailable' : ''}`}>
                <span className="stat-number">
                  {statsLoading ? '...' : 
                   displayStats.apiStatus !== 'OK' ? '—' :
                   formatNumber(animatedActiveWeek)}
                </span>
                <span className="stat-label">{t('home.stats.activeWeek')}</span>
              </div>
              <div className={`stat-item ${displayStats.apiStatus !== 'OK' ? 'unavailable' : ''}`}>
                <span className="stat-number">
                  {statsLoading ? '...' : 
                   displayStats.apiStatus !== 'OK' ? '—' :
                   formatNumber(animatedTotalEpisodes)}
                </span>
                <span className="stat-label">{t('home.stats.totalEpisodes')}</span>
              </div>
              
              {/* Debug info en développement */}
              {import.meta.env.DEV && statsError && (
                <div className="stat-item error">
                  <span className="stat-number">❌</span>
                  <span className="stat-label">Erreur stats</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Today's Releases */}
        <section className="todays-releases">
          <div className="section-header">
            <h2 className="section-title">
              {t('home.todayReleases')}
            </h2>
            
            <div className="section-controls">
              <CountrySelector 
                value={country}
                onChange={handleCountryChange}
                showLabel={false}
                compact={true}
              />

              <div className={`view-toggle ${viewMode ? 'has-active ' + (viewMode === 'grid' ? 'grid-active' : 'list-active') : ''}`}>
                <button 
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('grid')}
                  title={t('ui.gridView', 'Vue grille')}
                  aria-label={t('ui.gridView', 'Vue grille')}
                  data-view="grid"
                >
                  <svg className="icon icon-grid" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <circle cx="4" cy="4" r="2" fill="currentColor" />
                    <circle cx="12" cy="4" r="2" fill="currentColor" />
                    <circle cx="4" cy="12" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('list')}
                  title={t('ui.listView', 'Vue liste')}
                  aria-label={t('ui.listView', 'Vue liste')}
                  data-view="list"
                >
                  <svg className="icon icon-list" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" />
                    <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
                    <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="content">
            {renderContent()}
          </div>
        </section>

        {/* Floating Action Button (Mobile) */}
        <button className="fab" title={t('ui.refresh', 'Actualiser')}>
          ↻
        </button>
      </main>
    </>
  );
};

export default Home;