// Backend ESLint flat config (NestJS + TypeScript strict).
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'src/generated'] },
  // Plain JavaScript ESM configs: provide the Node globals explicitly.
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
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
  // CLI scripts (seed) print to stdout by design; no-console does not apply.
  {
    files: ['prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
