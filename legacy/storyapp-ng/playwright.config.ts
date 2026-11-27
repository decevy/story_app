import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests expect the API (with a seeded database) to be running. Locally that is
 * https://localhost:7011; CI points the dev-server proxy elsewhere with API_PROXY_TARGET.
 */
const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `e2e` serve configuration: dev build without Vite prebundling, so the page is not
    // reloaded mid-test when lazy dependencies are discovered.
    command: 'npx ng serve --configuration e2e',
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
