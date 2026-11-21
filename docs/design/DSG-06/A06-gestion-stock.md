# A06 — Gestion du stock

## 1. Objectif et contexte

Suivre le stock réel et disponible par variante, identifier les ruptures et seuils, ajuster les quantités avec traçabilité, et consulter l’historique des mouvements. A06 est le point d’entrée des alertes du dashboard.

- Route cible : `/admin/stock`
- Accès : `SUPER_ADMIN`, `ADMIN`, `STOCK_MANAGER` ; `ORDER_MANAGER` en lecture.
- Le stock est **par variante**, pas par produit. `disponible = stock - reservedStock`.
- Tout ajustement manuel est audité et conserve `before` / `after`.

## 2. Rôles autorisés

| Rôle | Voir | Ajuster | Modifier le seuil | Voir les mouvements |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Non | Non | Oui |
| `LIVREUR` | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Stock                        │
│ ┌────────────┬─────────────┐ │
│ │ 3 ruptures │ 7 stock faible│
│ ├────────────┼─────────────┤ │
│ │ 148 unités │ 12 réservées │
│ └────────────┴─────────────┘ │
│ [Rechercher un produit/SKU]  │
│ [Filtres 1]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ Mocassin Glacé · Noir 42 │ │
│ │ BARRAGEF-MOCASSIN-42-NOIR│ │
│ │ Disponible 1  ● Faible   │ │
│ │ Stock 3 · Réservé 2      │ │
│ │ [Ajuster]      [Historique]│
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Sandale Nomade · Beige 38│ │
│ │ Disponible 0  ● Rupture  │ │
│ │ [Réapprovisionner]       │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Stock                                              │
│ [3 ruptures] [7 seuils] [148 unités] [12 réservées]│
│ [Rechercher…] [Statut ▾] [Catégorie ▾] [Marque ▾] │
├────────────────────────────────────────────────────┤
│ Produit / variante        SKU          Dispo  Statut│
│ Mocassin · Noir 42        …-42-NOIR    1     Faible│
│ Sandale · Beige 38        …-38-BEIGE   0     Rupture│
│ Bottine · Cognac 41       …-41-COGNAC  12    OK    │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Stock                                    [Exporter] [Ajuster]│
│          │ ┌────────┬────────┬────────┬────────┐                        │
│          │ │Ruptures│Faibles │Unités  │Réservé │                        │
│          │ │ 3      │ 7      │ 148    │ 12     │                        │
│          │ └────────┴────────┴────────┴────────┘                        │
│          │ [Rechercher…] [Statut] [Catégorie] [Marque] [Seuil] [Reset]  │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Produit / variante       SKU             Stock Réservé Dispo  │
│          │ Mocassin · Noir 42       …-42-NOIR       3     2       1      │
│          │ Sandale · Beige 38       …-38-BEIGE      0     0       0      │
│          │                                        [Ajuster] [Historique]│
│          ├──────────────────────────────────────────────────────────────┤
│          │ Panneau latéral : historique des mouvements de la variante   │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `StatCard` | Ruptures, seuils, unités, réservé |
| `DataTable` | Liste desktop par variante |
| `CardList` | Cartes mobile |
| `SearchField` | Recherche produit/SKU |
| `FilterBar` / `FilterDrawer` | Statut de stock, catégorie, marque |
| `StatusBadge` | OK, Faible, Rupture |
| `Modal` / `BottomSheet` | Ajustement de stock |
| `Timeline` | Historique des mouvements |
| `Input` | Delta, seuil |
| `Select` | Motif d’ajustement |
| `Alert` | Stock négatif refusé, conflit de version |
| `Toast` | Succès |
| `EmptyState` | Aucun résultat |
| `Skeleton` | Chargement |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Aucune variante : « Aucune variante à suivre. Créez un produit pour commencer. » CTA A05 |
| Chargement | Squelettes de KPI et de lignes ; filtres visibles |
| Erreur | « Impossible de charger le stock. » + « Réessayer » ; historique en erreur séparé |
| Succès | Liste, KPI et horodatage à jour |

Cas complémentaires :

- **Ajustement réussi** : toast « Stock mis à jour : 3 → 7. », ligne et KPI recalculés.
- **Stock négatif** : bloqué côté UI (« Le stock ne peut pas être négatif. ») et côté API.
- **Conflit de version** : « Le stock a changé entre-temps. Rechargez la ligne avant d’ajuster. »
- **Rupture** : badge rouge, action « Réapprovisionner » mise en avant.
- **Réservé supérieur au stock** : cas incohérent, affiché en erreur et signalé, jamais masqué.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Stock |
| KPI ruptures | Ruptures |
| KPI faibles | Stock faible |
| KPI unités | Unités en stock |
| KPI réservé | Unités réservées |
| Recherche | Rechercher un produit ou un SKU |
| Filtre statut | État du stock |
| Options | En stock, Stock faible, Rupture |
| Colonne produit | Produit / variante |
| Colonne SKU | SKU |
| Colonne stock | Stock |
| Colonne réservé | Réservé |
| Colonne disponible | Disponible |
| Badge OK | En stock |
| Badge faible | Stock faible |
| Badge rupture | Rupture |
| Bouton ajuster | Ajuster |
| Bouton historique | Historique |
| Bouton réappro | Réapprovisionner |
| Titre ajustement | Ajuster le stock |
| Variante | {produit} · {couleur} {pointure} |
| Stock actuel | Stock actuel : {n} |
| Type d’ajustement | Type d’ajustement |
| Options type | Ajouter du stock, Retirer du stock, Corriger le stock |
| Quantité | Quantité |
| Motif | Motif |
| Motifs | Réapprovisionnement, Retour client, Inventaire, Casse ou perte, Autre |
| Note | Note interne (optionnelle) |
| Aperçu | Nouveau stock : {n} |
| Confirmer | Confirmer l’ajustement |
| Erreur négatif | Le stock ne peut pas être négatif. |
| Erreur motif | Sélectionnez un motif. |
| Succès | Stock mis à jour : {avant} → {après}. |
| Conflit | Le stock a changé entre-temps. Rechargez la ligne. |
| Historique vide | Aucun mouvement pour cette variante. |
| Historique titre | Mouvements récents |

