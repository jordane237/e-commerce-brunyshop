import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['libs/**/*.spec.ts', 'apps/**/*.spec.ts'],
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    clearMocks: true,
  },
});
