# Audit CRT-02 — Store de panier Angular persistant (compatible SSR)

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Panier invité conservé dans `localStorage`, protégé pour le SSR | ✅ | `cart.store.ts:76-86` (`afterNextRender` + `isPlatformBrowser`), `persist/restore` ; e2e `page.reload()` conserve l'article |
| 2 | Ajout, suppression, modification de quantité via signals | ✅ | `cart.store.ts:88-176` ; 25 tests `cart.store.spec.ts` |
| 3 | Revalidation par l'API à l'ouverture du panier et du tunnel | ✅ | Validation au boot `constructor`, `ngOnInit` de `CartPage`, ouverture du mini-panier ; endpoint `POST /cart/validate` |
| 4 | Aucune donnée sensible stockée | ✅ | Snapshot limité aux lignes produit ; e2e vérifie l'absence de `token|authorization|email|address` |
| 5 | Message clair en cas de changement de prix ou de rupture | ✅ | Issues serveur affichées en bannières et toasts ; e2e prix modifié et rupture |

## 2. Conformité au cahier des charges

Le CDC §4.5 (gestion d'état) et §6.5 (panier) sont respectés. Le store est volontairement isolé du Router et du tunnel, conformément à la séparation des responsabilités.

## 3. Qualité du code

- Store à signaux, état privé exposé en `readonly`.
- Validation de forme du snapshot (version, bornes 50 lignes/100 unités).
- Aucun `any` non justifié.
- Aucun TODO/FIXME.

## 4. Tests

- **25 tests** `cart.store.spec.ts`.
- **5 e2e** `cart.spec.ts` (persistance, mini-panier, prix, rupture).
- Suite frontend 515/515.

## 5. Sécurité

- `localStorage` ne contient aucun jeton ni PII.
- Les prix mémorisés sont indicatifs et remplacés par la réponse serveur.
- Aucun appel réseau au SSR.

## 6. Documentation

- `ANALYSE-DESIGN.md` et `VERIFICATION.md` complets.
- Limites (frais, coupons, fusion invité) documentées.

## 7. Points d'attention

- Le CTA de commande reste désactivé faute de tunnel : c'est CRT-03/CRT-04, pas CRT-02.
- Le quota de stockage est avalé silencieusement (comportement voulu, mais à surveiller).

## 8. Statut global

**✅ Conforme**

Recommandation : **merge OK**. Aucune correction bloquante.
