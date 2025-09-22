import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 heures en millisecondes
      cacheTime: 1000 * 60 * 60 * 24, // 24 heures en millisecondes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
