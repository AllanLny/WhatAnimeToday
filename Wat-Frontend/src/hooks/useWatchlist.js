import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '../context/UserContext';
import { fetchAnimeDetailsById } from '../services/api';

// Clé de cache pour TanStack Query
const WATCHLIST_QUERY_KEY = ['watchlist'];

// Fonction pour récupérer la watchlist depuis le backend
const fetchWatchlist = async () => {
  try {
    const res = await fetch('/api/user/watchlist');
    if (!res.ok) {
      if (res.status === 401) {
        // Non authentifié, retourner liste vide
        return [];
      }
      throw new Error(`Failed to fetch watchlist: ${res.status}`);
    }
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
};

// Fonction pour enrichir la watchlist avec les détails complets des animes
const enrichWatchlistWithDetails = async (watchlist) => {
  if (!Array.isArray(watchlist) || watchlist.length === 0) {
    return watchlist;
  }

  const enrichedItems = await Promise.all(
    watchlist.map(async (item) => {
      try {
        // Récupérer les détails complets de l'anime
        console.log(`🔍 Fetching details for anime_id: ${item.anime_id}`);
        const details = await fetchAnimeDetailsById(item.anime_id);
        console.log(`📋 Details received for ${item.anime_id}:`, details);
        
        if (details) {
          return {
            ...item,
            // Mapper les données backend vers le format attendu par AnimeCard
            mal_id: item.anime_id,
            id: item.anime_id,
            title: details.title || `Anime ${item.anime_id}`,
            title_english: details.title_english,
            synopsis: details.synopsis || 'Synopsis non disponible',
            images: details.images || {
              jpg: { image_url: '/placeholder-anime.jpg' }
            },
            score: details.score,
            status: item.status || 'planned',
            source: item.source || 'mal',
            genres: details.genres,
            year: details.year,
            episode_count: details.episode_count,
            broadcast: details.broadcast
          };
        } else {
          // Si on ne peut pas récupérer les détails, utiliser des valeurs par défaut
          console.warn(`⚠️ No details found for anime_id: ${item.anime_id}`);
          return {
            ...item,
            mal_id: item.anime_id,
            id: item.anime_id,
            title: `Anime ${item.anime_id}`,
            synopsis: 'Synopsis non disponible',
            images: {
              jpg: { image_url: '/placeholder-anime.jpg' }
            },
            status: item.status || 'planned',
            source: item.source || 'mal'
          };
        }
      } catch (error) {
        console.error(`❌ Error enriching anime ${item.anime_id}:`, error);
        return {
          ...item,
          mal_id: item.anime_id,
          id: item.anime_id,
          title: `Anime ${item.anime_id}`,
          synopsis: 'Erreur lors du chargement',
          images: {
            jpg: { image_url: '/placeholder-anime.jpg' }
          },
          status: item.status || 'planned',
          source: item.source || 'mal'
        };
      }
    })
  );

  return enrichedItems;
};

// Fonction pour ajouter un anime au backend
const addAnimeToWatchlist = async (anime) => {
  const animeId = anime.mal_id || anime.id || anime.slug;
  if (!animeId) {
    throw new Error('No anime ID found');
  }

  const payload = {
    mal_id: animeId,
    anime_id: animeId,
    source: anime.source || 'mal',
    status: anime.status || 'planned'
  };

  const res = await fetch('/api/user/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to add anime: ${res.status} - ${error}`);
  }
  
  return res.json();
};

// Fonction pour supprimer un anime du backend
const removeAnimeFromWatchlist = async (animeId) => {
  // On doit d'abord récupérer l'ID de la watchlist depuis le backend
  // car on stocke le mal_id mais on a besoin du DB ID pour la suppression
  const watchlist = await fetchWatchlist();
  const item = watchlist.find(w => w.anime_id === animeId);
  
  if (!item || !item.id) {
    throw new Error('Anime not found in watchlist');
  }

  const res = await fetch(`/api/user/watchlist/${encodeURIComponent(item.id)}`, {
    method: 'DELETE'
  });
  
  if (!res.ok) {
    throw new Error(`Failed to remove anime: ${res.status}`);
  }
  
  return res.json();
};

/**
 * Hook pour gérer l'état d'un anime spécifique dans la watchlist
 * Utilise TanStack Query pour le cache et la synchronisation
 */
export const useWatchlistStatus = (anime) => {
  const { isAuthenticated } = useUserContext() || { isAuthenticated: false };
  const queryClient = useQueryClient();
  
  const animeId = anime?.mal_id || anime?.id || anime?.slug;

  // Récupérer la watchlist avec TanStack Query
  const { data: watchlist = [], isLoading: isFetching } = useQuery({
    queryKey: WATCHLIST_QUERY_KEY,
    queryFn: fetchWatchlist,
    enabled: isAuthenticated,
    staleTime: 0, // Toujours considérer comme stale pour forcer la re-evaluation
    cacheTime: 1000 * 60 * 5, // 5 minutes de cache
  });

  // Vérifier si l'anime est dans la watchlist
  const inList = watchlist.some(item => {
    const itemId = item.anime_id || item.mal_id || item.id;
    return itemId === animeId;
  });

  // Log l'état actuel pour debug
  console.log(`💖 Watchlist status for anime ${animeId}:`, { 
    inList, 
    watchlistLength: watchlist.length, 
    isAuthenticated,
    watchlistIds: watchlist.map(w => w.anime_id || w.mal_id || w.id)
  });

  // Mutation pour ajouter à la watchlist
  const addMutation = useMutation({
    mutationFn: () => addAnimeToWatchlist(anime),
    // Mise à jour optimiste - met à jour l'UI immédiatement
    onMutate: async () => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: WATCHLIST_QUERY_KEY });
      
      // Récupérer les données actuelles
      const previousWatchlist = queryClient.getQueryData(WATCHLIST_QUERY_KEY);
      
      // Mettre à jour optimistiquement
      queryClient.setQueryData(WATCHLIST_QUERY_KEY, (old = []) => [
        ...old,
        { anime_id: animeId, status: 'planned', source: 'mal' }
      ]);
      
      // Retourner le contexte pour rollback si nécessaire
      return { previousWatchlist };
    },
    onSuccess: () => {
      // Invalider pour synchroniser avec le serveur
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
      // Force re-render de tous les composants qui utilisent la watchlist
      queryClient.refetchQueries({ queryKey: WATCHLIST_QUERY_KEY });
      console.log(`✅ Anime ${animeId} ajouté à la watchlist`);
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousWatchlist) {
        queryClient.setQueryData(WATCHLIST_QUERY_KEY, context.previousWatchlist);
      }
      console.error('Error adding anime to watchlist:', error);
    }
  });

  // Mutation pour supprimer de la watchlist
  const removeMutation = useMutation({
    mutationFn: () => removeAnimeFromWatchlist(animeId),
    // Mise à jour optimiste
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: WATCHLIST_QUERY_KEY });
      
      const previousWatchlist = queryClient.getQueryData(WATCHLIST_QUERY_KEY);
      
      // Retirer optimistiquement
      queryClient.setQueryData(WATCHLIST_QUERY_KEY, (old = []) =>
        old.filter(item => item.anime_id !== animeId)
      );
      
      return { previousWatchlist };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
      // Force re-render de tous les composants qui utilisent la watchlist
      queryClient.refetchQueries({ queryKey: WATCHLIST_QUERY_KEY });
      console.log(`✅ Anime ${animeId} retiré de la watchlist`);
    },
    onError: (error, variables, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(WATCHLIST_QUERY_KEY, context.previousWatchlist);
      }
      console.error('Error removing anime from watchlist:', error);
    }
  });

  // Fonction toggle pour ajouter/retirer
  const toggleWatchlist = async (event) => {
    if (event?.stopPropagation) event.stopPropagation();
    if (!animeId || !isAuthenticated) return;

    if (inList) {
      await removeMutation.mutateAsync();
    } else {
      await addMutation.mutateAsync();
    }
  };

  const isLoading = addMutation.isLoading || removeMutation.isLoading || isFetching;

  return {
    inList,
    isLoading,
    toggleWatchlist,
    addMutation,
    removeMutation
  };
};

