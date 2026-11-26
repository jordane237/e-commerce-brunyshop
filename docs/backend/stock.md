# Décrément de stock atomique — STK-01

Création de commande et protection contre la survente.

Branche : `feature/STK-01-atomic-stock-decrement`

---

## 1. Objectif et périmètre

`POST /api/v1/orders` crée une commande et décrémente le stock **dans la même
transaction PostgreSQL**. Le stock ne peut jamais devenir négatif, même si
plusieurs clients commandent la dernière paire au même instant.

Le ticket livre le socle transactionnel de commande :

- décrément atomique du stock ;
- un `StockMovement` par ligne décrémentée ;
- idempotence contre les doubles soumissions ;
- commande invité ou connectée ;
- paiement à la livraison (`COD`) uniquement ;
- création du paiement et de l’expédition minimaux.

Il ne livre pas le cycle de vie complet d’une commande (annulation, retour,
webhooks de paiement, affectation livreur, libération de réservation).

---

## 2. Pourquoi un `UPDATE` conditionnel

Le décrément repose sur un `UPDATE ... WHERE ... RETURNING` atomique :

```sql
UPDATE "ProductVariant"
SET "stock" = "stock" - $1,
    "version" = "version" + 1,
    "updatedAt" = NOW()
WHERE "id" = $2
  AND "stock" - "reservedStock" >= $1
RETURNING "stock", "version";
```

Points importants :

- les tables et colonnes Prisma sont en camelCase entre guillemets
  (`"ProductVariant"`, `"reservedStock"`, `"updatedAt"`) ;
- `ProductVariant.id` est un `TEXT` : aucun cast `::uuid` n’est utilisé ;
- la condition et la mise à jour sont évaluées sous le verrou de ligne
  PostgreSQL : deux transactions concurrentes ne peuvent pas consommer la même
  unité ;
- le prédicat utilise `stock - reservedStock`, cohérent avec CRT-01. En MVP,
  `reservedStock = 0` ;
- `version` est incrémenté pour conserver la traçabilité de concurrence ;
- 0 ligne affectée produit `409 INSUFFICIENT_STOCK`, y compris quand la
  dernière paire vient d’être vendue.

Le service ne crée pas la transaction : il reçoit `tx` du service Orders. Une
erreur de stock annule donc aussi la commande, ses lignes, le paiement,
l’expédition et les mouvements déjà écrits.

---

## 3. Transaction de commande

`OrdersService.createOrder` :

1. valide le moyen de paiement (`COD` seulement) ;
2. exige `guestName` et `guestPhone` sans JWT ;
3. retourne la commande existante si `idempotencyKey` est déjà connue ;
4. exécute le pré-check panier (`CartValidationService`) pour un refus rapide ;
5. ouvre `prisma.$transaction` ;
6. recharge les variantes et produits dans la transaction ;
7. recalcule les prix serveur avec `CartPricingService` ;
8. résout la `DeliveryZone` à partir de `address.city` ;
9. crée `Order`, `OrderItem` (snapshots), `Payment` COD et `Shipment` ;
10. trie les lignes par `variantId` pour éviter les deadlocks multi-articles ;
11. appelle `InventoryService.decrementStockAtomically` pour chaque ligne ;
12. incrémente le coupon utilisé, le cas échéant ;
13. retourne la commande.

Les prix, remises et totaux sont toujours recalculés depuis la base. Aucun
montant client n’est lu.

---

## 4. Contrat HTTP

### Requête

`POST /api/v1/orders` — public, JWT optionnel, 20 requêtes/minute/IP.

```json
{
  "items": [{ "variantId": "variant-uuid", "quantity": 1 }],
  "couponCode": "WELCOME10",
  "guestName": "Awa",
  "guestPhone": "+237699000001",
  "address": {
    "recipientName": "Awa",
    "phone": "+237699000001",
    "city": "Douala",
    "district": "Bonapriso",
    "line": "Rue 12",
    "landmark": "Face à la pharmacie"
  },
  "paymentMethod": "COD",
  "idempotencyKey": "5d7e6f2a-8f0f-4a0a-9b3e-2a1c7d9e4f10"
}
```

`guestName` et `guestPhone` sont ignorés lorsqu’un JWT valide est présent.
`idempotencyKey` est optionnel mais recommandé.

### Réponse 201

