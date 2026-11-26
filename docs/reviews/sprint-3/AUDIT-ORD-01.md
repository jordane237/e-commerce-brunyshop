# Audit ORD-01 — API de création de commande (idempotente, transactionnelle, sécurisée)

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | `POST /orders` exige `Idempotency-Key` ; un renvoi ne crée pas de doublon | ✅ | `orders.controller.ts` + service ; tests rejeu/conflit, e2e 400 clé absente/invalide, 409 corps différent |
| 2 | Prix, remises, frais et total recalculés côté serveur uniquement | ✅ | Aucun montant client accepté (`create-order.dto.ts`) ; e2e coupon 10 % et zone |
| 3 | Commande + lignes + décrément du stock dans une seule transaction | ✅ | `orders.service.ts` transaction Prisma ; e2e rollback multi-lignes et concurrence stock 1 |
| 4 | Numéro lisible et non devinable (`BRN-YYMM-XXXX`) | ✅ | `reference/order-reference.generator.ts` ; 5 tests + regex e2e |
| 5 | Limites anti-abus téléphone/IP et CAPTCHA vérifié | ✅ | `order-attempt.service.ts` (10/h/téléphone), `@Throttle` 5/min/IP, `TurnstileGuard` ; e2e 429 et 4 cas CAPTCHA |
| 6 | COD : statut initial `PENDING_CONFIRMATION` | ✅ | Tests unitaires et e2e `status`, `paymentStatus: PENDING`, `Payment.provider: cod` |
| 7 | Événement `order.created` émis pour les notifications | ✅ | `order-created.event.ts` + listener ; testé après commit, jamais en cas d'échec |

## 2. Conformité au cahier des charges

Le CDC §6.6 (tunnel) et §9 (contrat API) sont respectés. Tous les montants sont serveur, l'idempotence est réelle et testée, la transaction couvre commande/lignes/stock.

## 3. Qualité du code

- Module `orders` dédié, DTO stricts, service transactionnel.
- Générateur de référence isolé et testé.
- Aucun `any` non justifié ; allowlist ESLint documentée pour `audit`/`notifications`.
- Aucun TODO/FIXME.

## 4. Tests

- **270 tests backend** (30 fichiers), dont 13 service + 5 référence + 5 anti-abus + 3 listener.
- **226 tests e2e** annoncés, dont 13 `orders-create` et 4 `orders-captcha`.
- Tests de concurrence et de rollback présents.

## 5. Sécurité

- CAPTCHA, rate limit IP et téléphone, audit sans PII.
- `Idempotency-Key` validée en UUID v4 ; hash du corps pour détecter les conflits.
- Aucun secret en dur.

## 6. Documentation

- `ANALYSE-DESIGN.md`, `ORDER-API.md`, `VERIFICATION.md` complets.
- OpenAPI contient `/orders` avec l'en-tête obligatoire.

## 7. Points d'attention

- Aucun écran frontend ne consomme `POST /orders` : c'est normal (P11/P12 absentes), mais l'intégration de bout en bout reste non démontrée.
- Pas de `GET /orders/:reference` (suivi P13), hors périmètre.
- Paiement COD uniquement.

## 8. Statut global

**✅ Conforme**

Recommandation : **merge OK côté API**. L'audit de bout en bout du parcours d'achat reste impossible jusqu'à P11.
