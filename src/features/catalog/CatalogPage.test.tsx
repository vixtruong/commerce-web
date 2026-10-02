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
  vi.mocked(api).mockResolvedValue({ items: [], page: 1, pageSize: 12, total: 0 });
});
function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}
function mount() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/products?minPrice=10&maxPrice=100&sort=newest&page=2']}>
        <CatalogPage />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it('resets all URL filters together rather than retaining earlier price fields', async () => {
  mount();
  await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByLabelText('Minimum')).toHaveValue(null);
  expect(screen.getByLabelText('Maximum')).toHaveValue(null);
  expect(screen.getByLabelText('Sort by')).toHaveValue('name');
  expect(screen.getByTestId('location')).toHaveTextContent('page=1');
  expect(screen.getByTestId('location').textContent).not.toContain('Price');
});
it('debounces search into the URL and queries the first server page', async () => {
  mount();
  await userEvent.type(screen.getByLabelText('Search products'), 'keyboard');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('search=keyboard'));
  expect(screen.getByTestId('location')).toHaveTextContent('page=1');
  await waitFor(() => expect(vi.mocked(api).mock.calls.at(-1)?.[0]).toContain('search=keyboard'));
});
