# Contexte de passation pour Codex CLI

Ce document résume l’échange tenu dans ChatGPT/Codex et l’état du dépôt au 24 octobre 2026. Il donne le contexte du travail; il ne reproduit pas mot pour mot l’historique complet du chat.

## Demande de départ

Le projet est **BRUNY SHOPPING**, une boutique de chaussures au Cameroun (français, prix XAF/FCFA). La demande est de mettre en place et compléter les fondations définies dans le long prompt utilisateur : monorepo, Angular storefront SSR et admin SPA, API NestJS modulaire, PostgreSQL/Prisma, Redis/BullMQ, sécurité, Docker, qualité, tests et documentation. Les modules non prioritaires devaient rester des squelettes câblés; le parcours de preuve demandé est le catalogue de la base jusqu’à l’API puis au storefront SSR.

Stack retenue dans le dépôt : pnpm workspaces, Nx dans `frontend/`, Angular standalone pour storefront et admin, NestJS/Prisma/PostgreSQL/Redis pour l’API. Node est défini dans `.nvmrc`.

## Travail déjà réalisé dans le dépôt

- API : bootstrap sécurisé, configuration validée, Swagger, health checks, auth/RBAC déjà présents, modules catalog et inventory, création de produit administrateur auditée et modules métier squelettes documentés.
- Prisma : nouveaux modèles de permissions et soft delete de commande, migration correspondante; seed étendu à 6 rôles, 20 produits de démonstration, variantes, marques et zones.
- Infrastructure Nest : BullMQ, événements et scheduler câblés; contrats de stockage et paiement factice ajoutés.
- Frontend : applications Angular storefront SSR/hydratation et admin SPA; libs data-access, UI, utilitaires FCFA/téléphone et design tokens; pages catalogue, fiche produit, panier de base, connexion et liste admin protégée.
- Client API : OpenAPI TypeScript généré dans `frontend/libs/data-access/src/generated/api-types.ts` depuis Swagger.
- Livraison : Dockerfiles, Compose développement/production, Nginx, CI GitHub Actions, Dependabot, Playwright et documentation d’architecture, sécurité, conventions et ADR.
- Les fichiers `README.md`, `docs/architecture.md`, `docs/security.md`, `docs/conventions.md` et `docs/adr/` décrivent plus en détail le projet.
- Étape 2 du design system : tokens SCSS/CSS extraits de `design1/bruny shopping/bruny shopping.png` (`libs/design-tokens`), 16 composants Angular standalone dans `libs/ui`, route de démonstration `/design-system`, police Plus Jakarta Sans auto-hébergée, documentation dans `docs/design-system/` (audit, hypothèses, référence des tokens).
- Tests composants : Vitest 4 + jsdom + `@analogjs/vite-plugin-angular`, TestBed zoneless (`frontend/vitest.config.mjs`, `frontend/test-setup.ts`, `frontend/tsconfig.spec.json`) ; specs bouton, modale, select, table et toast.

## Vérifications déjà observées

- Backend build, lint et tests unitaires : réussis; 26 tests unitaires.
- Frontend lint et tests unitaires : réussis; 37 tests, dont les composants interactifs : bouton, modale (Échap, backdrop, focus), select (label, erreurs, disabled), table (tri ARIA, actions, pagination, états) et toast (rôles live, fermeture, minuterie).
- Étape 2 : typecheck des deux apps et des specs, lint Nx, tests Vitest et builds production storefront/admin réussis; les polices auto-hébergées sont émises dans les deux bundles.
- Migration Prisma exécutée avec succès sur la base locale; seed exécuté (6 rôles, 20 produits, 691 variantes, 4 marques, 3 zones).
- Tests API e2e : 3 réussis (health/catalogue, accès protégé sans jeton, accès admin refusé au client).
- Build Angular production SSR storefront : réussi. Test HTTP réel : `/boutique` répond 200 et son HTML initial contient le produit seedé `Sandales Kidzo Fun`; la fiche produit répond 200.
- Build admin via Nx : réussi.
- Compose a démarré PostgreSQL, Redis et Mailpit et leurs healthchecks étaient verts.

## À reprendre / limites non levées

1. Les pages hors catalogue/fiche produit utilisent encore les styles hérités et les alias `--color-*` : leur migration vers les composants `@bruny/ui` reste à planifier.
2. L’e2e Playwright est configuré mais n’a pas pu être validé dans cet environnement : le téléchargement Chromium Playwright est resté bloqué et Chrome système n’a pas démarré correctement. La CI installe Chromium.
3. `pnpm audit --audit-level high` n’a pas pu terminer dans le sandbox à cause d’une erreur DNS du registre npm; relancer avec réseau disponible.
4. Docker Compose est validé en configuration et les services de développement ont été démarrés; le build des images du profil `full` et l’overlay de production restent à tester.
5. Le panier n’a pas encore de revalidation serveur, checkout/commandes/paiements réels, intégrations SMS/WhatsApp/S3 ou traitement asynchrone métier. Ces points sont des intégrations futures, pas des fonctions livrées.
6. Storybook est optionnel dans le brief initial et n’a pas été installé.
7. Faire une revue finale de `git status`, des secrets/fichiers générés non suivis et de la CI avant de déclarer la fondation terminée.

## Consigne de reprise

Dans un terminal ouvert à la racine du dépôt, lancer `codex`. Codex CLI lit `AGENTS.md`, qui lui demande de commencer par ce fichier. Pour reprendre explicitement, lui demander : « Lis `AGENTS.md` et `docs/terminal-codex-context.md`, vérifie l’état réel du dépôt, puis reprends les points de validation restants sans écraser mes changements. »
