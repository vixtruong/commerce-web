export const Permissions = {
  ProductRead: 'catalog.products.read',
  ProductCreate: 'catalog.products.create',
  ProductUpdate: 'catalog.products.update',
  ProductDeactivate: 'catalog.products.deactivate',
  InventoryRead: 'inventory.read',
  InventoryAdjust: 'inventory.adjust',
  ReservationRead: 'inventory.reservations.read',
  OrderRead: 'orders.read',
  PaymentRead: 'payments.read',
  ShipmentRead: 'shipments.read',
  ShipmentUpdate: 'shipments.update',
  UserRead: 'users.read',
  RoleManage: 'users.roles.manage',
  SystemRead: 'system.health.read',
  BackofficeAccess: 'backoffice.access',
} as const;
export type Permission = (typeof Permissions)[keyof typeof Permissions];
export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}
export function hasPermission(user: User | null | undefined, permission: Permission) {
  return user?.permissions.includes(permission) ?? false;
}
export const can = hasPermission;
export function hasAnyPermission(user: User | null | undefined, permissions: Permission[]) {
  return permissions.some((p) => hasPermission(user, p));
}
export function hasAllPermissions(user: User | null | undefined, permissions: Permission[]) {
  return permissions.every((p) => hasPermission(user, p));
}
export function hasRole(user: User | null | undefined, role: string) {
  return user?.roles.includes(role) ?? false;
}
export function safeDestination(path: unknown) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}
