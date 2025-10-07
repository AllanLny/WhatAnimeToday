import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight useInView hook as a small replacement for react-intersection-observer
 * options: { triggerOnce: boolean, rootMargin: string }
 */
export function useInView(options = {}) {
  const { triggerOnce = true, rootMargin = '0px' } = options;
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
    }, { rootMargin });

    observer.observe(node);
    return () => observer.disconnect();
  }, [triggerOnce, rootMargin]);

  return { ref, inView };
}

export default useInView;
