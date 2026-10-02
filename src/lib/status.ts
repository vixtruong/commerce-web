import { messages } from './messages';
export interface StatusPresentation {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  description: string;
}
const entry = (label: string, tone: StatusPresentation['tone'], description = ''): StatusPresentation => ({
  label,
  tone,
  description,
});
export const orderStatuses = {
  Pending: entry(messages.orderReceived, 'neutral'),
  AwaitingInventory: entry(messages.checkingAvailability, 'warning'),
  InventoryReserved: entry('Stock reserved', 'neutral'),
  AwaitingPayment: entry(messages.processingPayment, 'warning'),
  Paid: entry('Payment confirmed', 'success'),
  Processing: entry('Preparing your order', 'neutral'),
  Shipped: entry('Shipment created', 'success'),
  Delivered: entry('Delivered', 'success'),
  Cancelled: entry('Cancelled', 'danger'),
  Refunded: entry('Refunded', 'neutral'),
};
export const paymentStatuses = {
  Pending: entry('Pending', 'neutral'),
  Processing: entry('Processing', 'warning'),
  Succeeded: entry('Succeeded', 'success'),
  Failed: entry('Failed', 'danger'),
  Refunded: entry('Refunded', 'neutral'),
};
export const shipmentStatuses = {
  Created: entry('Created', 'neutral'),
  ReadyForPickup: entry('Ready for pickup', 'warning'),
  InTransit: entry('In transit', 'warning'),
  Delivered: entry('Delivered', 'success'),
  Cancelled: entry('Cancelled', 'danger'),
};
export const productStatuses = {
  Draft: entry('Draft', 'neutral'),
  Active: entry('Active', 'success'),
  Inactive: entry('Inactive', 'warning'),
};
export function statusFor(
  kind: 'order' | 'payment' | 'shipment' | 'product',
  status: string,
): StatusPresentation {
  const mapping: Record<string, StatusPresentation> = {
    order: orderStatuses,
    payment: paymentStatuses,
    shipment: shipmentStatuses,
    product: productStatuses,
  }[kind];
  return mapping[status] ?? entry('Unknown state: ' + status, 'neutral');
}
export function stockState(available: number, reserved: number) {
  return available === 0
    ? entry('Out of stock', 'danger')
    : available <= 5
      ? entry('Low stock', 'warning')
      : reserved > available
        ? entry('High reservations', 'warning')
        : entry('In stock', 'success');
}
