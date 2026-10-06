import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api/client';
import { useUser } from '../../auth/useUser';
import { Permissions, can } from '../../auth/permissions';
import { money } from '../../lib/format';
import { PageHeader, ErrorState, Skeleton } from '../../components/Feedback';
import { PanelBoundary } from '../../components/PanelBoundary';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CreditCard,
  RefreshCw,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { Status } from '../../components/Status';
import { statusFor } from '../../lib/status';

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

/** Summary navigation is rendered only after the corresponding read permission is checked. */
function DashboardTitle({ title, href, icon: Icon }: { title: string; href: string; icon: LucideIcon }) {
  return (
    <div className="panel-title">
      <h2>
        <Icon size={18} aria-hidden="true" />
        {title}
      </h2>
      <Link to={href} aria-label={'View ' + title.toLowerCase()}>
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  error,
  icon: Icon,
  href,
}: {
  label: string;
  value?: number;
  error: boolean;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link className="dashboard-kpi" to={href}>
      <div>
        <span>{label}</span>
        <Icon size={18} aria-hidden="true" />
      </div>
      <strong>{value ?? '—'}</strong>
      <small>
        {error ? 'Temporarily unavailable' : value === undefined ? 'Loading summary…' : 'View records'}
        <ArrowUpRight size={13} aria-hidden="true" />
      </small>
    </Link>
  );
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
        eyebrow="Workspace / Overview"
        title="The business, at a glance."
        description="Your operational picture. Pick up where attention is needed."
        action={
          <button
            className="button secondary"
            disabled={orders.isFetching || inventory.isFetching || payments.isFetching || shipping.isFetching}
            onClick={() => {
              if (can(user.data, Permissions.OrderRead)) void orders.refetch();
              if (can(user.data, Permissions.InventoryRead)) void inventory.refetch();
              if (can(user.data, Permissions.PaymentRead)) void payments.refetch();
              if (can(user.data, Permissions.ShipmentRead)) void shipping.refetch();
            }}
          >
            <RefreshCw size={15} aria-hidden="true" /> Refresh overview
          </button>
        }
      />
      <div className="dashboard-kpis" aria-label="Operational totals">
        {can(user.data, Permissions.OrderRead) && (
          <SummaryMetric
            label="Total orders"
            value={orders.data?.total}
            error={!!orders.error}
            icon={ShoppingBag}
            href="/admin/orders"
          />
        )}
        {can(user.data, Permissions.InventoryRead) && (
          <SummaryMetric
            label="Available units"
            value={inventory.data?.available}
            error={!!inventory.error}
            icon={Boxes}
            href="/admin/inventory"
          />
        )}
        {can(user.data, Permissions.PaymentRead) && (
          <SummaryMetric
            label="Payment records"
            value={payments.data?.total}
            error={!!payments.error}
            icon={CreditCard}
            href="/admin/payments"
          />
        )}
        {can(user.data, Permissions.ShipmentRead) && (
          <SummaryMetric
            label="Shipments"
            value={shipping.data?.total}
            error={!!shipping.error}
            icon={Truck}
            href="/admin/shipments"
          />
        )}
      </div>
      <div
        className={
          'dashboard-grid' + (can(user.data, Permissions.OrderRead) ? '' : ' dashboard-without-orders')
        }
      >
        {can(user.data, Permissions.OrderRead) && (
          <section className="dashboard-section dashboard-orders">
            <DashboardTitle title="Order distribution" href="/admin/orders" icon={ShoppingBag} />
            <p className="small muted">Current persisted states across all orders.</p>
            {orders.isPending ? (
              <Skeleton />
            ) : orders.error ? (
              <ErrorState error={orders.error} retry={() => void orders.refetch()} />
            ) : (
              <>
                {orders.data.total > 0 ? (
                  <PanelBoundary>
                    <div className="chart-area" role="img" aria-label="Order counts by persisted status">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={orders.data.statuses}
                          margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="status"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => statusFor('order', String(value)).label}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip labelFormatter={(value) => statusFor('order', String(value)).label} />
                          <Bar
                            dataKey="count"
                            name="Orders"
                            fill="var(--primary)"
                            radius={[2, 2, 0, 0]}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </PanelBoundary>
                ) : (
                  <p className="dashboard-empty">No order records yet. New orders will appear here.</p>
                )}
                <ul className="summary-list order-status-list">
                  {orders.data.statuses.map((state) => (
                    <li key={state.status}>
                      <Status kind="order" value={state.status} />
                      <strong>{state.count}</strong>
                    </li>
                  ))}
                </ul>
                <div className="paid-snapshot">
                  <span className="eyebrow">Paid order value</span>
                  {orders.data.paidTotals.length ? (
                    orders.data.paidTotals.map((total) => (
                      <strong key={total.currency}>{money(total.amount, total.currency)}</strong>
                    ))
                  ) : (
                    <p>No paid order value recorded.</p>
                  )}
                  <small>Order snapshot values by currency. Provider settlement is not represented.</small>
                </div>
              </>
            )}
          </section>
        )}
        <div className="dashboard-side">
          {(can(user.data, Permissions.OrderRead) || can(user.data, Permissions.InventoryRead)) && (
            <section className="dashboard-section attention-panel">
              <p className="eyebrow">Next actions</p>
              <h2>Keep things moving.</h2>
              {can(user.data, Permissions.OrderRead) && (
                <Link className="attention-row" to="/admin/orders">
                  <div>
                    <strong>Orders processing</strong>
                    <small>Review ongoing checkout and fulfilment</small>
                  </div>
                  <span>{orders.data?.processing ?? '—'}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              )}
              {can(user.data, Permissions.InventoryRead) && (
                <Link className="attention-row" to="/admin/inventory">
                  <div>
                    <strong>Low or zero stock</strong>
                    <small>Review stock records and availability</small>
                  </div>
                  <span>{inventory.data?.lowStock ?? '—'}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              )}
              {can(user.data, Permissions.OrderRead) && orders.data && (
                <p className="attention-note">
                  {orders.data.cancelled} cancelled orders recorded. Open orders to inspect the reason and
                  current state.
                </p>
              )}
            </section>
          )}
          {can(user.data, Permissions.InventoryRead) && (
            <section className="dashboard-section">
              <DashboardTitle title="Inventory balance" href="/admin/inventory" icon={Boxes} />
              {inventory.isPending ? (
                <Skeleton rows={2} />
              ) : inventory.error ? (
                <ErrorState error={inventory.error} retry={() => void inventory.refetch()} />
              ) : (
                <ul className="summary-list">
                  <li>
                    <span>Physical units</span>
                    <strong>{inventory.data.onHand}</strong>
                  </li>
                  <li>
                    <span>Reserved units</span>
                    <strong>{inventory.data.reserved}</strong>
                  </li>
                  <li>
                    <span>Products with stock records</span>
                    <strong>{inventory.data.products}</strong>
                  </li>
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
      <div className="dashboard-outcomes">
        {can(user.data, Permissions.PaymentRead) && (
          <section className="dashboard-section">
            <DashboardTitle title="Payment outcomes" href="/admin/payments" icon={CreditCard} />
            {payments.isPending ? (
              <Skeleton rows={2} />
            ) : payments.error ? (
              <ErrorState error={payments.error} retry={() => void payments.refetch()} />
            ) : (
              <>
                <p className="small muted">Development provider records by outcome.</p>
                {payments.data.statuses.length ? (
                  <ul className="summary-list">
                    {payments.data.statuses.map((state) => (
                      <li key={state.status}>
                        <Status kind="payment" value={state.status} />
                        <strong>{state.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dashboard-empty">No payment records yet.</p>
                )}
              </>
            )}
          </section>
        )}
        {can(user.data, Permissions.ShipmentRead) && (
          <section className="dashboard-section">
            <DashboardTitle title="Fulfilment" href="/admin/shipments" icon={Truck} />
            {shipping.isPending ? (
              <Skeleton rows={2} />
            ) : shipping.error ? (
              <ErrorState error={shipping.error} retry={() => void shipping.refetch()} />
            ) : (
              <>
                <p className="small muted">Shipment preparation states. Carrier delivery is not tracked.</p>
                {shipping.data.statuses.length ? (
                  <ul className="summary-list">
                    {shipping.data.statuses.map((state) => (
                      <li key={state.status}>
                        <Status kind="shipment" value={state.status} />
                        <strong>{state.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dashboard-empty">No shipment records yet.</p>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </>
  );
}
