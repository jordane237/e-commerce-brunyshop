# ORD-01 — API de création de commande

> Endpoint : `POST /api/v1/orders`
> Contrat OpenAPI : `backend/openapi.json` (31 chemins)
> Branche : `feature/ORD-01-order-creation-api`

---

## 1. Vue d’ensemble

`POST /orders` crée une commande en une seule transaction PostgreSQL :
recalcul serveur des montants, décrément atomique du stock, écriture du
mouvement de stock, du paiement COD, de l’expédition, du journal d’audit, puis
émission de l’événement `order.created` après le commit.

L’endpoint est `@Public()` : un client invité peut commander. Le
`OptionalJwtAuthGuard` rattache la commande à l’utilisateur quand un jeton
`Bearer` valide est fourni. Le `TurnstileGuard` protège l’accès.

---

## 2. En-têtes

| En-tête | Obligatoire | Rôle |
| --- | --- | --- |
| `Idempotency-Key` | **oui** | UUID v4 unique par tentative de commande |
| `Authorization` | non | `Bearer <access token>` pour commander en tant que client connecté |
| `CF-Turnstile-Response` | si CAPTCHA actif | Jeton Turnstile (alternative au champ `turnstileToken` du corps) |
| `X-Forwarded-For` | non | IP client derrière le proxy (journal d’audit) |

`Idempotency-Key` vit **uniquement** dans l’en-tête. Le champ `idempotencyKey`
du corps a été retiré : le DTO est en `whitelist` + `forbidNonWhitelisted`, donc
l’envoyer produit `400 VALIDATION_ERROR`. Écart assumé par rapport à DSG-04
§8.1, à corriger côté design.

---

## 3. Corps de la requête

```jsonc
{
  "items": [{ "variantId": "uuid", "quantity": 1 }],
  "couponCode": "BRUNY10",            // optionnel
  "guestName": "Awa",                  // requis si non authentifié
  "guestPhone": "+237699000001",       // requis si non authentifié
  "address": {
    "recipientName": "Awa",
    "phone": "+237699000001",
    "city": "Douala",
    "district": "Bonapriso",
    "line": "Rue 12",
    "landmark": "Face pharmacie",     // optionnel
    "instructions": "Appeler",        // optionnel
    "slot": "afternoon",              // optionnel (P10)
    "callBeforeDelivery": true        // optionnel (P10)
  },
  "deliveryZoneId": "uuid",           // optionnel : repli sur la ville
  "paymentMethod": "COD",
  "notes": "Cadeau",                  // optionnel
  "turnstileToken": "…",              // requis si TURNSTILE_ENABLED=true
  "_honey": ""                        // honeypot : doit rester vide
}
```

