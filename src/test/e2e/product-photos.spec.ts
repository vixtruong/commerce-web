import { test, expect, type Page } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import type { Product, ProductPage } from '../../features/catalog/api';

const apiBase = process.env.API_BASE_URL || 'http://localhost:8080';
const assetDirectory = resolve(
  process.env.DEMO_ASSET_DIR || '../Commerce/src/Services/Catalog/Catalog.Api/wwwroot/demo-products',
);
const screenshots = process.env.VISUAL_ARTIFACT_DIR || 'artifacts/demo-data';
test.skip(process.env.DEMO_E2E !== 'true', 'Run with the imported local photo demo.');

async function capture(page: Page, name: string) {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((photo: HTMLImageElement) => photo.naturalWidth))
        .toBeGreaterThan(0);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: resolve(screenshots, `${width}-${name}.png`), fullPage: true });
  }
}

test('multiple photos can be uploaded, replaced and reordered; existing carts display the current primary photo', async ({
  page,
  request,
}) => {
  const files = readdirSync(assetDirectory)
    .filter((filename) => /\.(jpg|png|webp)$/.test(filename))
    .slice(0, 3)
    .map((filename) => resolve(assetDirectory, filename));
  expect(files).toHaveLength(3);
  const customerEmail = `photo-workflow-${Date.now()}@example.test`;
  const customerPassword = process.env.CUSTOMER_PASSWORD || '';
  const registered = await request.post(apiBase + '/api/auth/register', {
    data: { email: customerEmail, password: customerPassword },
  });
  expect(registered.status()).toBe(201);
  const customer: { accessToken: string } = await registered.json();
  const customerHeaders = { Authorization: 'Bearer ' + customer.accessToken };
  const login = await request.post(apiBase + '/api/auth/login', {
    data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  expect(login.status()).toBe(200);
  const administrator: { accessToken: string } = await login.json();
  const adminHeaders = { Authorization: 'Bearer ' + administrator.accessToken };
  const invalidPhoto = {
    file: { name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') },
  };
  expect((await request.post(apiBase + '/api/catalog/images', { multipart: invalidPhoto })).status()).toBe(
    401,
  );
  expect(
    (
      await request.post(apiBase + '/api/catalog/images', {
        headers: customerHeaders,
        multipart: invalidPhoto,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(apiBase + '/api/catalog/images', { headers: adminHeaders, multipart: invalidPhoto })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(apiBase + '/api/catalog/images', {
        headers: adminHeaders,
        multipart: {
          file: { name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) },
        },
      })
    ).status(),
  ).toBe(400);
  await page.goto('/login');
  await page.getByLabel('Email address').fill(process.env.ADMIN_EMAIL || '');
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD || '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/admin/products/new');
  const sku = 'IMG-E2E-' + Date.now();
  await page.getByLabel('SKU', { exact: true }).fill(sku);
  await page.getByLabel('Product name', { exact: true }).fill('Photo workflow fixture');
  await page.getByLabel('Price amount').fill('12.99');
  await page.getByLabel('Collection', { exact: true }).selectOption('keyboards');
  let uploads = 0;
  page.on('request', (message) => {
    if (message.method() === 'POST' && message.url().endsWith('/api/catalog/images')) uploads++;
  });
  await page.getByLabel('Add product photos').setInputFiles(files.slice(0, 2));
  await expect(page.getByRole('img', { name: 'Product preview 2' })).toBeVisible();
  expect(uploads).toBe(0);
  await page.getByRole('button', { name: 'Make photo 2 primary' }).click();
  await capture(page, 'photo-create');
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  expect(uploads).toBe(2);
  const catalog: ProductPage = await (
    await request.get(apiBase + '/api/catalog/products?search=' + sku)
  ).json();
  const product = catalog.items[0];
  expect(product.imageUrls).toHaveLength(2);
  expect(product.imageUrl).toBe(product.imageUrls![0]);
  expect(
    (
      await request.post(apiBase + '/api/catalog/products/' + product.id + '/activate', {
        headers: adminHeaders,
      })
    ).status(),
  ).toBe(204);
  expect(
    (
      await request.post(apiBase + '/api/inventory/' + product.id + '/receipts', {
        headers: adminHeaders,
        data: { quantity: 10 },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.put(apiBase + '/api/cart/items/' + product.id, {
        headers: customerHeaders,
        data: { quantity: 1 },
      })
    ).status(),
  ).toBe(200);
  const customerPage = await page.context().newPage();
  try {
    await customerPage.goto('/login');
    await customerPage.getByLabel('Email address').fill(customerEmail);
    await customerPage.getByLabel('Password', { exact: true }).fill(customerPassword);
    await customerPage.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(customerPage).not.toHaveURL(/\/login/);
    await customerPage.goto('/cart');
    await expect(customerPage.locator('.cart-media img')).toHaveAttribute('src', product.imageUrl!);
    await capture(customerPage, 'photo-cart');
    await page.goto('/admin/products/' + product.id);
    await page.getByLabel('Add product photos').setInputFiles(files[2]);
    await page.getByRole('button', { name: 'Make photo 3 primary' }).click();
    await page.getByRole('button', { name: 'Remove photo 2' }).click();
    await page.getByRole('button', { name: 'Save product' }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    const changed: Product = await (
      await request.get(apiBase + '/api/catalog/products/' + product.id)
    ).json();
    expect(changed.imageUrls).toHaveLength(2);
    expect(changed.imageUrl).not.toBe(product.imageUrl);
    await customerPage.reload();
    await expect(customerPage.locator('.cart-media img')).toHaveAttribute('src', changed.imageUrl!);
    await customerPage.goto('/products/' + product.id);
    await customerPage.getByRole('button', { name: 'View photo 2 of 2' }).click();
    await expect(customerPage.locator('.product-gallery img')).toHaveAttribute('src', changed.imageUrls![1]);
    await capture(customerPage, 'uploaded-gallery');
    const formats: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const type = formats[extname(changed.imageUrl!)];
    for (let round = 0; round < 12; round++) {
      const image = await request.get(apiBase + changed.imageUrl);
      expect(image.status()).toBe(200);
      expect(image.headers()['content-type']).toBe(type);
    }
  } finally {
    await customerPage.close();
    await request.delete(apiBase + '/api/cart', { headers: customerHeaders });
    await request.post(apiBase + '/api/catalog/products/' + product.id + '/deactivate', {
      headers: adminHeaders,
    });
  }
});
