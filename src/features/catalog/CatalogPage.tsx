import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogQuery } from './api';
import { ProductCard } from './ProductCard';
import { useListParams } from '../../hooks/useListParams';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { Pagination } from '../../components/DataTable';
export default function CatalogPage() {
  const list = useListParams();
  const products = useQuery({
    ...catalogQuery({
      search: list.search,
      page: list.page,
      pageSize: 12,
      status: 'Active',
      sort: list.params.get('sort') || 'name',
      minPrice: list.params.get('minPrice') || undefined,
      maxPrice: list.params.get('maxPrice') || undefined,
    }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="The collection"
        title="Work essentials"
        description="Discover the products currently available in our store."
      />
      <div className="catalog-layout">
        <aside className="catalog-filters">
          <label>
            Search products
            <input
              type="search"
              value={list.draft}
              onChange={(e) => list.setDraft(e.target.value)}
              placeholder="Name or SKU"
            />
          </label>
          <label>
            Sort by
            <select
              value={list.params.get('sort') || 'name'}
              onChange={(e) => list.set('sort', e.target.value)}
            >
              <option value="name">Name</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <fieldset>
            <legend>Price range</legend>
            <label>
              Minimum
              <input
                type="number"
                min="0"
                value={list.params.get('minPrice') || ''}
                onChange={(e) => list.set('minPrice', e.target.value)}
              />
            </label>
            <label>
              Maximum
              <input
                type="number"
                min="0"
                value={list.params.get('maxPrice') || ''}
                onChange={(e) => list.set('maxPrice', e.target.value)}
              />
            </label>
          </fieldset>
          <p className="muted small">Prices use each product's listed currency.</p>
          <button
            className="text-link"
            onClick={() => {
              list.setMany({ minPrice: '', maxPrice: '', sort: 'name', search: '', q: '' });
              list.setDraft('');
            }}
          >
            Reset filters
          </button>
        </aside>
        <div aria-busy={products.isFetching}>
          {products.isPending ? (
            <Skeleton rows={6} />
          ) : products.error ? (
            <ErrorState error={products.error} retry={() => void products.refetch()} />
          ) : products.data.items.length ? (
            <>
              <div className="results-note">
                {products.data.total} products {products.isFetching && '· Updating…'}
              </div>
              <div className="product-grid">
                {products.data.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination
                page={list.page}
                pageSize={12}
                total={products.data.total}
                onPage={(p) => list.set('page', String(p))}
                pending={products.isPlaceholderData}
              />
            </>
          ) : (
            <EmptyState
              title="No products match these filters."
              description="Try another search or a wider price range."
            />
          )}
        </div>
      </div>
    </>
  );
}
