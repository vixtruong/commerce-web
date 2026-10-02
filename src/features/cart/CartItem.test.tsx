import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { it, expect, vi } from 'vitest';
import { CartItem } from './CartPage';
it('removes an item through the provided mutation and disables pending changes', async () => {
  const onChange = vi.fn();
  const item = {
    productId: '1',
    productName: 'Keyboard',
    sku: 'TEST',
    unitPrice: 120,
    currency: 'USD',
    quantity: 2,
  };
  const view = render(
    <MemoryRouter>
      <CartItem item={item} pending={false} onChange={onChange} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
  expect(onChange).toHaveBeenCalledWith(0);
  view.rerender(
    <MemoryRouter>
      <CartItem item={item} pending onChange={onChange} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('spinbutton')).toBeDisabled();
});
