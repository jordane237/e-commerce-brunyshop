# P08 — Démarrage du checkout

> DSG-04 · écran d'entrée du tunnel · hors décompte des 3 étapes
> Route proposée : `/commande`

---

## 1. Objectif

Offrir un point d'entrée rassurant entre le panier et le formulaire : rappeler ce qui est commandé, le montant à régler, les trois étapes à venir et les garanties (essayage, paiement à la livraison, échange 7 jours).

P08 ne collecte **aucune donnée**. Il sert à décider de poursuivre ou de retourner au panier. Il évite de faire porter au premier formulaire le poids du récapitulatif complet.

**Indicateur de succès** : ≥ 90 % des visiteurs de P08 passent à P09 ; aucun retour panier involontaire.

---

## 2. Wireframes

### 2.1 Mobile — 360 px

```text
┌──────────────────────────────────────┐
│ ←   BRUNY SHOPPING      🔒 Sécurisé   │  header tunnel
├──────────────────────────────────────┤
│ ① Coordonnées  ② Livraison  ③ Paiement│  stepper, aucune étape active
├──────────────────────────────────────┤
│ VOTRE COMMANDE                       │
│ 2 paires · livraison offerte          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ [img] Mocassin Cuir Glacé        │ │
│ │       Pointure 41 · Qté 1        │ │
│ │                        24 500 FCFA│ │
│ ├──────────────────────────────────┤ │
│ │ [img] Richelieu Oxford Patine    │ │
│ │       Pointure 42 · Qté 1        │ │
│ │                        28 000 FCFA│ │
│ └──────────────────────────────────┘ │
│ Modifier mon panier                  │
│                                      │
│ Sous-total            52 500 FCFA    │
│ Livraison                Offerte     │
│ ──────────────────────────────────── │
│ Total à régler        52 500 FCFA    │
│ Payable au coursier, après essayage   │
│                                      │
│ ✓ Vous essayez avant de payer        │
│ ✓ Aucun acompte demandé              │
│ ✓ Échange gratuit sous 7 jours       │
│                                      │
│ [   Commencer ma commande        →  ] │
│                                      │
│ Besoin d'aide ? Discuter sur WhatsApp │
└──────────────────────────────────────┘
```

### 2.2 Tablette — 768 px

```text
┌─────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING                🔒 Sécurisé │
├─────────────────────────────────────────────┤
│        ① Coordonnées  ② Livraison  ③ Paiement│
├─────────────────────────────────────────────┤
│  ┌───────────────────────┬────────────────┐ │
│  │ VOTRE COMMANDE        │ RÉCAPITULATIF  │ │
│  │ lignes produit        │ sous-total     │ │
│  │ (2 colonnes max)      │ livraison      │ │
│  │                       │ total          │ │
│  │ Garanties (3 lignes)  │                │ │
│  │                       │ [Continuer]    │ │
│  └───────────────────────┴────────────────┘ │
└─────────────────────────────────────────────┘
```

- Grille 12 colonnes : 7 pour les articles et garanties, 5 pour le récapitulatif collant.
- Largeur maximale du contenu : 960 px.

### 2.3 Desktop — 1280 px

```text
┌───────────────────────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING                              🔒 Sécurisé     │
├───────────────────────────────────────────────────────────────┤
│              ① Coordonnées   ② Livraison   ③ Paiement          │
├───────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────┐  ┌────────────────────┐ │
│   │ VOTRE COMMANDE                  │  │ RÉCAPITULATIF      │ │
│   │                                 │  │ Sous-total 52 500  │ │
│   │ ┌────┬─────────────────────────┐│  │ Livraison  Offerte │ │
│   │ │img │ Mocassin Cuir Glacé     ││  │ ─────────────────  │ │
│   │ │    │ Pointure 41 · Qté 1     ││  │ Total     52 500   │ │
│   │ └────┴─────────────────────────┘│  │ Payable au coursier│ │
│   │ ┌────┬─────────────────────────┐│  │                    │ │
│   │ │img │ Richelieu Oxford Patine ││  │ [Commencer ma      │ │
│   │ └────┴─────────────────────────┘│  │  commande       →] │ │
│   │                                 │  │                    │ │
│   │ Garanties en 3 colonnes         │  │ Aide WhatsApp      │ │
│   └─────────────────────────────────┘  └────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

- Conteneur 1 200 px, colonnes 760 / 400 px, gouttière 32 px.
- Le récapitulatif est `position: sticky; top: 24px`.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `CheckoutHeader` | **à créer** | Retour, logo, badge sécurité |
| `StepIndicator` | **à créer** | 3 étapes, aucune active |
| `OrderLineItem` | **à créer** | Ligne compacte image + nom + pointure + qté + prix |
| `OrderSummaryCard` | **à créer** | Sous-total, livraison, total |
| `TrustPanel` | **à créer** | 3 garanties |
| `Button` | existant | CTA primaire, lien secondaire |
| `PriceTag` | existant | Montants |
| `Icon` | existant | Flèche, cadenas, WhatsApp |
| `Skeleton` | existant | Chargement du récapitulatif |
| `Alert` | **à créer** | Panier indisponible |

### 3.1 Structure proposée

```text
CheckoutLayout
├── CheckoutHeader
├── StepIndicator [current=0, steps=3]
├── main
│   ├── section "Votre commande"
│   │   ├── OrderLineItem × n
│   │   └── Button variant=ghost "Modifier mon panier"
│   └── TrustPanel
└── aside
    └── OrderSummaryCard [sticky, total, cta]
