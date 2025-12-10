import React from 'react';
import './AnimeCard.scss';
import { PlatformLogo } from '../../Media';
import { useStreamingInfo } from '../../../../services/api';
import { useWATTranslation } from '../../../../hooks/useWATTranslation';
import useInView from '../../../../hooks/useInView';
import { memo, useState, useEffect } from 'react';
import buildProviderHref from '../../../../lib/providerLinks';
import { useUserContext } from '../../../../context/UserContext';
import { Heart, ExternalLink, Check, Star, Calendar, Tv, Clock, Play } from 'lucide-react';
import {
  useWatchlistStatus
} from '../../../../hooks/useWatchlist';

// Helper: retourne le titre préféré selon la langue (préférer title_english sauf pour japonais)
const getPreferredTitle = (anime, language) => {
  const englishFromList = Array.isArray(anime.titles) ? (anime.titles.find(t => t.type === 'English') || {}).title : null;
  const preferredEnglish = anime.title_english || englishFromList || null;
  if (language && language.toString().startsWith('ja')) {
    return anime.title || anime.canonicalTitle || preferredEnglish || anime.mal_id || anime.id || anime.slug || '';
  }
  return preferredEnglish || anime.title || anime.canonicalTitle || anime.mal_id || anime.id || anime.slug || '';
};

// Small local component to render streaming platforms fetched from backend
const StreamingPlatforms = ({ anime, country, language }) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const animeId = anime.mal_id || anime.id || anime.slug || anime.title || anime.canonicalTitle;

  // Always fetch platforms from backend by anime id (no TMDB resolver logic here)
  const { data: platforms = [], isLoading } = useStreamingInfo(animeId, country, { enabled: inView });

  // Don't render until in view or loaded
  if (!inView) return <div ref={ref} style={{minHeight: 28}} />;
  if (isLoading) return <div ref={ref} style={{minHeight: 28}} />;
  if (!platforms || platforms.length === 0) return <div ref={ref} style={{minHeight: 28}} />;

  const visible = platforms.slice(0, 4);

  // Use shared util to build provider links (keeps URL construction consistent across the app)
  const buildProviderLink = (plat) => {
    const titleForQuery = getPreferredTitle(anime, language) || anime.title || anime.canonicalTitle || '';
    return buildProviderHref(plat, titleForQuery, country);
  };

  return (
    <div ref={ref} className="streaming-platforms">
      {visible.map((p, idx) => {
        const providerName = p.normalized_name || p.provider_name || '';
        const providerLink = buildProviderLink(p);
        return (
          <span key={idx} className="platform-item">
            {providerLink ? (
              <a
                href={providerLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(ev) => ev.stopPropagation()}
                title={providerName}
              >
                <PlatformLogo platform={providerName} size="small" />
              </a>
            ) : (
              <div onClick={(ev) => ev.stopPropagation()} title={providerName}>
                <PlatformLogo platform={providerName} size="small" />
              </div>
            )}
          </span>
        );
      })}
      {platforms.length > 4 && (
        <div className="more-platforms">+{platforms.length - 4}</div>
      )}
    </div>
  );
};

