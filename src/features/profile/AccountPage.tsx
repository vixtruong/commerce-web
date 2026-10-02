import { messages } from '../../lib/messages';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { logout } from '../../api/client';
import { useUser } from '../../auth/useUser';
import { Permissions } from '../../auth/permissions';
import { Can } from '../../auth/Guards';
import { ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
export default function AccountPage() {
  const user = useUser();
  const signOut = useMutation({ mutationFn: logout });
  if (user.isPending) return <Skeleton />;
  if (!user.data) return null;
  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Account overview"
        description="Your account information and order history."
      />
      <div className="account-grid">
        <section>
          <h2>Profile</h2>
          <dl className="detail-facts">
            <div>
              <dt>{messages.emailAddress}</dt>
              <dd>{user.data.email}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{user.data.roles.join(', ')}</dd>
            </div>
          </dl>
          <p className="muted small">
            Profile changes and password changes are not exposed by this reference store.
          </p>
          <button className="button secondary" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
            {signOut.isPending ? 'Signing out…' : 'Sign out'}
          </button>
          {signOut.error && <ErrorState error={signOut.error} />}
        </section>
        <section>
          <h2>Your orders</h2>
          <p>View product snapshots, delivery details, and the latest order state.</p>
          <Link className="text-link" to="/orders">
            Open order history →
          </Link>
          <Can permission={Permissions.BackofficeAccess}>
            <hr />
            <h2>Back office</h2>
            <Link className="text-link" to="/admin">
              Open operations portal →
            </Link>
          </Can>
        </section>
      </div>
    </>
  );
}
