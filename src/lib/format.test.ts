import { describe, it, expect } from 'vitest';
import { cartTotals, money } from './format';
describe('money and cart estimates', () => {
  it('uses the supplied currency', () => {
    expect(money(12.5, 'USD')).toBe('$12.50');
  });
  it('keeps currencies separate and computes estimates in integer cents', () => {
    expect(
      cartTotals([
        { unitPrice: 0.1, quantity: 3, currency: 'USD' },
        { unitPrice: 0.2, quantity: 1, currency: 'USD' },
        { unitPrice: 5, quantity: 2, currency: 'EUR' },
      ]),
    ).toEqual([
      { currency: 'USD', amount: 0.5 },
      { currency: 'EUR', amount: 10 },
    ]);
  });
});