Aucun montant n’est accepté : `unitPrice`, `subtotal`, `discount`,
`shippingFee`, `total` sont rejetés par la validation (CA #2).

`variantId` est validé en UUID, `quantity` en entier de 1 à 100, 1 à 50 lignes
par commande. Les lignes en doublon de variante sont fusionnées avant
persistance et hachage.

---

## 4. Réponses

### 201 — créée

```json
{
  "id": "uuid",
  "reference": "BRN-2611-7K3F",
  "status": "PENDING_CONFIRMATION",
  "paymentStatus": "PENDING",
  "paymentMethod": "COD",
  "subtotal": 30000,
  "discount": 0,
  "shippingFee": 1500,
  "total": 31500,
  "createdAt": "2026-11-17T10:00:00.000Z"
}
```

Le statut initial est `PENDING_CONFIRMATION` : en COD, la commande n’est ni
payée ni confirmée (CA #6).

### Erreurs

| HTTP | `code` | Cause |
| --- | --- | --- |
| 400 | `IDEMPOTENCY_KEY_REQUIRED` | En-tête absent ou vide |
| 400 | `INVALID_IDEMPOTENCY_KEY` | En-tête non UUID v4 |
| 400 | `VALIDATION_ERROR` | Corps invalide, montant client, honeypot rempli, UUID mal formé |
| 400 | `GUEST_INFORMATION_REQUIRED` | Ni utilisateur authentifié ni `guestName`/`guestPhone` |
| 400 | `PAYMENT_METHOD_UNAVAILABLE` | Moyen de paiement autre que COD |
| 400 | `PRODUCT_ARCHIVED`, `DELIVERY_ZONE_NOT_FOUND`, `DELIVERY_ZONE_MISMATCH`, `INVALID_COUPON` | Catalogue ou livraison |
| 400 | `CAPTCHA_REQUIRED`, `CAPTCHA_INVALID` | Vérification Turnstile |
| 404 | `PRODUCT_NOT_FOUND` | Variante supprimée du catalogue |
| 409 | `INSUFFICIENT_STOCK`, `OUT_OF_STOCK` | Rupture détectée au pré-check ou au décrément atomique |
| 409 | `IDEMPOTENCY_CONFLICT` | Même clé, corps différent, ou clé d’un autre client |
| 429 | `ORDER_RATE_LIMIT_EXCEEDED` | Plus de `ORDER_RATE_LIMIT_PER_HOUR` commandes pour ce téléphone |
| 429 | `RATE_LIMIT_EXCEEDED` | Plus de 5 requêtes/min pour cette IP |
| 503 | `CAPTCHA_UNAVAILABLE` | Cloudflare injoignable ou en erreur |

Les erreurs de stock renvoient `errors[]` avec `variantId`,
`requestedQuantity`, `availableQuantity` et un message français explicite :
`Stock insuffisant : 1 disponible(s), 2 demandé(s).`

---

## 5. Idempotence (CA #1)

1. La clé est recherchée **avant** toute écriture.
2. Même clé + même empreinte SHA-256 du corps canonique → renvoie la commande
   existante (`201`, même `id`, même `reference`), sans nouvelle écriture.
3. Même clé + empreinte différente → `409 IDEMPOTENCY_CONFLICT`.
4. Clé appartenant à un autre client (utilisateur ou téléphone invité) →
   `409 IDEMPOTENCY_CONFLICT`.
5. Course entre deux requêtes identiques : la contrainte `UNIQUE` sur
   `Order.idempotencyKey` tranche, la perdante relit la commande gagnante
   (`P2002` → relecture). Un corps différent dans la course reste un `409`.
6. Une empreinte `null` (ligne antérieure à ORD-01) est tolérée : la commande
   existante est renvoyée.

L’empreinte couvre : lignes fusionnées et triées, coupon, identité invitée,
adresse (dont `slot` et `callBeforeDelivery`), zone, moyen de paiement, notes.
Elle ignore l’ordre des lignes, les espaces de bord et la casse du coupon.

La clé n’est pas hachée en base : elle est déjà un UUID opaque et sert de clé
unique d’anti-rejeu, sans donnée personnelle.

---

## 6. Recalcul serveur des montants (CA #2)

| Montant | Source |
| --- | --- |
| `unitPrice` | `CartPricingService.calculatePrice(produit, variante, maintenant)` : `variant.price` sinon prix promo actif sinon `basePrice` |
| `subtotal` | Somme des prix unitaires × quantités |
| `discount` | `CartPricingService.evaluateCoupon` sur le catalogue rechargé |
| `shippingFee` | `DeliveryZone.fee` (zone choisie ou résolue par la ville) |
| `total` | `max(0, subtotal - discount) + shippingFee` |

Les instantanés (`nameSnapshot`, `sizeSnapshot`, `colorSnapshot`, `unitPrice`)
sont figés à la création pour que l’historique reste juste après une
modification catalogue.

---

## 7. Transaction et stock (CA #3)

Une seule transaction (`$transaction`, `maxWait: 5s`, `timeout: 15s`) contient :

1. relecture des variantes et produits ;
2. `Order` + `OrderItem[]` (instantanés) ;
3. `Payment` (`provider: cod`, `amount`, `status: PENDING`) ;
4. `Shipment` (`zoneId`, `status: PENDING`) ;
5. `decrementStockAtomically` par variante (tri par `variantId` pour éviter les
   interblocages), avec `StockMovement` `PURCHASE` et incrément de
   `variant.version` ;
6. `Coupon.usedCount++` et `OrderCoupon` si coupon appliqué ;
7. `AuditLog` `ORDER_CREATED` (ip, user-agent, référence, total, lignes — sans
   téléphone ni e-mail).

Toute erreur annule l’ensemble : la commande n’existe pas, le stock n’est pas
décrémenté. Les alertes de stock bas sont émises **après** le commit via
`InventoryService.emitLowStockEvents`.

---

## 8. Référence lisible (CA #4)

Format `BRN-YYMM-XXXX` : préfixe configurable (`ORDER_REFERENCE_PREFIX`), date
`YYMM` UTC, suffixe de 4 caractères tirés de `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
(pas de `I`, `O`, `0`, `1`). Espace ≈ 1,05 M de combinaisons par mois ; 5
tentatives en cas de collision, puis `409 ORDER_REFERENCE_CONFLICT`.

---

## 9. Anti-abus (CA #5)

| Limite | Implémentation | Clé | Fenêtre |
| --- | --- | --- | --- |
| IP | `@nestjs/throttler` sur `POST /orders` | IP | 5 req/min |
| Téléphone | `OrderAttemptService` (Redis `INCR` + `EXPIRE`) | `order:attempts:{sha256(téléphone)}` | `ORDER_RATE_LIMIT_PER_HOUR` (10 par défaut) |

Le numéro n’est jamais stocké en clair. Redis indisponible → **fail-open** :
la commande passe, l’incident est journalisé, le throttler IP reste actif.
Un `429` téléphone est audité (`ORDER_RATE_LIMITED`, numéro masqué).

CAPTCHA : `TurnstileGuard` exige un jeton dès que `TURNSTILE_ENABLED=true` ; le
jeton est accepté dans `turnstileToken` ou `CF-Turnstile-Response`.

---

## 10. Notifications et audit (CA #7)

`order.created` est émis après le commit avec la référence, le total, les
lignes et l’identité de contact. `OrderCreatedListener` (fire-and-forget) :

- SMS client `order.created` v1 si téléphone connu ;
- e-mail client `order.created` v1 si e-mail connu ;
- e-mail aux rôles `ADMIN`/`SUPER_ADMIN` actifs : `order.created.admin` v1
  (client, téléphone, total, récapitulatif des lignes, date).

Une erreur de notification n’échoue jamais la requête : elle est journalisée.
`order.confirmed` reste réservé à la confirmation effective de la commande.

---

## 11. Configuration

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `ORDER_REFERENCE_PREFIX` | `BRN` | Préfixe `^[A-Z]{2,6}$` |
| `ORDER_RATE_LIMIT_PER_HOUR` | `10` | Commandes max par téléphone et par heure |

---

## 12. Migration

`20261117140000_ord01_order_idempotency_hash` :

```sql
ALTER TABLE "Order" ADD COLUMN "idempotencyRequestHash" TEXT;
```

Additive et réversible : aucune colonne existante n’est modifiée, les lignes
antérieures conservent `NULL` (rejeu toléré).

---

## 13. Hors périmètre

- `GET /orders/:reference` (suivi public P13) : dépendance design non livrée.
- Réservation de stock (`reservedStock`) : V2.
- Paiement en ligne : MVP COD uniquement.
- Interface de suivi client et remboursements.
