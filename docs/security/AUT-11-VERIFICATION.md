# AUT-11 — Rapport de vérification

Date : 11 novembre 2026

Branche : `feature/AUT-11-captcha-sensitive-forms`

Base : `f86fbab` (`feat(stock): add atomic stock decrement with oversell protection [STK-01]`)

## Résultat

L’intégration Turnstile est fonctionnelle sur le périmètre backend et sur la connexion admin existante. Les vérifications ciblées AUT-11 passent. Deux limites doivent rester explicites :

1. Le storefront n’a pas encore d’inscription, de commande ou de contact client : les guards backend sont prêts, mais le widget n’est pas affiché sur des pages inexistantes.
2. Les builds Angular et la suite frontend complète échouent sur des composants UI préexistants sans rapport avec AUT-11 (`size-selector`, `product-card`, `input`, `price-tag`, `skeleton`, page design-system). Les typechecks et les nouveaux tests CAPTCHA passent.

## Vérifications exécutées

| Vérification | Commande | Résultat |
| --- | --- | --- |
| Lint complet | `pnpm lint` | ✅ backend + frontend |
| Typecheck complet | `pnpm typecheck` | ✅ backend + admin + storefront |
| Tests unitaires backend | `pnpm -C backend test` | ✅ 242 tests / 24 fichiers |
| Tests e2e backend complets | `pnpm -C backend test:e2e` | ✅ 202 tests / 14 fichiers |
| e2e CAPTCHA ciblés | `vitest run --config vitest.e2e.config.ts test/captcha*.e2e-spec.ts` | ✅ 13 tests / 3 fichiers |
| Tests frontend CAPTCHA | `vitest run libs/ui/.../captcha.component.spec.ts libs/data-access/.../public-config.service.spec.ts` | ✅ 8 tests / 2 fichiers |
| Build backend | `pnpm -C backend build` | ✅ |
| Build storefront | `pnpm -C frontend build:storefront` | ❌ erreurs UI préexistantes |
| Build admin | `pnpm -C frontend build:admin` | ❌ `size-selector` préexistant (`isEqual`) |
| OpenAPI / client | export + `api:generate` puis comparaison SHA-256 | ✅ aucun drift |
| Compose | `docker compose config -q` avec clés de test | ✅ |
| Secrets | `git status` + diff | ✅ aucun `.env` ni clé secrète réelle |

Les builds Angular ont été lancés avec Node `v24.15.0`, version exigée par `.nvmrc` et Angular. Le Node local (`v24.11.0`) refuse le build avant compilation.

## Couverture AUT-11

- `TurnstileService` : succès, refus, HTTP 5xx, JSON invalide, `internal-error`, timeout, désactivation, absence de fuite de secret dans les logs.
- `TurnstileGuard` : jeton body, jeton header, `CAPTCHA_REQUIRED`, `CAPTCHA_INVALID`, `CAPTCHA_UNAVAILABLE`, bypass explicite quand désactivé.
- e2e : `GET /config` sans secret, register sans/avec jeton, login sans/avec jeton, contact sans/avec jeton, header `cf-turnstile-response`, commande bloquée avant le métier, indisponibilité 503, validation DTO, clé always-fail, désactivation.
- Frontend : rendu navigateur, absence de widget en SSR, messages d’erreur et timeout accessibles, émission du jeton, cache et retry de `PublicConfigService`.

## Détails de l’intégration

- Les e2e CAPTCHA utilisent un stub HTTP local de `siteverify` pour éviter les timeouts intermittents du service de test Cloudflare. Le vrai contrat HTTP est couvert par les tests unitaires et a été vérifié manuellement avec les clés de test Cloudflare.
- Aucun jeton complet n’est journalisé : seuls les 8 premiers caractères apparaissent dans un aperçu de diagnostic.
- En cas d’indisponibilité, la requête protégée est refusée avec `503 CAPTCHA_UNAVAILABLE` et une alerte Pino `TURNSTILE_UNAVAILABLE` est émise.
- La clé secrète n’est exposée ni par l’API, ni par le client Angular généré, ni par les réponses d’erreur.

## Limites et suites

- Créer les parcours storefront P14/P15/P11/P22 avant de revendiquer le CAPTCHA sur inscription, commande et contact client.
- Corriger les composants UI préexistants pour rétablir les builds et la suite frontend complète.
- Remplacer les clés de test par un widget de production et surveiller les alertes `TURNSTILE_UNAVAILABLE`.
- Tester le rendu réel du widget dans un navigateur avec un domaine autorisé par Cloudflare ; aucun test navigateur visuel n’a été exécuté dans cette passe.
