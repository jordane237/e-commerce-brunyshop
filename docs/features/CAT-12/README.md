# CAT-12 — Prix promotionnels programmés

## Objectif

Programmer une promotion par produit : elle s’active et s’arrête toute seule, le prix appliqué est calculé côté serveur à l’instant de la requête, le client affiche le prix barré et le pourcentage d’économie, et un prix promo supérieur au prix normal est refusé.

## Ce qui est livré

- `PricingService` (`backend/src/common/pricing/pricing.service.ts`) : point d’entrée serveur unique `calculatePrice(product, at)` retournant `effectivePrice`, `basePrice`, `promoPrice`, `isPromoActive`, `discountPercent`. `at` vaut `new Date()` par défaut (UTC).
- Règles partagées dans `product-pricing.ts` (bornes inclusives, promotion défensive jamais active si `promoPrice >= basePrice`).
- `discountPercent` exposé par `GET /api/v1/products` et `GET /api/v1/products/:slug`.
- Validation admin complétée : `PROMO_PRICE_INVALID`, `PROMO_WINDOW_INVALID` et `PROMO_DATES_REQUIRED`.
- Frontend : `PriceTag` (prix barré) et badge `−X %` alimentés par `discountPercent` serveur, sans recalcul client.
- `openapi.json` et le client TypeScript généré sont à jour.

## Décisions

### Bornes de dates inclusives

Une promotion est active quand `promoStart <= at <= promoEnd`. Les dates Prisma sont stockées en UTC, `new Date()` l’est aussi, les comparaisons sont donc cohérentes sans conversion de fuseau (Cameroun = UTC+1).

### `promoPrice` sans dates refusé

Un prix promo sans `promoStart` / `promoEnd` ne s’activerait jamais : l’API renvoie `400 PROMO_DATES_REQUIRED`. Conséquence assumée : un `PATCH /admin/products/:id` qui ne modifie que `promoPrice` doit fournir les deux dates (un produit déjà programmé les conserve via la fusion avec l’existant).

### Pourcentage calculé côté serveur

`discountPercent = Math.round(((basePrice - promoPrice) / basePrice) * 100)` quand la promotion est active, `null` sinon. Le client n’affiche que cette valeur.

### Refactor ciblé

La logique existait déjà dans `product-pricing.ts` ; CAT-12 la dote d’un service NestJS injectable et fait déléguer `CatalogService` et `CartPricingService`. Les tests existants CAT-02/CAT-03/CAT-04/CRT-01 passent toujours.

## Formulaire admin (BO-04)

CAT-12 couvre la logique backend et la validation. Le formulaire admin de création/édition produit (saisie `promoPrice`, `promoStart`, `promoEnd`, validation inline) relève de **BO-04**, non implémenté à ce jour. En attendant, les promotions se programment via l’API :

```http
PATCH /api/v1/admin/products/:id
Content-Type: application/json

{
  "promoPrice": 25000,
  "promoStart": "2026-11-20T00:00:00.000Z",
  "promoEnd": "2026-11-30T23:59:59.000Z"
}
```

Le formulaire A05 (maquette `docs/design/DSG-06/A05-creation-edition-produit.md`) prévoit déjà les champs « Prix promotionnel » et « Du / au ».

## Microtextes

- « Le prix promotionnel doit être inférieur au prix de base. »
- « La date de début de promotion doit précéder la date de fin. »
- « Les dates de début et de fin sont requises pour programmer une promotion. »

## Limites connues

- La promotion s’applique au produit ; les variantes avec un `price` explicite gardent leur tarif (priorité existante RG-PRX-02).
- Aucune notification de début/fin de promotion.
- Pas d’index Prisma dédié aux colonnes promo : à prévoir si le catalogue grossit.
