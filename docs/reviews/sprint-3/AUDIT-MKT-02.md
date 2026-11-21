# Audit MKT-02 — Formulaire de contact protégé

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Champs minimaux, validation, CAPTCHA, limitation de débit | ✅ | `contact.dto.ts` (validation stricte), `TurnstileGuard`, `@Throttle` 5/min/IP ; tests service et e2e CAPTCHA |
| 2 | Message transmis à l'équipe par e-mail et enregistré | ✅ | `contact.service.ts:61` (`contactMessage.create`) et `:83` (notification e-mail) ; tests unitaires et e2e |
| 3 | Boutons directs WhatsApp, appel et Facebook | ✅ | `contact.component.html:167-195` ; `tel:` calculé depuis `APP_CONFIG` ; 6 tests composant |
| 4 | Confirmation claire à l'utilisateur | ✅ | `successId()` et panneau de confirmation avec référence ; test composant |

## 2. Conformité au cahier des charges

Le CDC §6.10 (contact) est couvert. Le CAPTCHA et le rate limit sont réellement appliqués côté serveur ; le honeypot est inclus sans être exposé dans l'OpenAPI.

## 3. Qualité du code

- Module backend dédié, DTO class-validator, service transactionnel simple.
- Composant frontend standalone avec formulaire réactif typé.
- Aucun `any` non justifié, aucun TODO.
- Les imports contact → audit/notifications sont explicitement allowlistés.

## 4. Tests

- **3 tests** `contact.service.test.ts` + **6 tests** composant + e2e contact/CAPTCHA.
- Suite backend 270/270, frontend 515/515.

## 5. Sécurité

- CAPTCHA, throttle, honeypot, audit sans e-mail, échappement HTML et neutralisation CR/LF.
- Aucun secret ; Turnstile est configuré par variables d'environnement.

## 6. Documentation

- `ANALYSE-DESIGN.md` et `VERIFICATION.md` complets.
- OpenAPI contient `/contact`.

## 7. Points d'attention

- Envoi e-mail réel non validé (adaptateur console en e2e).
- Turnstile réel non exercé (faux siteverify).
- WhatsApp/téléphone restent des placeholders.
- Pas de préremplissage du sujet depuis les pages info.

## 8. Statut global

**✅ Conforme avec réserves**

Recommandation : **merge OK**. Remplacer les coordonnées et valider le SMTP avant production.
