import { QueryClient } from '@tanstack/react-query';
import { retryQuery } from '../api/client';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryQuery,
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: { retry: false },
  },
});
window.addEventListener('commerce:session-ended', () => {
  void queryClient.cancelQueries();
  queryClient.clear();
  queryClient.setQueryData(['auth', 'me'], null);
});
