import { messages } from '../lib/messages';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Root, RouteError } from './Root';
import { RequireAuth, RequirePermission } from '../auth/Guards';
import { Permissions as P } from '../auth/permissions';
import { EmptyState } from '../components/Feedback';
export const router = createBrowserRouter([
  {
    Component: Root,
    errorElement: <RouteError />,
    children: [
      {
        lazy: async () => ({ Component: (await import('../layouts/StorefrontLayout')).default }),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('../features/catalog/HomePage')).default }),
          },
          {
            path: 'products',
            lazy: async () => ({ Component: (await import('../features/catalog/CatalogPage')).default }),
          },
          {
            path: 'products/:id',
            lazy: async () => ({ Component: (await import('../features/catalog/ProductPage')).default }),
          },
          {
            path: 'login',
            lazy: async () => ({ Component: (await import('../features/auth/AuthPage')).default }),
          },
          {
            path: 'register',
            lazy: async () => ({ Component: (await import('../features/auth/AuthPage')).default }),
          },
          {
            Component: RequireAuth,
            children: [
              {
                path: 'cart',
                lazy: async () => ({ Component: (await import('../features/cart/CartPage')).default }),
              },
              {
                path: 'checkout',
                lazy: async () => ({
                  Component: (await import('../features/checkout/CheckoutPage')).default,
                }),
              },
              {
                path: 'checkout/processing/:orderId',
                lazy: async () => ({
                  Component: (await import('../features/checkout/ProcessingPage')).default,
                }),
              },
              {
                path: 'checkout/success/:orderId',
                lazy: async () => {
                  const Page = (await import('../features/checkout/ProcessingPage')).default;
                  return { Component: () => <Page success /> };
                },
              },
              {
                path: 'orders',
                lazy: async () => ({ Component: (await import('../features/orders/OrdersPage')).default }),
              },
              {
                path: 'orders/:orderId',
                lazy: async () => ({
                  Component: (await import('../features/orders/OrderDetailPage')).default,
                }),
              },
              {
                path: 'account',
                lazy: async () => ({ Component: (await import('../features/profile/AccountPage')).default }),
              },
              {
                path: 'account/profile',
                lazy: async () => ({ Component: (await import('../features/profile/AccountPage')).default }),
              },
            ],
          },
          {
            path: '*',
            element: (
              <EmptyState
                code="404"
                title="Page not found."
                description="Choose a page from the collection."
                action="/products"
                actionLabel={messages.browseProducts}
              />
            ),
          },
        ],
      },
      {
        Component: RequireAuth,
        children: [
          {
            element: <RequirePermission permission={P.BackofficeAccess} />,
            children: [
              {
                path: 'admin',
                lazy: async () => ({ Component: (await import('../layouts/AdminLayout')).default }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import('../features/admin-dashboard/DashboardPage')).default,
                    }),
                  },
                  {
                    element: <RequirePermission permission={P.ProductRead} />,
                    children: [
                      {
                        path: 'products',
                        lazy: async () => ({
                          Component: (await import('../features/admin-products/ProductsPage')).default,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.ProductCreate} />,
                    children: [
                      {
                        path: 'products/new',
                        lazy: async () => ({
                          Component: (await import('../features/admin-products/ProductFormPage')).default,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.ProductUpdate} />,
                    children: [
                      {
                        path: 'products/:id',
                        lazy: async () => ({
                          Component: (await import('../features/admin-products/ProductFormPage')).default,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.InventoryRead} />,
                    children: [
                      {
                        path: 'inventory',
                        lazy: async () => ({
                          Component: (await import('../features/inventory/InventoryPage')).default,
                        }),
                      },
                      {
                        path: 'inventory/:productId',
                        lazy: async () => ({
                          Component: (await import('../features/inventory/StockPage')).default,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.OrderRead} />,
                    children: [
                      {
                        path: 'orders',
                        lazy: async () => {
                          const Page = (await import('../features/orders/OrdersPage')).default;
                          return { Component: () => <Page admin /> };
                        },
                      },
                      {
                        path: 'orders/:orderId',
                        lazy: async () => {
                          const Page = (await import('../features/orders/OrderDetailPage')).default;
                          return { Component: () => <Page admin /> };
                        },
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.PaymentRead} />,
                    children: [
                      {
                        path: 'payments',
                        lazy: async () => ({
                          Component: (await import('../features/payments/PaymentsPage')).default,
                        }),
                      },
                      {
                        path: 'payments/:id',
                        lazy: async () => ({
                          Component: (await import('../features/payments/PaymentsPage')).PaymentDetailPage,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.ShipmentRead} />,
                    children: [
                      {
                        path: 'shipments',
                        lazy: async () => ({
                          Component: (await import('../features/shipping/ShipmentsPage')).default,
                        }),
                      },
                      {
                        path: 'shipments/:id',
                        lazy: async () => ({
                          Component: (await import('../features/shipping/ShipmentsPage')).ShipmentDetailPage,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.UserRead} />,
                    children: [
                      { path: 'users', element: <Navigate to="/admin/access/users" replace /> },
                      {
                        path: 'access/users',
                        lazy: async () => ({
                          Component: (await import('../features/admin-access/UsersPage')).default,
                        }),
                      },
                      {
                        path: 'access/users/:id',
                        lazy: async () => ({
                          Component: (await import('../features/admin-access/UsersPage')).UserAccessPage,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.RoleManage} />,
                    children: [
                      {
                        path: 'access/roles',
                        lazy: async () => ({
                          Component: (await import('../features/admin-access/RolesPage')).default,
                        }),
                      },
                      {
                        path: 'access/roles/:id',
                        lazy: async () => ({
                          Component: (await import('../features/admin-access/RolesPage')).RoleDetailPage,
                        }),
                      },
                      {
                        path: 'access/audit',
                        lazy: async () => ({
                          Component: (await import('../features/admin-access/RolesPage')).AccessAuditPage,
                        }),
                      },
                    ],
                  },
                  {
                    element: <RequirePermission permission={P.SystemRead} />,
                    children: [
                      {
                        path: 'system',
                        lazy: async () => ({
                          Component: (await import('../features/system/SystemPage')).default,
                        }),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
