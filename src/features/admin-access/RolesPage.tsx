import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { rolesQuery, permissionsQuery, type AccessAudit } from './api';
import { PermissionGroups } from './PermissionGroups';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { date } from '../../lib/format';
import { useUser } from '../../auth/useUser';
export default function RolesPage() {
  const roles = useQuery(rolesQuery);
  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Role bundles"
        description="Manage the permissions grouped into each staff role."
      />
      {roles.isPending ? (
        <Skeleton />
      ) : roles.error ? (
        <ErrorState error={roles.error} retry={() => void roles.refetch()} />
      ) : (
        <div className="role-list">
          {roles.data.map((role) => (
            <Link key={role.id} to={'/admin/access/roles/' + role.id}>
              <strong>{role.name}</strong>
              <span>{role.permissions.length} permissions</span>
              <small>{role.isSystemRole ? 'Protected system role' : 'Editable permission bundle'} →</small>
            </Link>
          ))}
        </div>
      )}
      <Link className="text-link" to="/admin/access/audit">
        View access-change audit →
      </Link>
    </>
  );
}
export function RoleDetailPage() {
  const actor = useUser();
  const { id } = useParams();
  const client = useQueryClient();
  const roles = useQuery(rolesQuery);
  const catalog = useQuery(permissionsQuery);
  const [selection, setSelection] = useState<string[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const role = roles.data?.find((r) => r.id === id);
  const mutation = useMutation({
    mutationFn: () =>
      api<void>('/api/auth/roles/' + id + '/permissions', {
        method: 'PUT',
        body: { permissions: selection ?? role!.permissions },
      }),
    onSuccess: () => {
      setConfirm(false);
      setSelection(null);
      void client.invalidateQueries({ queryKey: ['access'] });
    },
  });
  if (roles.isPending || catalog.isPending) return <Skeleton />;
  if (roles.error || catalog.error) return <ErrorState error={(roles.error || catalog.error)!} />;
  if (!role)
    return (
      <EmptyState
        code="404"
        title="Role not found."
        description="Select an existing role bundle."
        action="/admin/access/roles"
        actionLabel="View roles"
      />
    );
  const protectedRole = role.isSystemRole || !!actor.data?.roles.includes(role.name);
  return (
    <>
      <PageHeader
        eyebrow="Access / Role bundle"
        title={role.name}
        description={
          protectedRole
            ? 'System roles and roles assigned to your own account are protected from permission changes.'
            : 'Group permissions by capability. Changes apply when access tokens are renewed.'
        }
      />
      <PermissionGroups
        permissions={catalog.data!}
        selected={selection ?? role.permissions}
        onChange={setSelection}
        disabled={protectedRole}
      />
      {!protectedRole && (
        <button
          className="button"
          disabled={!selection || mutation.isPending}
          onClick={() => setConfirm(true)}
        >
          Save permission bundle
        </button>
      )}
      {mutation.error && <ErrorState error={mutation.error} />}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Change this role bundle?"
        description={
          'Replace ' +
          role.name +
          ' permissions. All assigned users receive these permissions at their next token renewal. This change is audited.'
        }
        pending={mutation.isPending}
        error={mutation.error}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
export function AccessAuditPage() {
  const audit = useQuery({
    queryKey: ['access', 'audit'],
    queryFn: ({ signal }) => api<AccessAudit[]>('/api/auth/access/audit', { signal }),
  });
  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Access-change audit"
        description="Latest 100 recorded role assignments and permission-bundle changes."
      />
      {audit.isPending ? (
        <Skeleton />
      ) : audit.error ? (
        <ErrorState error={audit.error} />
      ) : audit.data.length ? (
        <ol className="audit-list">
          {audit.data.map((a) => (
            <li key={a.id}>
              <strong>{a.action}</strong>
              <time>{date(a.createdAtUtc)}</time>
              <p className="small">
                Actor: {a.actorId} · Target: {a.targetId}
              </p>
              <p>Before: {a.before || 'None'}</p>
              <p>After: {a.after || 'None'}</p>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          title="No access changes recorded."
          description="Audited access changes will appear here."
        />
      )}
    </>
  );
}
