import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { it, expect, vi } from 'vitest';
import { CartItem } from './CartPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../../api/client';
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: vi.fn(),
}));
it('removes an item through the provided mutation and disables pending changes', async () => {
  const onChange = vi.fn();
  vi.mocked(api).mockResolvedValue({ imageUrl: '/api/catalog/media/keyboard.jpg', brand: 'Keychron' });
  const client = new QueryClient();
  const item = {
    productId: '1',
    productName: 'Keyboard',
    sku: 'TEST',
    unitPrice: 120,
    currency: 'USD',
    quantity: 2,
  };
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CartItem item={item} pending={false} onChange={onChange} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
  expect(onChange).toHaveBeenCalledWith(0);
  expect(await screen.findByRole('img', { name: 'Keyboard' })).toHaveAttribute(
    'src',
    '/api/catalog/media/keyboard.jpg',
  );
  view.rerender(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CartItem item={item} pending onChange={onChange} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(screen.getByRole('spinbutton')).toBeDisabled();
});
