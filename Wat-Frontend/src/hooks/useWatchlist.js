import { useState, useEffect, useCallback } from 'react';
import { 
  readLocalWatchlist, 
  writeLocalWatchlist, 
  addToServerWatchlist, 
  removeFromServerWatchlist 
} from '../lib/watchlist';
import { useUserContext } from '../context/UserContext';

// Événement personnalisé pour synchroniser l'état entre tous les composants
const WATCHLIST_CHANGED_EVENT = 'watchlist-changed';

/**
 * Hook personnalisé pour gérer l'état de la watchlist
 * Synchronise automatiquement tous les composants AnimeCard
 */
export const useWatchlistStatus = (anime) => {
  const { isAuthenticated } = useUserContext() || { isAuthenticated: false };
  const [inList, setInList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const animeId = anime?.mal_id || anime?.id || anime?.slug;

  // Vérifier si l'anime est dans la watchlist
  const checkWatchlistStatus = useCallback(() => {
    if (!animeId) return;
    
    try {
      const local = readLocalWatchlist();
      const found = local.some(i => (i.mal_id || i.id || i.slug) === animeId);
      setInList(!!found);
    } catch (err) {
      console.warn('Error checking watchlist status:', err);
    }
  }, [animeId]);

  // Écouter les changements de watchlist
  useEffect(() => {
    checkWatchlistStatus();

    const handleWatchlistChange = (event) => {
      const { animeId: changedAnimeId, action } = event.detail;
      
      // Si c'est notre anime qui a changé, mettre à jour l'état
      if (changedAnimeId === animeId) {
        setInList(action === 'added');
      } else {
        // Sinon, revérifier notre statut (au cas où)
        checkWatchlistStatus();
      }
    };

    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChange);

    return () => {
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChange);
    };
  }, [animeId, checkWatchlistStatus]);

  // Émettre un événement de changement
  const emitWatchlistChange = useCallback((animeId, action) => {
    const event = new CustomEvent(WATCHLIST_CHANGED_EVENT, {
      detail: { animeId, action }
    });
    window.dispatchEvent(event);
  }, []);

  // Ajouter/retirer de la watchlist
  const toggleWatchlist = useCallback(async (event) => {
    if (event?.stopPropagation) event.stopPropagation();
    if (!animeId || isLoading) return;

    setIsLoading(true);

    try {
      if (inList) {
        // Retirer de la watchlist
        const next = readLocalWatchlist().filter(i => (i.mal_id || i.id || i.slug) !== animeId);
        writeLocalWatchlist(next);
        
        // Mettre à jour l'état local immédiatement
        setInList(false);
        emitWatchlistChange(animeId, 'removed');
        
        // Synchroniser avec le serveur
        if (isAuthenticated) {
          try {
            await removeFromServerWatchlist(animeId);
          } catch (e) {
            console.warn('Failed to remove from server:', e);
          }
        }
      } else {
        // Ajouter à la watchlist
        const newItem = {
          mal_id: anime.mal_id,
          id: anime.id,
          slug: anime.slug,
          title: anime.title,
          title_english: anime.title_english,
          synopsis: anime.synopsis,
          images: anime.images,
          score: anime.score,
          year: anime.year,
          first_air_date: anime.first_air_date,
          status: anime.status,
          episode_count: anime.episodes,
          genres: anime.genres,
          broadcast: anime.broadcast
        };
        
        const next = [newItem, ...readLocalWatchlist()];
        writeLocalWatchlist(next);
        
        // Mettre à jour l'état local immédiatement
        setInList(true);
        emitWatchlistChange(animeId, 'added');
        
        // Synchroniser avec le serveur
        if (isAuthenticated) {
          try {
            await addToServerWatchlist(newItem);
          } catch (e) {
            console.warn('Failed to add to server:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      // En cas d'erreur, revenir à l'état précédent
      checkWatchlistStatus();
    } finally {
      setIsLoading(false);
    }
  }, [anime, animeId, inList, isLoading, isAuthenticated, emitWatchlistChange, checkWatchlistStatus]);

  return {
    inList,
    isLoading,
    toggleWatchlist
  };
};

/**
 * Hook pour obtenir la watchlist complète
 */
export const useWatchlist = () => {
  const { isAuthenticated } = useUserContext() || { isAuthenticated: false };
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Utilisateur connecté : charger depuis le serveur
        const { fetchServerWatchlist } = await import('../lib/watchlist');
        const serverList = await fetchServerWatchlist();
        setWatchlist(serverList);
      } else {
        // Utilisateur non connecté : charger depuis localStorage
        const list = readLocalWatchlist();
        setWatchlist(list);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      // Fallback vers localStorage en cas d'erreur serveur
      const list = readLocalWatchlist();
      setWatchlist(list);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Recharger la watchlist quand elle change ou quand l'authentification change
  useEffect(() => {
    loadWatchlist();

    const handleWatchlistChange = () => {
      loadWatchlist();
    };

    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChange);

    return () => {
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChange);
    };
  }, [loadWatchlist]);

  return {
    watchlist,
    isLoading,
    reloadWatchlist: loadWatchlist
  };
};