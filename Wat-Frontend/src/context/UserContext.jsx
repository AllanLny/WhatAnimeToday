import { createContext, useState, useContext, useEffect } from 'react';

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

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(json => {
        if (!mounted) return;
        if (json && Object.keys(json).length > 0) setUser(json);
      }).catch(() => {});
    return () => { mounted = false; };
  }, []);

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
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;