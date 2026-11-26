# Audit AUT-09 — Écrans client : connexion et inscription

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Écrans conformes aux maquettes P14 et P15 | ⚠️ | Composants `login.component.ts` / `register.component.ts` et templates ; structure DSG-05 respectée, mais aucune comparaison pixel ni spec P14/P15 archivée dans le dépôt |
| 2 | Validation en direct (+237, force du mot de passe), messages en français | ✅ | `identifier.validator.ts`, `phone.validator.ts`, `common-password.validator.ts`, `match.validator.ts` ; messages FR dans les composants |
| 3 | Affichage/masquage du mot de passe, claviers adaptés | ✅ | Toggle dans `libs/ui/src/lib/input/input.component.html:44` ; `inputMode=email` (`login.component.html:18`) et `inputMode=tel` (`register.component.html:100`) |
| 4 | Après connexion, redirection vers la page d'origine | ✅ | `safeRedirect()` dans `login.component.ts:214-222` (`returnUrl` ou `redirect`, refus des URLs protocol-relative) |
| 5 | Accessibilité clavier et lecteur d'écran vérifiée | ⚠️ | ARIA, focus premier champ invalide et titres de succès testés ; aucun test NVDA/VoiceOver réel (`VERIFICATION.md` §4) |

## 2. Conformité au cahier des charges

Le CDC §6.8 (compte client) et §4.9 (accessibilité) sont visés. Les écrans couvrent les deux canaux email/téléphone et les contraintes de mot de passe. La conformité aux maquettes reste déclarative, faute de comparaison visuelle outillée.

## 3. Qualité du code

- Formulaires réactifs typés (`NonNullableFormBuilder`), signaux, `OnPush`.
- Aucun import cross-feature ; les validateurs viennent de `@bruny/util`.
- Gestion d'erreur API centralisée via `readApiError`.
- Aucun TODO/FIXME.

## 4. Tests

- **38 tests unitaires** dans `features/auth` : validators, login et register.
- Aucun test e2e versionné pour AUT-09 : les parcours Playwright de `VERIFICATION.md` §1 ont été exécutés manuellement, puis perdus. C'est un trou de non-régression.
- Suite frontend 515/515 (19/11).

## 5. Sécurité

- Aucun token persisté par l'écran : la session est gérée par TEC-12 (`AuthService`/`SessionService`).
- CAPTCHA Turnstile conditionnel, jamais chargé au SSR.
- Messages d'erreur neutres sur les identifiants invalides.
- Rate limit et verrouillage couverts côté backend (AUT-04).

## 6. Documentation

- `docs/features/AUT-09/ANALYSE-DESIGN.md` et `VERIFICATION.md` complets.
- Limites CAPTCHA et lecteur d'écran documentées.
- Pas d'impact OpenAPI.

## 7. Points d'attention

- Absence d'e2e committé : à ajouter pour sécuriser la redirection `returnUrl`.
- Le lien « mot de passe oublié » pointe vers `/mot-de-passe-oublie`, route inexistante (P16 non livrée).
- Les liens CGV/confidentialité sont valides depuis MKT-01, mais la version acceptée reste `1.0`.
- Aucune vérification réelle du CAPTCHA activé.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **merge acceptable**. Ajouter un e2e de connexion/inscription avant le Sprint 4 et créer la route P16 ou retirer le lien.
