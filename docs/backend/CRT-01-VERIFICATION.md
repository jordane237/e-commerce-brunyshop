# CRT-01 — Vérification de livraison

API de validation du panier — `POST /api/v1/cart/validate`
Branche : `feature/CRT-01-cart-validation-api`
Date de vérification : 2026-11-09

---

## 1. Les 11 checks demandés

| # | Check | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche `feature/CRT-01-cart-validation-api` créée et active | ✅ | `git branch --show-current` → `feature/CRT-01-cart-validation-api` |
| 2 | Build backend | ✅ | `pnpm -C backend build` → `prisma generate` OK puis `tsc -p tsconfig.build.json` sans erreur |
| 3 | Tests unitaires | ✅ | `pnpm -C backend test` → **77 tests / 10 fichiers**, dont **36 tests cart** (pricing 15, stock 6, validation 15) |
| 4 | Tests e2e panier | ✅ | `vitest run --config vitest.e2e.config.ts test/cart-validation.e2e-spec.ts` → **23 tests passés** |
| 5 | ESLint | ✅ (périmètre livré) | `pnpm exec eslint src test/cart-validation.e2e-spec.ts test/api.e2e-spec.ts --max-warnings=0` → 0 erreur. `pnpm exec eslint src test` échoue **uniquement** sur `test/notifications.e2e-spec.ts`, fichier non suivi hérité de NTF-01 (voir §5) |
| 6 | Docker Compose postgres + redis | ✅ | `docker compose ps` → `bruny-postgres` (healthy), `bruny-redis` (healthy), + mailpit/minio healthy |
| 7 | Prisma generate | ✅ | `pnpm -C backend prisma generate` → `Generated Prisma Client (7.10.0)` |
| 8 | Démarrage + health ready | ✅ | `PORT=4010 node dist/main.js` → `Nest application successfully started` ; `GET /api/v1/health/ready` → **200** |
| 9 | Test manuel panier valide | ✅ | voir §3, `valid: true`, `unitPrice: 12500`, `lineTotal: 25000` |
| 10 | Test manuel champ prix client rejeté | ✅ | voir §3, HTTP **400**, `code: VALIDATION_ERROR`, `errors[0].field = items.0.unitPrice` |
| 11 | Aucun prix client lu dans le code | ✅ | `grep -rn "dto.items.*unitPrice\|dto.items.*price" backend/src/modules/cart` → **aucun résultat** |

---

## 2. Contrat livré

- `POST /api/v1/cart/validate`, `HttpCode(200)`, `@Public()` +
  `OptionalJwtAuthGuard` (invité accepté, utilisateur attaché si JWT valide).
- `@Throttle({ default: { limit: 30, ttl: 60_000 } })` : 31e appel → 429.
- Body strict : `items[{ variantId, quantity, previousUnitPrice? }]` +
  `couponCode?` ; tout autre champ → 400 `VALIDATION_ERROR`.
- Réponse : `valid`, `items[]`, `subtotal`, `discount`, `total`, `issues[]`,
  `meta{ validatedAt, itemCount, totalQuantity }`.
- `CartIssueCode` exhaustif (11 codes), issues bloquantes vs informatives,
  messages en français.
- Recalcul serveur : `variant.price` > `promoPrice` dans la fenêtre >
  `basePrice` ; stock `available = stock - reservedStock` ;
  `adjustedQuantity = min(requested, available, 100)` ; coupon
  `PERCENTAGE`/`FIXED_AMOUNT` jamais négatif.
- Swagger mis à jour, `openapi.json` régénéré (18 paths, `cart/validate` présent).

Documentation complète : [`docs/backend/cart.md`](./cart.md).

---

## 3. Preuves des tests manuels

