# Audit MKT-06 — Bouton WhatsApp flottant et liens de contact

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Bouton flottant discret sur toutes les pages publiques, message selon la page | ✅ | `WhatsAppFabComponent` monté dans `app.html` ; 11 tests service + 8 tests composant + 12 e2e |
| 2 | Masqué pendant le tunnel de paiement, remplacé par un lien d'aide | ⚠️ | Préfixes `/commande`, `/checkout`, `/paiement`, `/confirmation`, `/suivi` testés unitairement ; aucune route tunnel n'existe pour un e2e, et aucun lien d'aide global n'est fourni |
| 3 | Numéro et message lus depuis les paramètres de la boutique | ✅ | `APP_CONFIG.contactWhatsappUrl` uniquement ; numéro extrait et validé ; FAB masqué si absent/invalide |
| 4 | Accessible (libellé, focus, taille) | ✅ | `aria-label`, `role="tooltip"`, focus visible, cible 56/52 px ; contraste 8,65:1 ; e2e |

## 2. Conformité au cahier des charges

Le CDC §6.10 (contact) et §11.4 (accessibilité) sont visés. Le comportement est conforme, mais le masquage tunnel n'est pas prouvé en conditions réelles. Le numéro placeholder a été remplacé par le numéro réel après la revue.

## 3. Qualité du code

- Service pur et testable, composant standalone `OnPush`.
- Aucun abonnement Router dupliqué ; contexte dérivé de l'URL.
- Aucun `any`, aucun TODO.
- Token z-index dédié (`1030`), sous overlay et consentement.

## 4. Tests

- **19 tests unitaires** MKT-06 (11 + 8) et **12 e2e** `whatsapp-fab.spec.ts`.
- Suite frontend 515/515 ; e2e complets 53/53 lors du ticket.
- Typecheck, builds et lint verts.

## 5. Sécurité

- Aucun secret ; aucune PII envoyée à WhatsApp au-delà du message prérempli.
- `rel="noopener noreferrer"` et nouvel onglet.
- Le numéro placeholder a été remplacé par le numéro réel `+237 6 79 17 62 96` après la revue.

## 6. Documentation

- `ANALYSE-DESIGN.md` et `VERIFICATION.md` complets, avec les 21 contrôles.

## 7. Points d'attention

- CA #2 partiellement démontrable (routes absentes).
- Numéro réel intégré : `237679176296`.
- Aucun lien d'aide n'est défini pour le tunnel.
- Le FAB n'est pas dans la maquette ; proposition à valider.
- Risque de doublon avec la future bottom-nav WhatsApp.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **merge OK avec réserves**. Rouvrir pour le tunnel et remplacer le numéro avant production.
