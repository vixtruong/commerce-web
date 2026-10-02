import { useQuery } from '@tanstack/react-query';
import { api, hasSession } from '../api/client';
import type { User } from './permissions';
export function useUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: ({ signal }) => (hasSession() ? api<User>('/api/auth/me', { signal }) : Promise.resolve(null)),
    retry: false,
    staleTime: 60_000,
  });
}
