import React, { useState } from 'react';
import './Home.scss';
import Header from '../../components/Layout/Header';
import { AnimeCard, Loading, ErrorMessage, CountrySelector } from '../../components/Common';
import { useTodayReleases, useGlobalStats } from '../../services/api';
import { useUserContext } from '../../context/UserContext';
import { useWATTranslation } from '../../hooks/useWATTranslation';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';

const Home = () => {
  const { t, formatNumber } = useWATTranslation();
  const { country, setCountry } = useUserContext() || { country: 'FR', setCountry: () => {} };
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Fetch today's releases using the custom hook
  const { data: animesAujourdhui, isLoading, error, refetch } = useTodayReleases();
  
  // Fetch global statistics from backend
  const { data: stats, isLoading: statsLoading, error: statsError } = useGlobalStats(country);

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

    return (
      <div className={`anime-grid ${viewMode}-view`}>
        {animesAujourdhui.map((anime) => (
          <AnimeCard 
            key={anime.mal_id} 
            anime={anime} 
            variant={viewMode === 'list' ? 'list' : 'default'}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
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

              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('grid')}
                  title={t('ui.gridView', 'Vue grille')}
                >
                  ⊞
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('list')}
                  title={t('ui.listView', 'Vue liste')}
                >
                  ☰
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