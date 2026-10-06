import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';

const directory = process.env.VISUAL_ARTIFACT_DIR || 'artifacts/frontend-visual';
async function capture(page: Page, name: string) {
  await expect(page.locator('.skeleton')).toHaveCount(0);
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: resolve(directory, width + '-' + name + '.png'), fullPage: true });
  }
}

// These interactions use the running Gateway and real catalog, not stubbed production records.
test('product-led discovery, URL filtering and browser history work together', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/');
  const spotlight = page.locator('.product-spotlight');
  await expect(spotlight).toBeVisible();
  const price = await spotlight.locator('.spotlight-copy > p').boundingBox();
  expect(price).not.toBeNull();
  expect(price!.y + price!.height).toBeLessThan(844);
  await page.getByRole('searchbox', { name: 'Search the collection' }).fill('KEYBOARD-001');
  await page.getByRole('searchbox', { name: 'Search the collection' }).press('Enter');
  await expect(page).toHaveURL(/q=KEYBOARD-001/);
  await expect(
    page.locator('.collection-results').getByRole('heading', { name: 'Mechanical Keyboard', exact: true }),
  ).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Filters' }).click();
  await page.getByLabel('Minimum', { exact: true }).fill('10');
  await expect(page).toHaveURL(/minPrice=10/);
  await page.getByLabel('Maximum', { exact: true }).fill('999');
  await expect(page).toHaveURL(/maxPrice=999/);
  await page.getByLabel('Sort by').selectOption('price-asc');
  await expect(page).toHaveURL(/sort=price-asc/);
  await page.locator('summary').filter({ hasText: 'Filters' }).click();
  await page.getByRole('button', { name: 'Remove minimum price filter' }).click();
  await expect(page).not.toHaveURL(/minPrice/);
  await expect(page).toHaveURL(/maxPrice=999/);
  await expect(page).toHaveURL(/page=1/);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Remove minimum price filter' })).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Filters' }).click();
  await capture(page, 'catalog-filter-open');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.getByLabel('Search products')).toHaveValue('');
  await expect(page.getByLabel('Sort by')).toHaveValue('name');
  await expect(page).not.toHaveURL(/minPrice|maxPrice|sort=|q=|search=/);
});

test('focused auth exposes validation and supports keyboard password visibility', async ({ page }) => {
  await page.goto('/login');
  await capture(page, 'auth-login');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('ExamplePassword123!');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Hide password' }).press('Enter');
  await expect(password).toHaveAttribute('type', 'password');
  await password.clear();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2);
  await page.goto('/register');
  await capture(page, 'auth-register');
});

test('workspace palette and drawer retain focus while form and access layouts adapt', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(process.env.ADMIN_EMAIL || '');
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD || '');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/admin');
  const command = page.getByRole('button', { name: /Go to…/ });
  await command.click();
  const search = page.getByRole('searchbox', { name: 'Search workspace areas' });
  await expect(search).toBeFocused();
  await search.fill('roles');
  await expect(page.getByText('1 available area')).toBeVisible();
  await page.screenshot({ path: resolve(directory, 'command-palette.png') });
  await page.keyboard.press('Escape');
  await expect(command).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await search.fill('roles');
  await page.getByRole('button', { name: 'Roles & permissions Access' }).click();
  await expect(page).toHaveURL(/\/admin\/access\/roles$/);
  await page.setViewportSize({ width: 375, height: 844 });
  const navigation = page.getByRole('button', { name: 'Open navigation' });
  await navigation.click();
  await expect(page.getByRole('dialog', { name: 'Operations navigation' })).toBeVisible();
  await page.screenshot({ path: resolve(directory, 'mobile-navigation.png') });
  await page.keyboard.press('Escape');
  await expect(navigation).toBeFocused();
  await navigation.click();
  await page.getByRole('dialog').getByRole('link', { name: 'Products', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for (const [route, name] of [
    ['/admin/products/new', 'product-form'],
    ['/admin/inventory/22222222-2222-2222-2222-222222222222', 'inventory-form'],
    ['/admin/access/users', 'users'],
    ['/admin/access/audit', 'audit'],
    ['/admin/system', 'system'],
  ]) {
    await page.goto(route);
    await capture(page, name);
  }
});
