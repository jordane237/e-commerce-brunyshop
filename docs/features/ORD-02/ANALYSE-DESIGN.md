# ORD-02 — Analyse et design (machine à états des commandes)

> Branche : `feature/ORD-02-order-state-machine`, créée depuis `working`
> (merge #205, STK-05 inclus). Ticket : Issue #55, épopée ORD, dépendance ORD-01.

---

## 1. Ce qui existait déjà

| Élément | État constaté |
| --- | --- |
| `Order.status` | Enum `OrderStatus` à **13 valeurs** dans `backend/prisma/schema.prisma` (les 12 du ticket + `EXCHANGED`) |
| Statut initial | `PENDING_CONFIRMATION` posé par `OrdersService.persistOrder` (ORD-01) |
| Endpoint commande | `POST /api/v1/orders` uniquement (public, invité, idempotent) |
| Endpoint de statut | **aucun** — aucune route `admin/orders`, aucun `PATCH` |
| Historique de statut | **aucune table** ; seul `AuditLog` existait |
| Audit | `AuditLogService.record(client, event)` accepte `PrismaClient \| TransactionClient` : réutilisable dans une transaction |
| RBAC | `@Roles` + `RolesGuard` global, matrice `permissions.matrix.ts` (rôles `ORDER_MANAGER`, `ADMIN`, `SUPER_ADMIN`, `LIVREUR`, `STOCK_MANAGER`, `CUSTOMER`) |
| Stock | `InventoryService.decrementStockAtomically` (décrément à la création) ; pas de méthode de restitution |
| Mouvements de stock | `StockMovementReason` contient déjà `CANCELLATION`, `RELEASE`, `RETURN`, `RESTOCK` |
| Paiement / livraison | `Payment` et `Shipment` créés en `PENDING` par ORD-01 ; modules `payments` et `shipping` = squelettes (README + module) |
| Notifications | Templates `order.created`, `order.created.admin`, `order.confirmed`, `order.shipped`, `order.delivered` existants |
| Contrat OpenAPI | 34 chemins avant ORD-02, export + client généré vérifiés en CI (`openapi-check`, `api-client`) |
| Design | `docs/design/DSG-06/A07` et `A08` : matrice de transitions §7, rôles §2, historique/timeline §4, erreur `409` en §9 |
| Tests | `orders.service.test.ts`, `orders-create.e2e-spec.ts`, `orders-captcha.e2e-spec.ts`, `rbac.e2e-spec.ts`, `stock-*` |

### Ce qui manquait au ticket

1. Table centrale de transitions (les règles n'existaient nulle part dans le code).
2. Endpoint `PATCH /admin/orders/:id/status`.
3. Historique persistant par commande (A08 §10 : « Le modèle `Order` ne stocke pas d'historique de statut »).
4. Audit des changements de statut (`ORDER_STATUS_CHANGED`).
5. Protection contre les transitions concurrentes.
6. Restitution du stock à l'annulation (le stock est décrémenté dès la création).
7. Contrôle des rôles sur chaque transition (le livreur ne doit pas piloter la commande).

---

## 2. Matrice de transitions retenue

Le ticket ne fournit pas la matrice ; elle est dérivée de **DSG-06/A08 §7** (source
la plus précise), de **DSG-04/P11b** (« attente de paiement ») et du modèle existant.

| Statut | Transitions autorisées | Justification |
| --- | --- | --- |
| `PENDING_CONFIRMATION` | `AWAITING_PAYMENT`, `CONFIRMED`, `CANCELLED` | A08 §7 + P11b (paiement en ligne à venir) |
| `AWAITING_PAYMENT` | `PAID`, `CANCELLED` | Paiement confirmé ou abandon |
| `CONFIRMED` | `PREPARING`, `CANCELLED` | A08 §7 |
| `PAID` | `PREPARING`, `CANCELLED` | A08 §7 |
| `PREPARING` | `SHIPPED`, `CANCELLED` | A08 §7 |
| `SHIPPED` | `DELIVERED`, `DELIVERY_FAILED` | A08 §7 / A09c |
| `DELIVERED` | `RETURN_REQUESTED` | Demande de retour client |
| `DELIVERY_FAILED` | `SHIPPED`, `CANCELLED` | A08 §7 (« réassigner ») + clôture |
| `RETURN_REQUESTED` | `RETURNED`, `REFUNDED` | Retour physique ou remboursement direct |
| `RETURNED` | `REFUNDED` | Marchandise reçue → remboursement |
| `CANCELLED` | — | Terminal |
| `REFUNDED` | — | Terminal |
| `EXCHANGED` | — | Hors périmètre ticket ; terminal par prudence |

**Hypothèses documentées**
- `AWAITING_PAYMENT → PAID` n'est pas listé dans A08 (COD MVP) mais rend le statut
  atteignable et cohérent avec P11b ; il ne sera utilisé qu'avec PAY-02.
- `CANCELLED` est terminal. Un remboursement après annulation se traite sur
  `Payment.paymentStatus`, conformément à A08 (« Le remboursement doit être
  traité séparément »), et non en rouvrant la commande.
- Retour demandé, retour effectué et remboursement sont **trois états distincts**.
- `EXCHANGED` reste dans l'enum (données existantes) mais n'a aucune transition :
  aucun écran ni règle ne le définit.

---

## 3. Rôles et permissions

| Rôle | Transitions |
| --- | --- |
| `SUPER_ADMIN`, `ADMIN` | Toutes les transitions valides |
| `ORDER_MANAGER` | Toutes sauf `REFUNDED` (décision financière, matrice RBAC sans permission de remboursement) |
| `LIVREUR` | `SHIPPED → DELIVERED`, `SHIPPED → DELIVERY_FAILED`, `DELIVERY_FAILED → SHIPPED` |
| `STOCK_MANAGER`, `CUSTOMER`, anonyme | Aucune (403 / 401) |

Le livreur ne peut donc ni confirmer, ni préparer, ni expédier, ni annuler, ni
rembourser. Le passage `PREPARING → SHIPPED` reste une action de l'équipe
commandes (A08 : « Expédier est désactivé tant qu'aucun livreur n'est assigné »).

---

## 4. Décisions techniques

1. **Table centralisée** : `backend/src/modules/orders/order-status.ts`, purement
   fonctionnelle (aucune dépendance Nest/Prisma), testable seule.
2. **Endpoint** : `PATCH /api/v1/admin/orders/:id/status` (chemin exact du ticket).
   Les specs DSG-06 utilisent `:reference` ; écart assumé et documenté, l'`id`
   UUID est plus robuste qu'une référence réaffectable.
3. **HTTP** : `400` DTO invalide, `401` non authentifié, `403` rôle non habilité,
   `404` commande absente, `409` transition interdite **et** conflit de
   concurrence (ticket : « transitions invalides → 409 »).
4. **Concurrence** : `UPDATE ... WHERE id = ? AND status = <statut lu>` dans une
   transaction, puis `count === 0` → `409 STALE_ORDER_STATUS`. Aucun verrou
   pessimiste, aucun numéro de version supplémentaire.
5. **Atomicité** : statut + historique + audit (+ restitution du stock) dans la
   même transaction Prisma (`maxWait 5 s`, `timeout 15 s`).
6. **Annulation** : incrément atomique du stock par variante (`UPDATE ... RETURNING`),
   tri par `variantId` contre les interblocages, `StockMovement` `CANCELLATION`.
   Pas de double restitution possible : le verrou de statut rend l'annulation
   unique.
7. **Historique** : nouvelle table `OrderStatusHistory` (append-only) avec
   `fromStatus`, `toStatus`, `reason`, `note`, `userId`, `createdAt`. La création
   de commande insère la première entrée (`fromStatus = null`).
8. **Audit** : `ORDER_STATUS_CHANGED` avec `before.status` / `after.status`,
   `reference`, `reason`, `note`, IP et user-agent.
9. **Pas de notification** ajoutée : le ticket ne la demande pas et l'émission
   d'effets de bord non spécifiés est exclue. Les templates `order.shipped` /
   `order.delivered` restent disponibles pour un ticket dédié.
10. **Pas de migration de données** : table additive ; les commandes antérieures
    ont un historique vide, toléré (aucune réécriture du passé).

---

## 5. Risques de régression identifiés

| Risque | Mesure |
| --- | --- |
| Création de commande (ORD-01) | Une seule écriture ajoutée dans la transaction existante ; tests unitaires ORD-01 + e2e `orders-create` rejoués |
| RBAC global | Aucun guard modifié ; nouvel usage de `@Roles` existant |
| Concurrence stock | La restitution utilise `UPDATE ... RETURNING`, comme le décrément |
| Contrat OpenAPI | Export + régénération du client vérifiés (`openapi:check`, `api:check`) |
| CI | Aucun workflow ni test modifié/supprimé |

---

## 6. Fichiers

**Créés**
- `backend/src/modules/orders/order-status.ts`
- `backend/src/modules/orders/order-workflow.service.ts`
- `backend/src/modules/orders/admin-orders.controller.ts`
- `backend/src/modules/orders/dto/update-order-status.dto.ts`
- `backend/src/modules/orders/dto/order-status-history.dto.ts`
- `backend/src/modules/orders/order-status.test.ts`
- `backend/src/modules/orders/order-workflow.service.test.ts`
- `backend/prisma/migrations/20261123150000_ord02_order_status_history/migration.sql`
- `backend/test/order-status.e2e-spec.ts`
- `docs/features/ORD-02/` (ce document, `ORDER-STATUS-API.md`, `VERIFICATION.md`)

**Modifiés**
- `backend/prisma/schema.prisma` (modèle `OrderStatusHistory` + relations)
- `backend/src/modules/orders/orders.module.ts` (controller + provider)
- `backend/src/modules/orders/orders.errors.ts` (codes ORD-02)
- `backend/src/modules/orders/events/order-created.event.ts` (action d'audit)
- `backend/src/modules/orders/orders.service.ts` (entrée d'historique à la création)
- `backend/src/modules/orders/orders.service.test.ts` (stub du nouveau modèle)
- `backend/openapi.json`, `frontend/libs/data-access/src/generated/api-types.ts` (contrat)
