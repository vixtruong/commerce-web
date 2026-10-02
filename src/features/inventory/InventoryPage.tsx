import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { api, queryString } from '../../api/client';
import type { Page } from '../orders/api';
import type { Stock } from './api';
import { productQuery } from '../catalog/api';
import { useListParams } from '../../hooks/useListParams';
import { DataTable, Pagination } from '../../components/DataTable';
import { ListFilters } from '../../components/ListFilters';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { StockStatus } from '../../components/Status';
function ProductName({ id }: { id: string }) {
  const result = useQuery(productQuery(id));
  return (
    <Link className="text-link" to={'/admin/inventory/' + id}>
      {result.data?.name || id.slice(0, 8)}
      <small className="block muted">{result.data?.sku}</small>
    </Link>
  );
}
const columns: ColumnDef<Stock>[] = [
  {
    accessorKey: 'productId',
    header: 'Product / SKU',
    cell: (c) => <ProductName id={c.row.original.productId} />,
  },
  { accessorKey: 'quantityOnHand', header: 'On hand' },
  { accessorKey: 'reservedQuantity', header: 'Reserved' },
  { accessorKey: 'availableQuantity', header: 'Available' },
  {
    id: 'health',
    header: 'Stock state',
    cell: (c) => (
      <StockStatus available={c.row.original.availableQuantity} reserved={c.row.original.reservedQuantity} />
    ),
  },
];
export default function InventoryPage() {
  const list = useListParams();
  const filters = {
    page: list.page,
    pageSize: 20,
    search: list.search,
    status: list.params.get('status') || undefined,
  };
  const result = useQuery({
    queryKey: ['inventory', 'list', filters],
    queryFn: ({ signal }) => api<Page<Stock>>('/api/inventory?' + queryString(filters), { signal }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Inventory"
        description="Available units = physical stock − pending reservations. Low stock means five or fewer available units."
      />
      <ListFilters list={list} statuses={['zero', 'low', 'reserved']} placeholder="Product ID" />
      {result.isPending ? (
        <Skeleton />
      ) : result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.data.items.length ? (
        <>
          <DataTable data={result.data.items} columns={columns} caption="Inventory overview" />
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
          title="No inventory records match your current filters."
          description="Open a product's stock page from Products to receive its first units."
        />
      )}
    </>
  );
}
