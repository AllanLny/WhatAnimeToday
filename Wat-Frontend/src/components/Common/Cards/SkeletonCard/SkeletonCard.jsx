import React from 'react';
import './SkeletonCard.scss';

/**
 * 🦴 Composant Skeleton pour AnimeCard
 * Affiche une version placeholder pendant le chargement des données
 */
const SkeletonCard = ({ variant = 'default', delay = 0 }) => {
  return (
    <div 
      className={`skeleton-card ${variant}`}
      style={{ 
        animationDelay: `${delay}ms`,
        // Délai d'apparition pour éviter les flickers rapides
        opacity: 0,
        animation: `fadeInSkeleton 0.3s ease-in-out ${delay}ms forwards, skeletonShimmer 1.5s infinite ${delay}ms`
      }}
    >
      {/* Image skeleton */}
      <div className="skeleton-image" />
      
      <div className="skeleton-content">
        {/* Titre principal */}
        <div className="skeleton-line skeleton-title" style={{ width: '75%' }} />
        
        {variant !== 'list' && (
          <>
            {/* Titre secondaire */}
            <div className="skeleton-line skeleton-subtitle" style={{ width: '60%' }} />
            
            {/* Score et infos */}
            <div className="skeleton-meta">
              <div className="skeleton-line skeleton-score" style={{ width: '40px' }} />
              <div className="skeleton-line skeleton-year" style={{ width: '50px' }} />
            </div>
            
            {/* Synopsis */}
            <div className="skeleton-synopsis">
              <div className="skeleton-line" style={{ width: '100%' }} />
              <div className="skeleton-line" style={{ width: '85%' }} />
              <div className="skeleton-line" style={{ width: '70%' }} />
            </div>
            
            {/* Plateformes de streaming */}
            <div className="skeleton-platforms">
              <div className="skeleton-platform-item" />
              <div className="skeleton-platform-item" />
              <div className="skeleton-platform-item" />
            </div>
          </>
        )}
        
        {variant === 'list' && (
          <>
            {/* Mode liste simplifié */}
            <div className="skeleton-line" style={{ width: '50%', marginTop: '8px' }} />
            <div className="skeleton-line" style={{ width: '30%', marginTop: '4px' }} />
          </>
        )}
      </div>
      
      {/* Bouton watchlist skeleton */}
      <div className="skeleton-watchlist-btn" />
    </div>
  );
};

export default SkeletonCard;