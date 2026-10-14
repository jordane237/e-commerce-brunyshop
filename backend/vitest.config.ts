import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Unit tests must stay isolated from the running docker stack.
    exclude: ['node_modules/**', 'dist/**'],
  },
});
