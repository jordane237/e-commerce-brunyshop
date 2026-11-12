# A07 — Liste des commandes

## 1. Objectif et contexte

Centraliser toutes les commandes, quel que soit leur canal, avec leur statut, leur paiement et leur avancement logistique. L’équipe doit pouvoir retrouver une commande en quelques secondes par référence, client ou téléphone, puis ouvrir A08.

- Route cible : `/admin/commandes`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER` ; `STOCK_MANAGER` en lecture.
- Aucune commande n’est créée ici.
- Chaque ligne desktop devient une carte mobile (CA #2).

## 2. Rôles autorisés

| Rôle | Voir | Confirmer | Annuler | Assigner un livreur | Modifier |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Lecture | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Commandes                    │
│ 42 commandes · 3 à valider   │
│ [Rechercher une commande]    │
│ [Filtres 2]      [Trier ▾]   │
│                              │
│ ┌──────────────────────────┐ │
│ │ BRN-2511-0843  À valider │ │
│ │ Awa N. · il y a 12 min   │ │
│ │ 58 000 FCFA · MTN MoMo   │ │
│ │ Yaoundé · ● Payée        │ │
│ │ [Ouvrir]                 │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ BRN-2511-0842  Confirmée │ │
│ │ Ibrahim K. · aujourd’hui │ │
│ │ 52 500 FCFA · Cash       │ │
│ │ Douala · ● En attente    │ │
│ │ [Ouvrir]                 │ │
│ └──────────────────────────┘ │
│        Charger plus          │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Commandes                    42 · 3 à valider       │
│ [Rechercher…] [Statut ▾] [Paiement ▾] [Date ▾]     │
├────────────────────────────────────────────────────┤
│ Référence       Client      Total    Statut        │
│ BRN-2511-0843   Awa N.      58 000   À valider     │
│ BRN-2511-0842   Ibrahim K.  52 500   Confirmée     │
│ BRN-2511-0841   Guest       24 000   Expédiée      │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Commandes                    42 · [Actualiser]                │
│          │ [Rechercher réf., client, téléphone…]                        │
│          │ [Statut] [Paiement] [Zone] [Période] [Reset]                 │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Référence     Date      Client     Total   Paiement Statut  │
│          │ BRN-2511-0843 11/11 14:20 Awa N.   58 000  MTN Payée À valider
│          │ BRN-2511-0842 11/11 09:05 Ibrahim  52 500  Cash     Confirmée
│          │ BRN-2511-0841 10/11 17:40 Guest    24 000  Cash     Expédiée
│          ├──────────────────────────────────────────────────────────────┤
│          │ 1–20 sur 42                                   ‹ 1 2 3 ›      │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DataTable` | Liste desktop, tri |
| `CardList` | Liste mobile |
| `SearchField` | Référence, nom, téléphone |
| `FilterBar` / `FilterDrawer` | Statut, paiement, zone, période |
| `StatusBadge` | Statut commande et paiement |
| `ActionMenu` | Confirmer, annuler, assigner |
| `ConfirmDialog` | Annulation |
| `EmptyState` | Aucune commande / aucun résultat |
| `Skeleton` | Chargement |
| `Pagination` | Desktop et mobile |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucune commande pour le moment. » avec lien vers la boutique si pertinent |
| Chargement | Squelettes de lignes, filtres actifs visibles |
| Erreur | « Impossible de charger les commandes. » + « Réessayer » |
| Succès | Liste, compteur et pagination à jour |

Cas complémentaires :

- **Aucun résultat** : « Aucune commande ne correspond à vos filtres. » + « Réinitialiser ».
- **Annulation** : motif obligatoire, dialogue avec conséquences (remboursement éventuel).
- **Commande payée** : l’annulation affiche « Un remboursement devra être traité séparément. »
- **Nouvelle commande** : le compteur se met à jour au retour sur la page, pas en temps réel.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Commandes |
| Compteur | {n} commandes · {n} à valider |
| Recherche | Rechercher une référence, un client ou un téléphone |
| Filtre statut | Statut |
| Filtre paiement | Paiement |
| Filtre zone | Zone de livraison |
| Filtre période | Période |
| Périodes | Aujourd’hui, 7 derniers jours, 30 derniers jours |
| Colonne référence | Référence |
| Colonne date | Date |
| Colonne client | Client |
| Colonne total | Total |
| Colonne paiement | Paiement |
| Colonne statut | Statut |
| Action ouvrir | Ouvrir |
| Action confirmer | Confirmer la commande |
| Action annuler | Annuler la commande |
| Action assigner | Assigner un livreur |
| Annulation titre | Annuler cette commande ? |
| Annulation texte | La commande sera annulée et le stock réservé libéré. |
| Annulation motif | Motif de l’annulation |
| Annulation confirmer | Annuler la commande |
| Vide | Aucune commande pour le moment. |
| Aucun résultat | Aucune commande ne correspond à vos filtres. |
| Erreur | Impossible de charger les commandes. |
| Réessayer | Réessayer |

