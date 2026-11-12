# A10 — Liste des clients

## 1. Objectif et contexte

Retrouver un client, comprendre sa valeur et son historique, et ouvrir sa fiche. La liste sert au service client et au suivi commercial ; elle ne permet aucune modification en masse.

- Route cible : `/admin/clients`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`.
- Seuls les comptes clients (`CUSTOMER`) apparaissent. Les commandes invitées restent visibles dans A07, sans fiche client.
- Chaque ligne desktop devient une carte mobile.

## 2. Rôles autorisés

| Rôle | Voir | Voir les coordonnées | Ouvrir la fiche | Suspendre |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Oui | Oui | Non |
| `STOCK_MANAGER` | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Clients                      │
│ 284 clients · 12 nouveaux    │
│ [Rechercher un client]       │
│ [Filtres 1]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ (AN) Awa N.       ● Actif│ │
│ │ awa@example.com          │ │
│ │ Douala · 3 commandes     │ │
│ │ 182 000 FCFA dépensés    │ │
│ │ Dernière : il y a 2 j    │ │
│ │ [Ouvrir]                 │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ (SK) Samuel K.  Suspendu │ │
│ │ +237 6 77 •• •• 12       │ │
│ │ Yaoundé · 1 commande     │ │
│ │ 24 000 FCFA              │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Clients                        284 · 12 nouveaux    │
│ [Rechercher…] [Statut ▾] [Ville ▾] [Période ▾]     │
├────────────────────────────────────────────────────┤
│ Client          Contact           Commandes  Total  │
│ Awa N.          awa@example.com   3          182 000│
│ Samuel K.       +237 6 77…        1           24 000│
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Clients                                  [Exporter] retiré    │
│          │ 284 clients · 12 nouveaux ce mois                            │
│          │ [Rechercher nom, e-mail, téléphone…]                         │
│          │ [Statut] [Ville] [Période] [Reset]                           │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Client        Contact          Commandes  Dépensé   Statut   │
│          │ Awa N.        awa@example.com  3          182 000   Actif    │
│          │ Samuel K.     +237 6 77…       1           24 000   Suspendu │
│          │ Guest         —                —          —         —        │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Les commandes invitées ne figurent pas ici. Voir Commandes.  │
│          │ 1–20 sur 284                                  ‹ 1 2 … 15 ›   │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DataTable` | Desktop |
| `CardList` | Mobile |
| `SearchField` | Nom, e-mail, téléphone |
| `FilterBar` / `FilterDrawer` | Statut, ville, période |
| `StatusBadge` | `UserStatus` |
| `Avatar` | Initiales |
| `EmptyState` | Aucun client / aucun résultat |
| `Skeleton` | Chargement |
| `Pagination` | Liste |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucun client inscrit pour le moment. » + lien vers la boutique |
| Chargement | Squelettes de lignes et de KPI |
| Erreur | « Impossible de charger les clients. » + « Réessayer » |
| Succès | Liste, compteurs et pagination à jour |

Cas complémentaires :

- **Aucun résultat** : « Aucun client ne correspond à vos filtres. » + « Réinitialiser ».
- **Client suspendu** : badge rouge, fiche accessible, aucune action de commande.
- **Coordonnées masquées** : si la politique l’exige, afficher un bouton « Afficher » plutôt qu’un numéro en clair.
- **Client sans commande** : « Aucune commande » à la place de 0 FCFA.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Clients |
| Compteur | {n} clients · {n} nouveaux ce mois |
| Recherche | Rechercher un nom, un e-mail ou un téléphone |
| Filtre statut | Statut |
| Filtre ville | Ville |
| Filtre période | Inscription |
| Colonne client | Client |
| Colonne contact | Contact |
| Colonne commandes | Commandes |
| Colonne dépensé | Total dépensé |
| Colonne statut | Statut |
| Colonne dernière | Dernière commande |
| Aucune commande | Aucune commande |
| Bouton ouvrir | Ouvrir la fiche |
| Note invités | Les commandes invitées ne figurent pas ici. Voir Commandes. |
| Vide | Aucun client inscrit pour le moment. |
| Aucun résultat | Aucun client ne correspond à vos filtres. |
| Erreur | Impossible de charger les clients. |

## 7. Interactions

1. La recherche porte sur le prénom, le nom, l’e-mail et le téléphone ; debounce 300 ms.
2. Les filtres sont cumulatifs et reflétés dans l’URL.
3. Le tri par défaut est l’inscription la plus récente.
4. Le total dépensé ne compte que les commandes payées et non annulées.
5. « Dernière commande » affiche une date relative ; la valeur exacte est dans l’infobulle et la fiche.
6. Un clic sur la ligne ouvre A10b.
7. Les clients sans compte invité n’ont pas de fiche : le lien « Voir Commandes » filtre A07 sur les commandes invitées.
8. Aucune action de masse, aucun export.
9. Les données personnelles ne sont jamais incluses dans l’URL.

## 8. Accessibilité WCAG 2.1 AA

- Tableau natif avec en-têtes et `aria-sort`.
- Avatar décoratif (`aria-hidden`) ; les initiales ne remplacent pas le nom.
- Statut textuel en plus de la couleur.
- Les montants sont formatés et lisibles.
- Le compteur de résultats est annoncé en `aria-live="polite"`.
- Cibles ≥ 44 px ; focus visible ; contraste AA.
- Titre de page : « Clients — Bruny Shopping ».

## 9. Données API

**Endpoint cible absent :** `GET /api/v1/admin/customers?search=&status=&city=&from=&to=&page=`.

```json
{
  "items": [
    {
      "id": "…",
      "firstName": "Awa",
      "lastName": "N.",
      "email": "awa@example.com",
      "phone": "+2376…",
      "city": "Douala",
      "status": "ACTIVE",
      "ordersCount": 3,
      "totalSpent": 182000,
      "lastOrderAt": "2026-11-09T10:00:00Z",
      "createdAt": "2026-09-01T08:00:00Z"
    }
  ],
  "total": 284,
  "newThisMonth": 12
}
```

## 10. Écarts et dépendances

- Modèle `User` et `Address` présents, aucun endpoint client.
- Un utilisateur peut avoir plusieurs rôles : la liste filtre ceux qui possèdent `CUSTOMER` et exclut les comptes internes.
- Les commandes invitées n’ont pas de `userId` : aucune fiche client ne peut être créée rétroactivement.
- Le « total dépensé » doit exclure les remboursements et annulations.
- Aucun export, aucune segmentation, aucun tag : non modélisés.
- Les données personnelles nécessitent une politique de masquage et de journalisation des accès.

## 11. Référence

- `backend/prisma/schema.prisma`, `User`, `Address`, `Order`.
- A07, A10b.
