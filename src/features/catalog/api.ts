import { queryOptions } from '@tanstack/react-query';
import { api, queryString } from '../../api/client';
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceAmount: number;
  priceCurrency: string;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  brand?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  sourceUrl?: string | null;
  categorySlug?: string | null;
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  productCount: number;
}
export const categoriesQuery = (includeInactive = false) =>
  queryOptions({
    queryKey: ['catalog', 'categories', includeInactive],
    queryFn: ({ signal }) =>
      api<Category[]>('/api/catalog/categories' + (includeInactive ? '?includeInactive=true' : ''), {
        signal,
        authenticated: includeInactive,
      }),
    staleTime: 30_000,
    meta: { private: includeInactive },
  });
export interface ProductPage {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}
export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ['catalog', 'product', id],
    queryFn: ({ signal }) => api<Product>('/api/catalog/products/' + id, { signal, authenticated: false }),
    staleTime: 60_000,
  });
export const catalogQuery = (filters: Record<string, string | number | undefined>) =>
  queryOptions({
    queryKey: ['catalog', 'list', filters],
    queryFn: ({ signal }) =>
      api<ProductPage>('/api/catalog/products?' + queryString(filters), { signal, authenticated: false }),
    staleTime: 30_000,
  });
export interface Availability {
  productId: string;
  availableQuantity: number;
}
export const availabilityQuery = (id: string) =>
  queryOptions({
    queryKey: ['inventory', 'availability', id],
    queryFn: ({ signal }) =>
      api<Availability>('/api/inventory/' + id + '/availability', { signal, authenticated: false }),
    staleTime: 10_000,
  });
