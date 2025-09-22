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
    return savedCountry || 'France'; // Pays par défaut
  });

  // Mettre à jour le localStorage quand le pays change
  useEffect(() => {
    localStorage.setItem('userCountry', country);
  }, [country]);

  // Valeurs et fonctions exposées par le contexte
  const value = {
    country,
    setCountry,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;