# P18 — Mes commandes

> DSG-05 · groupe Compte · route `/compte/commandes`
> Endpoint à créer : `GET /orders` (pagination, filtre par statut).

---

## 1. Objectif & rôle

Lister toutes les commandes du client, avec leur statut, leur montant et un accès au détail. L'écran doit rester lisible avec 0, 1 ou 50 commandes et proposer une sortie claire quand il n'y en a aucune.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Mon compte › Commandes ».
2. `h1` « Mes commandes », compteur « 3 commandes ».
3. Filtres en puces défilantes : Toutes, En cours, Livrées, Annulées.
4. Liste de cartes :
   - référence + date ;
   - badge de statut ;
   - visuel de la première ligne + « et 1 autre article » ;
   - total ;
   - CTA « Voir le détail ».
5. Pagination « Afficher plus » ou pagination numérotée si > 10.
6. Lien « Une commande passée sans compte ? Suivez-la avec votre référence. » → P13.
7. Bottom nav.

### 768 px

- Filtres en `Select` + puces.
- Cartes sur deux colonnes.
- Pagination numérotée en bas.

### 1280 px

- Sidebar compte + tableau `Table` (référence, date, statut, articles, total, action) avec pagination.
- Filtres au-dessus du tableau, compteur à droite.

```text
┌──────────────┬───────────────────────────────────────────────┐
│ MON COMPTE   │ Mes commandes (3)          [Toutes ▼]         │
│ Vue d'ensemble│ ┌───────────────────────────────────────────┐ │
│ Commandes ●  │ │ Réf.       Date     Statut   Total  Action│ │
│ Profil       │ │ BRN-…7K3F  10 nov.  En cours 52 500 Voir  │ │
│ Adresses     │ │ BRN-…7104  12 avr.  Livrée   24 500 Voir  │ │
│ Favoris      │ └───────────────────────────────────────────┘ │
│              │ ‹ 1 2 ›                                       │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `AccountNav` | NOUVEAU | sidebar | actif |
| `StatutBadge` | NOUVEAU | success, warning, info, danger, neutral | — |
| `Table` | TEC-10 | desktop | loading, empty |
| `Pagination` | NOUVEAU | numérotée | — |
| `Button` | TEC-10 | ghost, secondary | — |
| `EmptyState` | NOUVEAU | illustrations légères | — |
| `Skeleton` | TEC-10 | lignes | — |
| `Breadcrumb` | NOUVEAU | — | — |

---

## 4. États obligatoires

- **Chargement** : 3 squelettes de cartes (mobile) ou 5 lignes de tableau (desktop).
- **Vide** : `EmptyState` « Vous n'avez pas encore de commande » + « Découvrir la boutique » ; si un filtre est actif, message spécifique + « Réinitialiser les filtres ».
- **Erreur** : `Alert` + « Réessayer » ; pagination conservée.
- **Succès** : liste affichée, compteur à jour.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Session expirée | Redirection P14 |
| Chargement impossible | « Impossible de charger vos commandes. Réessayez. » |
| Filtre sans résultat | « Aucune commande ne correspond à ce filtre. » |
| Page hors limite | Recharge la dernière page valide |
| Réseau | « Connexion interrompue. Vérifiez votre connexion puis réessayez. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Mes commandes | neutre | `h1` |
| Compteur | {n} commande(s) | info | `aria-live="polite"` |
| Filtre tous | Toutes | neutre | — |
| Filtre en cours | En cours | neutre | — |
| Filtre livrées | Livrées | neutre | — |
| Filtre annulées | Annulées | neutre | — |
| Carte référence | Commande {référence} | neutre | — |
| Date | Passée le {date} | info | `<time>` |
| CTA | Voir le détail | action | — |
| Pagination | Page {n} sur {total} | info | `aria-label` |
| Vide titre | Vous n'avez pas encore de commande | neutre | `h2` |
| Vide corps | Découvrez nos chaussures et passez votre première commande. | encourageant | — |
| Vide CTA | Découvrir la boutique | action | — |
| Vide filtre | Aucune commande ne correspond à ce filtre. | neutre | — |
| Réinitialiser | Réinitialiser les filtres | action | — |
| Lien suivi invité | Une commande passée sans compte ? Suivez-la avec votre référence. | aide | — |

---

## 6. Interactions & comportements

- Filtre par statut : `Toutes`, `En cours` (`PENDING_CONFIRMATION`, `AWAITING_PAYMENT`, `CONFIRMED`, `PAID`, `PREPARING`, `SHIPPED`), `Livrées` (`DELIVERED`, `EXCHANGED`), `Annulées` (`CANCELLED`, `REFUNDED`).
- Le filtre est reflété dans l'URL (`?statut=en-cours`) pour permettre le retour.
- Clic sur une carte/ligne → P18b.
- Pagination : 10 par page, conserve le filtre.
- Rafraîchissement au retour depuis P18b.
- Aucun bouton « Annuler » dans la liste : l'annulation n'est pas disponible en MVP.

---

## 7. Accessibilité (WCAG 2.1 AA)

- Tableau avec `caption`, en-têtes `th scope="col"`, tri non requis.
- Cartes mobiles : chaque carte est un lien avec un libellé complet, pas un bloc cliquable sans focus.
- Badges : texte de statut explicite, jamais la couleur seule.
- Filtres : `aria-pressed` sur les puces, `label` sur le select.
- Pagination : `nav aria-label="Pagination des commandes"`, page courante `aria-current="page"`.
- Skeleton : `aria-busy="true"`.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : cartes en colonne, tableau remplacé par les cartes.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Liste | `GET /orders?page=1&pageSize=10&status=` **à créer** | Erreur + réessayer |
| Détail | `GET /orders/:reference` **à créer** | Erreur ciblée |

Réponse attendue : `{ items: [{ reference, createdAt, status, total, itemCount, firstItem: { name, image } }], page, pageSize, total }`.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Zone K montre 1 historique pour « 2 commandes » | Compteur API unique |
| « Facture PDF » présent | Retiré de la liste, V2 dans P18b |
| Aucune pagination dessinée | 10 par page, composant dédié |
| Aucun filtre dessiné | 4 filtres simples, URL synchronisée |

---

## 10. Wireframe de référence

Zone K, bloc « Historique des Commandes » (3416, 800, 396 × 1740).