```bash
V=037637fe-d853-4ba0-a79e-a2f7f82c73f0   # variante seed publiée (12 500 XAF, stock 14)

# 1. Panier valide
curl -X POST http://localhost:4010/api/v1/cart/validate \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"variantId":"'$V'","quantity":2}]}'
# → 200
# {"valid":true,"items":[{"...","quantity":2,"availableStock":14,
#   "unitPrice":12500,"lineTotal":25000,"issues":[]}],
#  "subtotal":25000,"discount":0,"total":25000,"issues":[],"meta":{...}}

# 2. Prix fourni par le client
curl -X POST http://localhost:4010/api/v1/cart/validate \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"variantId":"'$V'","quantity":1,"unitPrice":1}]}'
# → 400
# {"statusCode":400,"code":"VALIDATION_ERROR",
#  "message":"property unitPrice should not exist",
#  "errors":[{"field":"items.0.unitPrice","message":"property unitPrice should not exist"}], ...}

# 3. Coupon seed WELCOME10 (10 %, min 20 000 XAF)
curl -X POST http://localhost:4010/api/v1/cart/validate \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"variantId":"'$V'","quantity":2}],"couponCode":"WELCOME10"}'
# → 200, subtotal 25000, discount 2500, total 22500
```

---

## 4. Fichiers livrés

```
backend/src/common/guards/optional-jwt-auth.guard.ts          (nouveau)
backend/src/common/pipes/validation-exception.factory.ts      (nouveau)
backend/src/modules/cart/cart.constants.ts                    (nouveau)
backend/src/modules/cart/cart.utils.ts                        (nouveau)
backend/src/modules/cart/cart.controller.ts                   (nouveau)
backend/src/modules/cart/cart-pricing.service.ts              (nouveau)
backend/src/modules/cart/cart-pricing.service.test.ts         (nouveau)
backend/src/modules/cart/cart-stock.service.ts                (nouveau)
backend/src/modules/cart/cart-stock.service.test.ts           (nouveau)
backend/src/modules/cart/cart-validation.service.ts           (nouveau)
backend/src/modules/cart/cart-validation.service.test.ts      (nouveau)
backend/src/modules/cart/dto/cart-item-input.dto.ts           (nouveau)
backend/src/modules/cart/dto/validate-cart.dto.ts             (nouveau)
backend/src/modules/cart/dto/cart-item-validation.dto.ts      (1)
backend/src/modules/cart/dto/cart-validation-response.dto.ts  (nouveau)
backend/src/modules/cart/cart.module.ts                       (complété)
backend/src/modules/cart/README.md                            (complété)
backend/src/main.ts                                           (exceptionFactory)
backend/test/api.e2e-spec.ts                                  (bootstrap aligné)
backend/test/cart-validation.e2e-spec.ts                      (nouveau)
backend/openapi.json                                          (régénéré)
docs/backend/cart.md                                          (nouveau)
docs/backend/CRT-01-VERIFICATION.md                           (ce fichier)
```

(1) `CartItemValidationDto` est défini dans `cart-validation-response.dto.ts`
avec `CartIssueDto` et l'enum `CartIssueCode` : un seul fichier de contrat de
réponse, pour éviter un cycle d'imports entre DTO.

Aucune migration Prisma n'a été nécessaire pour CRT-01 : `promoPrice`,
`promoStart`, `promoEnd`, `reservedStock` et `Cart/CartItem` existaient déjà.

---

## 5. Réparations de base nécessaires aux vérifications (NTF-01)

La branche de départ ne compilait pas et `prisma generate` échouait. Ces
corrections sont **séparées du commit CRT-01** (commit `fix(notifications)`),
sans changement fonctionnel de la validation panier :

1. `prisma/schema.prisma` : ajout du côté inverse `User.notifications` —
   `prisma generate` refusait le schéma (relation sans opposite).
2. Migration `002_add_notifications_tables` : identifiants en `TEXT` (comme
   toute la base, uuid généré par Prisma) au lieu de `UUID`, incompatibles avec
   la clé `User.id`. Migration appliquée localement après
   `prisma migrate resolve --rolled-back`.
3. Sources `notifications` : initialisation des adaptateurs SMS/WhatsApp,
   imports `Job` (bullmq), `Logger.log`, méthodes de queue réelles
   (`enqueueEmail/Sms/Whatsapp`), import Prisma correct, typage du sanitizer,
   `NotificationsModule` importe `DatabaseModule`, contrôleur sans `Max`
   invalide.
