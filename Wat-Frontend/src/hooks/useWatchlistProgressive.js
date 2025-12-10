import { useState, useEffect } from 'react';
import { useWatchlist } from './useWatchlist';

/**
 * 🎯 Hook pour le chargement progressif de la watchlist
 * Charge chaque anime individuellement avec un système de skeleton intelligent
 */
export const useWatchlistProgressive = () => {
  const { watchlist, isLoading: isFetchingWatchlist, error } = useWatchlist();
  const [loadedAnimes, setLoadedAnimes] = useState(new Set());
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);
  
  // Charger les animes un par un avec un délai
  useEffect(() => {
    if (!isFetchingWatchlist && watchlist.length > 0) {
      const loadNextAnime = () => {
        if (currentLoadingIndex < watchlist.length) {
          setLoadedAnimes(prev => new Set([...prev, currentLoadingIndex]));
          setCurrentLoadingIndex(prev => prev + 1);
        }
      };
      
      // Charger le premier immédiatement, puis les autres avec délai
      if (currentLoadingIndex === 0) {
        loadNextAnime();
      } else {
        const timer = setTimeout(loadNextAnime, 200); // 200ms entre chaque anime
        return () => clearTimeout(timer);
      }
    }
  }, [watchlist.length, isFetchingWatchlist, currentLoadingIndex]);
  
  // Reset quand la watchlist change
  useEffect(() => {
    setLoadedAnimes(new Set());
    setCurrentLoadingIndex(0);
  }, [watchlist.length]);
  
  const getAnimeLoadingState = (index) => {
    const isLoaded = loadedAnimes.has(index);
    const isLoading = index === currentLoadingIndex;
    const shouldShowSkeleton = !isLoaded && !isLoading;
    
    return {
      isLoaded,
      isLoading,
      shouldShowSkeleton,
      anime: isLoaded ? watchlist[index] : null,
      skeletonDelay: index * 50 // Délai d'animation pour les skeletons
    };
  };
  
  return {
    watchlist,
    isLoading: isFetchingWatchlist,
    error,
    loadedAnimes,
    totalCount: watchlist.length,
    getAnimeLoadingState,
    isFullyLoaded: loadedAnimes.size === watchlist.length && watchlist.length > 0
  };
};