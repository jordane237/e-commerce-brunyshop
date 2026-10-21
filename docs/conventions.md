# Conventions de développement

- Code, noms techniques et commentaires en anglais; textes UI et documentation utilisateur en français.
- TypeScript strict, composants Angular standalone, gabarits avec la syntaxe moderne et état local réactif.
- NestJS : contrôleur HTTP mince → service métier → Prisma; validation d’entrée par DTO.
- Une fonctionnalité frontend ne dépend pas directement d’une autre fonctionnalité; le partage passe par `libs/`.
- Argent en entiers XAF, dates UTC, UUID comme identifiants, suppression logique lorsque définie par le modèle.
- Commits Conventional Commits : `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Toute modification de schéma inclut une migration; tout changement d’API actualise Swagger et le client généré.
- Revue de code : comportement, permissions, validation, données personnelles/logs, accessibilité, tests adaptés.
