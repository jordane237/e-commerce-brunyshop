# Audit STK-03 — Alertes de stock bas

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Seuil bas configurable par variante, valeur globale par défaut dans les paramètres | ✅ | `schema.prisma:311` (`lowStockThreshold` par variante) ; `settings.service.ts:6-41` (`stock.low.defaultThreshold`, env puis 5) |
| 2 | Une seule alerte jusqu'au réapprovisionnement (pas de spam) | ✅ | `lowStockAlertSentAt` + listener `stock-low.listener.ts:41-84` ; 4 tests listener + 6 tests e2e |
| 3 | L'alerte apparaît dans le tableau de bord et part par notification interne | ❌ | Notification interne et e-mail implémentés, mais `dashboard.routes.ts` et `stock.routes.ts` chargent un `PlaceholderPage` ; `GET /admin/stock/alerts` n'est consommé nulle part côté Angular |
| 4 | L'événement `stock.low` est émis | ✅ | `stock-low.event.ts:16`, émission après commit `inventory.service.ts:98-153` ; tests unitaires et e2e |

## 2. Conformité au cahier des charges

Le CDC §5.5 (cache/tâches) et §6.7 (stock) sont visés côté backend. Le backend est solide ; c'est l'exposition dans l'administration qui manque, alors que le CA l'exige explicitement.

## 3. Qualité du code

- Service admin isolé avec requête SQL paramétrée via `Prisma.sql` (pas de concaténation).
- Événement de domaine émis après commit, listener idempotent.
- Aucun TODO/FIXME.
- `StockAlertsService` renvoie aussi les compteurs LOW/OUT, ce qui facilite le dashboard.

## 4. Tests

- **10 tests unitaires** (6 inventaire + 4 listener) et **6 e2e** `stock-low-alerts.e2e-spec.ts`.
- Aucun test frontend : la page stock est un placeholder.
- Suite backend 270/270.

## 5. Sécurité

- Requête SQL brute mais entièrement paramétrée (`Prisma.sql`), pas d'injection.
- RBAC `STOCK_MANAGER/ADMIN/SUPER_ADMIN/ORDER_MANAGER` sur le contrôleur.
- Aucune PII dans les notifications de stock.

## 6. Documentation

- `docs/features/STK-03/` contient `ANALYSE-DESIGN.md`, `IMPLEMENTATION.md`, `LIMITES-ET-SUITES.md`, `TESTS.md`.
- **Pas de `VERIFICATION.md`** conforme au gabarit Sprint 3.
- OpenAPI expose `GET /admin/stock/alerts`.

## 7. Points d'attention

- CA #3 non satisfait : aucun écran, aucune consommation de l'API, aucune notification in-app affichée.
- Pas de `GET /admin/stock/alerts/count` séparé ; les compteurs sont dans `meta`, ce qui suffit.
- Le seuil global n'est pas injecté automatiquement dans les nouvelles variantes : la colonne a un défaut statique à 5, le Setting sert à la consultation.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **corrections requises avant clôture** : consommer `GET /admin/stock/alerts` dans le dashboard A03 ou la page Stock, et produire `VERIFICATION.md`. Le backend peut être mergé tel quel.
