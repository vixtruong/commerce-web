import { describe, expect, it } from 'vitest';
import { isCheckoutTerminal, checkoutFailure, orderPaymentLabel, type Order } from './api';
const order: Order = {
  id: '1',
  customerId: 'a',
  orderNumber: 'ORD-1',
  status: 'AwaitingPayment',
  sagaStatus: 'AwaitingPayment',
  totalAmount: 100,
  currency: 'USD',
  items: [],
  createdAtUtc: '',
  updatedAtUtc: '',
  shipmentId: null,
  trackingNumber: null,
  cancellationReason: null,
  shippingAddress: null,
};
describe('checkout workflow', () => {
  it('waits for shipping after payment succeeds', () => {
    expect(orderPaymentLabel({ ...order, status: 'Paid' })).toBe('Confirmed');
    expect(orderPaymentLabel({ ...order, status: 'Cancelled' })).toBe('Not confirmed');
    expect(isCheckoutTerminal({ ...order, status: 'Paid', sagaStatus: 'Paid' })).toBe(false);
    expect(isCheckoutTerminal({ ...order, status: 'Shipped', sagaStatus: 'ShipmentCreated' })).toBe(true);
  });
  it('does not claim stock was released until compensation finishes', () => {
    const failed = {
      ...order,
      status: 'Cancelled',
      sagaStatus: 'Compensating',
      cancellationReason: 'provider-failed',
    };
    expect(isCheckoutTerminal(failed)).toBe(false);
    expect(checkoutFailure(failed)).toContain('being released');
    expect(isCheckoutTerminal({ ...failed, sagaStatus: 'Cancelled' })).toBe(true);
    expect(checkoutFailure({ ...failed, sagaStatus: 'Cancelled' })).toContain('has been released');
  });
});
