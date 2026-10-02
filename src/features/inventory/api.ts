import { queryOptions } from '@tanstack/react-query';
import { api } from '../../api/client';
export interface Stock {
  productId: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  version: number;
}
export interface Reservation {
  orderId: string;
  quantity: number;
  status: string;
  expiresAtUtc: string;
}
export const stockQuery = (id: string) =>
  queryOptions({
    queryKey: ['inventory', 'stock', id],
    queryFn: ({ signal }) => api<Stock>('/api/inventory/' + id, { signal }),
    staleTime: 3000,
  });
