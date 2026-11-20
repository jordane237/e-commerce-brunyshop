import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Le serveur Angular de dev ne supporte pas plusieurs pages en parallèle
  // sans perdre des interactions (clics/URL non appliqués). La suite reste
  // rapide (~1 min) et déterministe en série.
  workers: 1,
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
  // En CI, le workflow démarre le storefront : le webServer Playwright y échoue (exit 127).
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command:
            'node node_modules/@angular/cli/bin/ng.js serve storefront --host 127.0.0.1 --port 4200',
          cwd: frontendRoot,
          url: 'http://127.0.0.1:4200/boutique',
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});
