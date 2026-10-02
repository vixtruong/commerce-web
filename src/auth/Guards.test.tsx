import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { Can, RequirePermission } from './Guards';
import { Permissions as P, type User } from './permissions';
const user: User = { id: '1', email: 'staff@example.test', roles: [], permissions: [P.InventoryRead] };
function wrapper(element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['auth', 'me'], user);
  return <QueryClientProvider client={client}>{element}</QueryClientProvider>;
}
describe('permission components', () => {
  it('allows a protected page when its read permission is present', () => {
    const router = createMemoryRouter([
      {
        element: <RequirePermission permission={P.InventoryRead} />,
        children: [{ path: '/', element: <span>Inventory page</span> }],
      },
    ]);
    render(wrapper(<RouterProvider router={router} />));
    expect(screen.getByText('Inventory page')).toBeInTheDocument();
  });
  it('shows permitted read controls and hides mutation controls', () => {
    render(
      wrapper(
        <>
          <Can permission={P.InventoryRead}>
            <span>Read stock</span>
          </Can>
          <Can permission={P.InventoryAdjust}>
            <span>Adjust stock</span>
          </Can>
          <Can allOf={[P.InventoryRead, P.InventoryAdjust]}>
            <span>All allowed</span>
          </Can>
          <Can anyOf={[P.InventoryRead, P.PaymentRead]}>
            <span>Some allowed</span>
          </Can>
        </>,
      ),
    );
    expect(screen.getByText('Read stock')).toBeInTheDocument();
    expect(screen.queryByText('Adjust stock')).not.toBeInTheDocument();
    expect(screen.queryByText('All allowed')).not.toBeInTheDocument();
    expect(screen.getByText('Some allowed')).toBeInTheDocument();
  });
  it('renders a proper forbidden page for a protected route', () => {
    const router = createMemoryRouter([
      {
        element: <RequirePermission permission={P.InventoryAdjust} />,
        children: [{ path: '/', element: <span>Protected</span> }],
      },
    ]);
    render(wrapper(<RouterProvider router={router} />));
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });
});
