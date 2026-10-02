import { defineConfig } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// Read test credentials explicitly; the standalone repository never requires backend files in its source tree.
const localEnv = resolve(process.cwd(), process.env.E2E_ENV_FILE || '.env.e2e');
if (existsSync(localEnv))
  for (const line of readFileSync(localEnv, 'utf8').split(/\r?\n/)) {
    const match = /^([^#=]+)=(.*)$/.exec(line);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
export default defineConfig({
  testDir: './src/test/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.WEB_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.WEB_BASE_URL
    ? undefined
    : { command: 'pnpm dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
});