/**
 * Hook pour obtenir la watchlist complète avec détails enrichis
 * Utilise TanStack Query pour le cache
 */
export const useWatchlist = () => {
  const { isAuthenticated } = useUserContext() || { isAuthenticated: false };
  const queryClient = useQueryClient();

  const { 
    data: rawWatchlist = [], 
    isLoading: isFetching, 
    error,
    refetch 
  } = useQuery({
    queryKey: WATCHLIST_QUERY_KEY,
    queryFn: fetchWatchlist,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  // Enrichir la watchlist avec les détails complets
  const { 
    data: enrichedWatchlist = [], 
    isLoading: isEnriching 
  } = useQuery({
    queryKey: ['watchlist-enriched', rawWatchlist?.length || 0],
    queryFn: () => enrichWatchlistWithDetails(rawWatchlist),
    enabled: isAuthenticated && rawWatchlist?.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes pour les détails enrichis
    cacheTime: 1000 * 60 * 60, // 1 heure
  });

  // Fonction pour forcer un reload du cache
  const reloadWatchlist = () => {
    queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['watchlist-enriched'] });
  };

  const isLoading = isFetching || isEnriching;
  const watchlist = rawWatchlist?.length > 0 ? enrichedWatchlist : [];

  return {
    watchlist,
    isLoading,
    error,
    reloadWatchlist,
    refetch
  };
};

// Hook pour vider la watchlist
export const useClearWatchlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/watchlist/clear', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to clear watchlist');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalider et vider le cache
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
      console.log('✅ Watchlist cleared');
    },
    onError: (error) => {
      console.error('Error clearing watchlist:', error);
    }
  });
};