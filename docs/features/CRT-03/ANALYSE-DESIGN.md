# CRT-03 — Analyse du design existant

**Date** : 16 novembre 2026
**Branche** : `feature/CRT-03-mini-cart-drawer`
**Périmètre** : mini-panier en tiroir (P07), après ajout au panier.

## 1. Sources examinées

| Source | Résultat |
| --- | --- |
| `design1/bruny shopping/bruny shopping.png` | Planche unique 4302 × 5532 ; utilisée pour P01, P02, P04 et P06 |
| `design/` | **Dossier absent** du dépôt |
| `docs/design/DSG-03/README.md` | Déclare P07 **absent**, sans maquette ni spec |
| `docs/design/DSG-04/P08-checkout-start.md` | Route `/commande` **proposée**, écran non implémenté |
| `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` | Source de vérité des libellés |
| `docs/design/DSG-02` / `libs/design-tokens` | Tokens couleurs, espacements, focus, mouvement |
| `frontend/apps/storefront/src/app/features/cart/cart-page.*` | P06 existant, référence de structure |
| `frontend/apps/storefront/src/app/core/cart/cart.store.ts` | Signaux et validation CRT-02 |

## 2. Constat P07

**P07 n'a pas de maquette ni de spécification dans le dépôt.** Les documents DSG-03 et
DSG-07 le confirment explicitement. Il n'existe donc aucune vue 360 / 768 / 1280 à
reproduire au pixel. La structure du tiroir a été dérivée de P06 (panier), du composant
Modal existant et des tokens DSG-02, sans inventer de nouvelles règles visuelles.

Conséquences :

- le tiroir est à droite, pleine hauteur, **400 px** sur desktop et **100 %** sur mobile ;
- la largeur mobile utilise `min(400px, 100vw)` pour rester utilisable à 360 px ;
- le footer est fixe en bas du tiroir, le corps défile indépendamment ;
- le backdrop reprend `--bs-color-overlay` et le tiroir `--bs-shadow-lg` ;
- l'animation d'entrée vient de la droite en `--bs-duration-slow` (240 ms), avec
  désactivation sous `prefers-reduced-motion: reduce`.

## 3. Structure retenue

```text
bruny-drawer (CDK Overlay, role=dialog, aria-modal=true)
├── header
│   ├── h2 « Mon panier » (aria-labelledby)
│   └── bouton « Fermer le panier » (44 × 44 px)
├── body
│   ├── bandeau issues (le cas échéant)
│   ├── erreur + Réessayer
│   ├── skeletons (chargement à vide)
│   ├── état vide + « Découvrir la boutique »
│   └── liste des lignes
│       ├── image 64 × 64
│       ├── nom, couleur, pointure, quantité
│       ├── prix de ligne (PriceTag)
│       └── bouton Retirer
└── footer sticky
    ├── Sous-total / Total (PriceTag)
    ├── Voir le panier
    ├── Continuer mes achats
    ├── Passer la commande (désactivé, P08 absent)
    └── mention de disponibilité future
```

Le déclencheur reste dans le header : icône panier, libellé « Panier », badge numérique
`aria-hidden` et libellé accessible « Ouvrir le panier (N articles) ». Un texte
`sr-only` en `aria-live="polite"` annonce les changements de compteur.

## 4. Microtextes et décisions

| Élément | Texte retenu | Justification |
| --- | --- | --- |
| Titre du tiroir | **Mon panier** | Cohérence avec le titre P06 existant |
| Compteur | **N article / N articles** | Annonce accessible et badge |
| Fermer | **Fermer le panier** | `aria-label` contextualisé, conforme au glossaire |
| Voir le panier | **Voir le panier** | Forme canonique DSG-07 |
| Continuer | **Continuer mes achats** | Exigence CA #2 |
| Commande | **Passer la commande** | Forme canonique DSG-07 ; « Commander » est une variante interdite |
| Vide | **Votre panier est vide** + **Découvrir la boutique** | État vide canonique DSG-07 |
| Rupture / écart | **Votre panier a changé** | Reprise de P06 |
| Paiement | **Le paiement sera disponible prochainement.** | Aucune promesse d'un tunnel absent |

Le glossaire DSG-07 interdit « Commander » et « Voir le catalogue ». Les libellés du
prompt ont donc été alignés sur la source de vérité, sans invention.

## 5. Routes et CTA

| Action | Destination | État |
| --- | --- | --- |
| Continuer mes achats | `/boutique` | Implémenté et testé |
| Voir le panier | `/panier` | Implémenté et testé |
| Passer la commande | `/commande` | **Désactivé** : P08 n'existe pas et la route est absente |

Le prompt mentionne `/catalogue` et `/commande` à titre indicatif. La route réelle du
catalogue est `/boutique` ; `/commande` n'existe pas. Le CTA de commande reste donc
désactivé avec une mention explicite, décision validée avec l'utilisateur, plutôt que
de promettre une navigation vers une route inexistante.

## 6. Composants réutilisés / créés

| Composant | Usage |
| --- | --- |
| `DrawerComponent` (créé dans `libs/ui`) | Overlay CDK, focus trap, Échap, backdrop, scroll lock, restitution du focus |
| `ButtonComponent` | « Continuer mes achats » et « Passer la commande » |
| `PriceTagComponent` | Prix de ligne, sous-total et total au format FCFA |
| `SkeletonComponent` | État de chargement |
| `IconComponent` | Panier, fermeture |
| `CartStore` | Lignes, compteur, total, remise, validation, `lastAddedAt` |

Le badge numérique reste un span dédié : le composant `BadgeComponent` est prévu pour
des statuts textuels et non pour un compteur de panier de 20 px.

## 7. Intégration au header

Il n'existe pas de `HeaderComponent` séparé dans ce dépôt : le header est inline dans
`apps/storefront/src/app/app.html` et contient déjà `<bruny-mini-cart />`. Le bouton,
le badge et la région `aria-live` sont donc portés par `MiniCartComponent`, ce qui évite
un composant artificiel et conserve le comportement temps réel via signaux.

## 8. Ouverture automatique

`CartStore.lastAddedAt` est mis à jour après tout ajout réussi (nouvelle ligne ou
quantité incrémentée) et remis à `null` par `clear()`. `MiniCartComponent` observe ce
signal avec `effect()` et ouvre le tiroir via `untracked()` : fermer le tiroir ne relance
pas l'effet et ne le rouvre donc pas. La validation est déclenchée à l'ouverture si le
panier est obsolète ou en erreur.

## 9. SSR et accessibilité

- Le portail et l'overlay ne sont créés qu'après le premier rendu navigateur
  (`afterNextRender` + `isPlatformBrowser`) ; le HTML SSR ne contient aucun dialogue.
- Le scroll est bloqué par `scrollStrategies.block()` et restauré à la fermeture.
- Focus initial sur le premier élément interactif (bouton fermer), focus piégé,
  Échap, clic backdrop et retour au déclencheur sont couverts par les tests unitaires
  et e2e.
- Sous `prefers-reduced-motion`, l'animation du tiroir est supprimée.

## 10. Limites

- P07 n'existe pas : la conformité pixel et les wireframes 360 / 768 / 1280 ne peuvent
  pas être prouvés.
- Le checkout P08 n'existe pas : le CTA « Passer la commande » est volontairement
  désactivé.
- Le rendu a été vérifié avec Chromium et les tests ARIA structurels ; aucun test
  NVDA/VoiceOver n'a été exécuté dans cet environnement.
