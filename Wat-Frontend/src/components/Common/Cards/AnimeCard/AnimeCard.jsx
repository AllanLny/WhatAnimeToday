import React from 'react';
import './AnimeCard.scss';
import { PlatformLogo } from '../../Media';
import { useStreamingInfo } from '../../../../services/api';
import { useWATTranslation } from '../../../../hooks/useWATTranslation';
import useInView from '../../../../hooks/useInView';
import { memo } from 'react';

// Small local component to render streaming platforms fetched from backend
const StreamingPlatforms = ({ anime, country }) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const animeId = anime.title || anime.canonicalTitle || anime.mal_id || anime.id || anime.slug;
  const { data: platforms = [], isLoading } = useStreamingInfo(animeId, country, { enabled: inView });

  // Don't render until in view or loaded
  if (!inView) return <div ref={ref} style={{minHeight: 28}} />;
  if (isLoading) return <div ref={ref} style={{minHeight: 28}} />;
  if (!platforms || platforms.length === 0) return <div ref={ref} style={{minHeight: 28}} />;

  const visible = platforms.slice(0, 4);

  return (
    <div ref={ref} className="streaming-platforms">
      {visible.map((p, idx) => (
        <PlatformLogo key={idx} platform={p.normalized_name || p.provider_name} size="small" />
      ))}
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
  const { t } = useWATTranslation();

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
    title_english,
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
  const displayTitle = title || title_english || t('anime.noTitle', 'Titre non disponible');
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
          <button className="watch-button">
            <span className="play-icon">▶</span>
            {t('anime.watch', 'Regarder')}
          </button>
        </div>
      </div>

      <div className="anime-content">
        <div className="anime-header">
          <h3 className="anime-title">{displayTitle}</h3>
          {title_english && title !== title_english && (
            <p className="anime-subtitle">{title_english}</p>
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
  <StreamingPlatforms anime={anime} country={country} />

        {/* Synopsis */}
        {synopsis && (
          <p className="anime-synopsis">
            {synopsis}
          </p>
        )}

        {/* Actions */}
        <div className="anime-actions">
          <div className="action-buttons">
            <button className="action-btn" title={t('anime.addToList', 'Ajouter à ma liste')}>
              ❤
            </button>
            <button className="action-btn" title={t('anime.markAsWatched', 'Marquer comme vu')}>
              ✓
            </button>
            <button className="action-btn" title={t('anime.share', 'Partager')}>
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default memo(AnimeCard);