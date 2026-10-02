import { messages } from '../../lib/messages';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { api, queryString } from '../../api/client';
import type { Page } from '../orders/api';
import { useListParams } from '../../hooks/useListParams';
import { shipmentStatuses } from '../../lib/status';
import { date } from '../../lib/format';
import { DataTable, Pagination } from '../../components/DataTable';
import { ListFilters } from '../../components/ListFilters';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Status } from '../../components/Status';
import { Can } from '../../auth/Guards';
import { Permissions } from '../../auth/permissions';
interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}
const columns: ColumnDef<Shipment>[] = [
  {
    accessorKey: 'trackingNumber',
    header: 'Shipment',
    cell: (c) => (
      <Link className="text-link" to={'/admin/shipments/' + c.row.original.id}>
        {c.row.original.trackingNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'orderId',
    header: 'Order',
    cell: (c) => (
      <Link className="text-link" to={'/admin/orders/' + c.row.original.orderId}>
        {c.row.original.orderId.slice(0, 8)}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (c) => <Status kind="shipment" value={c.row.original.status} />,
  },
  { accessorKey: 'createdAtUtc', header: 'Created', cell: (c) => date(c.row.original.createdAtUtc) },
];
export default function ShipmentsPage() {
  const list = useListParams();
  const filters = {
    page: list.page,
    pageSize: 20,
    search: list.search,
    status: list.params.get('status') || undefined,
  };
  const result = useQuery({
    queryKey: ['shipments', filters],
    queryFn: ({ signal }) => api<Page<Shipment>>('/api/shipping?' + queryString(filters), { signal }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Shipments"
        description="Track the persisted fulfilment lifecycle. Carrier tracking is not integrated."
      />
      <ListFilters list={list} statuses={Object.keys(shipmentStatuses)} placeholder="Shipment or order ID" />
      {result.isPending ? (
        <Skeleton />
      ) : result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.data.items.length ? (
        <>
          <DataTable data={result.data.items} columns={columns} caption="Shipments" />
          <Pagination
            page={list.page}
            pageSize={20}
            total={result.data.totalCount}
            pending={result.isPlaceholderData}
            onPage={(p) => list.set('page', String(p))}
          />
        </>
      ) : (
        <EmptyState
          title="No shipments match these filters."
          description="Shipments appear after payment is confirmed."
        />
      )}
    </>
  );
}
export function ShipmentDetailPage() {
  const { id = '' } = useParams();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const result = useQuery({
    queryKey: ['shipments', 'detail', id],
    queryFn: ({ signal }) => api<Shipment>('/api/shipping/' + id, { signal }),
  });
  const mutation = useMutation({
    mutationFn: () => api<Shipment>('/api/shipping/' + id + '/advance', { method: 'POST' }),
    onSuccess: () => {
      setConfirm(false);
      void client.invalidateQueries({ queryKey: ['shipments'] });
      void client.invalidateQueries({ queryKey: ['orders'] });
    },
  });
  if (result.isPending) return <Skeleton />;
  if (result.error) return <ErrorState error={result.error} retry={() => void result.refetch()} />;
  const s = result.data;
  const next = { Created: 'Ready for pickup', ReadyForPickup: 'In transit', InTransit: 'Delivered' }[
    s.status as 'Created' | 'ReadyForPickup' | 'InTransit'
  ];
  return (
    <>
      <PageHeader
        eyebrow="Sales / Shipment"
        title={s.trackingNumber}
        description="Development fulfilment lifecycle"
        action={
          <button
            className="button secondary"
            disabled={mutation.isPending || result.isFetching}
            onClick={() => void result.refetch()}
          >
            {messages.refreshStatus}
          </button>
        }
      />
      <Status kind="shipment" value={s.status} />
      <dl className="detail-facts">
        <div>
          <dt>Source order</dt>
          <dd>
            <Link className="text-link" to={'/admin/orders/' + s.orderId}>
              {s.orderId}
            </Link>
          </dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{date(s.createdAtUtc)}</dd>
        </div>
        <div>
          <dt>Latest transition</dt>
          <dd>{date(s.updatedAtUtc)}</dd>
        </div>
      </dl>
      <Can permission={Permissions.ShipmentUpdate}>
        {next && (
          <button className="button" disabled={mutation.isPending} onClick={() => setConfirm(true)}>
            Advance to {next}
          </button>
        )}
      </Can>
      {mutation.error && <ErrorState error={mutation.error} />}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Advance fulfilment?"
        description={'Record the next development fulfilment state: ' + next + '.'}
        pending={mutation.isPending}
        error={mutation.error}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
