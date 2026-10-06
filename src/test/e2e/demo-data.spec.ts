import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import type { Category, Product, ProductPage } from '../../features/catalog/api';
import { resolve } from 'node:path';

const apiBase = process.env.API_BASE_URL || 'http://localhost:8080';
const screenshots = process.env.VISUAL_ARTIFACT_DIR || 'artifacts/demo-data';
test.skip(process.env.DEMO_E2E !== 'true', 'Run after importing tech-demo-v1 with DEMO_E2E=true.');

async function review(page: Page, name: string) {
  await expect(page.locator('.skeleton')).toHaveCount(0);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    // Full-page screenshots need real scrolling to load photos below the viewport.
    for (const photo of await page.locator('img[src^="/api/catalog/media/"]').all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect
        .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: resolve(screenshots, `${width}-${name}.png`), fullPage: true });
  }
}
async function authenticate(request: APIRequestContext, admin: boolean) {
  const response = await request.post(apiBase + '/api/auth/login', {
    data: {
      email: process.env[admin ? 'ADMIN_EMAIL' : 'CUSTOMER_EMAIL'],
      password: process.env[admin ? 'ADMIN_PASSWORD' : 'CUSTOMER_PASSWORD'],
    },
  });
  expect(response.status()).toBe(200);
  const tokens: { accessToken: string } = await response.json();
  return { Authorization: 'Bearer ' + tokens.accessToken };
}

test('200 stored models, live group counts and local product photos support responsive discovery', async ({
  page,
  request,
}) => {
  const products: Product[] = [];
  for (const number of [1, 2]) {
    const response = await request.get(
      apiBase + `/api/catalog/products?search=DEMO-&status=Active&pageSize=100&page=${number}`,
    );
    const result: ProductPage = await response.json();
    expect(result.total).toBe(200);
    products.push(...result.items);
  }
  expect(new Set(products.map((product) => product.sku)).size).toBe(200);
  expect(
    products.every(
      (product) =>
        product.imageUrl?.startsWith('/api/catalog/media/') &&
        product.brand &&
        product.categorySlug &&
        product.sourceUrl?.startsWith('https://'),
    ),
  ).toBe(true);
  const categories: Category[] = await (await request.get(apiBase + '/api/catalog/categories')).json();
  const demoGroups = categories.filter((group) =>
    products.some((product) => product.categorySlug === group.slug),
  );
  expect(demoGroups).toHaveLength(9);
  expect(demoGroups.reduce((count, group) => count + group.productCount, 0)).toBe(200);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Shop by collection.' })).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.product-spotlight img').evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await review(page, 'home');
  const group = demoGroups.find((entry) => entry.slug === 'keyboards')!;
  await page
    .locator('.collection-groups')
    .getByRole('link', { name: new RegExp(group.name) })
    .click();
  await expect(page).toHaveURL(/category=keyboards/);
  await expect(page.getByRole('combobox', { name: 'Collection', exact: true })).toHaveValue('keyboards');
  await expect(page.locator('.collection-count')).toContainText(`${group.productCount} products`);
  await review(page, 'keyboards');
  await page.getByLabel('Sort by').selectOption('price-desc');
  await expect(page).toHaveURL(/page=1/);
  await expect(page).toHaveURL(/category=keyboards/);
  await page.locator('.product-card').first().getByRole('link').click();
  await expect
    .poll(() =>
      page.locator('.product-gallery img').evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await review(page, 'product');
});

test('group administration enforces permissions and preserves imported photos when updating old-format DTOs', async ({
  request,
  page,
}) => {
  const admin = await authenticate(request, true);
  const customer = await authenticate(request, false);
  expect((await request.get(apiBase + '/api/catalog/categories?includeInactive=true')).status()).toBe(401);
  expect(
    (
      await request.get(apiBase + '/api/catalog/categories?includeInactive=true', { headers: customer })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(apiBase + '/api/catalog/categories', {
        headers: customer,
        data: { name: 'Forbidden', slug: 'forbidden' },
      })
    ).status(),
  ).toBe(403);
  const catalog: ProductPage = await (
    await request.get(apiBase + '/api/catalog/products?search=DEMO-&status=Active&pageSize=1')
  ).json();
  const product = catalog.items[0];
  const oldFormat = {
    name: product.name,
    description: product.description,
    priceAmount: product.priceAmount,
    priceCurrency: product.priceCurrency,
  };
  expect(
    (
      await request.put(apiBase + '/api/catalog/products/' + product.id, { headers: admin, data: oldFormat })
    ).status(),
  ).toBe(204);
  const after: Product = await (await request.get(apiBase + '/api/catalog/products/' + product.id)).json();
  expect(after.imageUrl).toBe(product.imageUrl);
  expect(after.sourceUrl).toBe(product.sourceUrl);
  expect(after.categorySlug).toBe(product.categorySlug);
  expect(
    (
      await request.put(apiBase + '/api/catalog/products/' + product.id, {
        headers: admin,
        data: { ...oldFormat, categorySlug: 'missing-demo-group' },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.put(apiBase + '/api/catalog/products/' + product.id, {
        headers: admin,
        data: { ...oldFormat, imageUrl: 'https://example.com/photo.jpg' },
      })
    ).status(),
  ).toBe(400);
  await page.goto('/login');
  await page.getByLabel('Email address').fill(process.env.ADMIN_EMAIL || '');
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD || '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/admin/collections');
  await review(page, 'collections-admin');
  await page.goto('/admin/products/' + product.id);
  await expect(page.getByLabel('Collection', { exact: true })).toHaveValue(product.categorySlug || '');
  await expect(page.getByLabel('Brand', { exact: true })).toHaveValue(product.brand || '');
  await review(page, 'product-form');
  await page.goto('/admin');
  await review(page, 'dashboard');
});
