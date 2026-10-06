import { Permissions, hasPermission, type Permission, type User } from '../auth/permissions';
import {
  Activity,
  Boxes,
  CreditCard,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
export interface NavigationItem {
  label: string;
  href: string;
  group: string;
  permission: Permission;
  icon: LucideIcon;
}
export const adminNavigation: NavigationItem[] = [
  {
    label: 'Overview',
    href: '/admin',
    group: 'Workspace',
    permission: Permissions.BackofficeAccess,
    icon: LayoutDashboard,
  },
  {
    label: 'Products',
    href: '/admin/products',
    group: 'Commerce',
    permission: Permissions.ProductRead,
    icon: Package,
  },
  {
    label: 'Inventory',
    href: '/admin/inventory',
    group: 'Commerce',
    permission: Permissions.InventoryRead,
    icon: Boxes,
  },
  {
    label: 'Collections',
    href: '/admin/collections',
    group: 'Commerce',
    permission: Permissions.ProductUpdate,
    icon: Boxes,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    group: 'Sales',
    permission: Permissions.OrderRead,
    icon: ShoppingBag,
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    group: 'Sales',
    permission: Permissions.PaymentRead,
    icon: CreditCard,
  },
  {
    label: 'Shipments',
    href: '/admin/shipments',
    group: 'Sales',
    permission: Permissions.ShipmentRead,
    icon: Truck,
  },
  {
    label: 'Users',
    href: '/admin/access/users',
    group: 'Access',
    permission: Permissions.UserRead,
    icon: Users,
  },
  {
    label: 'Roles & permissions',
    href: '/admin/access/roles',
    group: 'Access',
    permission: Permissions.RoleManage,
    icon: ShieldCheck,
  },
  {
    label: 'System',
    href: '/admin/system',
    group: 'System',
    permission: Permissions.SystemRead,
    icon: Activity,
  },
];
export function visibleNavigation(user: User | null | undefined) {
  return adminNavigation.filter((item) => hasPermission(user, item.permission));
}
