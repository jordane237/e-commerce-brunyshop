# API de validation du panier — POST /api/v1/cart/validate

Panier — CRT-01 | Priorité MVP | Dépendance CAT-03

---

## Description

Valide un panier avant la commande : chaque ligne est **recalculée côté serveur**
(prix, promotion, stock) et la réponse liste les écarts détectés (prix changé,
stock insuffisant, produit retiré, coupon invalide…).

> ⚠️ **Aucun prix fourni par le client n'est utilisé.**
> Le body ne transporte que `variantId` et `quantity` (plus `couponCode` optionnel).
> Tous les montants (`unitPrice`, `lineTotal`, `subtotal`, `discount`, `total`) sont
> recalculés depuis la base. Tout champ non déclaré (`unitPrice`, `price`, `total`,
> `subtotal`, …) est rejeté en **400 `VALIDATION_ERROR`** grâce à
> `whitelist: true` + `forbidNonWhitelisted: true` (TEC-04).

Le endpoint est **public** (panier invité) : aucun JWT n'est requis. Si un JWT
valide est présent, l'utilisateur est attaché à la requête (`OptionalJwtAuthGuard`)
pour l'audit et le futur rattachement au panier persisté ; un jeton absent, expiré
ou invalide est traité comme une requête invitée. Aucune donnée propre à
l'utilisateur n'est retournée.

- Rate limiting : **30 requêtes / minute / IP** (`@Throttle`), réponse **429** au-delà.
- Aucune donnée n'est écrite : validation en lecture seule, sans cache (prix et
  stock doivent être temps réel).

---

## Request body (`ValidateCartDto`)

| Champ | Type | Obligatoire | Contraintes |
|---|---|---|---|
| `items` | array | oui | 1 à 50 lignes |
| `items[].variantId` | uuid | oui | variante existante |
| `items[].quantity` | int | oui | 1 à 100 |
| `items[].previousUnitPrice` | int | non | ≥ 0 — **information seule**, jamais utilisée dans un calcul |
| `couponCode` | string | non | max 64 caractères |

Les `variantId` dupliqués sont **fusionnés** (somme des quantités) : un panier ne
contient qu'une ligne par variante. Au-delà de 100 unités fusionnées, l'issue
`QUANTITY_EXCEEDED` est levée et la quantité est ramenée à 100.

`previousUnitPrice` sert uniquement à détecter un écart avec le prix serveur
(`PRICE_CHANGED`, `PROMO_APPLIED`, `PROMO_EXPIRED`). Le prix retourné reste
toujours le prix recalculé.

### Exemple

```json
{
  "items": [
    { "variantId": "uuid-variant-1", "quantity": 2 },
    { "variantId": "uuid-variant-2", "quantity": 1, "previousUnitPrice": 28000 }
  ],
  "couponCode": "WELCOME10"
}
```

---

## Réponse 200 (`CartValidationResponseDto`)

```json
{
  "valid": false,
  "items": [
    {
      "variantId": "uuid-variant-1",
      "productId": "uuid-product-1",
      "productName": "Air Max 90",
      "variantSku": "NIK-AIRMAX-42-BLK",
      "size": "42",
      "color": "Noir",
      "quantity": 2,
      "availableStock": 3,
      "unitPrice": 35000,
      "lineTotal": 70000,
      "issues": []
    },
    {
      "variantId": "uuid-variant-2",
      "productId": "uuid-product-2",
      "productName": "Stan Smith",
      "variantSku": "ADI-STAN-40-WHT",
      "size": "40",
      "color": "Blanc",
      "quantity": 2,
      "availableStock": 2,
      "unitPrice": 28000,
      "lineTotal": 56000,
      "issues": [
        {
          "code": "INSUFFICIENT_STOCK",
          "message": "Stock insuffisant : 2 disponible(s), 5 demandé(s).",
          "requestedQuantity": 5,
          "availableQuantity": 2
        }
      ]
    }
  ],
  "subtotal": 126000,
  "discount": 0,
  "total": 126000,
  "issues": [
    {
      "code": "INSUFFICIENT_STOCK",
      "variantId": "uuid-variant-2",
      "requestedQuantity": 5,
      "availableQuantity": 2,
      "message": "Stock insuffisant pour Stan Smith (40, Blanc)."
    }
  ],
  "meta": {
    "validatedAt": "2026-11-09T10:30:00.000Z",
    "itemCount": 2,
    "totalQuantity": 4
  }
}
```

- `items[].quantity` est la **quantité retenue** après plafonnement au stock
  disponible (et à 100). C'est cette valeur que le frontend doit répercuter.
- `items[].lineTotal = unitPrice × quantity` (recalculé).
- `meta.itemCount` = nombre de lignes retournées ; `meta.totalQuantity` = somme
  des quantités retenues. Une ligne exclue (rupture, produit archivé, produit
  supprimé) est retournée avec `quantity: 0` et `lineTotal: 0`.
- Une variante inconnue ne produit pas de ligne : seule l'issue
  `VARIANT_NOT_FOUND` est retournée (dans `issues`).
- `subtotal` n'inclut que les lignes retenues. `total = max(0, subtotal - discount)`.

---

## Codes d'écart (`CartIssueCode`)

