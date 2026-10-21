// Root ESLint flat config.
// Nx generators (apps/libs) will add their own configs and reference them here.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      '.nx',
      '.husky',
      'dist',
      'tmp',
      'out-tsc',
      'coverage',
      'infra/docker',
      'docs/**',
      // Build/test caches and outputs, never linted.
      '.angular/**',
      'test-results/**',
      'playwright-report/**',
      // OpenAPI-generated client code: formatted, not hand-linted.
      '**/generated/**',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    // The TypeScript compiler already reports undefined identifiers; no-undef
    // only adds false positives (Node/SSR globals in .d.ts, generated code).
    files: ['**/*.{ts,tsx}'],
    rules: { 'no-undef': 'off' },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'error',
    },
  },
);
