# A09 — Liste des livraisons

## 1. Objectif et contexte

Piloter les livraisons depuis la préparation jusqu’à la remise : voir les tournées, assigner ou réassigner un livreur, suivre les échecs et le COD attendu. A09 est l’écran de l’équipe ; le livreur utilise A09b.

- Route cible : `/admin/livraisons`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`.
- Une livraison correspond à un `Shipment` lié à une seule commande.
- Chaque ligne desktop devient une carte mobile (CA #2).

## 2. Rôles autorisés

| Rôle | Voir toutes | Assigner | Réassigner | Marquer livrée | Voir le COD |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Oui | Oui | Non | Oui |
| `STOCK_MANAGER` | Non | Non | Non | Non | Non |
| `LIVREUR` | Ses livraisons | Non | Non | Oui (A09b) | Oui (ses courses) |

Un livreur qui ouvre `/admin/livraisons` est redirigé vers A09b.

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Livraisons                   │
│ ┌────────────┬─────────────┐ │
│ │ 6 à assigner│ 4 en cours │ │
│ ├────────────┼─────────────┤ │
│ │ 12 livrées │ 2 échecs    │ │
│ └────────────┴─────────────┘ │
│ [Rechercher commande/client] │
│ [Filtres 2]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ BRN-2511-0842  En cours  │ │
│ │ Awa N. · Douala          │ │
│ │ Livreur : Ibrahim        │ │
│ │ COD 52 500 FCFA          │ │
│ │ [Ouvrir]                 │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ BRN-2511-0840  À assigner│ │
│ │ Guest · Yaoundé          │ │
│ │ Aucun livreur            │ │
│ │ [Assigner]               │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Livraisons                                          │
│ [6 à assigner] [4 en cours] [12 livrées] [2 échecs]│
│ [Rechercher…] [Statut ▾] [Livreur ▾] [Zone ▾]      │
├────────────────────────────────────────────────────┤
│ Commande       Client     Zone     Livreur  Statut  │
│ BRN-…-0842     Awa N.     Douala   Ibrahim  En cours│
│ BRN-…-0840     Guest      Yaoundé  —        À assigner│
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Livraisons                              [Actualiser]         │
│          │ ┌──────────┬──────────┬──────────┬──────────┐                │
│          │ │À assigner│En cours  │Livrées   │Échecs    │                │
│          │ │ 6        │ 4        │ 12       │ 2        │                │
│          │ └──────────┴──────────┴──────────┴──────────┘                │
│          │ [Rechercher…] [Statut] [Livreur] [Zone] [Période] [Reset]    │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Commande      Client    Zone     Livreur   COD      Statut   │
│          │ BRN-…-0842    Awa N.    Douala   Ibrahim   52 500   En cours │
│          │ BRN-…-0840    Guest     Yaoundé  —        24 000   À assigner│
│          │ BRN-…-0839    Samuel    Douala   Samuel    0        Livrée   │
│          ├──────────────────────────────────────────────────────────────┤
│          │ 1–20 sur 24                                   ‹ 1 2 ›        │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `StatCard` | À assigner, en cours, livrées, échecs |
| `DataTable` | Desktop |
| `CardList` | Mobile |
| `SearchField` | Commande, client, téléphone |
| `FilterBar` / `FilterDrawer` | Statut, livreur, zone, période |
| `StatusBadge` | `ShipmentStatus` |
| `Select` | Assignation de livreur |
| `Modal` / `BottomSheet` | Assignation |
| `ActionMenu` | Assigner, réassigner, ouvrir |
| `EmptyState` | Aucune livraison |
| `Skeleton` | Chargement |
| `Alert` | Échec d’assignation |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucune livraison planifiée. » + lien A07 pour les commandes à préparer |
| Chargement | Squelettes de KPI et de lignes |
| Erreur | « Impossible de charger les livraisons. » + « Réessayer » |
| Succès | Liste et KPI à jour |

Cas complémentaires :

- **Aucun livreur disponible** : « Aucun livreur actif. Ajoutez un livreur dans Utilisateurs. »
- **Réassignation** : confirmation « Changer le livreur de cette course ? »
- **Livraison échouée** : badge rouge, action « Réassigner ».
- **COD** : affiché uniquement si `paymentMethod = COD` ; sinon « Déjà payé ».

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Livraisons |
| KPI à assigner | À assigner |
| KPI en cours | En cours |
| KPI livrées | Livrées aujourd’hui |
| KPI échecs | Échecs |
| Recherche | Rechercher une commande, un client ou un téléphone |
| Filtre statut | Statut |
| Filtre livreur | Livreur |
| Filtre zone | Zone |
| Filtre période | Période |
| Colonne commande | Commande |
| Colonne client | Client |
| Colonne zone | Zone |
| Colonne livreur | Livreur |
| Colonne COD | À encaisser |
| Colonne statut | Statut |
| Non assigné | Non assigné |
| Bouton assigner | Assigner |
| Bouton réassigner | Réassigner |
| Dialogue titre | Assigner cette livraison |
| Dialogue livreur | Choisir un livreur |
| Dialogue confirmer | Confirmer l’assignation |
| Aucun livreur | Aucun livreur actif disponible. |
| Réassignation | Changer le livreur de cette course ? |
| COD | À encaisser |
| Déjà payé | Déjà payé |
| Vide | Aucune livraison planifiée. |
| Erreur | Impossible de charger les livraisons. |

## 7. Interactions

1. Les KPI respectent les filtres actifs.
2. Le tri par défaut place « À assigner », puis « En cours », puis les livrées.
3. « Assigner » ouvre une liste de livreurs actifs, avec leur nombre de courses en cours.
4. L’assignation passe le `Shipment` de `PENDING` à `ASSIGNED` et crée la tournée du livreur.
5. « Réassigner » est disponible pour `ASSIGNED`, `IN_TRANSIT` et `FAILED`.
6. Une livraison `DELIVERED` ou `RETURNED` n’est plus réassignable.
7. Un clic sur la ligne ouvre A09c.
8. Sur mobile, les actions principales sont « Ouvrir » et « Assigner » ; le reste est dans le menu.
9. La liste se rafraîchit au retour sur la page ; aucun temps réel.
10. Aucune action groupée en V1.

## 8. Accessibilité WCAG 2.1 AA

- Tableau avec `aria-sort`, badges textuels.
- KPI en liste avec valeurs et libellés.
- Dialogue d’assignation avec focus piégé et restitution.
- Les livreurs sont affichés avec leur charge (« Ibrahim · 3 courses ») pour éviter les erreurs.
- Le COD est libellé, jamais un simple chiffre.
- Cibles ≥ 44 px ; focus visible ; contraste AA.
- Titre de page : « Livraisons — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `GET /api/v1/admin/shipments?status=&driverId=&zoneId=&from=&to=&search=`
- `POST /api/v1/admin/shipments/:id/assign` avec `{ "driverId": "…" }`
- `GET /api/v1/admin/drivers` pour la liste des livreurs actifs.

```json
{
  "summary": { "pending": 6, "inTransit": 4, "deliveredToday": 12, "failed": 2 },
  "items": [
    {
      "id": "…",
      "orderReference": "BRN-2511-0842",
      "customerName": "Awa N.",
      "zone": { "id": "…", "name": "Douala" },
      "driver": { "id": "…", "name": "Ibrahim" },
      "status": "IN_TRANSIT",
      "codAmount": 52500,
      "paymentMethod": "COD",
      "updatedAt": "2026-11-11T12:00:00Z"
    }
  ],
  "total": 24
}
```

## 10. Écarts et dépendances

- Modèle `Shipment` présent, aucun endpoint.
- Aucun modèle de véhicule, de flotte ou de hub : ne pas afficher « Moto Fleet ».
- Aucun SLA : ne pas afficher « urgent 16 h ».
- Le COD vient de `Order.total` lorsque `paymentMethod = COD`.
- `codCollected` est un booléen, pas un montant partiel : l’UI ne propose pas de paiement partiel.
- Un livreur ne voit jamais la liste complète.
- La réassignation doit être auditée.

## 11. Référence

- Zone L, cartes livreur et commande.
- `backend/prisma/schema.prisma`, `Shipment`, `DeliveryZone`.
- A08, A09b, A09c.
