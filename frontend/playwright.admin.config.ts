import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-admin',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Le serveur de dev compile à la demande : trop de workers en parallèle
  // retardent le premier rendu des routes lazy-loaded.
  workers: process.env.CI ? 2 : 4,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4201',
    trace: 'retain-on-failure',
    launchOptions: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']
      ? { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] }
      : {},
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'pnpm exec ng serve admin --host 127.0.0.1 --port 4201',
    url: 'http://127.0.0.1:4201/connexion',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