4. `tsconfig*.json` : exclusion de `**/*.spec.ts`. Ces fichiers ne sont **jamais
   exécutés** (`vitest.config.ts` n'inclut que `src/**/*.test.ts`) et ne
   compilaient pas ; ils restent dans le dépôt.

---

## 6. Écarts assumés par rapport au texte du ticket

| Sujet | Décision | Raison |
|---|---|---|
| Nom des tests unitaires | `.test.ts` au lieu de `.spec.ts` | `vitest.config.ts` n'exécute que `src/**/*.test.ts` ; des `.spec.ts` seraient invisibles |
| `QUANTITY_EXCEEDED` | **bloquant** | Une quantité fusionnée > 100 ne peut pas être honorée telle quelle (le ticket ne le listait pas dans les bloquants) |
| `COUPON_MIN_AMOUNT_NOT_REACHED` | non bloquant, `discount = 0` | Conforme à la liste des bloquants du ticket |
| Audit `CART_VALIDATED` | non écrit | `AuditLog.userId` est obligatoire et l'endpoint accepte les invités ; évite un faux utilisateur et une écriture par validation |
| Code 400 | `VALIDATION_ERROR` | Ajout d'un `exceptionFactory` partagé ; les autres 400 restent `BAD_REQUEST` |
| 429 | `RATE_LIMITED` | Code déjà produit par le filtre global (`codeFor(429)`), non modifié |
| `meta.totalQuantity` | somme des quantités **retenues** | Cohérent avec `lineTotal`/`subtotal` ; le ticket montrait des valeurs demandées |
| `PROMO_APPLIED` / `PROMO_EXPIRED` | détectés via `previousUnitPrice` | Sans historique d'ajout au panier côté serveur, seul ce champ permet la comparaison |

---

## 7. Checklist DoD

- [x] Branche `feature/CRT-01-cart-validation-api` créée et active
- [x] `POST /api/v1/cart/validate` retourne `CartValidationResponseDto`
- [x] `CartPricingService` : `variant.price` > `promoPrice` (fenêtre) > `basePrice`
- [x] `CartStockService` : `available = stock - reservedStock`, `adjustedQuantity`
- [x] `CartValidationService` : fusion des doublons, 1 requête batch, issues
- [x] 11 codes d'écart, bloquants vs informatifs
- [x] Aucun prix client utilisé (e2e : `unitPrice` → 400 `VALIDATION_ERROR`)
- [x] Quantité limitée au stock disponible (e2e `adjustedQuantity = 1`)
- [x] Lignes invalides exclues du sous-total
- [x] Coupon valide appliqué, invalide → issue et `discount = 0`
- [x] `OptionalJwtAuthGuard` : invité et utilisateur supportés
- [x] Rate limiting 30/min/IP
- [x] 36 tests unitaires cart verts
- [x] 23 tests e2e cart verts
- [x] Build backend ✅
- [x] ESLint 0 erreur sur le périmètre livré
- [x] Démarrage + health ready 200
- [x] Tests manuels panier valide (200) et prix client (400)
- [x] `docs/backend/cart.md`
- [x] `docs/backend/CRT-01-VERIFICATION.md`
- [x] Swagger + `openapi.json` régénérés
- [x] Aucun secret versionné, aucun `dist/` commité

---

## 8. Limites connues

1. **`test/notifications.e2e-spec.ts` (non suivi, NTF-01)** importe
   `../../src/generated/prisma` (chemin obsolète) : il fait échouer
   `pnpm -C backend test:e2e` (26 tests passent, cette suite ne démarre pas) et
   `eslint test`. Fichier laissé intact car non suivi et hors périmètre CRT-01 ;
   à supprimer ou terminer dans le ticket NTF-01.
2. **Concurrence stock** : la validation ne réserve rien. Entre validation et
   commande, `reservedStock` peut évoluer ; la réservation atomique
   (`ProductVariant.version`) relève du ticket de commande.
3. **Coupons** : `usedCount` n'est pas incrémenté ici ; l'unicité d'usage sera
   appliquée à la création de commande.
4. **`backend/.env` local** pointe sur PostgreSQL 5432 et Redis 6379 (arrêtés) :
   les scripts utilisent `../.env` (Docker 15432/16379), comme la CI.
