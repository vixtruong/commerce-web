import { messages } from '../lib/messages';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from './useUser';
import { ApiError } from '../api/client';
import { can, hasAllPermissions, hasAnyPermission, type Permission } from './permissions';
import { EmptyState, ErrorState, Skeleton } from '../components/Feedback';
export function RequireAuth() {
  const user = useUser();
  const location = useLocation();
  if (user.isPending) return <Skeleton />;
  if (user.error && !(user.error instanceof ApiError && user.error.status === 401))
    return <ErrorState error={user.error} retry={() => void user.refetch()} />;
  return user.data ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  );
}
export function RequirePermission({ permission }: { permission: Permission }) {
  const user = useUser();
  return can(user.data, permission) ? (
    <Outlet />
  ) : (
    <EmptyState
      title={messages.accessDenied}
      description={messages.forbiddenDescription}
      action="/products"
      actionLabel={messages.returnToStore}
      code="403"
    />
  );
}
export function Can({
  permission,
  allOf,
  anyOf,
  children,
}: {
  permission?: Permission;
  allOf?: Permission[];
  anyOf?: Permission[];
  children: ReactNode;
}) {
  const user = useUser();
  const allowed =
    (!permission || can(user.data, permission)) &&
    (!allOf || hasAllPermissions(user.data, allOf)) &&
    (!anyOf || hasAnyPermission(user.data, anyOf));
  return allowed ? children : null;
}
