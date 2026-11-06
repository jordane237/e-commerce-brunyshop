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

// --- Seeds (seed.ts au niveau de prisma) : cycle d'import géré en dur -------
// seed.ts importe les seeds/*.ts et chaque seed importe seed.ts (cycle).
// C'est l'unique graphe de dépendance du seed orchestrateur : on le laisse
// passer. Règle locale à la racine du seed, sans toucher à la config globale.
const seedConfigForScript = [
  {
    files: ['prisma/seeds/**/*.ts', 'prisma/seed.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../prisma/seeds/**', '../prisma/seed.ts'],
              message: 'Import vers seed.ts interdit dans les seeds.',
            },
          ],
        },
      ],
    },
  },
];

// --- Config globale --------------------------------------------------------
// Règles communes à tous les fichiers TypeScript du backend :
//   - pas de console sauf pour les seeds (scripts CLI),
//   - pas de variable inutilisée,
//   - imports cycliques ignorés pour les seeds (seed.ts ne peut pas importer
//     les seeds sans créer de cycle : c'est l'unique graphe du seed orchestrateur).
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
      // Imports cycliques dans les seeds (seed.ts ne peut pas importer les seeds
      // sans créer de cycle : c'est l'unique graphe du seed orchestrateur).
      'import/no-cycle': 'off',
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
  // Seeds : cycle d'import via seed.ts orchestrateur — règle locale.
  ...seedConfigForScript,
);
