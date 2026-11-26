# ORD-05 — API de suivi public de commande

## Endpoint

`POST /api/v1/orders/track` — public, `@HttpCode(200)`, throttled 5/min/IP.

Body :

```json
{ "reference": "BRN-2611-7K3F", "phone": "+237612345678" }
```

## Sécurité — anti-énumération (CA #2)

- Format invalide → `400 VALIDATION_ERROR` (ne révèle rien, juste un format incorrect).
- Combinaison correcte mais inexistante → `200 { "found": false }` (pas de 404, pas de message qui révèle si c'est la référence ou le téléphone qui est faux).
- Réponse uniforme : même status HTTP, même structure, même message générique (ou pas de message) succès/échec.

## PII filtrées (CA #4)

La réponse contient uniquement : `reference`, `status` + `statusLabel`, `items` (name, size, color, quantity, unitPrice, lineTotal), `subtotal`, `discount`, `shippingFee`, `total`, `createdAt`, `timeline`, `shippingCity` (ville seulement), `estimatedDelivery`.

JAMAIS : `email`, `phone` complet, `addressSnapshot`, `guestName`, `userId`, `idempotencyKey`, `source`, `providerRef`, `userAgent`, `ipAddress`.

## Rate limiting (CA #3)

- `@Throttle({ limit: 5, ttl: 60_000 })` (5/min/IP).
- `OrderAttemptService.isTrackingRateLimited(identifierHash)` (10/h par couple `sha256(reference:phone)`, Redis, TTL 1h).

## Audit

- `ORDER_TRACKED` (succès), `ORDER_TRACK_ATTEMPT` (échec), `ORDER_TRACK_RATE_LIMITED` (limite couple).
- `after` = `{ reference, phoneMasked, found }` ; l'IP et l'utilisateur restent dans les colonnes dédiées `ip` / `userAgent` de `AuditLog`.
- Logs pino sans téléphone en clair, sans email et sans IP.

## CAPTCHA Turnstile

Optionnel : le rate limiting strict suffit pour le MVP. Décision documentée : pas de CAPTCHA sur `/orders/track`.

## Fichiers

- `backend/src/modules/orders/dto/track-order.dto.ts`
- `backend/src/modules/orders/dto/track-order-response.dto.ts`
- `backend/src/modules/orders/order-tracking.controller.ts`
- `backend/src/modules/orders/order-tracking.service.ts`
- `backend/src/modules/orders/order-attempt.service.ts` (méthodes tracking)
- `backend/src/modules/orders/events/order-created.event.ts` (actions audit)
- `backend/src/modules/orders/orders.module.ts`
- `backend/test/order-tracking.e2e-spec.ts`
- `backend/src/modules/orders/order-tracking.service.test.ts`
- `backend/src/modules/orders/order-attempt.service.test.ts`
- `docs/features/ORD-05/VERIFICATION.md`
