import angular from '@analogjs/vite-plugin-angular';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const tsconfig = join(dirname(fileURLToPath(import.meta.url)), 'tsconfig.spec.json');

export default defineConfig({
  plugins: [angular({ tsconfig })],
  server: {
    deps: {
      inline: [/@angular\//],
    },
  },
  test: {
    include: ['libs/**/*.spec.ts', 'apps/**/*.spec.ts'],
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    setupFiles: ['./test-setup.ts'],
    clearMocks: true,
  },
});
