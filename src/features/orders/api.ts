import { messages } from '../../lib/messages';
import { queryOptions } from '@tanstack/react-query';
import { api, queryString } from '../../api/client';
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  unitPrice: number;
  currency: string;
  quantity: number;
}
export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  createdAtUtc: string;
  updatedAtUtc: string;
  customerId: string;
  sagaStatus: string | null;
  cancellationReason: string | null;
  shipmentId: string | null;
  trackingNumber: string | null;
  shippingAddress: {
    recipientName: string;
    line1: string;
    city: string;
    postalCode: string;
    countryCode: string;
  } | null;
}
export const orderQuery = (id: string, admin = false) =>
  queryOptions({
    queryKey: ['orders', admin ? 'admin' : 'customer', id],
    queryFn: ({ signal }) => api<Order>('/api/orders/' + (admin ? 'admin/' : '') + id, { signal }),
    staleTime: 2000,
  });
export const ordersQuery = (filters: Record<string, string | number | undefined>, admin = false) =>
  queryOptions({
    queryKey: ['orders', admin ? 'admin-list' : 'list', filters],
    queryFn: ({ signal }) =>
      api<Page<Order>>('/api/orders' + (admin ? '/admin' : '') + '?' + queryString(filters), { signal }),
  });
export function isCheckoutTerminal(order: Order) {
  return (
    ['Shipped', 'Delivered', 'Refunded'].includes(order.status) ||
    (order.status === 'Cancelled' && order.sagaStatus !== 'Compensating')
  );
}
/** Describes payment facts available in the order snapshot without claiming an unrecorded provider result. */
export function orderPaymentLabel(order: Order) {
  if (['Paid', 'Processing', 'Shipped', 'Delivered'].includes(order.status)) return 'Confirmed';
  if (order.status === 'Refunded') return 'Refunded';
  if (order.status === 'AwaitingPayment') return 'Awaiting outcome';
  if (order.status === 'Cancelled') return 'Not confirmed';
  return 'Not requested yet';
}
export function checkoutFailure(order: Order) {
  if (order.cancellationReason === 'insufficient-stock') return messages.insufficientStock;
  if (order.cancellationReason === 'inventory-reservation-expired') return messages.availabilityExpired;
  return order.sagaStatus === 'Compensating' ? messages.stockReleasing : messages.stockReleased;
}
