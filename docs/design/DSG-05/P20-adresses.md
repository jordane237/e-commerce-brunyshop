# P20 — Mes adresses

> DSG-05 · groupe Compte · route `/compte/adresses`
> Endpoints à créer : `GET/POST/PATCH/DELETE /addresses`.

---

## 1. Objectif & rôle

Gérer les lieux de livraison enregistrés (domicile, bureau, autre) avec un repère fiable pour le coursier, et identifier une adresse par défaut. L'écran doit rester utile avec 0, 1 ou plusieurs adresses.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Mon compte › Adresses ».
2. `h1` « Mes adresses », compteur « 2 adresses ».
3. Cartes d'adresse :
   - libellé + badge « Par défaut » ;
   - ville, quartier, ligne ;
   - repère en encadré ;
   - téléphone ;
   - actions « Modifier » (icône crayon) et « Supprimer » (menu ou bouton).
4. Bouton pointillé « Ajouter une adresse ».
5. Aide : « Un repère précis aide le coursier à vous trouver. »
6. Bottom nav.

### 768 px

- Grille 2 colonnes de cartes.
- Bouton d'ajout en fin de grille.

### 1280 px

- Sidebar compte + grille 2 colonnes (max 720 px) + colonne d'aide 280 px.
- L'aide rappelle les zones desservies et le lien P24.

```text
┌──────────────┬───────────────────────────────────────────────┐
│ MON COMPTE   │ Mes adresses (2)         [+ Ajouter]          │
│ Adresses ●   │ ┌──────────────────┬──────────────────────┐   │
│              │ │ Domicile [Défaut]│ Bureau               │   │
│              │ │ Bonapriso        │ Akwa                 │   │
│              │ │ Repère…          │ Repère…              │   │
│              │ │ Modifier Suppr.  │ Modifier Suppr.      │   │
│              │ └──────────────────┴──────────────────────┘   │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `AccountNav` | NOUVEAU | sidebar | actif |
| `AddressCard` | NOUVEAU (DSG-04) | complète | défaut / normale |
| `Button` | TEC-10 | primary, ghost, danger | — |
| `ConfirmDialog` | NOUVEAU | danger | ouvert / fermé |
| `EmptyState` | NOUVEAU | — | — |
| `Toast` | TEC-10 | success, error | — |
| `Skeleton` | TEC-10 | cartes | — |

---

## 4. États obligatoires

- **Chargement** : 2 squelettes de cartes.
- **Vide** : `EmptyState` « Aucune adresse enregistrée » + « Ajouter une adresse » + « Vous pourrez aussi en ajouter au moment de commander. »
- **Erreur** : liste indisponible, suppression échouée, 401.
- **Succès** : ajout/édition → retour P20 avec toast ; suppression → carte retirée, toast « Adresse supprimée. ».

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Chargement impossible | « Impossible de charger vos adresses. Réessayez. » |
| Suppression échouée | « L'adresse n'a pas pu être supprimée. Réessayez. » |
| Adresse utilisée par une commande en cours | « Cette adresse est utilisée par une commande en cours. Modifiez-la après la livraison. » |
| Session expirée | Redirection P14 |
| Réseau | « Connexion interrompue. Réessayez. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Mes adresses | neutre | `h1` |
| Compteur | {n} adresse(s) | info | — |
| Badge défaut | Par défaut | info | texte + icône |
| CTA ajouter | Ajouter une adresse | action | — |
| Action modifier | Modifier l'adresse {libellé} | action | `aria-label` |
| Action supprimer | Supprimer l'adresse {libellé} | action | `aria-label` |
| Aide | Un repère précis aide le coursier à vous trouver. | aide | — |
| Vide titre | Aucune adresse enregistrée | neutre | `h2` |
| Vide corps | Ajoutez une adresse pour commander plus rapidement. | aide | — |
| Vide CTA | Ajouter une adresse | action | — |
| Suppression titre | Supprimer cette adresse ? | clair | `alertdialog` |
| Suppression corps | Elle ne sera plus proposée lors de vos commandes. | clair | — |
| Suppression annuler | Annuler | action | focus initial |
| Suppression confirmer | Supprimer l'adresse | danger | — |
| Toast suppression | Adresse supprimée. | succès | `role="status"` |

---

## 6. Interactions & comportements

- « Ajouter » → P20b en mode création.
- « Modifier » → P20b prérempli.
- « Supprimer » → `ConfirmDialog` ; confirmation → appel DELETE ; échec → message, carte conservée.
- Adresse par défaut : badge unique ; le changement se fait dans P20b via un toggle « Utiliser par défaut ».
- Suppression d'une adresse par défaut : la première adresse restante devient par défaut (règle à confirmer backend).
- Aucune sélection multiple, aucun tri.
- `GET /addresses` renvoie `isDefault` une fois le champ ajouté.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1`, cartes en `<ul>`/`<li>` ou articles avec titres.
- Badge « Par défaut » lu en texte, pas seulement visuel.
- Boutons d'action avec `aria-label` incluant le libellé de l'adresse.
- `ConfirmDialog` : `role="alertdialog"`, focus initial « Annuler », Échap ferme, focus restitué.
- Erreurs : `role="alert"`.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : une carte par ligne.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Liste | `GET /addresses` **à créer** | Erreur + réessayer |
| Suppression | `DELETE /addresses/:id` **à créer** | Erreur |
| Défaut | `PATCH /addresses/:id` **à créer** | — |

Modèle : `label`, `city`, `district`, `line`, `landmark`, `phone`, **`isDefault` à ajouter**.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Zone K montre « Par défaut » | `isDefault` absent du schéma : migration recommandée |
| Zone K : « 2 repères actifs » | Remplacé par « 2 adresses » |
| Bouton pointillé | Conservé comme CTA d'ajout |
| Aucune suppression dessinée | `ConfirmDialog` ajouté |

---

## 10. Wireframe de référence

Zone K, bloc « Adresses & Repères de Livraison » (3416, 800).
