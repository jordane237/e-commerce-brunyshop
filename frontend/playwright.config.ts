import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    launchOptions: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']
      ? { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] }
      : {},
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'pnpm exec ng serve storefront --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200/boutique',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