| Code | Bloquant | Contexte | Signification |
|---|---|---|---|
| `PRICE_CHANGED` | non | `previousPrice`, `currentPrice` | Le prix serveur diffère du prix mémorisé côté client |
| `PROMO_APPLIED` | non | `previousPrice`, `currentPrice` | Une promotion est désormais active |
| `PROMO_EXPIRED` | non | `previousPrice`, `currentPrice` | La promotion est terminée, retour au prix de base |
| `INSUFFICIENT_STOCK` | **oui** | `requestedQuantity`, `availableQuantity` | Stock disponible < quantité demandée |
| `OUT_OF_STOCK` | **oui** | `availableQuantity: 0` | Stock disponible nul |
| `PRODUCT_ARCHIVED` | **oui** | — | Produit `ARCHIVED` ou `DRAFT` |
| `PRODUCT_NOT_FOUND` | **oui** | — | Produit supprimé logiquement (`deletedAt`) |
| `VARIANT_NOT_FOUND` | **oui** | — | Variante inexistante |
| `QUANTITY_EXCEEDED` | **oui** | `requestedQuantity`, `maxQuantity` | Quantité fusionnée > 100 |
| `COUPON_INVALID` | **oui** | `couponCode` | Code inconnu, pas encore actif, expiré ou épuisé |
| `COUPON_MIN_AMOUNT_NOT_REACHED` | non | `minAmount`, `subtotal` | Sous-total inférieur au minimum du coupon (remise = 0) |

`valid` vaut `false` dès qu'au moins une issue **bloquante** est présente ; il
reste `true` si seules des issues informatives (`PRICE_CHANGED`,
`PROMO_APPLIED`, `PROMO_EXPIRED`, `COUPON_MIN_AMOUNT_NOT_REACHED`) sont levées.

> `QUANTITY_EXCEEDED` est traité comme bloquant : la ligne demandée ne peut pas
> être honorée telle quelle. `COUPON_MIN_AMOUNT_NOT_REACHED` reste informatif :
> le panier est commandable, simplement sans remise.

---

## Règles de recalcul des prix

Ordre de priorité (du plus fort au plus faible) :

1. `ProductVariant.price` (override variante) s'il est non nul ;
2. `Product.promoPrice` si `promoStart <= maintenant <= promoEnd` (bornes incluses, UTC) ;
3. `Product.basePrice`.

Une promotion dont `promoPrice`, `promoStart` ou `promoEnd` est nul n'est jamais
appliquée. Le prix override variante prime sur la promotion produit.

Détection des écarts à partir de `previousUnitPrice` (jamais utilisée pour le calcul) :

- prix serveur **inférieur** au prix mémorisé : `PROMO_APPLIED` si une promotion
  est active, sinon `PRICE_CHANGED` ;
- prix serveur **supérieur** : `PROMO_EXPIRED` si le prix mémorisé correspond
  exactement au `promoPrice` du produit et que la fenêtre est terminée, sinon
  `PRICE_CHANGED` ;
- aucun `previousUnitPrice` : aucun écart de prix signalé.

---

## Règles de stock

```
available        = max(0, variant.stock - variant.reservedStock)
canFulfill       = requestedQuantity <= available
adjustedQuantity = min(requestedQuantity, available)
```

- `available === 0` → `OUT_OF_STOCK`, ligne exclue du sous-total (`quantity: 0`).
- `requested > available` → `INSUFFICIENT_STOCK`, ligne incluse avec
  `quantity = available` (« quantité maximale par ligne limitée au stock
  disponible »).
- Le stock réservé (commandes en attente de paiement) n'est jamais disponible
  pour une nouvelle commande.

La validation est **read-only** : aucune réservation n'est posée. La réservation
atomique (optimistic lock `ProductVariant.version` + `reservedStock`) appartient
au ticket de commande/checkout.

---

## Règles de coupon

| Vérification | Résultat |
|---|---|
| Code inconnu | `COUPON_INVALID`, `discount = 0` |
| `startsAt > maintenant` | `COUPON_INVALID` |
| `endsAt < maintenant` | `COUPON_INVALID` |
| `maxUses` atteint (`usedCount >= maxUses`) | `COUPON_INVALID` |
| `subtotal < minAmount` | `COUPON_MIN_AMOUNT_NOT_REACHED`, `discount = 0` |
| `PERCENTAGE` | `discount = round(subtotal × value / 100)`, `value` borné à 0..100 |
| `FIXED_AMOUNT` | `discount = min(value, subtotal)` |

`usedCount` n'est pas incrémenté par cette API : l'unicité d'usage est appliquée
au moment de la commande.

---

## Erreurs

| HTTP | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body invalide, champ non autorisé (`unitPrice`, `total`…), quantité hors bornes, plus de 50 lignes |
| 429 | `RATE_LIMITED` | Plus de 30 appels par minute et par IP |
| 500 | `INTERNAL_ERROR` | Erreur inattendue (format normalisé global) |

Le code `VALIDATION_ERROR` provient du `exceptionFactory` partagé
(`src/common/pipes/validation-exception.factory.ts`) appliqué au `ValidationPipe`
global. Les autres erreurs 400 conservent leur code métier (`BAD_REQUEST` par
défaut). Le détail par champ est exposé dans `errors: [{ field, message }]`
(chemins imbriqués du type `items.0.unitPrice`).

---

## Sécurité

- **Recalcul 100 % serveur** : aucun montant client n'alimente le calcul,
  `previousUnitPrice` est purement informatif (test e2e dédié).
- **Défense en profondeur** : `forbidNonWhitelisted` rejette tout champ de prix
  non déclaré (400 `VALIDATION_ERROR`).
- **Anti-énumération** : aucune donnée produit non publiée n'est retournée
  (`ARCHIVED`, `DRAFT`, `deletedAt` → ligne exclue).
- **Charge maîtrisée** : une seule requête `findMany` pour toutes les variantes
  (+ une requête coupon), projection minimale, pas de N+1.
- **Pas de PII dans les logs** : seule une ligne `debug` (userId, nombre de
  lignes, total quantité, validité) est journalisée, sans email ni téléphone.
- **Limites d'entrée** : 50 lignes, 100 unités par ligne, body limité à 32 kb
  par le bootstrap.
