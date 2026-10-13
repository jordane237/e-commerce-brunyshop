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
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
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
