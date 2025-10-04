import { useState, useEffect, useRef, useCallback } from 'react';

// Fonctions d'easing (à l'extérieur pour éviter les re-créations)
const easingFunctions = {
  linear: (t) => t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  bounce: (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};

/**
 * 🎯 Hook pour animer un compteur jusqu'à une valeur cible
 * @param {number} targetValue - Valeur cible à atteindre
 * @param {number} duration - Durée de l'animation en millisecondes (défaut: 2000ms)
 * @param {boolean} shouldStart - Déclenche l'animation quand true
 * @param {string} easing - Type d'easing ('linear', 'easeOut', 'easeInOut')
 * @returns {number} La valeur actuelle du compteur
 */
export const useCounterAnimation = (
  targetValue = 0,
  duration = 2000,
  shouldStart = true,
  easing = 'easeOut'
) => {
  const [currentValue, setCurrentValue] = useState(0);
  const frameRef = useRef();
  const startTimeRef = useRef();

  const animate = useCallback((currentTime) => {
    if (!startTimeRef.current) {
      startTimeRef.current = currentTime;
    }

    const elapsed = currentTime - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Appliquer l'easing
    const easedProgress = easingFunctions[easing] ? 
      easingFunctions[easing](progress) : 
      easingFunctions.easeOut(progress);

    // Calculer la valeur actuelle
    const newValue = Math.floor(targetValue * easedProgress);
    setCurrentValue(newValue);

    // Continuer l'animation si pas terminée
    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      // S'assurer que la valeur finale est exacte
      setCurrentValue(targetValue);
    }
  }, [targetValue, duration, easing]);

  useEffect(() => {
    if (shouldStart && targetValue > 0) {
      // Reset pour démarrer l'animation
      setCurrentValue(0);
      startTimeRef.current = null;
      
      // Démarrer l'animation
      frameRef.current = requestAnimationFrame(animate);

      // Cleanup
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }
  }, [targetValue, shouldStart, animate]);

  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return currentValue;
};

/**
 * 🎯 Composant simple pour afficher un compteur animé
 * @param {number} value - Valeur cible
 * @param {boolean} shouldAnimate - Si l'animation doit démarrer
 * @param {number} duration - Durée de l'animation
 * @param {Function} formatter - Fonction pour formater la valeur (ex: formatNumber)
 */
export const AnimatedCounter = ({ 
  value, 
  shouldAnimate = true, 
  duration = 1500, 
  formatter = (n) => n.toString(),
  delay = 0 
}) => {
  const [startAnimation, setStartAnimation] = useState(false);
  const animatedValue = useCounterAnimation(value, duration, startAnimation, 'easeOut');
  
  useEffect(() => {
    if (shouldAnimate && value > 0) {
      const timer = setTimeout(() => {
        setStartAnimation(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, value, delay]);
  
  return formatter(animatedValue);
};