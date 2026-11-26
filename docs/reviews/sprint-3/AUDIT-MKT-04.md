# Audit MKT-04 — Pixel Meta, UTM et bandeau de consentement

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Événements ViewContent, AddToCart, InitiateCheckout, Purchase avec les bonnes valeurs | ⚠️ | ViewContent/AddToCart branchés sur P04 ; `trackInitiateCheckout` et `trackPurchaseOnce` existent et sont testés, mais aucun écran P08/P11/P12 ne les appelle |
| 2 | Traceurs activés seulement après consentement ; choix mémorisé et modifiable | ✅ | `MetaPixelService.canTrack()` et `syncConsent()` ; `ConsentService` 13 mois ; footer « Gérer mes préférences » ; 20 tests |
| 3 | Paramètres UTM conservés jusqu'à la commande et enregistrés avec elle | ⚠️ | `UtmService` capture et persiste ; le backend ORD-01 accepte `source`, mais aucun `POST /orders` n'est émis par l'UI |
| 4 | Aucun double comptage d'achat au rechargement de la confirmation | ⚠️ | Garde session + `localStorage` par référence, testée unitairement ; non démontrable sans page P12 |

## 2. Conformité au cahier des charges

Le CDC §10.3 (traceurs et consentement) et §6.11 (mesure d'audience) sont partiellement couverts. Le socle est correct, mais la chaîne publicitaire complète dépend du tunnel absent.

## 3. Qualité du code

- Services isolés (`ConsentService`, `MetaPixelService`, `UtmService`), signaux et SSR-safe.
- Aucune PII transmise au Pixel (SKU, montants, quantités, référence).
- Aucun `any` non justifié ; le snippet Meta est injecté sans dépendance externe.
- Aucun TODO/FIXME.

## 4. Tests

- **30 tests** de services/bandeau (8 consentement, 10 pixel, 6 UTM, 6 bandeau).
- **9 e2e** `meta-pixel.spec.ts`.
- Suite frontend 515/515.

## 5. Sécurité

- Aucun script Meta avant consentement ; révocation et suppression `_fbp`/`_fbc`.
- Aucune PII dans les événements.
- CSP production mise à jour.

## 6. Documentation

- `ANALYSE-DESIGN.md`, `TEST-PIXEL.md`, `VERIFICATION.md` complets.
- Limites du tunnel clairement documentées.

## 7. Points d'attention

- CA #1, #3 et #4 ne sont pas démontrables de bout en bout.
- Aucun ID Pixel réel (`CHANGEME_meta_pixel_id`), donc pas de Meta Pixel Helper.
- AddToCart non instrumenté depuis l'accueil/catalogue, seulement depuis P04.
- Pas d'audit lecteur d'écran du modal de préférences.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **merge acceptable avec réserve**. Le ticket devra être rouvert pour brancher InitiateCheckout/Purchase et vérifier l'anti-double-comptage quand P11/P12 existeront.
