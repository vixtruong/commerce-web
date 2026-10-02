import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { availabilityQuery, catalogQuery, type Product } from '../catalog/api';
import { Can } from '../../auth/Guards';
import { Permissions } from '../../auth/permissions';
import { useListParams } from '../../hooks/useListParams';
import { ListFilters } from '../../components/ListFilters';
import { DataTable, Pagination } from '../../components/DataTable';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { Status, StockStatus } from '../../components/Status';
import { money } from '../../lib/format';
function ProductAvailability({ id }: { id: string }) {
  // Availability stays owned by Inventory; requests are bounded to the 20 visible catalog rows.
  const stock = useQuery(availabilityQuery(id));
  if (stock.isPending) return <Skeleton rows={1} />;
  if (stock.error)
    return (
      <button className="text-link" onClick={() => void stock.refetch()}>
        Retry stock
      </button>
    );
  return <StockStatus available={stock.data.availableQuantity} />;
}
export default function ProductsPage() {
  const list = useListParams();
  const result = useQuery({
    ...catalogQuery({
      page: list.page,
      pageSize: 20,
      search: list.search,
      status: list.params.get('status') || undefined,
      sort: list.params.get('sort') || 'name',
    }),
    placeholderData: keepPreviousData,
  });
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: (c) => (
        <div>
          <strong>{c.row.original.name}</strong>
          <p className="small muted">{c.row.original.id.slice(0, 8)}</p>
        </div>
      ),
    },
    { accessorKey: 'sku', header: 'SKU' },
    {
      accessorKey: 'priceAmount',
      header: 'Price',
      cell: (c) => (
        <span className="money-value">{money(c.row.original.priceAmount, c.row.original.priceCurrency)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Publication',
      cell: (c) => <Status kind="product" value={c.row.original.status} />,
    },
    {
      id: 'stock',
      header: 'Stock',
      cell: (c) => <ProductAvailability id={c.row.original.id} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: (c) => (
        <div className="actions">
          <Can permission={Permissions.ProductUpdate}>
            <Link className="text-link" to={'/admin/products/' + c.row.original.id}>
              Edit
            </Link>
          </Can>
          <Can permission={Permissions.InventoryRead}>
            <Link className="text-link" to={'/admin/inventory/' + c.row.original.id}>
              Stock
            </Link>
          </Can>
          <Link className="text-link" to={'/products/' + c.row.original.id}>
            Preview
          </Link>
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Products"
        description="Manage catalog content, prices and publication."
        action={
          <Can permission={Permissions.ProductCreate}>
            <Link className="button" to="/admin/products/new">
              Create product
            </Link>
          </Can>
        }
      />
      <ListFilters list={list} statuses={['Draft', 'Active', 'Inactive']} placeholder="Name or SKU" />
      <label className="sort-control">
        Sort
        <select value={list.params.get('sort') || 'name'} onChange={(e) => list.set('sort', e.target.value)}>
          <option value="name">Name</option>
          <option value="price-asc">Price ascending</option>
          <option value="price-desc">Price descending</option>
          <option value="newest">Newest</option>
        </select>
      </label>
      {result.isPending ? (
        <Skeleton />
      ) : result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.data.items.length ? (
        <>
          <DataTable data={result.data.items} columns={columns} caption="Product catalog" />
          <Pagination
            page={list.page}
            pageSize={20}
            total={result.data.total}
            pending={result.isPlaceholderData}
            onPage={(p) => list.set('page', String(p))}
          />
        </>
      ) : (
        <EmptyState
          title="No products match these filters."
          description="Try a different search or publication state."
        />
      )}
    </>
  );
}
