import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api/client';
import { useUser } from '../../auth/useUser';
import { Permissions, can } from '../../auth/permissions';
import { money } from '../../lib/format';
import { PageHeader, ErrorState, Skeleton } from '../../components/Feedback';
import { PanelBoundary } from '../../components/PanelBoundary';
interface Counts {
  total: number;
  statuses: { status: string; count: number }[];
  totals: { currency: string; amount: number }[];
}
interface OrdersSummary {
  total: number;
  processing: number;
  cancelled: number;
  paidTotals: { currency: string; amount: number }[];
  statuses: Counts['statuses'];
}
interface InventorySummary {
  products: number;
  onHand: number;
  reserved: number;
  available: number;
  lowStock: number;
}
export default function DashboardPage() {
  const user = useUser();
  const orders = useQuery({
    queryKey: ['orders', 'summary'],
    queryFn: ({ signal }) => api<OrdersSummary>('/api/orders/summary', { signal }),
    enabled: can(user.data, Permissions.OrderRead),
  });
  const inventory = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: ({ signal }) => api<InventorySummary>('/api/inventory/summary', { signal }),
    enabled: can(user.data, Permissions.InventoryRead),
  });
  const payments = useQuery({
    queryKey: ['payments', 'summary'],
    queryFn: ({ signal }) => api<Counts>('/api/payments/summary', { signal }),
    enabled: can(user.data, Permissions.PaymentRead),
  });
  const shipping = useQuery({
    queryKey: ['shipments', 'summary'],
    queryFn: ({ signal }) => api<Counts>('/api/shipping/summary', { signal }),
    enabled: can(user.data, Permissions.ShipmentRead),
  });
  return (
    <>
      <PageHeader
        eyebrow="Operations overview"
        title="The business, at a glance."
        description="Current service-owned operational summaries."
        action={
          <button
            className="button secondary"
            onClick={() => {
              if (can(user.data, Permissions.OrderRead)) void orders.refetch();
              if (can(user.data, Permissions.InventoryRead)) void inventory.refetch();
              if (can(user.data, Permissions.PaymentRead)) void payments.refetch();
              if (can(user.data, Permissions.ShipmentRead)) void shipping.refetch();
            }}
          >
            Refresh overview
          </button>
        }
      />
      <div className="dashboard-grid">
        {can(user.data, Permissions.OrderRead) && (
          <section className="dashboard-section">
            <h2>Orders</h2>
            {orders.isPending ? (
              <Skeleton />
            ) : orders.error ? (
              <ErrorState error={orders.error} />
            ) : (
              <>
                <div className="metrics">
                  <div>
                    <span>Total orders</span>
                    <strong>{orders.data.total}</strong>
                  </div>
                  <div>
                    <span>Processing</span>
                    <strong>{orders.data.processing}</strong>
                  </div>
                  <div>
                    <span>Cancelled</span>
                    <strong>{orders.data.cancelled}</strong>
                  </div>
                </div>
                {orders.data.paidTotals.map((t) => (
                  <p key={t.currency}>
                    Paid order value: <strong>{money(t.amount, t.currency)}</strong>
                  </p>
                ))}
                <p className="small muted">
                  Order snapshot value, grouped by currency. This is not settled provider revenue.
                </p>
                {orders.data.total > 0 && (
                  <PanelBoundary>
                    <div className="chart-area" role="img" aria-label="Order counts by persisted status">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={orders.data.statuses}>
                          <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#285444" isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </PanelBoundary>
                )}
                <ul className="summary-list">
                  {orders.data.statuses.map((s) => (
                    <li key={s.status}>
                      <span>{s.status}</span>
                      <strong>{s.count}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
        {can(user.data, Permissions.InventoryRead) && (
          <section className="dashboard-section">
            <h2>Stock health</h2>
            {inventory.isPending ? (
              <Skeleton />
            ) : inventory.error ? (
              <ErrorState error={inventory.error} />
            ) : (
              <>
                <div className="metrics">
                  <div>
                    <span>Available units</span>
                    <strong>{inventory.data.available}</strong>
                  </div>
                  <div>
                    <span>Reserved units</span>
                    <strong>{inventory.data.reserved}</strong>
                  </div>
                </div>
                <ul className="summary-list">
                  <li>
                    <span>Physical units</span>
                    <strong>{inventory.data.onHand}</strong>
                  </li>
                  <li>
                    <span>Products with stock records</span>
                    <strong>{inventory.data.products}</strong>
                  </li>
                  <li>
                    <span>Low or zero stock</span>
                    <strong>{inventory.data.lowStock}</strong>
                  </li>
                </ul>
              </>
            )}
          </section>
        )}
        {can(user.data, Permissions.PaymentRead) && (
          <section className="dashboard-section">
            <h2>Payment outcomes</h2>
            {payments.isPending ? (
              <Skeleton />
            ) : payments.error ? (
              <ErrorState error={payments.error} />
            ) : (
              <>
                <p>{payments.data.total} development payment records</p>
                <ul className="summary-list">
                  {payments.data.statuses.map((s) => (
                    <li key={s.status}>
                      <span>{s.status}</span>
                      <strong>{s.count}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
        {can(user.data, Permissions.ShipmentRead) && (
          <section className="dashboard-section">
            <h2>Fulfilment</h2>
            {shipping.isPending ? (
              <Skeleton />
            ) : shipping.error ? (
              <ErrorState error={shipping.error} />
            ) : (
              <>
                <p>{shipping.data.total} shipments</p>
                <ul className="summary-list">
                  {shipping.data.statuses.map((s) => (
                    <li key={s.status}>
                      <span>{s.status}</span>
                      <strong>{s.count}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </div>
    </>
  );
}
