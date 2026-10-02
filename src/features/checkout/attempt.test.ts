import { describe, expect, it } from 'vitest';
import { checkoutAttempt, loadAttempt, saveAttempt } from './attempt';
const address = {
  recipientName: 'Customer',
  addressLine1: '1 Main Street',
  city: 'Hanoi',
  postalCode: '100000',
  countryCode: 'VN',
};
describe('checkout retry identity', () => {
  it('keeps one key and body across double click, retry, and remount', () => {
    const first = checkoutAttempt('customer-a', address, 'cart-v1');
    expect(checkoutAttempt('customer-a', { ...address, city: 'Changed' }, 'cart-v2')).toEqual(first);
    expect(loadAttempt('customer-a')?.key).toBe(first.key);
    saveAttempt({ ...first, orderId: 'accepted-order' });
    expect(loadAttempt('customer-a')?.orderId).toBe('accepted-order');
  });
  it('does not reuse another account checkout key', () => {
    checkoutAttempt('customer-a', address, 'cart');
    expect(loadAttempt('customer-b')).toBeNull();
  });
  it('preserves an ambiguous attempt on expiry and clears it on explicit logout', () => {
    const attempt = checkoutAttempt('customer-a', address, 'cart');
    window.dispatchEvent(new CustomEvent('commerce:session-ended', { detail: { reason: 'expired' } }));
    expect(loadAttempt('customer-a')?.key).toBe(attempt.key);
    window.dispatchEvent(new CustomEvent('commerce:session-ended', { detail: { reason: 'logout' } }));
    expect(loadAttempt('customer-a')).toBeNull();
  });
});
