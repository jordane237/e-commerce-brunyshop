# ORD-05 — Vérification

> Branche : `feature/ORD-05-public-order-tracking`
> Date : 23 novembre 2026
> Environnement : Node 24, NestJS 12, Prisma 7, PostgreSQL 16 (port 15432), Redis 7 (port 16379), Vitest 5.

---

## 1. Résultats des vérifications

| # | Vérification | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche dédiée active | ✅ | `git branch --show-current` → `feature/ORD-05-public-order-tracking` (`main` et `working` non touchés) |
| 2 | Lint backend | ✅ | `pnpm -C backend lint` → code 0 |
| 3 | Typecheck monorepo | ✅ | `pnpm typecheck` → code 0 |
| 4 | Build backend | ✅ | `pnpm -C backend build` → code 0 |
| 5 | Build complet (backend + storefront + admin) | ✅ | `pnpm build` → code 0 |
| 6 | Lint frontend | ✅ | `pnpm -C frontend lint` → code 0 |
| 7 | Tests unitaires backend | ✅ | `35` fichiers, `319` tests réussis (dont `order-tracking.service.test.ts` 5 tests et `order-attempt.service.test.ts` 8 tests) |
| 8 | E2E ORD-05 | ✅ | `test/order-tracking.e2e-spec.ts` → `8/8` tests réussis |
| 9 | Non-régression e2e commandes | ✅ | `orders-create` + `order-status` + `cart-validation` → `47/47` tests réussis |
| 10 | Contrat OpenAPI | ✅ | `openapi.json` régénéré, `37` paths dont `/api/v1/orders/track` + schémas `TrackOrder*` |
| 11 | Client Angular généré | ✅ | `pnpm api:generate` → `+144` lignes dans `api-types.ts` |
| 12 | CA #1 — référence + téléphone obligatoires | ✅ | `400 VALIDATION_ERROR` si format invalide ou champ manquant (e2e + smoke test) |
| 13 | CA #2 — réponses indistinguables | ✅ | Référence inexistante et téléphone erroné → `200 {"found":false}` strictement identiques (e2e) |
| 14 | CA #3 — 5/min/IP | ✅ | 6 requêtes successives même IP → `200,200,200,200,200,429` (smoke test) |
| 15 | CA #3 — 10/h par couple | ✅ | 11<sup>e</sup> requête du couple → `429` (e2e) ; clé Redis `order:track:attempts:*` avec `ttl=3595` |
| 16 | CA #4 — aucune PII dans la réponse | ✅ | Test unitaire parcourant `email`, `phone`, `addressSnapshot`, `guestName`, `userId`, `idempotencyKey`, `source`, `providerRef`, `userAgent`, `ipAddress` |
| 17 | Audit des trois actions | ✅ | `ORDER_TRACKED` (60), `ORDER_TRACK_ATTEMPT` (16), `ORDER_TRACK_RATE_LIMITED` (4) en base ; `after` = `{ reference, phoneMasked, found }` |
| 18 | Logs applicatifs sans PII | ✅ | Pino : `{ reference }` / `{ orderId, reference }`, jamais le téléphone en clair |
| 19 | Audit de sécurité des dépendances | ✅ | `pnpm audit --prod --audit-level=high` → code 0 (3 low, 6 moderate, 0 high/critical) |
| 20 | Scan de secrets | ❌ | `gitleaks` non installé localement, non exécuté |
| 21 | `pnpm api:check` | ⚠️ | Échoue localement car le fichier généré est modifié et non commité ; la garde compare l'état commité (vert après commit) |
| 22 | E2E via `pnpm -C backend test:e2e` | ⚠️ | `Worker exited unexpectedly with signal SIGABRT` sur le pool `forks`, y compris sur des specs antérieures non modifiées (`orders-create.e2e-spec.ts`) ; exécution parallèle impossible en local |

---

## 2. Commandes exécutées

```bash
# Qualité
pnpm -C backend lint
pnpm typecheck
pnpm -C backend test
pnpm -C frontend lint

# Builds
pnpm -C backend build
pnpm build

# Contrat + client
cd backend && node dist/scripts/export-openapi.js && cd ..
pnpm exec prettier --write backend/openapi.json
pnpm api:generate
pnpm api:check        # échoue tant que le diff n'est pas commité

# E2E (pool threads, cf. § 5)
pnpm -C backend exec vitest run --config vitest.e2e.config.ts \
  test/order-tracking.e2e-spec.ts --pool=threads
pnpm -C backend exec vitest run --config vitest.e2e.config.ts \
  test/orders-create.e2e-spec.ts test/order-status.e2e-spec.ts \
  test/cart-validation.e2e-spec.ts --pool=threads

# Sécurité des dépendances
pnpm audit --prod --audit-level=high
```

Smoke test HTTP sur l'API compilée (`node dist/main.js`, port 4000) :

