# CRT-02 — Analyse design et décisions

## 1. Sources réellement disponibles

| Source | Contenu |
| --- | --- |
| `docs/design-1/ANALYSE-MAQUETTES.md` | Zones E–H de la planche, P04 et P06 en mobile 390 px |
| `docs/design/DSG-03/README.md` | Traçabilité P01–P07, absence de specs détaillées |
| `docs/design/DSG-04/P08-checkout-start.md` | Récapitulatif du panier avant checkout |
| `docs/design/DSG-04/P11-paiement.md` | Messages de panier modifié, prix modifié, stock épuisé |
| `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` | Microtextes panier, succès, rupture, session |
| `docs/design-system/COMPOSANTS.md` | Composants UI et états attendus |
| Code existant | `CartStore` partiel, `CartPage`, `ProductPage`, header boutique |

**Constat important** : les specs `DSG-03/P06-*.md` et `P07-*.md` n'existent
pas. P06 n'est documenté que par l'analyse de la maquette mobile ; P07 n'a
aucune maquette. Aucune vue 768/1280 de P06 ou P07 n'est disponible.

## 2. Structure extraite

### P06 — Panier (mobile partiel)

La maquette présente :

- en-tête « Mon panier » avec compteur d'articles ;
- deux lignes avec visuel, nom, pointure, couleur, prix et stepper ;
- suppression par ligne ;
- récapitulatif sous-total / livraison / total ;
- CTA de passage à la caisse ;
- aucun état vide, chargement, erreur ou écart de prix dessiné.

Décision CRT-02 : conserver cette structure, remplacer les éléments non encore
disponibles (coupon et frais de livraison) par le sous-total et la remise
renvoyés par CRT-01. Les frais de livraison restent hors périmètre jusqu'à P10.

### P07 — Mini-panier (absent)

Décision documentée, conformément à la recommandation de
`ANALYSE-MAQUETTES.md` :

- drawer latéral droit sur desktop (440 px) ;
- plein écran sur mobile (< 768 px) ;
- lignes compactes, total, CTA « Voir le panier » et « Continuer mes achats » ;
- état vide avec lien catalogue ;
- réutilisation du composant Modal existant, étendu avec `placement="right"`.

### P04 — Fiche produit

La maquette mobile décrit une barre d'achat fixe, le choix de la pointure et le
libellé « Ajouter au panier ». L'implémentation existante respecte déjà ce
parcours. CRT-02 conserve la sélection de pointure et enregistre le variant
sélectionné dans le panier.

### P11 — Paiement (futur)

P11 n'est pas implémenté. Les messages de panier modifié et de rupture sont
prévus dans `CartStore` et réutilisables par le tunnel. Le CTA « Passer la
commande » de P06 reste désactivé tant que P08/P11 n'existent pas, afin de ne
pas créer de route morte.

## 3. Mapping des microtextes

| Situation | Texte retenu |
| --- | --- |
| Titre | Mon panier |
| Compteur | {n} article / {n} articles |
| Ajout réussi | Produit ajouté au panier. |
| Retrait | Produit retiré du panier. |
| Panier vide | Votre panier est vide |
| Aide panier vide | Ajoutez un produit pour commencer votre commande. |
| CTA vide | Découvrir la boutique |
| Écart détecté | Votre panier a changé |
| Erreur réseau | Impossible de vérifier votre panier. Vérifiez votre connexion. |
| Réessayer | Réessayer |
| CTA panier | Voir le panier |
| CTA achat | Ajouter au panier |
| Récapitulatif | Récapitulatif |
| Total | Total à payer |
| Commande indisponible | Le paiement sera disponible prochainement. |

Les messages d'écart détaillés (`PRICE_CHANGED`, `INSUFFICIENT_STOCK`,
`OUT_OF_STOCK`, `PRODUCT_ARCHIVED`, `VARIANT_NOT_FOUND`, promotions, coupons)
proviennent du backend CRT-01, qui les renvoie déjà en français et au format
XAF.

## 4. Tokens et composants

- Couleurs, espacements, rayons, ombres, focus et cibles tactiles viennent des
  tokens `--bs-*` (DSG-02).
- Montants via `FcfaPipe` / `formatFcfa`, jamais de formatage local.
- Composants réutilisés : `ModalComponent`, `IconComponent`, `ProductCard`,
  `PriceTag` implicite via le format monétaire.
- `ModalComponent` reçoit une option `placement: 'center' | 'right'` pour le
  drawer P07, sans changer le comportement par défaut.
- Composants créés : `MiniCartComponent`, `CartPage` complet.

## 5. Décisions d'architecture

### Store dans le core de la boutique

Le brief proposait `features/cart/cart.store.ts`. Le panier est utilisé par la
fiche produit, le catalogue, l'accueil, le layout et la page panier. Le placer
dans une feature aurait créé des imports cross-feature. Il est donc placé dans
`apps/storefront/src/app/core/cart/`, avec :

- `cart.model.ts` pour le format persisté et la normalisation CRT-01 ;
- `cart.store.ts` pour l'état à signaux et la persistance.

Le client HTTP typé `CartApi` est ajouté dans `@bruny/data-access`, car le
client généré TEC-09 ne contient pas de `CartControllerService`.

### Persistance

- Clé : `brunyshop.cart.v1`.
- Snapshot versionné `{ version: 1, lines, updatedAt }`.
- Migration de l'ancienne clé `bruny-cart-v1`.
- Restauration après le premier rendu (`afterNextRender`) pour éviter une
  divergence d'hydratation SSR.
- Aucune donnée sensible : ni token, ni email, ni téléphone, ni adresse, ni
  total serveur. `unitPriceAtAdd` sert seulement de repère pour détecter un
  changement de prix.

### Revalidation

- CRT-01 est appelé uniquement côté navigateur.
- Au démarrage si le panier restauré n'est pas vide.
- À l'ouverture de `/panier`.
- À l'ouverture du mini-panier si la validation a plus de 5 minutes.
- 500 ms après une modification de quantité.
- Les réponses obsolètes sont ignorées grâce à un compteur de requête.
- Les quantités ajustées et les lignes à `quantity: 0` sont synchronisées.
- Les écarts restent affichés dans une bannière persistante, en plus des toasts.

## 6. Limites

- Les vues 768/1280 de P06 et P07 sont dérivées, pas maquettées.
- Le coupon et les frais de livraison restent hors CRT-02.
- Le tunnel P08–P11 n'existe pas encore.
- Le panier invité n'est pas fusionné avec un panier utilisateur : cette
  synchronisation nécessite un ticket dédié.
- Aucun changement backend.
