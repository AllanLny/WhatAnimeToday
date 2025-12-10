import { useState, useEffect } from 'react';
import useInView from './useInView';

/**
 * 🧠 Hook simplifié pour le chargement progressif des AnimeCards
 * - Pour les premières cards (visibles), chargement immédiat
 * - Pour les autres, utilise Intersection Observer
 */
export const useProgressiveLoading = ({ 
  anime, 
  index = 0, 
  enabled = true,
  delayPerCard = 100 // Délai entre chaque card en ms
}) => {
  // Les 6 premières cards (généralement visibles) se chargent immédiatement
  const shouldLoadImmediately = index < 6;
  const [isLoaded, setIsLoaded] = useState(shouldLoadImmediately);
  
  // Intersection Observer pour les cards plus bas
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '300px' // Zone plus large pour anticiper
  });
  
  // Chargement immédiat pour les premières cards
  useEffect(() => {
    if (shouldLoadImmediately && !isLoaded) {
      const delay = index * delayPerCard;
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldLoadImmediately, isLoaded, index, delayPerCard]);
  
  // Chargement conditionnel pour les cards plus bas
  useEffect(() => {
    if (!shouldLoadImmediately && enabled && !isLoaded) {
      // Si l'Intersection Observer ne fonctionne pas, on charge après un délai plus long
      const fallbackDelay = inView ? 200 : 3000; // 3s si pas encore visible
      
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, fallbackDelay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldLoadImmediately, inView, enabled, isLoaded, index]);
  
  return {
    ref: shouldLoadImmediately ? null : ref, // Pas de ref pour les premières cards
    isLoaded,
    showSkeleton: !isLoaded,
    skeletonDelay: index * delayPerCard
  };
};