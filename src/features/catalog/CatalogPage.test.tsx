import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import CatalogPage from './CatalogPage';
import { api } from '../../api/client';

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(api).mockReset();
  vi.mocked(api).mockImplementation(async (path) =>
    path.includes('/categories')
      ? [{ id: 'keyboards', name: 'Keyboards', slug: 'keyboards', isActive: true, productCount: 38 }]
      : { items: [], page: 1, pageSize: 12, total: 0 },
  );
});
function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}
function mount() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter
        initialEntries={['/products?minPrice=10&maxPrice=100&sort=newest&page=2&category=keyboards']}
      >
        <CatalogPage />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it('resets all URL filters together rather than retaining earlier price fields', async () => {
  mount();
  await userEvent.click(screen.getByText('Filters', { exact: true }));
  await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByLabelText('Minimum')).toHaveValue(null);
  expect(screen.getByLabelText('Maximum')).toHaveValue(null);
  expect(screen.getByLabelText('Sort by')).toHaveValue('name');
  expect(screen.getByTestId('location')).toHaveTextContent('page=1');
  expect(screen.getByTestId('location').textContent).not.toContain('Price');
  expect(screen.getByTestId('location').textContent).not.toContain('category');
});

it('removes a collection filter while preserving search and price state', async () => {
  mount();
  await userEvent.click(screen.getByRole('button', { name: 'Remove collection filter' }));
  expect(screen.getByTestId('location')).not.toHaveTextContent('category');
  expect(screen.getByTestId('location')).toHaveTextContent('minPrice=10');
  expect(screen.getByTestId('location')).toHaveTextContent('page=1');
});
it('removes one applied price filter while preserving the other filters and resetting pagination', async () => {
  mount();
  await userEvent.click(screen.getByRole('button', { name: 'Remove minimum price filter' }));
  expect(screen.getByTestId('location')).not.toHaveTextContent('minPrice');
  expect(screen.getByTestId('location')).toHaveTextContent('maxPrice=100');
  expect(screen.getByTestId('location')).toHaveTextContent('sort=newest');
  expect(screen.getByTestId('location')).toHaveTextContent('page=1');
  expect(screen.queryByRole('button', { name: 'Remove minimum price filter' })).not.toBeInTheDocument();
});
it('debounces search into the URL and queries the first server page', async () => {
  mount();
  await userEvent.type(screen.getByLabelText('Search products'), 'keyboard');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('search=keyboard'));
  expect(screen.getByTestId('location')).toHaveTextContent('page=1');
  await waitFor(() => expect(vi.mocked(api).mock.calls.at(-1)?.[0]).toContain('search=keyboard'));
});