const AnimeCard = ({ 
  anime, 
  variant = 'default', // 'default', 'compact', 'list'
  isLoading = false,
  country = 'FR',
  skipFiltering = false // If true, display card even without English title (useful for watchlist)
}) => {
  const { t, language } = useWATTranslation();

  // Expose current user (if logged via Discord) and a flag — used for server-side watchlist sync
  const { user, isAuthenticated } = useUserContext() || { user: null, isAuthenticated: false };
  
  // Utiliser le nouveau hook pour la synchronisation de la watchlist
  const { inList, isLoading: isWatchlistLoading, toggleWatchlist, addMutation, removeMutation } = useWatchlistStatus(anime);

  // Requirement: only display card if we have an English title AND a TMDB id (present or resolvable)
  const englishFromList = Array.isArray(anime.titles) ? (anime.titles.find(t => t.type === 'English') || {}).title : null;
  const hasEnglish = !!(anime.title_english || englishFromList);
  // Require English title and an anime id (we fetch platforms server-side by mal_id)
  // But skip this check if skipFiltering is true (e.g., in watchlist where user already chose these animes)
  if (!skipFiltering && (!hasEnglish || !(anime.mal_id || anime.id || anime.slug))) {
    // hide card (no english title or no TMDB match)
    return null;
  }
  
  // If skipFiltering is true, we still need at least an ID to display
  if (skipFiltering && !(anime.mal_id || anime.id || anime.slug)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`anime-card loading ${variant}`}>
        <div className="anime-image"></div>
        <div className="anime-content">
          <div className="anime-title"></div>
          <div className="anime-synopsis"></div>
          <div className="anime-synopsis"></div>
        </div>
      </div>
    );
  }

  const {
    title,
    images,
    synopsis,
    score,
    year,
    episodes,
    status,
  genres = [],
  broadcast = {}
  } = anime;
  // 'streaming' legacy prop removed in favor of backend-driven platforms
  const webpLarge = images?.webp?.large_image_url;
  const jpgLarge = images?.jpg?.large_image_url || images?.jpg?.image_url;
  const imageUrl = webpLarge || jpgLarge || '/placeholder-anime.jpg';
  // Preferred title centralisé
  const displayTitle = getPreferredTitle(anime, language) || t('anime.noTitle', 'Titre non disponible');

  // Default/original title (used as subtitle when different from the preferred/display title)
  const defaultTitle = title || anime.canonicalTitle || (anime.attributes && anime.attributes.canonicalTitle) || null;

  // Description localisée : prefer description_fr/description_en envoyées par le backend
  let localizedDescription = null;
  if (language && language.toString().startsWith('fr')) {
    localizedDescription = anime.description_fr || anime.description || anime.description_en || synopsis || anime.background || null;
  } else {
    localizedDescription = anime.description_en || anime.description || anime.description_fr || synopsis || anime.background || null;
  }
  const episodeText = episodes ? t('anime.episodes', { count: episodes }) : t('anime.episodesTBA', 'Episodes TBA');
  
  // Status mapping
  const getStatusInfo = (status) => {
    const statusMap = {
      'Currently Airing': { text: t('anime.status.airing', 'En cours'), class: 'airing' },
      'Finished Airing': { text: t('anime.status.completed', 'Terminé'), class: 'completed' },
      'Not yet aired': { text: t('anime.status.upcoming', 'À venir'), class: 'upcoming' }
    };
    return statusMap[status] || { text: t('anime.status.unknown', 'Inconnu'), class: 'unknown' };
  };

  const statusInfo = getStatusInfo(status);

  // Fonction pour traduire les jours de la semaine
  const translateDay = (dayName) => {
    if (!dayName || dayName === 'TBA') return dayName;
    
    // Convertir le pluriel en singulier (Fridays -> Friday)
    const singularDay = dayName.replace(/s$/, '');
    
    // Mapping direct selon la langue (seulement singulier)
    const dayMappings = {
      fr: {
        'monday': 'Lundi',
        'tuesday': 'Mardi',
        'wednesday': 'Mercredi',
        'thursday': 'Jeudi',
        'friday': 'Vendredi',
        'saturday': 'Samedi',
        'sunday': 'Dimanche'
      },
      en: {
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
      }
    };
    
    const currentLang = language?.startsWith('fr') ? 'fr' : 'en';
    const dayKey = singularDay.toLowerCase();
    const translatedDay = dayMappings[currentLang]?.[dayKey] || dayName;
    
    // Debug pour voir ce qui se passe
    console.log(`🔍 translateDay: "${dayName}" -> singular: "${singularDay}" -> lang: "${currentLang}" -> key: "${dayKey}" -> result: "${translatedDay}"`);
    
    return translatedDay;
  };

  // Formater l'affichage des horaires
  const getBroadcastDisplay = () => {
    const fallbackDay = broadcast?.day || 'TBA';
    const fallbackTime = broadcast?.time || '';
    const translatedDay = translateDay(fallbackDay);
    
    if (fallbackDay !== 'TBA') {
      return `${translatedDay} ${fallbackTime} (JST)`;
    }
    return 'TBA';
  };

  const broadcastDisplay = getBroadcastDisplay();

  return (
    <div className={`anime-card ${variant}`}>
      <div className="anime-image" style={{aspectRatio: '2/3', overflow: 'hidden'}}>
        <picture>
          {webpLarge && <source srcSet={webpLarge} type="image/webp" />}
          {jpgLarge && <source srcSet={jpgLarge} type="image/jpeg" />}
          <img 
            src={imageUrl}
            alt={displayTitle}
            loading="lazy"
            width="240"
            height="360"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </picture>
        
        {/* Status Badge */}
        <div className={`status-badge ${statusInfo.class}`}>
          {statusInfo.text}
        </div>
        
        {/* Episode Count */}
        {episodes && (
          <div className="episode-count">
            {episodeText}
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="anime-overlay">
          <button
            className="watch-button"
            onClick={async (e) => {
              e.preventDefault();
              // Fetch platforms for this anime and open the preferred provider link
              try {
                // Fast path: if legacy streaming array exists on the anime object, use it
                let platforms = anime.streaming || anime.platforms || null;
                if (!platforms) {
                  // Prefer TMDB flow: use anime.tmdb_id if present, otherwise try to resolve TMDB id via backend
                  const tmdbIdLocal = anime.tmdb_id || anime.tmdbId || null;
                  let resp, data;
                  if (tmdbIdLocal) {
                    resp = await fetch(`/api/anime/tmdb/${encodeURIComponent(tmdbIdLocal)}/platforms?country=${country}`);
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    data = await resp.json();
                    platforms = (data && data.platforms && data.platforms.data) ? data.platforms.data : (data && data.data) ? data.data : [];
                  } else {
                    // Try resolving TMDB id via resolver endpoint
                    const titleForResolve = getPreferredTitle(anime, language) || anime.title || anime.canonicalTitle || '';
                    if (titleForResolve) {
                      const yearParam = anime.year || (anime.first_air_date || '').slice(0,4) || '';
                      const resolveUrl = `/api/anime/tmdb/resolve?q=${encodeURIComponent(titleForResolve)}${yearParam?`&year=${encodeURIComponent(yearParam)}`:''}&country=${encodeURIComponent(country)}`;
                      const r = await fetch(resolveUrl);
                      if (r.ok) {
                        const j = await r.json();
                        const best = j.data?.best || j.best || null;
                        const foundTmdb = best && best.id ? String(best.id) : null;
                        if (foundTmdb) {
                          const resp2 = await fetch(`/api/anime/tmdb/${encodeURIComponent(foundTmdb)}/platforms?country=${country}`);
                          if (resp2.ok) {
                            const d2 = await resp2.json();
                            platforms = (d2 && d2.platforms && d2.platforms.data) ? d2.platforms.data : (d2 && d2.data) ? d2.data : [];
                          }
                        }
                      }
                    }
                  }
                }

                if (!platforms || platforms.length === 0) {
                  // No provider found: open search on MyAnimeList as fallback
                  const fallback = `https://myanimelist.net/search/all?q=${encodeURIComponent(displayTitle)}`;
                  window.open(fallback, '_blank', 'noopener');
                  return;
                }

                // Prefer platforms by type and display_priority
                const priorityOrder = { 'flatrate': 0, 'free': 1, 'buy': 2, 'rent': 3 };
                platforms.sort((a, b) => {
                  const pa = priorityOrder[a.type] ?? 10;
                  const pb = priorityOrder[b.type] ?? 10;
                  if (pa !== pb) return pa - pb;
                  const da = a.display_priority ?? 0;
                  const db = b.display_priority ?? 0;
                  return db - da; // higher display_priority first
                });

                const top = platforms[0];
                // Utiliser buildProviderHref pour construire le lien de redirection approprié
                const preferredTitleForQuery = getPreferredTitle(anime, language) || displayTitle;
                const providerLink = buildProviderHref(top, preferredTitleForQuery, country);
                if (providerLink) {
                  window.open(providerLink, '_blank', 'noopener');
                } else {
                  const fallback2 = `https://myanimelist.net/search/all?q=${encodeURIComponent(displayTitle)}`;
                  window.open(fallback2, '_blank', 'noopener');
                }
              } catch (err) {
                console.error('Erreur lors de la récupération des plateformes:', err);
                const fallback = `https://myanimelist.net/search/all?q=${encodeURIComponent(displayTitle)}`;
                window.open(fallback, '_blank', 'noopener');
              }
            }}
          >
            <Play size={16} />
            {t('anime.watch', 'Regarder')}
          </button>
        </div>

      </div>

      <div className="anime-content">
        <div className="anime-header">
          <h3 className="anime-title">{displayTitle}</h3>
          {defaultTitle && defaultTitle !== displayTitle && (
            <p className="anime-subtitle">{defaultTitle}</p>
          )}
        </div>

        <div className="anime-meta">
          {score && (
            <div className="meta-item rating">
              <Star size={16} fill="currentColor" />
              <span>{score.toFixed(1)}</span>
            </div>
          )}
          
          {year && (
            <div className="meta-item year">
              <Calendar size={16} />
              <span>{year}</span>
            </div>
          )}
          
          <div className="meta-item episodes">
            <Tv size={16} />
            <span>{episodeText}</span>
          </div>
          
          {broadcastDisplay && broadcastDisplay !== 'TBA' && (
            <div className="meta-item broadcast">
              <Clock size={16} />
              <span>{broadcastDisplay}</span>
            </div>
          )}
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="anime-genres">
            {genres.slice(0, 3).map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre.name || genre}
              </span>
            ))}
            {genres.length > 3 && (
              <span className="genre-tag">+{genres.length - 3}</span>
            )}
          </div>
        )}

  {/* Streaming Info - fetch only when visible */}
  <StreamingPlatforms anime={anime} country={country} language={language} />

        {/* Synopsis / Description localisée */}
        {localizedDescription && (
          <p className="anime-synopsis">
            {localizedDescription}
          </p>
        )}

        {/* Actions */}
        <div className="anime-actions">
          <div className="action-buttons">
            {isAuthenticated && (
              <>
                <button 
                  className={`action-btn watchlist-btn ${inList ? 'active' : ''} ${isWatchlistLoading ? 'loading' : ''}`} 
                  title={inList ? t('anime.removeFromList', 'Retirer de ma liste') : t('anime.addToList', 'Ajouter à ma liste')} 
                  onClick={(e) => { e.stopPropagation(); toggleWatchlist(e); }}
                  disabled={isWatchlistLoading}
                >
                  {isWatchlistLoading ? (
                    <div className="loading-spinner">⏳</div>
                  ) : (
                    <div className={`heart-container ${
                      addMutation.isPending ? 'adding' : removeMutation.isPending ? 'removing' : ''
                    }`}>
                      <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        className={`heart-icon ${inList ? 'filled' : ''}`}
                      >
                        {/* Définition du gradient pour le remplissage progressif */}
                        <defs>
                          <linearGradient 
                            id={`heartGradient-${anime?.mal_id || anime?.id || 'default'}`} 
                            x1="0%" 
                            y1="100%" 
                            x2="0%" 
                            y2="0%"
                          >
                            <stop 
                              offset="0%" 
                              stopColor="#ff3b3b" 
                              stopOpacity={inList ? "1" : "0"}
                              className="gradient-stop-start"
                            />
                            <stop 
                              offset={inList ? "100%" : "0%"} 
                              stopColor="#ff3b3b" 
                              stopOpacity={inList ? "1" : "0"}
                              className="gradient-stop-end"
                            />
                          </linearGradient>
                        </defs>
                        {/* Remplissage du cœur - en dessous pour l'effet de fond */}
                        <path 
                          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                          fill={`url(#heartGradient-${anime?.mal_id || anime?.id || 'default'})`}
                          className="heart-fill"
                        />
                        {/* Contour du cœur - par-dessus pour la définition */}
                        <path 
                          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5"
                          className="heart-stroke"
                        />
                      </svg>
                    </div>
                  )}
                </button>
                <button className="action-btn" title={t('anime.markAsWatched', 'Marquer comme vu')} onClick={(e) => e.stopPropagation()}>
                  <Check size={12} />
                </button>
              </>
            )}
            <button className="action-btn" title={t('anime.share', 'Partager')} onClick={(e) => e.stopPropagation()}>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default memo(AnimeCard);