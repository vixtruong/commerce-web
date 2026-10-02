import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, api } from '../../api/client';
import { stockQuery, type Stock, type Reservation } from './api';
import { productQuery } from '../catalog/api';
import { Input } from '../../components/FormField';
import { ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StockStatus } from '../../components/Status';
import { Can } from '../../auth/Guards';
import { Permissions, can } from '../../auth/permissions';
import { useUser } from '../../auth/useUser';
import { date } from '../../lib/format';
const schema = z.object({
  delta: z
    .number()
    .int()
    .min(-2147483647)
    .max(2147483647)
    .refine((d) => d !== 0, 'Enter a nonzero change.'),
  reason: z.string().trim().min(3, 'Explain the stock adjustment.').max(500),
});
type Adjustment = z.infer<typeof schema>;
export default function StockPage() {
  const { productId = '' } = useParams();
  const user = useUser();
  const client = useQueryClient();
  const product = useQuery(productQuery(productId));
  const stock = useQuery(stockQuery(productId));
  const reservations = useQuery({
    queryKey: ['inventory', 'reservations', productId],
    enabled: can(user.data, Permissions.ReservationRead),
    queryFn: ({ signal }) => api<Reservation[]>('/api/inventory/' + productId + '/reservations', { signal }),
  });
  const form = useForm<Adjustment>({
    resolver: zodResolver(schema),
    defaultValues: { delta: 1, reason: '' },
  });
  const [confirmation, setConfirmation] = useState<Adjustment | null>(null);
  const mutation = useMutation({
    mutationFn: (body: Adjustment) =>
      api<Stock>('/api/inventory/' + productId + '/adjustments', {
        method: 'POST',
        body: { ...body, version: stock.data?.version ?? 0 },
      }),
    onSuccess: () => {
      setConfirmation(null);
      form.reset();
      void client.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
  if (product.isPending || stock.isPending) return <Skeleton />;
  if (product.error) return <ErrorState error={product.error} />;
  if (stock.error && !(stock.error instanceof ApiError && stock.error.status === 404))
    return <ErrorState error={stock.error} retry={() => void stock.refetch()} />;
  const s = stock.data ?? { quantityOnHand: 0, reservedQuantity: 0, availableQuantity: 0, version: 0 };
  return (
    <>
      <PageHeader
        eyebrow={product.data.sku}
        title={product.data.name + ' · Stock'}
        description="Every adjustment records the acting administrator and a business reason."
        action={
          <button className="button secondary" onClick={() => void stock.refetch()}>
            Refresh stock
          </button>
        }
      />
      <div className="stock-totals">
        <div>
          <span>On hand</span>
          <strong>{s.quantityOnHand}</strong>
        </div>
        <div>
          <span>Reserved</span>
          <strong>{s.reservedQuantity}</strong>
        </div>
        <div>
          <span>Available</span>
          <strong>{s.availableQuantity}</strong>
        </div>
        <StockStatus available={s.availableQuantity} reserved={s.reservedQuantity} />
      </div>
      <div className="admin-form-layout">
        <Can permission={Permissions.InventoryAdjust}>
          <form onSubmit={form.handleSubmit(setConfirmation)} noValidate>
            <h2>Adjust physical stock</h2>
            <Input
              label="Quantity change"
              type="number"
              required
              {...form.register('delta', { valueAsNumber: true })}
              error={form.formState.errors.delta?.message}
              hint="Positive to receive units; negative to remove units. Reserved units are protected."
            />
            <Input
              label="Reason"
              required
              {...form.register('reason')}
              error={form.formState.errors.reason?.message}
            />
            <button className="button" disabled={mutation.isPending || stock.isFetching} type="submit">
              Review adjustment
            </button>
            {mutation.error && (
              <ErrorState
                error={mutation.error}
                retry={() => {
                  setConfirmation(null);
                  void stock.refetch();
                }}
              />
            )}
          </form>
        </Can>
        <Can permission={Permissions.ReservationRead}>
          <section className="info-panel">
            <h2>Recent reservations</h2>
            <p className="small muted">Latest 100 leases. Reservations are managed by checkout.</p>
            {reservations.isPending ? (
              <Skeleton />
            ) : reservations.error ? (
              <ErrorState error={reservations.error} />
            ) : reservations.data?.length ? (
              <ul className="reservation-list">
                {reservations.data.map((r, i) => (
                  <li key={r.orderId + i}>
                    <Link className="text-link" to={'/admin/orders/' + r.orderId}>
                      {r.orderId.slice(0, 8)}
                    </Link>
                    <span>
                      {r.quantity} units · {r.status}
                    </span>
                    <small>Lease expires {date(r.expiresAtUtc)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No reservations recorded.</p>
            )}
          </section>
        </Can>
      </div>
      <ConfirmDialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
        title="Confirm stock adjustment"
        description={
          confirmation
            ? 'Change physical stock by ' + confirmation.delta + ' units. Reason: ' + confirmation.reason
            : ''
        }
        pending={mutation.isPending}
        error={mutation.error}
        onConfirm={() => {
          if (confirmation) mutation.mutate(confirmation);
        }}
      />
    </>
  );
}