## 7. Interactions

1. Les KPI se recalculent selon les filtres actifs, pas seulement sur la page.
2. Le tri par défaut place les ruptures puis les stocks faibles en tête.
3. « Ajuster » ouvre une modale (desktop) ou une feuille (mobile) avec le stock actuel figé.
4. Trois modes : ajouter (`+`), retirer (`−`), corriger (valeur cible). Le mode « corriger » affiche clairement l’écart.
5. Le motif est obligatoire ; « Autre » exige une note.
6. L’aperçu « Nouveau stock » se met à jour en direct et bloque si le résultat est négatif.
7. La confirmation envoie un delta signé + motif + note ; le backend renvoie `before`/`after`.
8. « Historique » ouvre un panneau avec les 20 derniers mouvements, pagination « Voir plus ».
9. Chaque mouvement affiche date, auteur, motif, delta, avant → après et référence de commande si applicable.
10. Le seuil d’alerte est éditable par variante via le menu de ligne ; il ne modifie pas le stock.
11. Aucune action groupée de stock en V1 : trop risquée sans confirmation par variante.
12. L’export est retiré de la V1 (aucun endpoint).

## 8. Accessibilité WCAG 2.1 AA

- KPI en liste avec intitulé et valeur, variation en texte.
- Tableau avec `aria-sort` ; badge de statut toujours accompagné du libellé.
- La modale d’ajustement piège le focus, `Échap` ferme sans appliquer, focus initial sur le premier champ.
- Le calcul « Nouveau stock » est annoncé en `aria-live="polite"`.
- Les erreurs sont liées au champ et annoncées.
- Le panneau d’historique est une région nommée ; la timeline est une liste ordonnée.
- Cibles ≥ 44 px ; focus visible ; contrastes AA, y compris badges.
- Titre de page : « Stock — Bruny Shopping ».

## 9. Données API

**Tous les endpoints sont à créer.**

`GET /api/v1/admin/stock?search=&status=&categoryId=&brandId=&page=`

```json
{
  "summary": { "out": 3, "low": 7, "units": 148, "reserved": 12 },
  "items": [
    {
      "variantId": "…",
      "productId": "…",
      "product": "Mocassin Glacé",
      "color": "Noir",
      "size": "42",
      "sku": "BARRAGEF-MOCASSIN-42-NOIR",
      "stock": 3,
      "reservedStock": 2,
      "available": 1,
      "lowStockThreshold": 5,
      "version": 4
    }
  ],
  "total": 64
}
```

`POST /api/v1/admin/stock/adjust`

```json
{
  "variantId": "…",
  "mode": "add",
  "quantity": 4,
  "reason": "RESTOCK",
  "note": "Livraison fournisseur",
  "expectedVersion": 4
}
```

Réponse : `{ "before": 3, "after": 7, "movementId": "…" }`.

`GET /api/v1/admin/stock/movements?variantId=&page=`

```json
{
  "items": [
    {
      "id": "…",
      "delta": 4,
      "reason": "RESTOCK",
      "before": 3,
      "after": 7,
      "user": { "firstName": "Awa", "lastName": "N." },
      "orderReference": null,
      "createdAt": "2026-11-11T10:00:00Z"
    }
  ]
}
```

`PATCH /api/v1/admin/stock/:variantId/threshold` avec `{ "lowStockThreshold": 5, "expectedVersion": 4 }`.

## 10. Écarts et dépendances

- Modèles `ProductVariant` et `StockMovement` présents, aucun endpoint.
- Les motifs backend (`StockMovementReason`) sont plus nombreux que les motifs UI ; l’UI se limite aux ajustements manuels autorisés : `RESTOCK`, `RETURN`, `ADJUSTMENT`.
- `RESERVATION`, `RELEASE`, `PURCHASE`, `CANCELLATION` sont générés par les flux métier, jamais à la main.
- `reservedStock` n’est jamais éditable.
- La concurrence optimiste s’appuie sur `version` ; le backend doit renvoyer `409` en cas de conflit.
- Aucun export, aucun seuil global par catégorie en V1.
- Le stock négatif est interdit ; la correction à zéro reste possible avec motif.

## 11. Référence

- Zone L : alerte stock et action « Réapprovisionner ».
- `backend/prisma/schema.prisma`, `ProductVariant`, `StockMovement`.
- A03, A05b, `MICROTEXTES.md`.
