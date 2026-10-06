import { messages } from '../../lib/messages';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ordersQuery, orderPaymentLabel, type Order } from './api';
import { useListParams } from '../../hooks/useListParams';
import { orderStatuses } from '../../lib/status';
import { date, money } from '../../lib/format';
import { DataTable, Pagination } from '../../components/DataTable';
import { ListFilters } from '../../components/ListFilters';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { Status } from '../../components/Status';
import type { ColumnDef } from '@tanstack/react-table';
export default function OrdersPage({ admin = false }: { admin?: boolean }) {
  const list = useListParams();
  const result = useQuery({
    ...ordersQuery(
      {
        search: list.search,
        page: list.page,
        pageSize: 20,
        status: list.params.get('status') || undefined,
        from: list.params.get('from') ? list.params.get('from') + 'T00:00:00Z' : undefined,
        to: list.params.get('to') ? list.params.get('to') + 'T00:00:00Z' : undefined,
      },
      admin,
    ),
    placeholderData: keepPreviousData,
  });
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order',
      cell: (c) => (
        <Link className="text-link" to={(admin ? '/admin/orders/' : '/orders/') + c.row.original.id}>
          {c.row.original.orderNumber}
        </Link>
      ),
    },
    { accessorKey: 'createdAtUtc', header: 'Placed', cell: (c) => date(c.row.original.createdAtUtc) },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (c) => <Status kind="order" value={c.row.original.status} />,
    },
    { id: 'payment', header: 'Payment', cell: (c) => orderPaymentLabel(c.row.original) },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: (c) => money(c.row.original.totalAmount, c.row.original.currency),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow={admin ? 'Sales' : 'Your account'}
        title={admin ? 'Orders' : 'Your orders'}
        description="Follow the latest state of each order."
      />
      <ListFilters
        list={list}
        statuses={Object.keys(orderStatuses)}
        statusKind="order"
        placeholder="Order number or ID"
        dates={admin}
      />
      {result.isPending ? (
        <Skeleton />
      ) : result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.data.items.length ? (
        <>
          <DataTable data={result.data.items} columns={columns} caption="Orders" />
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
          title={admin ? 'No orders match these filters.' : "You haven't placed an order yet."}
          description="Your orders will appear here after checkout."
          action={admin ? undefined : '/products'}
          actionLabel={messages.browseProducts}
        />
      )}
    </>
  );
}