## 7. Interactions

1. La recherche porte sur la référence, le nom du client (compte ou invité) et le téléphone ; debounce 300 ms.
2. Les filtres sont cumulatifs et reflétés dans l’URL.
3. Le tri par défaut est la date décroissante.
4. La période filtre sur `createdAt`, fuseau `Africa/Douala`.
5. Un clic sur une ligne ouvre A08 ; les actions rapides ne déclenchent pas l’ouverture.
6. « Confirmer » passe par A08 pour vérifier les articles et l’adresse ; aucune confirmation en un clic depuis la liste.
7. « Annuler » ouvre un dialogue avec motif obligatoire.
8. « Assigner » ouvre un sélecteur de livreur disponible ; si aucun livreur, message explicite.
9. Sur mobile, « Charger plus » ajoute 20 cartes.
10. Aucune action groupée en V1 : une commande est traitée individuellement.
11. Aucun export : endpoint absent.

## 8. Accessibilité WCAG 2.1 AA

- Tableau natif avec `caption`, en-têtes, `aria-sort`.
- Les statuts sont textuels ; la couleur est un complément.
- Chaque ligne est accessible au clavier ; le lien principal est la référence.
- Les filtres actifs sont des puces avec bouton de retrait.
- Le compteur de résultats est annoncé en `aria-live="polite"`.
- Dialogue d’annulation avec focus piégé, focus initial sur « Retour ».
- Cibles ≥ 44 px ; contraste AA sur les badges.
- Titre de page : « Commandes — Bruny Shopping ».

## 9. Données API

**Endpoint cible absent :** `GET /api/v1/admin/orders`.

Paramètres : `page`, `limit`, `search`, `status`, `paymentStatus`, `zoneId`, `from`, `to`, `sort`.

```json
{
  "items": [
    {
      "id": "…",
      "reference": "BRN-2511-0843",
      "createdAt": "2026-11-11T14:20:00Z",
      "customer": { "name": "Awa N.", "phone": "+2376…", "isGuest": false },
      "total": 58000,
      "paymentMethod": "MOBILE_MONEY",
      "paymentStatus": "SUCCEEDED",
      "status": "PENDING_CONFIRMATION",
      "zone": { "id": "…", "name": "Yaoundé" },
      "itemCount": 2
    }
  ],
  "total": 42,
  "toValidate": 3,
  "page": 1
}
```

Actions cibles :

- `PATCH /admin/orders/:reference/status` avec `{ "status": "CONFIRMED" }` ou `{ "status": "CANCELLED", "reason": "…" }`.
- `POST /admin/orders/:reference/assign` avec `{ "driverId": "…" }`.

**Aucun endpoint commande n’existe aujourd’hui** (`orders/README.md` : « No order endpoint is exposed yet. »).

## 10. Écarts et dépendances

- Modèle `Order` riche, mais aucun contrôleur.
- Les statuts couvrent 13 valeurs ; l’UI doit les traduire sans en inventer.
- « Expédition interurbaine » n’est pas un statut : c’est un libellé de zone.
- Les commandes invité n’ont pas de compte : le client est un snapshot.
- Le remboursement n’existe pas : ne pas afficher d’action « Rembourser ».
- L’assignation crée ou met à jour un `Shipment`.
- La liste ne montre jamais les commandes supprimées logiquement.

## 11. Référence

- Zone L, carte commande à valider.
- `backend/prisma/schema.prisma`, `Order`.
- `backend/src/modules/orders/README.md`.
- A08, A09, `MICROTEXTES.md`.
