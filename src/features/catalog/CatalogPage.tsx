import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogQuery, categoriesQuery } from './api';
import { ProductCard } from './ProductCard';
import { useListParams } from '../../hooks/useListParams';
import { EmptyState, ErrorState, Skeleton } from '../../components/Feedback';
import { Pagination } from '../../components/DataTable';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function CatalogPage() {
  const list = useListParams();
  const minimum = list.params.get('minPrice') || '';
  const maximum = list.params.get('maxPrice') || '';
  const category = list.params.get('category') || '';
  const categories = useQuery(categoriesQuery());
  const products = useQuery({
    ...catalogQuery({
      search: list.search,
      page: list.page,
      pageSize: 12,
      status: 'Active',
      sort: list.params.get('sort') || 'name',
      minPrice: minimum || undefined,
      maxPrice: maximum || undefined,
      category: category || undefined,
    }),
    placeholderData: keepPreviousData,
  });
  const reset = () => {
    list.setMany({ minPrice: '', maxPrice: '', sort: '', search: '', q: '', category: '' });
    list.setDraft('');
  };
  return (
    <>
      <div className="collection-heading">
        <div>
          <p className="eyebrow">Shop / The collection</p>
          <h1>{categories.data?.find((group) => group.slug === category)?.name || 'Tech & accessories.'}</h1>
          <p>Discover what fits your everyday.</p>
        </div>
        <span className="collection-count" role="status">
          {products.data
            ? products.data.total + (products.data.total === 1 ? ' product' : ' products')
            : 'Loading collection…'}
          {products.isFetching && products.data && ' · Updating…'}
        </span>
      </div>
      {categories.error ? (
        <ErrorState error={categories.error} retry={() => void categories.refetch()} />
      ) : (
        <label className="collection-picker">
          Collection
          <select
            value={category}
            onChange={(event) => list.set('category', event.target.value)}
            disabled={categories.isPending}
          >
            <option value="">All collections</option>
            {categories.data?.map((group) => (
              <option value={group.slug} key={group.slug}>
                {group.name} ({group.productCount})
              </option>
            ))}
            {category && !categories.data?.some((group) => group.slug === category) && (
              <option value={category}>{category}</option>
            )}
          </select>
        </label>
      )}
      <div className="collection-toolbar">
        <label className="collection-search">
          <span className="sr-only">Search products</span>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Search by name or SKU"
          />
        </label>
        <label className="collection-sort">
          Sort by
          <select
            value={list.params.get('sort') || 'name'}
            onChange={(event) => list.set('sort', event.target.value)}
          >
            <option value="name">Name</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </label>
        <details className="collection-filter-disclosure">
          <summary>
            <SlidersHorizontal size={17} aria-hidden="true" /> Filters
            {(minimum || maximum) && (
              <span className="filter-count">{Number(!!minimum) + Number(!!maximum)}</span>
            )}
          </summary>
          <div className="collection-price-filters">
            <fieldset>
              <legend>Price range</legend>
              <label>
                Minimum
                <input
                  type="number"
                  min="0"
                  value={minimum}
                  onChange={(event) => list.set('minPrice', event.target.value)}
                />
              </label>
              <label>
                Maximum
                <input
                  type="number"
                  min="0"
                  value={maximum}
                  onChange={(event) => list.set('maxPrice', event.target.value)}
                />
              </label>
            </fieldset>
            <p className="small muted">Prices use each product’s listed currency.</p>
            <button className="text-link" type="button" onClick={reset}>
              Reset filters
            </button>
          </div>
        </details>
      </div>
      {(list.search || minimum || maximum || category) && (
        <div className="active-filters" aria-label="Applied filters">
          {category && (
            <button
              type="button"
              onClick={() => list.set('category', '')}
              aria-label="Remove collection filter"
            >
              Collection: {categories.data?.find((group) => group.slug === category)?.name || category}
              <X size={14} aria-hidden="true" />
            </button>
          )}
          {list.search && (
            <button
              type="button"
              onClick={() => {
                list.setMany({ search: '', q: '' });
                list.setDraft('');
              }}
              aria-label="Remove search filter"
            >
              Search: {list.search}
              <X size={14} aria-hidden="true" />
            </button>
          )}
          {minimum && (
            <button
              type="button"
              onClick={() => list.set('minPrice', '')}
              aria-label="Remove minimum price filter"
            >
              Min: {minimum}
              <X size={14} aria-hidden="true" />
            </button>
          )}
          {maximum && (
            <button
              type="button"
              onClick={() => list.set('maxPrice', '')}
              aria-label="Remove maximum price filter"
            >
              Max: {maximum}
              <X size={14} aria-hidden="true" />
            </button>
          )}
          <button type="button" className="text-link" onClick={reset}>
            Clear all
          </button>
        </div>
      )}
      <div className="collection-results" aria-busy={products.isFetching}>
        {products.isPending ? (
          <Skeleton rows={6} variant="products" />
        ) : products.error ? (
          <ErrorState error={products.error} retry={() => void products.refetch()} />
        ) : products.data.items.length ? (
          <>
            <div className="product-grid">
              {products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              page={list.page}
              pageSize={12}
              total={products.data.total}
              onPage={(page) => list.set('page', String(page))}
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
    </>
  );
}
