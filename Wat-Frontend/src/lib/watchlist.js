const WATCHLIST_KEY = 'wat-watchlist';

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

export async function fetchServerWatchlist() {
  try {
    const res = await fetch('/api/user/watchlist');
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data || []);
  } catch (e) {
    console.error('fetchServerWatchlist error', e);
    return [];
  }
}

export async function addToServerWatchlist(item) {
  try {
    const res = await fetch('/api/user/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add');
    return await res.json();
  } catch (e) {
    console.error('addToServerWatchlist error', e);
    throw e;
  }
}

export async function removeFromServerWatchlist(id) {
  try {
    const res = await fetch(`/api/user/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove');
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
    return await res.json();
  } catch (e) {
    console.error('clearServerWatchlist error', e);
    throw e;
  }
}

export default {
  readLocalWatchlist,
  writeLocalWatchlist,
  fetchServerWatchlist,
  addToServerWatchlist,
  removeFromServerWatchlist,
  clearServerWatchlist
};
