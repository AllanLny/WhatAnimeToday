import { createContext, useState, useContext, useEffect } from 'react';
import { readLocalWatchlist, writeLocalWatchlist, fetchServerWatchlist, addToServerWatchlist } from '../lib/watchlist';

// Création du contexte
const UserContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useUserContext = () => useContext(UserContext);

// Provider du contexte
export const UserProvider = ({ children }) => {
  const [country, setCountry] = useState(() => {
    // Essayer de récupérer le pays depuis le localStorage
    const savedCountry = localStorage.getItem('userCountry');
    return savedCountry || 'FR'; // Code pays par défaut (France)
  });

  // User object from server session (Discord) — fetched once on mount
  const [user, setUser] = useState(null);
  const [syncingWatchlist, setSyncingWatchlist] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        const r = await fetch('/api/auth/me');
        const json = await r.json();
        
        if (!mounted) return;
        
        if (json && Object.keys(json).length > 0) {
          setUser(json);
          
          // User just logged in: sync watchlist
          console.log('🔄 User authenticated, syncing watchlist...');
          await syncWatchlistOnLogin();
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    };
    
    checkAuth();
    return () => { mounted = false; };
  }, []);

  // Sync local watchlist with server when user logs in
  const syncWatchlistOnLogin = async () => {
    try {
      setSyncingWatchlist(true);
      
      // Get local and server watchlists
      const local = readLocalWatchlist();
      const server = await fetchServerWatchlist();
      
      if (!local || local.length === 0) {
        console.log('✅ No local items to sync');
        setSyncingWatchlist(false);
        return;
      }
      
      // Get anime IDs that are already on server
      const serverIds = new Set(server.map(item => item.mal_id || item.id));
      
      // Add local items that are not on server
      const itemsToAdd = local.filter(item => {
        const id = item.mal_id || item.id || item.slug;
        return !serverIds.has(id);
      });
      
      console.log(`📤 Syncing ${itemsToAdd.length} local items to server...`);
      
      let successCount = 0;
      for (const item of itemsToAdd) {
        try {
          await addToServerWatchlist(item);
          successCount++;
        } catch (err) {
          console.warn(`Failed to sync item ${item.mal_id || item.id}:`, err);
        }
      }
      
      console.log(`✅ Synced ${successCount}/${itemsToAdd.length} items to server`);
      setSyncingWatchlist(false);
    } catch (err) {
      console.error('❌ Error syncing watchlist:', err);
      setSyncingWatchlist(false);
    }
  };

  // Mettre à jour le localStorage quand le pays change
  useEffect(() => {
    localStorage.setItem('userCountry', country);
  }, [country]);

  // Valeurs et fonctions exposées par le contexte
  const value = {
    country,
    setCountry,
    user,
    isAuthenticated: !!user,
    syncingWatchlist,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;