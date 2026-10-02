import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  Permissions as P,
  type User,
  safeDestination,
} from './permissions';
import { visibleNavigation } from '../layouts/adminNavigation';
const user: User = {
  id: '1',
  email: 'warehouse@example.test',
  roles: ['ArbitraryRole'],
  permissions: [P.BackofficeAccess, P.InventoryRead],
};
describe('effective permissions', () => {
  it('checks capabilities independently from role names', () => {
    expect(hasPermission(user, P.InventoryRead)).toBe(true);
    expect(hasPermission(user, P.InventoryAdjust)).toBe(false);
  });
  it('supports any and all requirements', () => {
    expect(hasAnyPermission(user, [P.InventoryRead, P.PaymentRead])).toBe(true);
    expect(hasAllPermissions(user, [P.InventoryRead, P.InventoryAdjust])).toBe(false);
    expect(hasPermission(null, P.InventoryRead)).toBe(false);
  });
  it('shows inventory navigation without granting adjustment', () => {
    expect(visibleNavigation(user).map((i) => i.label)).toEqual(['Overview', 'Inventory']);
  });
  it('rejects external post-login destinations', () => {
    expect(safeDestination('//example.test')).toBe('/');
    expect(safeDestination('/orders?page=2')).toBe('/orders?page=2');
  });
});