1. Création d'une commande réelle via `POST /api/v1/orders` → `201`, référence `BRN-2611-YK4X`.
2. `POST /api/v1/orders/track` avec la bonne combinaison → `200`, `found:true`, 5 étapes de timeline, `shippingCity: "Douala Centre"`, `estimatedDelivery`.
3. Même référence + téléphone erroné → `200 {"found":false}` (corps identique au cas « référence inexistante »).
4. Référence inexistante → `200 {"found":false}`.
5. Formats invalides → `400 VALIDATION_ERROR` avec les deux champs en erreur.
6. 6 requêtes consécutives → `429` à partir de la 6<sup>e</sup>.
7. Vérification Redis : `order:track:attempts:<sha256>` → `count=5`, `ttl=3595`.

---

## 3. Corrections issues de la vérification

### Injection Nest de `PrismaService`

`import type { PrismaService }` était effacé à la compilation : Nest ne pouvait plus résoudre le paramètre du constructeur (`UnknownDependenciesException … OrderTrackingService (?, AuditLogService, OrderAttemptService)`). L'import est redevenu un import de valeur ; c'est la convention utilisée par les autres services du dépôt.

### Relation Prisma `payment` inexistante

Le `include` de la recherche utilisait `payment: { select: … }` alors que la relation est une collection (`payments`). La requête levait `PrismaClientValidationError` et l'endpoint répondait `500`. Le paiement n'étant pas exposé par le contrat ORD-05, l'`include` a été supprimé plutôt que corrigé en `payments` : moins de données lues, moins de risque de fuite.

### Audit : PII hors du JSON `after`

`after` dupliquait `ipAddress` et `userAgent`. Ces valeurs restent dans les colonnes dédiées `AuditLog.ip` / `AuditLog.userAgent` (convention du dépôt) ; `after` se limite désormais à `reference`, `phoneMasked` et `found`. Les logs applicatifs ne contiennent plus l'IP.

### Specs e2e rejouables

- Les IP de test étaient réutilisées d'une exécution à l'autre alors que le throttler Redis survit 60 s : la seconde exécution dans la même minute recevait `429`. Chaque run tire maintenant sa propre plage d'IP.
- `shippingCity` était comparé à `"Douala"` alors que l'API renvoie le nom de la zone résolue (`"Douala Centre"`). L'assertion vérifie désormais le type, conformément au contrat (ville/zone, jamais l'adresse).

---

## 4. Couverture des critères d'acceptation

| CA | Preuve |
|---|---|
| CA #1 | `reference` (`^BRN-[0-9]{4}-[A-Z0-9]{4}$`) et `phone` (`^\+237[0-9]{9}$`) validés par `class-validator` ; `400` sur format invalide, champ manquant ou corps vide. |
| CA #2 | Aucun `404`, aucun champ `message` dans la réponse ; échec = `{ "found": false }`, succès = `{ "found": true, "order": … }` ; les deux échecs (référence inconnue / téléphone faux) renvoient un corps identique. |
| CA #3 | `@Throttle({ default: { limit: 5, ttl: 60_000 } })` sur le contrôleur + compteur Redis `order:track:attempts:{sha256(reference:phone)}`, limite 10, TTL 3600 s, fail-open si Redis indisponible. |
| CA #4 | Sélection explicite des champs (aucun `select: *`) ; test unitaire dédié aux champs interdits ; audit avec `phoneMasked`. |

---

## 5. Limites restantes

- **`trust proxy` non configuré dans `main.ts`.** Le throttler s'appuie sur l'IP de la socket. Derrière un reverse proxy, toutes les requêtes partageraient l'IP du proxy et la limite « 5/min/IP » deviendrait globale. Les specs e2e activent `trust proxy` sur leur instance de test ; le réglage de production reste à faire côté infrastructure (variable `TRUST_PROXY` ou `app.set('trust proxy', 1)`), car il modifie aussi l'IP journalisée par les autres modules.
- **CAPTCHA Turnstile non activé** sur `/orders/track` : décision documentée dans le README, le rate limiting multiple couvre le besoin du MVP. Aucun widget réel n'a donc été exercé.
- **`gitleaks` non disponible** dans l'environnement local : le job `security` de la CI n'a pas pu être reproduit.
- **E2E en pool `forks` impossible en local** (`SIGABRT` à l'initialisation Nest, y compris sur des specs non modifiées par ORD-05). Les résultats du § 1 ont été obtenus avec `--pool=threads` ; la CI reste la référence pour l'exécution standard.
- **`api:check` et `openapi:check` dépendent de l'état commité** : ils ne peuvent pas être verts avant le commit des fichiers générés.
- **Logs CI non consultés** : `gh` est absent de l'environnement et aucun journal GitHub Actions n'a été fourni. Aucun diagnostic des jobs `ci-success` / `security` n'a donc été réalisé (`docs/features/ORD-05/CI-FIXES.md` non produit).
