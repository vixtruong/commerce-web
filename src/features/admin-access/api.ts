import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api/client';
export interface Role {
  id: string;
  name: string;
  isSystemRole: boolean;
  permissions: string[];
}
export interface AccessAudit {
  id: string;
  actorId: string;
  targetId: string;
  action: string;
  before: string;
  after: string;
  createdAtUtc: string;
}
export const rolesQuery = queryOptions({
  queryKey: ['access', 'roles'],
  queryFn: ({ signal }) => api<Role[]>('/api/auth/roles', { signal }),
});
export const permissionsQuery = queryOptions({
  queryKey: ['access', 'catalog'],
  queryFn: ({ signal }) => api<string[]>('/api/auth/permissions', { signal }),
  staleTime: 300_000,
});
