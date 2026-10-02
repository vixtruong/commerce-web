import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { api, ApiError } from '../../api/client';
import CheckoutPage from './CheckoutPage';
import { loadAttempt } from './attempt';

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: vi.fn(),
}));
vi.mock('../../auth/useUser', () => ({ useUser: () => ({ data: { id: 'customer-a' } }) }));
vi.mock('../cart/api', () => ({
  useCart: () => ({
    isPending: false,
    error: null,
    data: {
      items: [{ productId: '1', productName: 'Keyboard', quantity: 2, unitPrice: 120, currency: 'USD' }],
    },
  }),
}));
beforeEach(() => vi.mocked(api).mockReset());

function mount() {
  const router = createMemoryRouter(
    [
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/checkout/processing/:orderId', element: <h1>Accepted order processing</h1> },
    ],
    { initialEntries: ['/checkout'] },
  );
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

it('validates delivery fields before making a checkout request', async () => {
  mount();
  await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
  expect(await screen.findByText('Enter the recipient name.')).toBeVisible();
  expect(screen.getByLabelText('Street address')).toHaveAttribute('aria-invalid', 'true');
  expect(api).not.toHaveBeenCalled();
});

it('retries the same key and address after a network failure and component remount', async () => {
  vi.mocked(api).mockRejectedValueOnce(new ApiError('Connection interrupted', 0));
  const view = mount();
  await userEvent.type(screen.getByLabelText('Recipient name'), 'Customer');
  await userEvent.type(screen.getByLabelText('Street address'), '1 Main Street');
  await userEvent.type(screen.getByLabelText('City'), 'Hanoi');
  await userEvent.type(screen.getByLabelText('Postal code'), '100000');
  await userEvent.click(screen.getByRole('button', { name: 'Place order' }));
  expect(await screen.findByText('Connection interrupted')).toBeVisible();
  const first = vi.mocked(api).mock.calls[0];
  const saved = loadAttempt('customer-a');
  expect(saved?.key).toBe(first[1]?.headers?.['Idempotency-Key']);
  view.unmount();
  vi.mocked(api).mockResolvedValueOnce({
    orderId: 'accepted',
    orderNumber: 'ORD-1',
    status: 'AwaitingInventory',
  });
  mount();
  expect(screen.getByLabelText('City')).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Retry this checkout' }));
  expect(await screen.findByText('Accepted order processing')).toBeVisible();
  expect(vi.mocked(api).mock.calls[1]).toEqual(first);
  await waitFor(() => expect(loadAttempt('customer-a')?.orderId).toBe('accepted'));
});

it('allows correcting a definitively rejected address and maps server field errors', async () => {
  sessionStorage.setItem(
    'commerce.checkout-attempt',
    JSON.stringify({
      owner: 'customer-a',
      key: 'saved',
      fingerprint: 'cart',
      payload: {
        recipientName: 'Customer',
        addressLine1: '1 Main Street',
        city: 'Hanoi',
        postalCode: '100000',
        countryCode: 'VN',
      },
    }),
  );
  vi.mocked(api).mockRejectedValueOnce(
    new ApiError('Invalid address', 400, undefined, undefined, { City: ['Use a supported delivery city.'] }),
  );
  mount();
  await userEvent.click(screen.getByRole('button', { name: 'Retry this checkout' }));
  expect(await screen.findByText('Use a supported delivery city.')).toBeVisible();
  expect(screen.getByLabelText('City')).toBeEnabled();
  expect(loadAttempt('customer-a')).toBeNull();
});
