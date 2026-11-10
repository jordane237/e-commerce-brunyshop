# P18b — Détail d'une commande

> DSG-05 · groupe Compte · route `/compte/commandes/:reference`
> Endpoint à créer : `GET /orders/:reference`.

---

## 1. Objectif & rôle

Donner une vue complète et figée d'une commande : statut, étapes, articles achetés, adresse de livraison, montants et actions utiles (suivi, support, recommander). C'est l'équivalent connecté de P12/P13, sans promesse de temps réel.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Mon compte › Commandes › BRN-… ».
2. En-tête : référence, date, badge de statut, total.
3. **Timeline** verticale (5 étapes) avec dates.
4. **Articles commandés** : lignes snapshotées (nom, pointure, couleur, quantité, prix).
5. **Adresse de livraison** : destinataire, téléphone masqué, adresse, repère, créneau.
6. **Récapitulatif** : sous-total, livraison, remise, total, mode de paiement.
7. Actions : « Suivre ma commande », « Contacter le support », « Recommander ».
8. « Télécharger la facture » désactivé avec mention « Bientôt disponible ».
9. Bottom nav.

### 768 px

- En-tête commande pleine largeur.
- Deux colonnes : timeline + articles à gauche, adresse + récap + actions à droite.

### 1280 px

```text
┌──────────────┬───────────────────────────────────────────────┐
│ MON COMPTE   │ BRN-2611-7K3F  10 nov. 2026   [En cours]      │
│ Commandes ●  │ ┌─────────────────────────┬─────────────────┐ │
│              │ │ Timeline                │ Adresse         │ │
│              │ │ Articles                │ Récapitulatif   │ │
│              │ │                         │ Actions         │ │
│              │ └─────────────────────────┴─────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

- Contenu 900 px, colonnes 560 / 320 px.

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `AccountNav` | NOUVEAU | sidebar | actif |
| `Timeline` | NOUVEAU (DSG-04) | 5 étapes | done, current, todo |
| `StatutBadge` | NOUVEAU | sémantique | — |
| `OrderLineItem` | NOUVEAU (DSG-04) | compact | — |
| `AddressCard` | NOUVEAU | lecture | — |
| `Button` | TEC-10 | primary, ghost | — |
| `Alert` | NOUVEAU | info, danger | — |
| `Skeleton` | TEC-10 | — | — |

---

## 4. États obligatoires

- **Chargement** : skeleton de l'en-tête, de la timeline et des articles.
- **Vide** : référence inconnue → état « Commande introuvable » avec retour P18.
- **Erreur** : 403 (commande d'un autre compte) → même message neutre que 404 ; 5xx → « Réessayer ».
- **Succès** : toutes les données affichées, timeline à jour.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Introuvable / non autorisée | « Nous ne trouvons pas cette commande dans votre compte. » |
| Session expirée | Redirection P14 |
| Erreur serveur | « Impossible d'afficher cette commande. Réessayez. » |
| Réseau | « Connexion interrompue. Réessayez. » |
| Facture indisponible | « La facture sera disponible prochainement. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Commande {référence} | neutre | `h1` |
| Date | Passée le {date} | info | `<time>` |
| Timeline | Suivi de votre commande | neutre | `h2` |
| Articles | Articles commandés | neutre | `h2` |
| Adresse | Adresse de livraison | neutre | `h2` |
| Récapitulatif | Récapitulatif | neutre | `h2` |
| Sous-total | Sous-total | neutre | — |
| Livraison | Livraison | neutre | — |
| Remise | Remise | neutre | — |
| Total | Total | neutre | — |
| Paiement | Paiement à la livraison | info | — |
| CTA suivi | Suivre ma commande | action | — |
| CTA support | Contacter le support | action | — |
| CTA recommander | Recommander cette commande | action | — |
| Facture | Télécharger la facture | action | désactivé |
| Facture aide | Disponible prochainement. | info | — |
| Statut annulé | Cette commande a été annulée. | neutre | — |
| Introuvable | Nous ne trouvons pas cette commande dans votre compte. | neutre | `role="alert"` |

---

## 6. Interactions & comportements

- « Suivre ma commande » → P13 avec la référence (lien signé si disponible).
- « Contacter le support » → WhatsApp prérempli avec la référence.
- « Recommander » → ajoute les variantes encore disponibles au panier, puis redirige vers `/panier` ; les variantes épuisées sont signalées.
- Facture : bouton désactivé, `aria-describedby` vers l'aide.
- Timeline : une seule étape `current`.
- Aucun bouton d'annulation ou de modification d'adresse en MVP.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` avec référence lisible, pas seulement un numéro brut.
- Timeline : `<ol>`, `aria-current="step"`, statut textuel par étape.
- Montants en `dl`, libellés explicites.
- Bouton désactivé : `aria-disabled="true"` et explication liée.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Erreur : `role="alert"`, focus sur le message.
- Zoom 200 % : colonnes empilées, aucune troncature de référence.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Commande | `GET /orders/:reference` **à créer** | Erreur |
| Suivi | `GET /tracking/:reference` **à créer** | Lien P13 manuel |

Données : `reference`, `createdAt`, `status`, `paymentStatus`, `paymentMethod`, `items[]` (snapshot), `subtotal`, `discount`, `shippingFee`, `total`, `addressSnapshot`, `shipment` (statut, estimation, coursier).

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| « Facture PDF » dans la zone K | V2, bouton désactivé |
| « Livré & Essayé » | Dérivé de `DELIVERED` + paiement |
| Timeline non dessinée pour le compte | Réutilise celle de P13 |
| Aucune action de retour produit | Renvoi vers P25, pas de formulaire intégré |

---

## 10. Wireframe de référence

Zone K, carte de commande active et historique ; timeline de la zone J.
