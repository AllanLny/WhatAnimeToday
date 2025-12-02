const WATCHLIST_KEY = 'wat-watchlist';
const WATCHLIST_MAPPING_KEY = 'wat-watchlist-mapping'; // Maps mal_id -> watchlist DB id
const WATCHLIST_DETAILS_KEY = 'wat-watchlist-details'; // Stores full anime details locally

export function readLocalWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('readLocalWatchlist error', e);
    return [];
  }
}

export function writeLocalWatchlist(list) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list || []));
  } catch (e) {
    console.error('writeLocalWatchlist error', e);
  }
}

// Store mapping of mal_id -> watchlist DB id for deletion
export function readWatchlistMapping() {
  try {
    const raw = localStorage.getItem(WATCHLIST_MAPPING_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('readWatchlistMapping error', e);
    return {};
  }
}

export function writeWatchlistMapping(mapping) {
  try {
    localStorage.setItem(WATCHLIST_MAPPING_KEY, JSON.stringify(mapping || {}));
  } catch (e) {
    console.error('writeWatchlistMapping error', e);
  }
}

// Store complete anime details locally (no DB storage, just local enrichment)
export function readWatchlistDetails() {
  try {
    const raw = localStorage.getItem(WATCHLIST_DETAILS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('readWatchlistDetails error', e);
    return {};
  }
}

export function writeWatchlistDetails(details) {
  try {
    localStorage.setItem(WATCHLIST_DETAILS_KEY, JSON.stringify(details || {}));
  } catch (e) {
    console.error('writeWatchlistDetails error', e);
  }
}

export function addAnimeDetails(animeId, details) {
  const allDetails = readWatchlistDetails();
  allDetails[animeId] = details;
  writeWatchlistDetails(allDetails);
}

export async function fetchServerWatchlist() {
  try {
    const res = await fetch('/api/user/watchlist');
    if (!res.ok) {
      console.warn(`⚠️ fetchServerWatchlist failed with status ${res.status}`);
      return [];
    }
    const json = await res.json();
    
    // Expected format: array of { id, anime_id, status, source, ... }
    // Convert to local format and enrich with stored details
    if (!Array.isArray(json)) return [];
    
    const details = readWatchlistDetails();
    const mapping = {};
    
    const localList = json.map(item => {
      const mal_id = item.anime_id;
      if (item.id) {
        mapping[mal_id] = item.id; // Map mal_id -> DB id for deletion
      }
      
      // Enrich with locally stored details if available
      const storedDetails = details[mal_id] || {};
      
      return {
        mal_id: mal_id,
        id: mal_id,
        source: item.source || 'mal',
        status: item.status || 'planned',
        // Include all stored details if they exist
        ...storedDetails
      };
    });
    
    // Update mapping for later deletion
    writeWatchlistMapping(mapping);
    
    console.log(`✅ Fetched ${localList.length} items from server`);
    return localList;
  } catch (e) {
    console.error('fetchServerWatchlist error', e);
    return [];
  }
}

export async function addToServerWatchlist(item) {
  try {
    // Extract the anime ID (prefer mal_id, fallback to id or slug)
    const animeId = item.mal_id || item.id || item.slug;
    if (!animeId) {
      throw new Error('No anime ID in item');
    }

    // Store full anime details locally (image, title, synopsis, etc.)
    // Don't send all this to server - keep DB light
    const animeDetails = {
      title: item.title,
      title_english: item.title_english,
      synopsis: item.synopsis,
      images: item.images,
      score: item.score,
      year: item.year,
      first_air_date: item.first_air_date,
      status: item.status,
      episode_count: item.episode_count,
      genres: item.genres,
      broadcast: item.broadcast
    };
    addAnimeDetails(animeId, animeDetails);

    // Send only minimal info to server
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
    
    // Store mapping for future deletion
    if (response.id && animeId) {
      const mapping = readWatchlistMapping();
      mapping[animeId] = response.id;
      writeWatchlistMapping(mapping);
      console.log(`✅ Added anime ${animeId} to server (DB id: ${response.id})`);
    }
    
    return response;
  } catch (e) {
    console.error('addToServerWatchlist error', e);
    throw e;
  }
}

export async function removeFromServerWatchlist(animeIdOrMalId) {
  try {
    // Look up the watchlist DB ID from our mapping
    const mapping = readWatchlistMapping();
    const dbId = mapping[animeIdOrMalId];
    
    if (!dbId) {
      console.warn(`⚠️ No watchlist DB ID found for ${animeIdOrMalId}. Skipping server deletion.`);
      return { success: false, reason: 'ID not found' };
    }

    const res = await fetch(`/api/user/watchlist/${encodeURIComponent(dbId)}`, { 
      method: 'DELETE' 
    });
    
    if (!res.ok) {
      console.warn(`⚠️ removeFromServerWatchlist failed: ${res.status}`);
      throw new Error(`Failed to remove (${res.status})`);
    }
    
    // Remove from mapping
    delete mapping[animeIdOrMalId];
    writeWatchlistMapping(mapping);
    
    // Also remove from details
    const details = readWatchlistDetails();
    delete details[animeIdOrMalId];
    writeWatchlistDetails(details);
    
    console.log(`✅ Removed anime ${animeIdOrMalId} from server and local details`);
    return await res.json();
  } catch (e) {
    console.error('removeFromServerWatchlist error', e);
    throw e;
  }
}

export async function clearServerWatchlist() {
  try {
    const res = await fetch(`/api/user/watchlist/clear`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear');
    
    // Also clear local details
    writeWatchlistDetails({});
    writeWatchlistMapping({});
    
    console.log(`✅ Cleared watchlist`);
    return await res.json();
  } catch (e) {
    console.error('clearServerWatchlist error', e);
    throw e;
  }
}

export default {
  readLocalWatchlist,
  writeLocalWatchlist,
  readWatchlistDetails,
  writeWatchlistDetails,
  addAnimeDetails,
  fetchServerWatchlist,
  addToServerWatchlist,
  removeFromServerWatchlist,
  clearServerWatchlist
};