```json
{
  "id": "order-uuid",
  "reference": "BRN-2611-7K3F",
  "status": "PENDING_CONFIRMATION",
  "paymentStatus": "PENDING",
  "paymentMethod": "COD",
  "subtotal": 30000,
  "discount": 0,
  "shippingFee": 1500,
  "total": 31500,
  "createdAt": "2026-11-11T10:30:00.000Z"
}
```

### Erreurs métier

| HTTP | Code | Cas |
|---|---|---|
| 400 | `VALIDATION_ERROR` | body invalide, prix client interdit |
| 400 | `GUEST_INFORMATION_REQUIRED` | guest sans nom/téléphone |
| 400 | `PAYMENT_METHOD_UNAVAILABLE` | paiement autre que COD |
| 400 | `PRODUCT_ARCHIVED` | produit non publié |
| 400 | `DELIVERY_ZONE_NOT_FOUND` | ville non desservie |
| 400 | `INVALID_COUPON` | coupon inconnu, expiré ou épuisé |
| 404 | `PRODUCT_NOT_FOUND` | variante/produit absent |
| 409 | `INSUFFICIENT_STOCK` | décrément impossible |
| 409 | `IDEMPOTENCY_CONFLICT` | clé appartenant à une autre commande |
| 429 | `RATE_LIMITED` | plus de 20 requêtes/minute/IP |

Un conflit de stock expose aussi les détails :

```json
{
  "statusCode": 409,
  "code": "INSUFFICIENT_STOCK",
  "message": "Stock insuffisant : 1 disponible(s), 2 demandé(s).",
  "errors": [
    {
      "field": "items",
      "message": "Stock insuffisant : 1 disponible(s), 2 demandé(s).",
      "variantId": "variant-uuid",
      "requestedQuantity": 2,
      "availableQuantity": 1
    }
  ],
  "requestId": "req-id",
  "timestamp": "2026-11-11T10:30:00.000Z"
}
```

---

## 5. Mouvement de stock

Chaque décrément crée un `StockMovement` dans la même transaction :

```json
{
  "variantId": "variant-uuid",
  "delta": -1,
  "reason": "PURCHASE",
  "orderId": "order-uuid",
  "userId": "user-uuid",
  "before": 3,
  "after": 2
}
```

Pour une commande invitée, `userId` est `null` ; `orderId` reste la référence
de traçabilité. La migration
`20261111120000_stk01_stock_movement_user_optional` rend cette colonne nullable
sans toucher aux mouvements existants.

---

## 6. Idempotence

- Même clé et même propriétaire : la commande existante est retournée, sans
  nouveau décrément ni nouveau paiement.
- Deux requêtes simultanées avec la même clé : la seconde récupère la commande
  créée par la première après la violation d’unicité PostgreSQL.
- La propriété est vérifiée par `userId` (connecté) ou `guestPhone` (invité).
  Une clé connue mais appartenant à un autre client retourne
  `409 IDEMPOTENCY_CONFLICT`.
- Le body n’est pas hashé : une même clé avec un body différent ne peut pas être
  détectée comme un conflit de contenu. Cette limite est assumée pour le MVP.

---

## 7. Limites connues

- `reservedStock` est lu mais aucun job de réservation/expiration n’est livré.
- Le paiement et l’expédition sont créés en `PENDING` ; aucun webhook de
  paiement n’est branché.
- La gratuité de livraison dès deux paires (DSG-04) n’est pas implémentée dans
  ce ticket : le frais provient uniquement de `DeliveryZone.fee`.
- Aucune libération de stock à l’annulation n’est exposée : le flux d’annulation
  devra écrire des mouvements `CANCELLATION`/`RETURN` dans une transaction.
- La référence `BRN-YYMM-XXXX` est régénérée jusqu’à trois fois en cas de
  collision ; au-delà, `409 ORDER_REFERENCE_CONFLICT`.

---

## 8. Tests

- `backend/src/modules/inventory/inventory.service.test.ts` : décrément,
  quantités invalides, insuffisance, rupture, variante supprimée.
- `backend/src/modules/orders/orders.service.test.ts` : guest, COD, idempotence,
  prix serveur, transaction, rollback, zone.
- `backend/test/orders.e2e-spec.ts` : 11 scénarios de commande.
- `backend/test/stock-concurrency.e2e-spec.ts` : 7 scénarios de concurrence et
  rollback.

Le scénario central : stock = 1, deux commandes simultanées → `201` + `409`,
stock final `0`, une seule commande, un seul `StockMovement`.
