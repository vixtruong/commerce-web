import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import ProductFormPage from './ProductFormPage';
import { api } from '../../api/client';
import type { Category, Product } from '../catalog/api';

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: vi.fn(),
}));
it('shows accessible required product errors before attempting to save a draft', async () => {
  vi.mocked(api).mockResolvedValue([]);
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
  expect(vi.mocked(api).mock.calls.every(([, options]) => !options?.method || options.method === 'GET')).toBe(
    true,
  );
});

it('retains the saved assignment when collection options finish loading after the product', async () => {
  let provideCategories!: (categories: Category[]) => void;
  const categoryResponse = new Promise<Category[]>((resolve) => {
    provideCategories = resolve;
  });
  const product: Product = {
    id: 'demo-product',
    sku: 'DEMO-KEYCHRON-1',
    name: 'Wireless keyboard',
    description: '',
    priceAmount: 59.99,
    priceCurrency: 'USD',
    status: 'Active',
    createdAtUtc: '',
    updatedAtUtc: '',
    brand: 'Keychron',
    categorySlug: 'keyboards',
  };
  vi.mocked(api).mockImplementation(async (path) =>
    path.includes('/categories') ? categoryResponse : product,
  );
  const router = createMemoryRouter([{ path: '/admin/products/:id', element: <ProductFormPage /> }], {
    initialEntries: ['/admin/products/demo-product'],
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await waitFor(() => expect(screen.getByLabelText('Brand')).toHaveValue('Keychron'));
  await act(async () =>
    provideCategories([
      { id: 'group-1', name: 'Keyboards', slug: 'keyboards', isActive: true, productCount: 38 },
    ]),
  );
  await waitFor(() => expect(screen.getByLabelText('Collection')).toHaveValue('keyboards'));
});
