// ⚠️ DEPRECATED: Ce fichier est conservé uniquement pour compatibilité temporaire
// La watchlist utilise maintenant TanStack Query via useWatchlist.js

/**
 * @deprecated Utiliser useWatchlist() hook à la place
 * Récupérer la watchlist depuis le backend
 */
export async function fetchServerWatchlist() {
  try {
    const res = await fetch('/api/user/watchlist');
    if (!res.ok) {
      console.warn(`⚠️ fetchServerWatchlist failed with status ${res.status}`);
      return [];
    }
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.error('fetchServerWatchlist error', e);
    return [];
  }
}

/**
 * @deprecated Utiliser useWatchlistStatus().toggleWatchlist() à la place
 * Ajouter un anime au backend
 */
export async function addToServerWatchlist(item) {
  try {
    const animeId = item.mal_id || item.id || item.slug;
    if (!animeId) {
      throw new Error('No anime ID in item');
    }

    const payload = {
      mal_id: animeId,
      anime_id: animeId,
      source: item.source || 'mal',
      status: item.status || 'planned'
    };

    const res = await fetch('/api/user/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.warn(`⚠️ addToServerWatchlist failed: ${res.status} - ${error}`);
      throw new Error(`Failed to add (${res.status})`);
    }
    
    const response = await res.json();
    console.log(`✅ Added anime ${animeId} to server`);
    return response;
  } catch (e) {
    console.error('addToServerWatchlist error', e);
    throw e;
  }
}

/**
 * @deprecated Utiliser useWatchlistStatus().toggleWatchlist() à la place
 * Supprimer un anime du backend
 */
export async function removeFromServerWatchlist(animeIdOrMalId) {
  try {
    // Il faut d'abord récupérer la watchlist pour trouver l'ID DB
    const watchlist = await fetchServerWatchlist();
    const item = watchlist.find(w => w.anime_id === animeIdOrMalId);
    
    if (!item || !item.id) {
      console.warn(`⚠️ No watchlist DB ID found for ${animeIdOrMalId}. Skipping server deletion.`);
      return { success: false, reason: 'ID not found' };
    }

    const res = await fetch(`/api/user/watchlist/${encodeURIComponent(item.id)}`, { 
      method: 'DELETE' 
    });
    
    if (!res.ok) {
      console.warn(`⚠️ removeFromServerWatchlist failed: ${res.status}`);
      throw new Error(`Failed to remove (${res.status})`);
    }
    
    console.log(`✅ Removed anime ${animeIdOrMalId} from server`);
    return await res.json();
  } catch (e) {
    console.error('removeFromServerWatchlist error', e);
    throw e;
  }
}

/**
 * @deprecated Utiliser useClearWatchlist() hook à la place
 * Vider la watchlist
 */
export async function clearServerWatchlist() {
  try {
    const res = await fetch(`/api/user/watchlist/clear`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear');
    
    console.log(`✅ Cleared watchlist`);
    return await res.json();
  } catch (e) {
    console.error('clearServerWatchlist error', e);
    throw e;
  }
}

// ⚠️ Fonctions localStorage supprimées - plus utilisées
// La watchlist utilise maintenant uniquement TanStack Query + Backend

export default {
  fetchServerWatchlist,
  addToServerWatchlist,
  removeFromServerWatchlist,
  clearServerWatchlist
};
