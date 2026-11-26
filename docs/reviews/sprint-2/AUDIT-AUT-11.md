# Audit AUT-11 — CAPTCHA formulaires sensibles

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | CAPTCHA invisible (Turnstile) sur inscription, connexion, commande, contact | ⚠️ | backend/src/security/turnstile/* ; frontend captcha component | Inscription/connexion couverts ; commande/contact à vérifier |
| 2 | Jeton vérifié côté serveur avant traitement | ✅ | turnstile.guard.ts (+7 tests) | Présent |
| 3 | Dégradation gracieuse si service indisponible | ✅ | captcha-disabled.e2e-spec.ts | Présent |
| 4 | Aucune clé secrète exposée côté client | ✅ | public-config.controller.ts | Clé publique uniquement ; secret via env |

## 2. Conformité CDC
- Turnstile intégré avec garde backend.

## 3. Qualité du code
- Guard dédié, tests unitaires.

## 4. Tests
- Unitaires : turnstile.guard.test.ts (7)
- E2E : captcha.e2e-spec.ts, captcha-disabled, captcha-failure

## 5. Sécurité
- Secret non exposé (grep sur dist à confirmer en vérification finale).

## 6. Documentation
- .env.example.

## 7. Points d'attention
- Vérifier l'application du CAPTCHA sur commande et contact (pas seulement auth).
- SSR-safety du composant Angular à confirmer.

## 8. Statut global
- ⚠️ Conforme avec réserves
