import { Link, useParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { api, queryString } from '../../api/client';
import type { Page } from '../orders/api';
import { useListParams } from '../../hooks/useListParams';
import { paymentStatuses } from '../../lib/status';
import { date, money } from '../../lib/format';
import { DataTable, Pagination } from '../../components/DataTable';
import { ListFilters } from '../../components/ListFilters';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { Status } from '../../components/Status';
interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  transactionReference: string | null;
  failureCode: string | null;
  createdAtUtc: string;
  completedAtUtc: string | null;
}
const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'id',
    header: 'Payment',
    cell: (c) => (
      <Link className="text-link" to={'/admin/payments/' + c.row.original.id}>
        {c.row.original.id.slice(0, 8)}
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
    accessorKey: 'amount',
    header: 'Amount',
    cell: (c) => money(c.row.original.amount, c.row.original.currency),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (c) => <Status kind="payment" value={c.row.original.status} />,
  },
  { accessorKey: 'createdAtUtc', header: 'Created', cell: (c) => date(c.row.original.createdAtUtc) },
];
export default function PaymentsPage() {
  const list = useListParams();
  const filters = {
    page: list.page,
    pageSize: 20,
    search: list.search,
    status: list.params.get('status') || undefined,
  };
  const result = useQuery({
    queryKey: ['payments', filters],
    queryFn: ({ signal }) => api<Page<Payment>>('/api/payments?' + queryString(filters), { signal }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Payments"
        description="Development provider records. No real card processing or refund action is configured."
      />
      <ListFilters
        list={list}
        statuses={Object.keys(paymentStatuses)}
        statusKind="payment"
        placeholder="Payment or order ID"
      />
      {result.isPending ? (
        <Skeleton />
      ) : result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.data.items.length ? (
        <>
          <DataTable data={result.data.items} columns={columns} caption="Payment records" />
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
          title="No payments match these filters."
          description="Payment records appear after inventory is reserved during checkout."
        />
      )}
    </>
  );
}
export function PaymentDetailPage() {
  const { id = '' } = useParams();
  const result = useQuery({
    queryKey: ['payments', 'detail', id],
    queryFn: ({ signal }) => api<Payment>('/api/payments/' + id, { signal }),
  });
  if (result.isPending) return <Skeleton />;
  if (result.error) return <ErrorState error={result.error} retry={() => void result.refetch()} />;
  const p = result.data;
  return (
    <>
      <PageHeader
        eyebrow="Sales / Payment"
        title={'Payment ' + p.id.slice(0, 8)}
        description="Deterministic development provider"
      />
      <Status kind="payment" value={p.status} />
      <dl className="detail-facts">
        <div>
          <dt>Amount</dt>
          <dd>{money(p.amount, p.currency)}</dd>
        </div>
        <div>
          <dt>Order</dt>
          <dd>
            <Link className="text-link" to={'/admin/orders/' + p.orderId}>
              {p.orderId}
            </Link>
          </dd>
        </div>
        <div>
          <dt>Provider reference</dt>
          <dd>{p.transactionReference || 'Not available'}</dd>
        </div>
        <div>
          <dt>Failure code</dt>
          <dd>{p.failureCode || 'None'}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{date(p.createdAtUtc)}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{p.completedAtUtc ? date(p.completedAtUtc) : 'Pending'}</dd>
        </div>
      </dl>
    </>
  );
}
