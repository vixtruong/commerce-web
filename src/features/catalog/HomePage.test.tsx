import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '../../api/client';
import HomePage from './HomePage';

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(api).mockReset();
});

function mount() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

it('explains an empty collection without presenting fabricated products', async () => {
  vi.mocked(api).mockImplementation(async (path) =>
    path.includes('/categories') ? [] : { items: [], total: 0, page: 1, pageSize: 4 },
  );
  mount();
  expect(await screen.findByText('The collection is getting ready.')).toBeVisible();
  expect(screen.queryAllByRole('article')).toHaveLength(0);
  expect(screen.getByRole('link', { name: 'Explore the collection' })).toHaveAttribute('href', '/products');
});

it('presents an API failure with an explicit retry action', async () => {
  vi.mocked(api).mockImplementation(async (path) => {
    if (path.includes('/categories')) return [];
    throw new Error('The collection is temporarily unavailable.');
  });
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('The collection is temporarily unavailable.');
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
});
