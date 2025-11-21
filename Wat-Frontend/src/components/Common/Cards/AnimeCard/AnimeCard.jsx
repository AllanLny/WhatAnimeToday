import React from 'react';
import './AnimeCard.scss';
import { PlatformLogo } from '../../Media';
import { useStreamingInfo } from '../../../../services/api';
import { useWATTranslation } from '../../../../hooks/useWATTranslation';
import useInView from '../../../../hooks/useInView';
import { memo, useState, useEffect } from 'react';
import buildProviderHref from '../../../../lib/providerLinks';
import { useUserContext } from '../../../../context/UserContext';
import {
  readLocalWatchlist,
  writeLocalWatchlist,
  addToServerWatchlist,
  removeFromServerWatchlist
} from '../../../../lib/watchlist';

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
  country = 'FR'
}) => {
  const { t, language } = useWATTranslation();

  // Expose current user (if logged via Discord) and a flag — used for server-side watchlist sync
  const { user, isAuthenticated } = useUserContext() || { user: null, isAuthenticated: false };
  const [inList, setInList] = useState(false);

  useEffect(() => {
    try {
      const idKey = anime?.mal_id || anime?.id || anime?.slug;
      const local = readLocalWatchlist();
      const found = local.some(i => (i.mal_id || i.id || i.slug) === idKey);
      setInList(!!found);
    } catch (err) {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime?.mal_id, anime?.id, anime?.slug]);

  const toggleWatchlist = async (ev) => {
    ev && ev.stopPropagation && ev.stopPropagation();
    const idKey = anime?.mal_id || anime?.id || anime?.slug;
    if (!idKey) return;

    if (inList) {
      const next = readLocalWatchlist().filter(i => (i.mal_id || i.id || i.slug) !== idKey);
      writeLocalWatchlist(next);
      setInList(false);
      if (isAuthenticated) {
        try { await removeFromServerWatchlist(idKey); } catch (e) { /* ignore */ }
      }
    } else {
      const newItem = {
        mal_id: anime.mal_id,
        id: anime.id,
        slug: anime.slug,
        title: anime.title,
        title_english: anime.title_english,
        images: anime.images
      };
      const next = [newItem, ...readLocalWatchlist()];
      writeLocalWatchlist(next);
      setInList(true);
      if (isAuthenticated) {
        try { await addToServerWatchlist(newItem); } catch (e) { /* ignore */ }
      }
    }
  };

  // Requirement: only display card if we have an English title AND a TMDB id (present or resolvable)
  const englishFromList = Array.isArray(anime.titles) ? (anime.titles.find(t => t.type === 'English') || {}).title : null;
  const hasEnglish = !!(anime.title_english || englishFromList);
  // Require English title and an anime id (we fetch platforms server-side by mal_id)
  if (!hasEnglish || !(anime.mal_id || anime.id || anime.slug)) {
    // hide card (no english title or no TMDB match)
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

  

  // Format broadcast day
  const broadcastDay = broadcast?.day || 'TBA';
  const broadcastTime = broadcast?.time || '';

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
                // Some providers include a 'link' field (TMDB link); otherwise build a generic provider page
                const preferredTitleForQuery = getPreferredTitle(anime, language) || displayTitle;
                const providerLink = top.link || (`https://www.themoviedb.org/provider/${top.provider_id}`) || null || (`https://www.google.com/search?q=${encodeURIComponent(preferredTitleForQuery)}`);
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
            <span className="play-icon">▶</span>
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
              <span className="meta-icon">⭐</span>
              <span>{score.toFixed(1)}</span>
            </div>
          )}
          
          {year && (
            <div className="meta-item year">
              <span className="meta-icon">📅</span>
              <span>{year}</span>
            </div>
          )}
          
          <div className="meta-item episodes">
            <span className="meta-icon">📺</span>
            <span>{episodeText}</span>
          </div>
          
          {broadcastDay !== 'TBA' && (
            <div className="meta-item broadcast">
              <span className="meta-icon">🕒</span>
              <span>{broadcastDay} {broadcastTime}</span>
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
                <button className="action-btn" title={t('anime.addToList', 'Ajouter à ma liste')} onClick={(e) => { e.stopPropagation(); toggleWatchlist(e); }}>
                  {inList ? '❤' : '♡'}
                </button>
                <button className="action-btn" title={t('anime.markAsWatched', 'Marquer comme vu')} onClick={(e) => e.stopPropagation()}>
                  ✓
                </button>
              </>
            )}
            <button className="action-btn" title={t('anime.share', 'Partager')} onClick={(e) => e.stopPropagation()}>
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default memo(AnimeCard);