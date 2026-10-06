import { messages } from '../../lib/messages';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { api, queryString } from '../../api/client';
import type { Page } from '../orders/api';
import { Permissions, can, type User } from '../../auth/permissions';
import { useUser } from '../../auth/useUser';
import { useListParams } from '../../hooks/useListParams';
import { rolesQuery } from './api';
import { PermissionGroups } from './PermissionGroups';
import { DataTable, Pagination } from '../../components/DataTable';
import { ListFilters } from '../../components/ListFilters';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { ConfirmDialog } from '../../components/ConfirmDialog';
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'email',
    header: 'Account',
    cell: (c) => (
      <Link className="text-link" to={'/admin/access/users/' + c.row.original.id}>
        {c.row.original.email}
      </Link>
    ),
  },
  { accessorKey: 'roles', header: 'Roles', cell: (c) => c.row.original.roles.join(', ') },
  { id: 'permissionCount', header: 'Effective permissions', cell: (c) => c.row.original.permissions.length },
];
export default function UsersPage() {
  const list = useListParams();
  const filters = { search: list.search, page: list.page, pageSize: 20 };
  const result = useQuery({
    queryKey: ['access', 'users', filters],
    queryFn: ({ signal }) => api<Page<User>>('/api/auth/users?' + queryString(filters), { signal }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Users"
        description="Find accounts and review their assigned roles and access."
      />
      <ListFilters list={list} placeholder={messages.emailAddress} />
      {result.isPending ? (
        <Skeleton />
      ) : result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.data.items.length ? (
        <>
          <DataTable data={result.data.items} columns={columns} caption="Accounts" />
          <Pagination
            page={list.page}
            pageSize={20}
            total={result.data.totalCount}
            pending={result.isPlaceholderData}
            onPage={(p) => list.set('page', String(p))}
          />
        </>
      ) : (
        <EmptyState title="No accounts match this search." description="Try another email address." />
      )}
    </>
  );
}
export function UserAccessPage() {
  const { id = '' } = useParams();
  const actor = useUser();
  const client = useQueryClient();
  const user = useQuery({
    queryKey: ['access', 'user', id],
    queryFn: ({ signal }) => api<User>('/api/auth/users/' + id, { signal }),
  });
  const roles = useQuery({ ...rolesQuery, enabled: can(actor.data, Permissions.RoleManage) });
  const [selection, setSelection] = useState<string[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      api<void>('/api/auth/users/' + id + '/roles', {
        method: 'PUT',
        body: { roles: selection || user.data!.roles },
      }),
    onSuccess: () => {
      setConfirm(false);
      setSelection(null);
      void client.invalidateQueries({ queryKey: ['access'] });
    },
  });
  if (user.isPending) return <Skeleton />;
  if (user.error) return <ErrorState error={user.error} retry={() => void user.refetch()} />;
  const selected = selection ?? user.data.roles;
  const editable = can(actor.data, Permissions.RoleManage) && actor.data?.id !== id;
  return (
    <>
      <PageHeader
        eyebrow="Access / User"
        title={user.data.email}
        description="Effective permissions are the union of this account's role bundles."
      />
      <section>
        <h2>Assigned roles</h2>
        {editable && roles.data ? (
          <>
            <div className="role-options">
              {roles.data.map((r) => (
                <label className="checkbox-label" key={r.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(r.name)}
                    onChange={(e) =>
                      setSelection(
                        e.target.checked ? [...selected, r.name] : selected.filter((n) => n !== r.name),
                      )
                    }
                  />
                  {r.name}
                </label>
              ))}
            </div>
            <button
              className="button"
              disabled={!selection || selection.length === 0 || mutation.isPending}
              onClick={() => setConfirm(true)}
            >
              Save role assignment
            </button>
          </>
        ) : (
          <p>{user.data.roles.join(', ')}</p>
        )}
        {roles.error && editable && <ErrorState error={roles.error} />}
        <p className="small muted">
          Self changes are protected. Assigned users must sign in again after a role change; current access
          tokens expire within 15 minutes.
        </p>
      </section>
      <section className="section">
        <h2>Effective permissions</h2>
        <PermissionGroups permissions={user.data.permissions} selected={user.data.permissions} />
      </section>
      {mutation.error && <ErrorState error={mutation.error} />}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Change this account's access?"
        description={
          'Assign roles: ' + selected.join(', ') + '. This change is audited and revokes refresh sessions.'
        }
        pending={mutation.isPending}
        error={mutation.error}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
