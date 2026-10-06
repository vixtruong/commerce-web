import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '../../api/client';
import { Permissions } from '../../auth/permissions';
import CollectionsPage from './CollectionsPage';

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  api: vi.fn(),
}));
vi.mock('../../auth/useUser', () => ({
  useUser: () => ({
    data: {
      id: 'admin',
      email: 'admin@example.test',
      roles: ['Admin'],
      permissions: Object.values(Permissions),
    },
  }),
}));
beforeEach(() => {
  vi.mocked(api).mockReset();
  vi.mocked(api).mockResolvedValue([
    { id: 'group', slug: 'keyboards', name: 'Keyboards', isActive: true, productCount: 38 },
  ]);
});
function mount() {
  const router = createMemoryRouter([{ path: '/admin/collections', element: <CollectionsPage /> }], {
    initialEntries: ['/admin/collections'],
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

it('requires confirmation before disabling assignments and sends the stable slug', async () => {
  mount();
  await screen.findByText('Keyboards');
  await userEvent.click(screen.getByRole('button', { name: 'Disable' }));
  expect(vi.mocked(api).mock.calls.some(([, options]) => options?.method === 'PUT')).toBe(false);
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith('/api/catalog/categories/keyboards', {
      method: 'PUT',
      body: { name: 'Keyboards', isActive: false },
    }),
  );
});

it('validates slugs and protects unsaved collection details when closing the editor', async () => {
  mount();
  await screen.findByText('Keyboards');
  await userEvent.click(screen.getByRole('button', { name: 'Create collection' }));
  await userEvent.type(screen.getByLabelText('Collection name'), 'Office tech');
  await userEvent.type(screen.getByLabelText('Collection slug'), 'Bad Slug');
  await userEvent.click(screen.getByRole('button', { name: 'Save collection' }));
  expect(await screen.findByText('Use lowercase letters, numbers and hyphens.')).toBeVisible();
  expect(vi.mocked(api).mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  const discard = await screen.findByRole('dialog', { name: 'Discard unsaved changes?' });
  await userEvent.click(within(discard).getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Create collection' })).toHaveFocus();
});
