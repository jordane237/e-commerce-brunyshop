# A12 — Promotions et coupons

## 1. Objectif et contexte

Suivre les codes promotionnels, leur période, leur valeur et leur consommation. Après A12b, cette liste permet d’identifier les codes actifs, programmés, expirés ou épuisés, et de clôturer un code.

- Route cible : `/admin/promotions`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`.
- Un coupon n’a pas de champ « actif » : son statut est **calculé** à partir des dates, de `maxUses` et de `usedCount`.
- Aucune suppression : un coupon utilisé par une commande doit rester traçable.

## 2. Rôles autorisés

| Rôle | Voir | Créer | Modifier | Clôturer | Voir la consommation |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Non | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Promotions                   │
│ 6 codes · 3 actifs           │
│ [ + Nouveau coupon ]         │
│ [Rechercher un code]         │
│ [Filtres 1]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ BRUNY10        ● Actif   │ │
│ │ -10 % · min. 25 000      │ │
│ │ 42 / 100 utilisations    │ │
│ │ Jusqu’au 30 nov. 2026    │ │
│ │ [Modifier]         [⋯]   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ LIVRAISON500   Expiré    │ │
│ │ -500 FCFA · sans minimum │ │
│ │ 18 / 50 utilisations     │ │
│ │ Terminé le 31 oct. 2026  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Promotions                          [ + Nouveau ]  │
│ [Rechercher…] [Type ▾] [Statut ▾]                  │
├────────────────────────────────────────────────────┤
│ Code         Type     Valeur   Usages   Statut     │
│ BRUNY10      -10 %    25 000   42/100   Actif      │
│ LIVRAISON500 -500      —       18/50    Expiré     │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Promotions                             [ + Nouveau coupon ]  │
│          │ 6 codes · 3 actifs · 1 programmé · 2 expirés                 │
│          │ [Rechercher un code…] [Type] [Statut] [Période] [Reset]      │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Code          Type      Valeur   Minimum  Usages  Statut     │
│          │ BRUNY10       -10 %     10 %     25 000   42/100  Actif      │
│          │ FIDELE2000    -2 000    2 000    —        7/∞     Programmé  │
│          │ LIVRAISON500  -500      500      —        18/50   Expiré     │
│          ├──────────────────────────────────────────────────────────────┤
│          │ 1–20 sur 6                                      ‹ 1 ›        │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DataTable` | Desktop |
| `CardList` | Mobile |
| `SearchField` | Code |
| `FilterBar` / `FilterDrawer` | Type, statut, période |
| `StatusBadge` | Actif, programmé, expiré, épuisé, clôturé |
| `Button` | Nouveau, modifier, clôturer |
| `ActionMenu` | Modifier, copier le code, clôturer |
| `ConfirmDialog` | Clôture |
| `EmptyState` | Aucun coupon |
| `Skeleton` | Chargement |
| `Pagination` | Liste |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucun code promotionnel. » + CTA « Créer un coupon » |
| Chargement | Squelettes de lignes |
| Erreur | « Impossible de charger les promotions. » + « Réessayer » |
| Succès | Liste et statuts calculés à jour |

Cas complémentaires :

- **Aucun résultat** : « Aucun coupon ne correspond à vos filtres. »
- **Clôture** : dialogue « Ce code ne pourra plus être utilisé. Les commandes passées restent valides. »
- **Code épuisé** : badge gris, action « Modifier » permet d’augmenter `maxUses`.
- **Coupon programmé** : badge info, dates visibles.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Promotions |
| Compteur | {n} codes · {n} actifs |
| Recherche | Rechercher un code |
| Filtre type | Type |
| Filtre statut | Statut |
| Types | Pourcentage, Montant fixe |
| Statuts | Actif, Programmé, Expiré, Épuisé, Clôturé |
| Colonne code | Code |
| Colonne type | Type |
| Colonne valeur | Valeur |
| Colonne minimum | Minimum |
| Colonne usages | Utilisations |
| Colonne période | Période |
| Colonne statut | Statut |
| Sans minimum | Sans minimum |
| Illimité | Illimité |
| Jusqu’au | Jusqu’au {date} |
| Depuis | Depuis le {date} |
| Terminé le | Terminé le {date} |
| Bouton nouveau | Nouveau coupon |
| Bouton modifier | Modifier |
| Bouton clôturer | Clôturer |
| Copier | Copier le code |
| Dialogue clôture | Clôturer ce code ? |
| Texte clôture | Il ne pourra plus être utilisé. Les commandes passées restent valides. |
| Confirmer clôture | Clôturer |
| Vide | Aucun code promotionnel. |
| Aucun résultat | Aucun coupon ne correspond à vos filtres. |
| Erreur | Impossible de charger les promotions. |

## 7. Interactions

1. La recherche est insensible à la casse et porte sur le code exact ou partiel.
2. Les filtres sont cumulatifs et reflétés dans l’URL.
3. Le tri par défaut est la date de création décroissante.
4. Le statut est calculé dans cet ordre : clôturé (`endsAt` passé manuellement) > épuisé (`usedCount >= maxUses`) > programmé (`startsAt` futur) > expiré (`endsAt` passé) > actif.
5. « Copier le code » copie la valeur exacte et affiche un toast.
6. « Modifier » ouvre A12b.
7. « Clôturer » fixe `endsAt` à maintenant après confirmation.
8. Aucune suppression, aucune duplication.
9. Un coupon utilisé ne peut pas voir sa valeur ou son type modifiés : seuls `maxUses` et `endsAt` restent éditables (règle proposée, à confirmer backend).
10. Sur mobile, « Modifier » et le menu sont accessibles sans ouvrir la carte.

## 8. Accessibilité WCAG 2.1 AA

- Tableau avec `aria-sort` ; codes en police monospace mais lisibles.
- Statut toujours textuel.
- Les usages sont annoncés « 42 utilisations sur 100 ».
- Dialogue de clôture avec focus piégé.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « Promotions — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `GET /api/v1/admin/coupons?search=&type=&status=&page=`
- `PATCH /api/v1/admin/coupons/:id` (dont clôture via `endsAt`)
- `POST /api/v1/admin/coupons`

```json
{
  "items": [
    {
      "id": "…",
      "code": "BRUNY10",
      "type": "PERCENTAGE",
      "value": 10,
      "minAmount": 25000,
      "startsAt": "2026-11-01T00:00:00Z",
      "endsAt": "2026-11-30T23:59:59Z",
      "maxUses": 100,
      "usedCount": 42,
      "status": "ACTIVE"
    }
  ],
  "total": 6,
  "active": 3
}
```

## 10. Écarts et dépendances

- Modèle `Coupon` présent, aucun endpoint.
- Pas de champ `active` : ne pas afficher de toggle d’activation.
- Pas de portée produit/catégorie, pas de cumul, pas de parrainage : ne pas les promettre.
- `usedCount` est mis à jour par les commandes ; l’admin ne l’édite jamais.
- La clôture est une convention (`endsAt = now`), pas un statut stocké.
- Un coupon à pourcentage doit être borné à 100.
- Aucune suppression pour préserver l’historique `OrderCoupon`.

## 11. Référence

- CA promotions du brief.
- `backend/prisma/schema.prisma`, `Coupon`, `CouponType`, `OrderCoupon`.
- A12b, `MICROTEXTES.md`.