```

---

## 4. États

### 4.1 Nominal

Panier avec au moins une ligne, total calculé, livraison offerte ou estimée. CTA actif.

### 4.2 Chargement

- Squelette : 2 lignes de 96 px, 3 lignes de récapitulatif.
- CTA désactivé avec libellé « Chargement… ».
- Durée maximale affichée avant erreur : 8 s.

### 4.3 Vide

Le panier n'a plus de ligne (autre onglet, expiration) :

```text
Votre panier est vide
Ajoutez une paire pour commencer votre commande.
[ Découvrir la boutique ]
```

Redirection automatique vers `/panier` après 5 s, avec le même message.

### 4.4 Erreur

Le panier ne peut pas être lu (réseau, stock) :

```text
Impossible d'afficher votre commande
Vérifiez votre connexion puis réessayez. Votre panier est conservé.
[ Réessayer ]   [ Retour au panier ]
```

Si une ligne est en rupture : bandeau « Un article n'est plus disponible. Retirez-le pour continuer. » + lien vers le panier. Le CTA est désactivé.

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Titre d'écran | « Votre commande » |
| Sous-titre | « Vérifiez votre sélection avant de continuer. » |
| Lien panier | « Modifier mon panier » |
| Ligne produit | `{nom}` · `Pointure {taille}` · `Quantité {n}` |
| Sous-total | « Sous-total » |
| Livraison | « Livraison » / « Offerte » / « Calculée à l'étape suivante » |
| Total | « Total à régler » |
| Mention paiement | « Payable au coursier, après essayage » |
| Garantie 1 | « Vous essayez avant de payer » |
| Garantie 2 | « Aucun acompte demandé » |
| Garantie 3 | « Échange gratuit sous 7 jours » |
| CTA | « Commencer ma commande » |
| Aide | « Besoin d'aide ? » · « Discuter sur WhatsApp » |
| Badge sécurité | « Commande sécurisée » |
| Erreur réseau | « Impossible d'afficher votre commande. Vérifiez votre connexion puis réessayez. » |
| Panier vide | « Votre panier est vide. Ajoutez une paire pour commencer votre commande. » |
| Rupture | « Un article n'est plus disponible. Retirez-le pour continuer. » |

Interdits : « Passer à la caisse », « Checkout », « Paiement 100 % sécurisé », « Livraison garantie ».

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Clic sur le logo | Confirmation douce si panier non vide : « Quitter la commande ? Votre panier est conservé. » → `/boutique` |
| Clic sur « Modifier mon panier » | `/panier`, brouillon conservé |
| Clic sur CTA | Navigation vers P09, focus sur le premier champ |
| Clic sur WhatsApp | Ouvre `wa.me` avec message prérempli contenant la référence panier locale |
| Ligne produit | Non cliquable (évite une sortie accidentelle du tunnel) |

Aucun menu, aucun lien de navigation global : le tunnel est un **contexte fermé** assumé.

---

## 7. Accessibilité — WCAG 2.1 AA

- **Structure** : `h1` unique « Votre commande » ; récapitulatif en `aside` avec `aria-labelledby`.
- **Stepper** : `nav aria-label="Étapes de la commande"`, liste ordonnée, étape courante `aria-current="step"` (aucune sur P08), étapes futures `aria-disabled="true"`.
- **Montants** : chaque prix est lisible isolément (`<span class="sr-only">Prix total :</span> 52 500 FCFA`), pas uniquement visuel.
- **Contrastes** : texte ≥ 4,5:1, badges ≥ 3:1 ; or sur blanc interdit, utiliser `accent-text #8A6A1F`.
- **Cibles** : 44 × 44 px minimum, y compris le retour et le lien WhatsApp.
- **Focus** : anneau `bs-focus-ring` visible sur fond clair et navy.
- **Zoom** : lisible à 200 % sans perte de contenu ; les lignes produit passent en colonne.
- **Mouvement** : aucune animation supérieure à 5 s ; respect de `prefers-reduced-motion`.
- **Sécurité** : le badge « Commande sécurisée » est décoratif (`aria-hidden`) et ne remplace pas une information utile.

---

## 8. Données API

| Donnée | Origine | Obligatoire | Remarque |
| --- | --- | --- | --- |
| `lines[]` (id, nom, image, pointure, quantité, prix unitaire) | `CartStore` | oui | Source locale en MVP |
| `subtotal` | calcul client | oui | Entier XAF |
| `shippingFee` | zone ou règle « 2 paires » | non | `null` = « calculée à l'étape suivante » |
| `total` | calcul client | oui | Recalculé serveur à la création |
| `stockStatus` | `POST /cart/validate` | non | Existant (CRT-01) |

Aucun appel de création de commande sur P08. Aucune donnée personnelle collectée.

**Dépendances manquantes** : aucune pour P08, hormis `CartStore` déjà présent.

---

## 9. Écarts et décisions

| Constat | Décision DSG-04 |
| --- | --- |
| La maquette n'a pas d'écran d'entrée : elle commence directement par les coordonnées | Créer P08 comme écran de récapitulatif et de décision |
| La maquette affiche 3 sections sur une page | P08 ne montre que le récapitulatif, sans formulaire |
| Stepper présent dès le haut de la maquette | Sur P08, aucune étape active ; le stepper informe sans promettre une progression déjà faite |
| Aucun CTA final | CTA « Commencer ma commande » ajouté |
| « 100 % Sécurisé » | Remplacé par « Commande sécurisée », exact et non trompeur |

---

## 10. Référence

- Maquette : zone C, haut de la planche (`design1/bruny shopping/bruny shopping.png`, 8, 800).
- Documents : `PARCOURS.md` §4, §6 ; `COMPOSANTS-REQUIS.md` ; `MICROTEXTES.md` §P08.
- Existant : `frontend/apps/storefront/src/app/features/cart/cart-page.ts`, `CartStore`.
