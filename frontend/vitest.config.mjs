import angular from '@analogjs/vite-plugin-angular';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const tsconfig = join(dirname(fileURLToPath(import.meta.url)), 'tsconfig.spec.json');
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@bruny/util': join(root, 'libs/util/src/index.ts'),
      '@bruny/core': join(root, 'libs/core/src/index.ts'),
      '@bruny/data-access': join(root, 'libs/data-access/src/index.ts'),
      '@bruny/ui': join(root, 'libs/ui/src/index.ts'),
    },
  },
  plugins: [angular({ tsconfig })],
  server: {
    deps: {
      inline: [/@angular\//, /@bruny\//],
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
