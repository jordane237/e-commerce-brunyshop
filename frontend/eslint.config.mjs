// Root ESLint flat config.
// Nx generators (apps/libs) will add their own configs and reference them here.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nx from '@nx/eslint-plugin';

// Frontières de modules (critère TEC-02 #1).
// Les tags sont ceux réellement déclarés dans frontend/*/project.json :
//   apps:        type:app   (scope:admin, scope:storefront)
//   libs:        type:ui, type:data-access, type:util, type:styles
// Le tag type:feature n'existe pas encore : sa contrainte est déclarée pour
// être prête le jour où une lib feature apparaît, sans retaguer l'existant.
const depConstraints = [
  // Une feature ne dépend QUE de couches infra (jamais d'une autre feature).
  {
    sourceTag: 'type:feature',
    onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:data-access', 'type:styles'],
  },
  // Une app ne dépend pas d'une autre app (isolation admin <-> storefront).
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'type:ui',
      'type:util',
      'type:data-access',
      'type:styles',
      'type:feature',
    ],
  },
  // ui importe data-access (types CatalogProduct) + util + styles.
  {
    sourceTag: 'type:ui',
    onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:data-access', 'type:styles'],
  },
  // data-access importe uniquement util (effectiveProductPrice).
  { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
  // util : feuille, aucun import de couche.
  { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
  // styles (design-tokens) : feuille.
  { sourceTag: 'type:styles', onlyDependOnLibsWithTags: ['type:styles'] },
];

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
  // Enregistre le plugin Nx (plugins: { '@nx': ... }) fourni par flat/base.
  ...nx.configs['flat/base'],
  {
    // Frontières de modules : une feature/app ne dépend pas d'une autre.
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints,
        },
      ],
    },
  },
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
