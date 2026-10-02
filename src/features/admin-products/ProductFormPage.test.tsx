import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import ProductFormPage from './ProductFormPage';
import { api } from '../../api/client';

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: vi.fn(),
}));
it('shows accessible required product errors before attempting to save a draft', async () => {
  const router = createMemoryRouter([{ path: '/admin/products/new', element: <ProductFormPage /> }], {
    initialEntries: ['/admin/products/new'],
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Save product' }));
  expect(await screen.findByText('Enter a SKU.')).toBeVisible();
  expect(screen.getByLabelText('Product name')).toHaveAttribute('aria-invalid', 'true');
  expect(api).not.toHaveBeenCalled();
});
