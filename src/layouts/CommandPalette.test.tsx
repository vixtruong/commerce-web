import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it } from 'vitest';
import { CommandPalette } from './CommandPalette';
import { Permissions, type User } from '../auth/permissions';

const operator: User = {
  id: 'operator',
  email: 'operator@example.test',
  roles: [],
  permissions: [Permissions.BackofficeAccess, Permissions.OrderRead, Permissions.InventoryRead],
};

function Workspace() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  return (
    <>
      <button onClick={() => setOpen(true)}>Open workspace search</button>
      <CommandPalette open={open} onOpenChange={setOpen} user={operator} />
      <output aria-label="Current route">{location.pathname}</output>
    </>
  );
}

it('searches only permitted areas and navigates to a matching result', async () => {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Workspace />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('button', { name: /Payments/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Users/ })).not.toBeInTheDocument();
  await userEvent.type(screen.getByRole('searchbox', { name: 'Search workspace areas' }), 'sales');
  expect(screen.getByRole('status')).toHaveTextContent('1 available area');
  await userEvent.click(screen.getByRole('button', { name: /Orders/ }));
  expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin/orders');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('shows no matching areas and resets the search after reopening', async () => {
  render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByRole('searchbox', { name: 'Search workspace areas' }), 'does-not-exist');
  expect(screen.getByText('No areas match. Try a different name.')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await userEvent.click(screen.getByRole('button', { name: 'Open workspace search' }));
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(screen.getByRole('button', { name: /Orders/ })).toBeVisible();
});
