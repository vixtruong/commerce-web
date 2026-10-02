import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { api } from '../../api/client';
import { cartKey, useCartMutation, type Cart } from './api';

vi.mock('../../api/client', () => ({ api: vi.fn(), hasSession: () => true, sessionGeneration: () => 1 }));
it('rolls back optimistic quantity changes when the Gateway rejects a cart mutation', async () => {
  const previous: Cart = {
    customerId: 'a',
    updatedAtUtc: '',
    items: [
      { productId: '1', sku: 'K', productName: 'Keyboard', unitPrice: 120, currency: 'USD', quantity: 1 },
    ],
  };
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(cartKey, previous);
  let rejectRequest: (error: Error) => void = () => undefined;
  vi.mocked(api).mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        rejectRequest = reject;
      }),
  );
  const { result } = renderHook(useCartMutation, {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  act(() => result.current.mutate({ productId: '1', quantity: 3 }));
  await waitFor(() => expect(client.getQueryData<Cart>(cartKey)?.items[0].quantity).toBe(3));
  act(() => rejectRequest(new Error('Stock limit')));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(client.getQueryData(cartKey)).toEqual(previous);
});
