# ORD-01 — Vérification

> Date des vérifications : **17 novembre 2026**.
> Branche : `feature/ORD-01-order-creation-api`.
> Environnement : Node.js, NestJS 12, Prisma 7.10, Vitest 5, PostgreSQL et Redis
> locaux (Docker, ports `15432` et `16379`).
> Tous les résultats ci-dessous proviennent de commandes réellement exécutées
> dans le dépôt.

---

## 1. Base de données

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm prisma generate` | ✅ | Client régénéré avec `Order.idempotencyRequestHash` |
| `pnpm prisma migrate deploy` | ✅ | 16 migrations, `20261117140000_ord01_order_idempotency_hash` appliquée |
| Migration | ✅ | Une seule instruction `ALTER TABLE "Order" ADD COLUMN`, additive |

La migration a été appliquée sur la base locale après les 15 migrations
existantes, sans réécriture ni perte de données.

---

## 2. Compilation, lint et contrat

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C backend build` | ✅ | `prisma generate && tsc -p tsconfig.build.json`, aucune erreur |
| `pnpm -C backend lint` | ✅ | ESLint sans erreur ni avertissement |
| `pnpm -C backend openapi:export` | ✅ | 31 chemins, `openapi.json` mis à jour (+40/−8 lignes) puis formaté par Prettier |

L’allowlist ESLint de frontière de module pour `src/modules/orders/**` a été
élargie à `audit` et `notifications` : ces dépendances sont des services NestJS
exportés, pas des imports internes. Aucun `eslint-disable` n’a été ajouté.

---

## 3. Tests backend

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C backend test` | ✅ | **30 fichiers, 270 tests passés** |
| `pnpm -C backend test:e2e` | ✅ | **17 fichiers, 226 tests passés, 0 échec** |

### Nouveaux tests unitaires

| Fichier | Cas |
| --- | --- |
| `orders.service.test.ts` | 13 cas : guest requis, COD seul, mapping rupture, rejeu de clé, conflit de corps, clé d’un autre client, 429 téléphone audité, transaction complète (commande, paiement, expédition, mouvement, audit, événement), rollback sur rupture, zone absente, zone incohérente, prix recalculé, instantané d’adresse |
| `order-reference.generator.test.ts` | 5 cas : format, alphabet sans caractères ambigus, préfixe configurable, collision, épuisement des tentatives |
| `order-attempt.service.test.ts` | 5 cas : sous la limite, dépassement `429`, numéro jamais en clair, normalisation des espaces, fail-open Redis |
| `order-created.listener.test.ts` | 3 cas : SMS client, e-mail admin, échec de notification non bloquant |

### Nouvelles suites e2e

| Fichier | Cas |
| --- | --- |
| `orders-create.e2e-spec.ts` | 13 cas : en-tête manquant/invalide, création complète auditée et notifiée, rejeu, conflit de corps, rejet des montants client, honeypot, rollback multi-lignes, coupon, zone incohérente, limite téléphone, concurrence stock 1, audit sans données personnelles |
| `orders-captcha.e2e-spec.ts` | 4 cas avec faux `siteverify` local : jeton absent, jeton refusé, vérification indisponible (`503`), jeton valide en en-tête (`201`) |

### Suites existantes adaptées

L’en-tête `Idempotency-Key` étant désormais obligatoire, trois suites qui
postaient des commandes ont été mises à jour, sans affaiblir leurs assertions :

- `orders.e2e-spec.ts` (STK-01) : clé par requête, téléphone unique par requête ;
- `stock-concurrency.e2e-spec.ts` : clé en en-tête (au lieu du corps), numéros
  uniques, deux identifiants de variantes UUID ordonnés pour le scénario de
  rollback (le DTO exige des UUID) ;
- `stock-low-alerts.e2e-spec.ts` : clé en en-tête, IP et téléphone uniques.

Ces suites exigent `DATABASE_URL` et `REDIS_URL` :

```bash
cd backend
DATABASE_URL="postgresql://bruny:…@localhost:15432/bruny?schema=public" \
REDIS_URL="redis://localhost:16379" \
  pnpm test:e2e
```

---

## 4. Couverture des critères d’acceptation

| CA | Vérification |
| --- | --- |
| #1 `Idempotency-Key` obligatoire, sans doublon | Unitaires (rejeu, conflit, autre client) + e2e (400 manquante, 400 invalide, rejeu 1 seule commande et 1 seul mouvement, 409 corps différent) |
| #2 Prix, remises, frais et total serveur | e2e : montants client rejetés en `400 VALIDATION_ERROR` ; coupon 10 % → `discount 3000`, `total 28500` ; frais issus de la zone |
| #3 Commande + lignes + stock en une transaction | e2e : rollback complet sur rupture, instantanés présents, `variant.stock` décrémenté, un seul `StockMovement` |
| #4 Référence `BRN-YYMM-XXXX` non devinable | 5 tests unitaires + regex e2e `^BRN-\d{4}-[A-Z2-9]{4}$` |
| #5 Limites téléphone + IP et CAPTCHA | e2e : 4ᵉ commande même numéro → `429 ORDER_RATE_LIMIT_EXCEEDED` ; throttle IP 5/min ; CAPTCHA requis/invalide/indisponible/valide |
| #6 COD → `PENDING_CONFIRMATION` | Assertions unitaires et e2e sur `status`, `paymentStatus: PENDING`, `Payment.provider: cod` |
| #7 Événement `order.created` | Unitaire (émission après commit, jamais en cas d’échec) + e2e (notification `order.created` créée pour le client) |

---

## 5. Ce qui n’a pas été vérifié

| Élément | Raison |
| --- | --- |
| Vérification Turnstile réelle chez Cloudflare | Faux serveur `siteverify` local, aucune clé de production |
| Envoi réel des SMS et e-mails | Files BullMQ alimentées ; aucun opérateur SMS ni SMTP de production branché |
| `GET /orders/:reference` (suivi P13) | Hors périmètre ORD-01, dépendance design |
| Consommation frontend du nouveau contrat | Aucune modification frontend dans ce ticket ; l’écran P12 consommera l’API dans un ticket dédié |
| Charge réelle (débit, contention PostgreSQL) | Non mesurée ; seule la concurrence fonctionnelle (2 et 10 requêtes) est testée |
| Réservation de stock (`reservedStock`) | Reportée en V2 |

---

## 6. Fichiers exclus du commit

- `frontend/angular.json` : modification antérieure à ORD-01, non liée au ticket.
- `.~lock.Tickets_BRUNY_SHOPPING.docx#` : verrou bureautique non suivi.
- `backend/dist/**`, `frontend/dist/**` : artefacts de build ignorés par Git.
