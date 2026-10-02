import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './schema';
import { registrationSchema } from '../auth/schemas';
import { productSchema } from '../admin-products/schema';
describe('forms', () => {
  it('rejects incomplete addresses and normalizes country codes', () => {
    expect(checkoutSchema.safeParse({}).success).toBe(false);
    const result = checkoutSchema.parse({
      recipientName: ' A ',
      addressLine1: '1 Main',
      city: 'Hanoi',
      postalCode: '100000',
      countryCode: 'vn',
    });
    expect(result.countryCode).toBe('VN');
    expect(result.recipientName).toBe('A');
  });
  it('enforces the audited Identity password policy', () => {
    expect(registrationSchema.safeParse({ email: 'user@example.test', password: 'short' }).success).toBe(
      false,
    );
    expect(
      registrationSchema.safeParse({ email: 'user@example.test', password: 'LongPassword123!' }).success,
    ).toBe(true);
  });
  it('rejects a negative price', () => {
    expect(
      productSchema.safeParse({
        sku: 'TEST',
        name: 'Test',
        description: '',
        priceAmount: -1,
        priceCurrency: 'USD',
      }).success,
    ).toBe(false);
  });
});
