import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';
const apiBase = process.env.API_BASE_URL || 'http://localhost:8080';
const visualDirectory = process.env.VISUAL_ARTIFACT_DIR || 'artifacts/frontend-visual';
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});
async function login(page: Page, admin = false, credentials?: { email: string; password: string }) {
  await page.goto('/login');
  await page
    .getByLabel('Email address')
    .fill(credentials?.email || process.env[admin ? 'ADMIN_EMAIL' : 'CUSTOMER_EMAIL'] || '');
  await page
    .getByLabel('Password', { exact: true })
    .fill(credentials?.password || process.env[admin ? 'ADMIN_PASSWORD' : 'CUSTOMER_PASSWORD'] || '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function review(page: Page, name: string) {
  await expect(page.locator('.skeleton')).toHaveCount(0);
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({
      path: resolve(visualDirectory, width + '-' + name + '.png'),
      fullPage: true,
    });
  }
}
test('customer checkout reaches the persisted terminal state and rejects admin access', async ({
  page,
  request,
}) => {
  const credentials = {
    email: 'checkout-' + Date.now() + '@example.test',
    password: 'ReferencePassword123!',
  };
  expect((await request.post(apiBase + '/api/auth/register', { data: credentials })).status()).toBe(201);
  await login(page, false, credentials);
  const refreshed = page.waitForResponse(
    (response) => response.url().includes('/api/auth/refresh') && response.request().method() === 'POST',
  );
  await page.reload();
  expect((await refreshed).status()).toBe(200);
  const adminLogin = await request.post(apiBase + '/api/auth/login', {
    data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  const admin: { accessToken: string } = await adminLogin.json();
  const headers = { Authorization: 'Bearer ' + admin.accessToken };
  const stockUrl = apiBase + '/api/inventory/22222222-2222-2222-2222-222222222222';
  const before: { quantityOnHand: number; reservedQuantity: number } = await (
    await request.get(stockUrl, { headers })
  ).json();
  await page.goto('/products');
  await page.getByRole('heading', { name: 'Mechanical Keyboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mechanical Keyboard', exact: true })).toBeVisible();
  await review(page, 'product-detail');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByText('Item added to your cart.')).toBeVisible();
  await page.getByRole('link', { name: 'Shopping cart', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Quantity for Mechanical Keyboard' }).fill('2');
  await expect(page.getByRole('spinbutton', { name: 'Quantity for Mechanical Keyboard' })).toHaveValue('2');
  await expect(page.getByRole('spinbutton', { name: 'Quantity for Mechanical Keyboard' })).toBeEnabled();
  await review(page, 'cart');
  await page.getByRole('link', { name: 'Continue to checkout' }).click();
  await page.getByLabel('Recipient name').fill('Commerce E2E Customer');
  await page.getByLabel('Street address').fill('1 Architecture Way');
  await page.getByLabel('City', { exact: true }).fill('Hanoi');
  await page.getByLabel('Postal code').fill('100000');
  await review(page, 'checkout');
  let checkouts = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/orders/checkout')) checkouts++;
  });
  await page.getByRole('button', { name: 'Place order', exact: true }).dblclick();
  const failed = process.env.PAYMENT_OUTCOME === 'Failure';
  await expect(
    page.getByRole('heading', { name: failed ? 'Your order was cancelled.' : 'Your order is confirmed.' }),
  ).toBeVisible({ timeout: 75_000 });
  expect(checkouts).toBe(1);
  if (failed)
    await expect(
      page.getByText('Payment could not be completed. Reserved stock has been released.'),
    ).toBeVisible({ timeout: 75_000 });
  const orderId = page.url().split('/').pop()!;
  await review(page, failed ? 'processing-cancelled' : 'processing-confirmed');
  const after: { quantityOnHand: number; reservedQuantity: number } = await (
    await request.get(stockUrl, { headers })
  ).json();
  expect(after.reservedQuantity).toBe(0);
  expect(after.quantityOnHand).toBe(before.quantityOnHand - (failed ? 0 : 2));
  await page.getByRole('link', { name: 'View order details' }).click();
  await expect(page.getByRole('heading', { name: 'Order activity' })).toBeVisible();
  await expect(page.getByText('Commerce E2E Customer')).toBeVisible();
  await review(page, failed ? 'order-cancelled' : 'order-detail');
  await page.goto('/orders');
  await expect(page.locator('a[href="/orders/' + orderId + '"]')).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByText('403', { exact: true })).toBeVisible();
});
test('administrator manages a real product, stock and access pages', async ({ page, request }) => {
  await login(page, true);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'The business, at a glance.' })).toBeVisible();
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await page.getByRole('link', { name: 'Create product', exact: true }).click();
  const sku = 'E2E-' + Date.now();
  await page.getByLabel('SKU', { exact: true }).fill(sku);
  await page.getByLabel('Product name').fill('Reference desk tool ' + sku);
  await page
    .getByLabel('Description', { exact: true })
    .fill('End-to-end fixture created through the public Gateway.');
  await page.getByLabel('Price amount').fill('49.95');
  const created = page.waitForResponse(
    (response) => response.url().includes('/api/catalog/products') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Save product' }).click();
  const product: { productId: string } = await (await created).json();
  await page.goto('/admin/products/' + product.productId);
  await page.getByRole('button', { name: 'Activate product', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Deactivate product', exact: true })).toBeVisible();
  await page.getByLabel('Product name').fill('Updated reference desk tool ' + sku);
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.goto('/admin/inventory/' + product.productId);
  await page.getByLabel('Quantity change').fill('10');
  await page.getByLabel('Reason', { exact: true }).fill('Receive E2E development fixture stock');
  await page.getByRole('button', { name: 'Review adjustment' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('10', { exact: true }).first()).toBeVisible();
  for (const [route, heading] of [
    ['orders', 'Orders'],
    ['payments', 'Payments'],
    ['shipments', 'Shipments'],
    ['access/users', 'Users'],
    ['access/roles', 'Role bundles'],
    ['system', 'Gateway readiness'],
  ]) {
    await page.goto('/admin/' + route);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  // Clean up publication through the same authorized application endpoint; retain auditable test data.
  const authResponse = await request.post(apiBase + '/api/auth/login', {
    data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  const auth: { accessToken: string } = await authResponse.json();
  expect(
    (
      await request.post(apiBase + '/api/catalog/products/' + product.productId + '/deactivate', {
        headers: { Authorization: 'Bearer ' + auth.accessToken },
      })
    ).status(),
  ).toBe(204);
});
test('permission bundles, JWT renewal, API enforcement and resource ownership work end to end', async ({
  request,
}) => {
  const adminResponse = await request.post(apiBase + '/api/auth/login', {
    data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  const admin: { accessToken: string } = await adminResponse.json();
  const headers = { Authorization: 'Bearer ' + admin.accessToken };
  expect((await request.get(apiBase + '/api/inventory')).status()).toBe(401);
  const email = 'permission-' + Date.now() + '@example.test';
  const password = 'ReferencePassword123!';
  const registered = await request.post(apiBase + '/api/auth/register', { data: { email, password } });
  const initial: { accessToken: string } = await registered.json();
  const me: { id: string } = await (
    await request.get(apiBase + '/api/auth/me', {
      headers: { Authorization: 'Bearer ' + initial.accessToken },
    })
  ).json();
  const roles: { id: string; name: string; permissions: string[] }[] = await (
    await request.get(apiBase + '/api/auth/roles', { headers })
  ).json();
  const warehouse = roles.find((r) => r.name === 'WarehouseManager')!;
  expect(
    (
      await request.get(apiBase + '/api/inventory', {
        headers: { Authorization: 'Bearer ' + initial.accessToken },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.put(apiBase + '/api/auth/users/' + me.id + '/roles', {
        headers,
        data: { roles: ['WarehouseManager', 'CatalogManager'] },
      })
    ).status(),
  ).toBe(204);
  const loginResponse = await request.post(apiBase + '/api/auth/login', { data: { email, password } });
  const staff: { accessToken: string; refreshToken: string } = await loginResponse.json();
  const modified = warehouse.permissions.filter((p) => p !== 'inventory.adjust');
  try {
    expect(
      (
        await request.put(apiBase + '/api/auth/roles/' + warehouse.id + '/permissions', {
          headers,
          data: { permissions: modified },
        })
      ).status(),
    ).toBe(204);
    const renewed = await request.post(apiBase + '/api/auth/refresh', {
      data: { refreshToken: staff.refreshToken },
    });
    const token: { accessToken: string; refreshToken: string } = await renewed.json();
    const claims: { permission: string[] | string } = JSON.parse(
      Buffer.from(token.accessToken.split('.')[1], 'base64url').toString(),
    );
    expect(claims.permission).toContain('inventory.read');
    expect(claims.permission).not.toContain('inventory.adjust');
    expect(claims.permission).toContain('catalog.products.create');
    const effective = Array.isArray(claims.permission) ? claims.permission : [claims.permission];
    expect(new Set(effective).size).toBe(effective.length);
    const staffHeaders = { Authorization: 'Bearer ' + token.accessToken };
    expect((await request.get(apiBase + '/api/inventory', { headers: staffHeaders })).status()).toBe(200);
    expect(
      (
        await request.post(apiBase + '/api/inventory/22222222-2222-2222-2222-222222222222/adjustments', {
          headers: staffHeaders,
          data: { delta: 1, reason: 'Forbidden mutation', version: 0 },
        })
      ).status(),
    ).toBe(403);
    expect((await request.get(apiBase + '/api/payments', { headers: staffHeaders })).status()).toBe(403);
    expect(
      (
        await request.put(apiBase + '/api/auth/users/' + me.id + '/roles', {
          headers: staffHeaders,
          data: { roles: ['Admin'] },
        })
      ).status(),
    ).toBe(403);
    const replay = await request.post(apiBase + '/api/auth/refresh', {
      data: { refreshToken: staff.refreshToken },
    });
    expect(replay.status()).toBe(401);
    const race = await Promise.all(
      [1, 2].map(() =>
        request.post(apiBase + '/api/auth/refresh', { data: { refreshToken: token.refreshToken } }),
      ),
    );
    expect(race.map((response) => response.status()).sort()).toEqual([200, 401]);
    const customerResponse = await request.post(apiBase + '/api/auth/login', {
      data: { email: process.env.CUSTOMER_EMAIL, password: process.env.CUSTOMER_PASSWORD },
    });
    const customer: { accessToken: string } = await customerResponse.json();
    const orders: { items: { id: string }[] } = await (
      await request.get(apiBase + '/api/orders', {
        headers: { Authorization: 'Bearer ' + customer.accessToken },
      })
    ).json();
    expect(orders.items.length).toBeGreaterThan(0);
    if (orders.items[0]) {
      const other = await request.post(apiBase + '/api/auth/register', {
        data: { email: 'other-' + Date.now() + '@example.test', password },
      });
      const otherToken: { accessToken: string } = await other.json();
      expect(
        (
          await request.get(apiBase + '/api/orders/' + orders.items[0].id, {
            headers: { Authorization: 'Bearer ' + otherToken.accessToken },
          })
        ).status(),
      ).toBe(404);
      expect(
        (
          await request.get(apiBase + '/api/orders/' + orders.items[0].id, { headers: staffHeaders })
        ).status(),
      ).toBe(200);
    }
  } finally {
    await request.put(apiBase + '/api/auth/roles/' + warehouse.id + '/permissions', {
      headers,
      data: { permissions: warehouse.permissions },
    });
  }
});
test('insufficient stock cancels checkout without starting a payment', async ({ page, request }) => {
  const adminLogin = await request.post(apiBase + '/api/auth/login', {
    data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  const admin: { accessToken: string } = await adminLogin.json();
  const adminHeaders = { Authorization: 'Bearer ' + admin.accessToken };
  const created = await request.post(apiBase + '/api/catalog/products', {
    headers: adminHeaders,
    data: {
      sku: 'E2E-STOCK-' + Date.now(),
      name: 'Stock-limited test fixture',
      description: 'Isolated reservation failure fixture.',
      priceAmount: 10,
      priceCurrency: 'USD',
    },
  });
  expect(created.status()).toBe(201);
  const product: { productId: string } = await created.json();
  try {
    expect(
      (
        await request.post(apiBase + '/api/catalog/products/' + product.productId + '/activate', {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(204);
    expect(
      (
        await request.post(apiBase + '/api/inventory/' + product.productId + '/adjustments', {
          headers: adminHeaders,
          data: { delta: 1, reason: 'Receive isolated limited fixture', version: 0 },
        })
      ).status(),
    ).toBe(200);
    const credentials = { email: 'stock-' + Date.now() + '@example.test', password: 'ReferencePassword123!' };
    const registered = await request.post(apiBase + '/api/auth/register', { data: credentials });
    const customer: { accessToken: string } = await registered.json();
    expect(
      (
        await request.put(apiBase + '/api/cart/items/' + product.productId, {
          headers: { Authorization: 'Bearer ' + customer.accessToken },
          data: { quantity: 2 },
        })
      ).status(),
    ).toBe(200);
    await login(page, false, credentials);
    await page.goto('/checkout');
    await page.getByLabel('Recipient name').fill('Limited Stock Customer');
    await page.getByLabel('Street address').fill('1 Reference Way');
    await page.getByLabel('City', { exact: true }).fill('Hanoi');
    await page.getByLabel('Postal code').fill('100000');
    await page.getByRole('button', { name: 'Place order', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your order was cancelled.' })).toBeVisible({
      timeout: 75_000,
    });
    await expect(page.getByText('One or more items are no longer available.')).toBeVisible();
    const orderId = page.url().split('/').pop()!;
    expect(
      (await request.get(apiBase + '/api/payments/orders/' + orderId, { headers: adminHeaders })).status(),
    ).toBe(404);
    const stock: { quantityOnHand: number; reservedQuantity: number } = await (
      await request.get(apiBase + '/api/inventory/' + product.productId, { headers: adminHeaders })
    ).json();
    expect(stock.quantityOnHand).toBe(1);
    expect(stock.reservedQuantity).toBe(0);
  } finally {
    await request.post(apiBase + '/api/catalog/products/' + product.productId + '/deactivate', {
      headers: adminHeaders,
    });
  }
});
test('important screens remain usable at mobile, tablet and desktop widths', async ({ page }) => {
  await login(page, true);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      '/',
      '/products',
      '/cart',
      '/admin',
      '/admin/products',
      '/admin/inventory',
      '/admin/orders',
      '/admin/payments',
      '/admin/shipments',
      '/admin/access/roles',
    ]) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('.skeleton')).toHaveCount(0);
      await expect(page.locator('[role="alert"]')).toHaveCount(0);
      await page.screenshot({
        path: resolve(visualDirectory, width + '-' + (route.replaceAll('/', '-') || 'home') + '.png'),
        fullPage: true,
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(
        true,
      );
    }
  }
});
