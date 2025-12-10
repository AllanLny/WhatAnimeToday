import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight useInView hook as a small replacement for react-intersection-observer
 * options: { triggerOnce: boolean, rootMargin: string, threshold: number }
 */
export function useInView(options = {}) {
  const { triggerOnce = true, rootMargin = '0px', threshold = 0 } = options;
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setInView(false);
        }
      });
    }, { rootMargin, threshold });

    observer.observe(node);
    
    // Vérification immédiate pour les éléments déjà visibles
    const checkInitialVisibility = () => {
      const rect = node.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        setInView(true);
        if (triggerOnce) observer.disconnect();
      }
    };
    
    // Check après un court délai pour s'assurer que le layout est stable
    const timeoutId = setTimeout(checkInitialVisibility, 50);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [triggerOnce, rootMargin, threshold, inView]);

  return { ref, inView };
}

export default useInView;
