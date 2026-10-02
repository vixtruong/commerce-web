import { Permissions, hasPermission, type Permission, type User } from '../auth/permissions';
export interface NavigationItem {
  label: string;
  href: string;
  group: string;
  permission: Permission;
}
export const adminNavigation: NavigationItem[] = [
  { label: 'Overview', href: '/admin', group: 'Workspace', permission: Permissions.BackofficeAccess },
  { label: 'Products', href: '/admin/products', group: 'Commerce', permission: Permissions.ProductRead },
  { label: 'Inventory', href: '/admin/inventory', group: 'Commerce', permission: Permissions.InventoryRead },
  { label: 'Orders', href: '/admin/orders', group: 'Sales', permission: Permissions.OrderRead },
  { label: 'Payments', href: '/admin/payments', group: 'Sales', permission: Permissions.PaymentRead },
  { label: 'Shipments', href: '/admin/shipments', group: 'Sales', permission: Permissions.ShipmentRead },
  { label: 'Users', href: '/admin/access/users', group: 'Access', permission: Permissions.UserRead },
  {
    label: 'Roles & permissions',
    href: '/admin/access/roles',
    group: 'Access',
    permission: Permissions.RoleManage,
  },
  { label: 'System', href: '/admin/system', group: 'System', permission: Permissions.SystemRead },
];
export function visibleNavigation(user: User | null | undefined) {
  return adminNavigation.filter((item) => hasPermission(user, item.permission));
}
