# ORD-03 — Vérification

> Branche : `feat/ORD-03-checkout-three-steps` (depuis `working`).
> Date des vérifications : 23 novembre 2026, en local.
> API : `dist/main.js` sur `:4000` (PostgreSQL et Redis locaux, Turnstile désactivé).

---

## 1. Critères du ticket

| Critère | État | Preuve |
| --- | --- | --- |
| Trois étapes Coordonnées / Livraison / Paiement | ✅ | `checkout-page.html`, e2e `checkout.spec.ts` |
| Barre de progression accessible | ✅ | `nav[aria-label]`, `aria-current="step"`, e2e |
| Données conservées après rechargement | ✅ | unit `checkout.store.spec.ts`, e2e rechargement |
| CGV obligatoires | ✅ | `termsAccepted` + `Validators.requiredTrue`, e2e sans coche → aucun appel réseau |
| COD par défaut | ✅ | `paymentForm` initialisé à `COD`, e2e `toBeChecked()` |
| Mobile Money non sélectionnable, « Bientôt » | ✅ | radio `disabled`, mention affichée, e2e |
| Bouton désactivé pendant l'envoi | ✅ | `submitting` → `loading` + `disabled`, libellé « Envoi de la commande… » |
| Clé d'idempotence stable | ✅ | unit (même clé au réessai, régénération si payload changé), e2e en-tête UUID v4 |
| CAPTCHA invisible | ✅ | `bruny-captcha` activé par `PublicConfigService`, jeton envoyé avec la commande |
| Erreurs près des champs | ✅ | messages `bruny-input`, `role="alert"`, e2e |
| Responsive mobile | ✅ | styles < 900 px / 680 px (récapitulatif au-dessus, boutons pleine largeur) |
| Aucun montant/frais inventé | ✅ | frais lus via `GET /shipping/zones`, total recalculé serveur |

Non validé / hors périmètre :

- Paiement Mobile Money réel (PAY-01 #63 ouvert) ;
- devis de livraison par adresse (SHP-01 #70 ouvert) ;
- e-mail de confirmation (contrat de commande sans e-mail, ACC-04 non livré) ;
- comparaison pixel à pixel avec la planche `design1`.

## 2. Commandes exécutées

| Commande | Résultat |
| --- | --- |
| `pnpm lint` | ✅ 0 erreur |
| `pnpm typecheck` | ✅ backend + storefront + admin |
| `pnpm -C backend test` | ✅ 34 fichiers, **311 tests** |
| `pnpm -C frontend test` | ✅ 105 fichiers, **578 tests** |
| `pnpm -C backend test:e2e` | ✅ 22 fichiers, **261 tests** |
| `pnpm -C frontend test:e2e` (Playwright) | ✅ **58 tests** (56 existants + 2 checkout) |
| `pnpm build` | ✅ storefront SSR + admin |
| `pnpm -C backend openapi:export` + `pnpm api:generate` | ✅ `GET /shipping/zones` et `CreateOrderBody` à jour, aucune dérive |

## 3. Tests ajoutés

- `backend/src/modules/shipping/shipping.service.test.ts` — tri et sélection
  des zones.
- `frontend/apps/storefront/src/app/features/checkout/checkout.model.spec.ts`
  — validateurs FR, e-mail facultatif, brouillon (version, rétrogradation
  d'étape), clés UUID.
- `frontend/apps/storefront/src/app/features/checkout/checkout.store.spec.ts`
  — persistance, chargement des zones, payload COD sans montants client,
  CGV, idempotence (réessai vs payload modifié), erreurs API.
- `frontend/e2e/checkout.spec.ts` — parcours complet (validation, zones,
  CGV, envoi, en-tête `Idempotency-Key`, nettoyage) et restauration du
  brouillon/étape après rechargement.
- Mises à jour : tests `cart-summary` et `mini-cart` (CTA désormais actif),
  e2e `cart.spec.ts` (navigation vers `/commande`, ordre de tabulation du
  tiroir avec le nouveau bouton).

## 4. Vérification visuelle mobile

Captures Playwright aux largeurs **390 px** (étapes 1, 2 et 3) et **360 px**
(étape 1) : aucun débordement horizontal, les trois libellés du stepper
s'affichent en entier, le récapitulatif tient sur deux lignes (nombre
d'articles + total) et le formulaire commence dans le premier écran.

## 5. Limites connues

1. `GET /shipping/zones` est un endpoint intérimaire ; le devis par adresse
   (SHP-01) le remplacera.
2. L'e-mail saisi n'est pas transmis (contrat ORD-01 sans e-mail).
3. `address.line` reprend le point de repère faute de carnet d'adresses.
4. Si les zones n'ont pas pu être chargées, le bouton « Continuer vers le
   paiement » reste désactivé jusqu'à un réessai réussi.
5. Aucun commit n'a été créé sur cette branche dans le cadre de cette
   vérification.
