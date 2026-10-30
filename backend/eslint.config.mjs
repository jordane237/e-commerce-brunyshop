// Backend ESLint flat config (NestJS + TypeScript strict).
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// --- Frontières entre modules (TEC-02 #1) ---------------------------------
// Il n'existe pas de barrel index.ts par module (dette documentée, voir ADR).
// On bloque l'atteinte des fichiers d'un module frère, tout en gardant :
//   - le code shared/infra (src/common, src/config, src/infrastructure,
//     src/generated) qui vit hors de src/modules et reste libre d'import ;
//   - la composition NestJS existante catalog -> audit (imports: [AuditModule]),
//     seule dépendance cross-module réelle, sans quoi le lint casserait.
// Les motifs littéraux `../<module>/**` et `../../<module>/**` ne peuvent pas
// attraper `../../common/...` car `common` n'est pas un nom de module.
const MODULES = [
  'analytics',
  'audit',
  'auth',
  'cart',
  'catalog',
  'health',
  'inventory',
  'notifications',
  'orders',
  'payments',
  'promotions',
  'reviews',
  'roles',
  'settings',
  'shipping',
  'users',
  'wishlist',
];

const CROSS_MODULE_MESSAGE =
  'Import cross-module interdit. Passe par le service public du module (imports/exports NestJS) ou un module partagé dans src/common.';

// Construit les motifs de blocage pour un module donné, en excluant certains
// modules autorisés (dépendances NestJS légitimes, ex. audit pour catalog).
function crossModulePatterns(allowedForThisModule = []) {
  const blocked = MODULES.filter((m) => !allowedForThisModule.includes(m));
  return blocked.flatMap((m) => [`../${m}/**`, `../../${m}/**`]);
}

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
  // Frontières entre modules NestJS : blocage par défaut.
  {
    files: ['src/modules/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: crossModulePatterns(), message: CROSS_MODULE_MESSAGE }] },
      ],
    },
  },
  // Exception : catalog dépend légitimement de audit (AuditModule exporté).
  // Override posé APRÈS la règle générale pour prévaloir sur elle.
  {
    files: ['src/modules/catalog/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: crossModulePatterns(['audit']), message: CROSS_MODULE_MESSAGE }],
        },
      ],
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
