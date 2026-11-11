# A13 — Avis clients

## 1. Objectif et contexte

Modérer les avis produits : lire le contenu complet, approuver ou rejeter, et retrouver un avis par produit ou client. Aucune réponse publique n’est possible dans le modèle actuel.

- Route cible : `/admin/avis`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`.
- Trois statuts : `PENDING`, `APPROVED`, `REJECTED`.
- Chaque ligne desktop devient une carte mobile.

## 2. Rôles autorisés

| Rôle | Voir | Approuver | Rejeter | Supprimer | Répondre |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Non | Non |
| `ADMIN` | Oui | Oui | Oui | Non | Non |
| `ORDER_MANAGER` | Oui | Oui | Oui | Non | Non |
| `STOCK_MANAGER` | Non | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Avis clients                 │
│ 18 avis · 5 en attente       │
│ [Rechercher un produit]      │
│ [Filtres 1]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ ★★★★★  Mocassin Glacé    │ │
│ │ Awa N. · il y a 2 jours  │ │
│ │ « Très confortable, la   │ │
│ │ taille est parfaite. »   │ │
│ │ ● En attente             │ │
│ │ [Lire] [Approuver] [⋯]   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ★★☆☆☆  Sandale Nomade   │ │
│ │ Samuel K. · 09/11        │ │
│ │ « Livraison trop lente… »│ │
│ │ ● Approuvé               │ │
│ │ [Lire]                   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Avis clients                    18 · 5 en attente  │
│ [Rechercher un produit…] [Statut ▾] [Note ▾]       │
├────────────────────────────────────────────────────┤
│ Produit          Client    Note  Statut   Date     │
│ Mocassin Glacé   Awa N.    ★★★★★ En attente 11/11 │
│ Sandale Nomade   Samuel K. ★★☆☆☆ Approuvé   09/11 │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Avis clients                      18 · 5 en attente         │
│          │ [Rechercher un produit ou un client…]                        │
│          │ [Statut] [Note] [Période] [Reset]                            │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Produit         Client     Note    Statut      Date          │
│          │ Mocassin Glacé  Awa N.     ★★★★★  En attente  11/11         │
│          │ Sandale Nomade  Samuel K.  ★★☆☆☆  Approuvé    09/11         │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Panneau latéral : avis complet + actions                     │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DataTable` | Desktop |
| `CardList` | Mobile |
| `SearchField` | Produit, client |
| `FilterBar` / `FilterDrawer` | Statut, note, période |
| `StatusBadge` | Statut d’avis |
| `RatingStars` | Note en étoiles + valeur textuelle |
| `Modal` / `SidePanel` | Avis complet et actions |
| `Button` | Approuver, rejeter |
| `ConfirmDialog` | Rejet |
| `EmptyState` | Aucun avis |
| `Skeleton` | Chargement |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucun avis pour le moment. » |
| Chargement | Squelettes de lignes |
| Erreur | « Impossible de charger les avis. » + « Réessayer » |
| Succès | Liste et compteurs à jour, toast après modération |

Cas complémentaires :

- **Aucun résultat** : « Aucun avis ne correspond à vos filtres. »
- **Approbation** : toast « Avis approuvé. », badge mis à jour.
- **Rejet** : confirmation « Cet avis ne sera plus visible sur la boutique. »
- **Avis déjà modéré** : actions disponibles pour changer d’état, avec confirmation.
- **Commentaire vide** : afficher uniquement la note, sans guillemets vides.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Avis clients |
| Compteur | {n} avis · {n} en attente |
| Recherche | Rechercher un produit ou un client |
| Filtre statut | Statut |
| Filtre note | Note |
| Filtre période | Période |
| Statuts | En attente, Approuvé, Rejeté |
| Colonne produit | Produit |
| Colonne client | Client |
| Colonne note | Note |
| Colonne statut | Statut |
| Colonne date | Date |
| Bouton lire | Lire l’avis |
| Bouton approuver | Approuver |
| Bouton rejeter | Rejeter |
| Titre détail | Avis de {client} |
| Produit | Produit |
| Note | Note |
| Commentaire | Commentaire |
| Sans commentaire | Aucun commentaire. |
| Dialogue rejet | Rejeter cet avis ? |
| Texte rejet | Il ne sera plus visible sur la boutique. |
| Confirmer rejet | Rejeter |
| Succès approbation | Avis approuvé. |
| Succès rejet | Avis rejeté. |
| Vide | Aucun avis pour le moment. |
| Aucun résultat | Aucun avis ne correspond à vos filtres. |
| Erreur | Impossible de charger les avis. |

## 7. Interactions

1. La recherche porte sur le nom du produit et le nom du client.
2. Les filtres statut et note sont cumulatifs ; la note accepte 1 à 5.
3. Le tri par défaut est la date décroissante.
4. Un clic sur une ligne ouvre l’avis complet dans un panneau latéral (desktop) ou une modale (mobile).
5. « Approuver » est direct ; « Rejeter » demande confirmation.
6. Un avis rejeté peut être approuvé ultérieurement, et inversement.
7. Aucune réponse publique, aucune suppression, aucune modification du texte.
8. Sur mobile, « Approuver » est visible directement sur la carte ; « Rejeter » est dans le menu.
9. Le compteur « en attente » se met à jour après chaque modération.

## 8. Accessibilité WCAG 2.1 AA

- Note affichée en étoiles **et** en texte (« 5 sur 5 »).
- Tableau avec `aria-sort`, statuts textuels.
- Panneau latéral avec `role="dialog"`, focus piégé et restitution.
- Le commentaire complet est lisible sans troncature dans le panneau.
- Les actions de modération sont accessibles au clavier.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « Avis clients — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `GET /api/v1/admin/reviews?search=&status=&rating=&from=&to=&page=`
- `PATCH /api/v1/admin/reviews/:id` avec `{ status: "APPROVED" | "REJECTED" }`

```json
{
  "items": [
    {
      "id": "…",
      "product": { "id": "…", "name": "Mocassin Glacé" },
      "customer": { "id": "…", "name": "Awa N." },
      "rating": 5,
      "comment": "Très confortable, la taille est parfaite.",
      "status": "PENDING",
      "createdAt": "2026-11-09T10:00:00Z"
    }
  ],
  "total": 18,
  "pending": 5
}
```

## 10. Écarts et dépendances

- Modèle `Review` présent, aucun endpoint.
- Pas de réponse marchand, pas de signalement, pas de pièce jointe, pas de suppression.
- La note est un entier ; l’UI doit tolérer une valeur hors 1–5 et l’afficher comme anomalie.
- Un avis est lié à un produit et à un utilisateur ; pas d’avis invité.
- La visibilité boutique dépend du statut `APPROVED`.
- Aucune action groupée en V1.

## 11. Référence

- `backend/prisma/schema.prisma`, `Review`, `ReviewStatus`.
- A10b, `MICROTEXTES.md`.
