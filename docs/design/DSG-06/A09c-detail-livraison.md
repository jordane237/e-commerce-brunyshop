# A09c — Détail d’une livraison

## 1. Objectif et contexte

Afficher tout ce qu’il faut pour exécuter ou superviser une course : commande, client, adresse, zone, articles, paiement, COD, livreur et historique. L’écran est partagé entre l’administration et le livreur assigné, avec des actions différentes.

- Route cible : `/admin/livraisons/:id`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`, et `LIVREUR` si la course lui est assignée.
- Une livraison est liée à une commande unique.
- Aucun suivi GPS, aucune preuve photo ou signature en V1.

## 2. Rôles autorisés

| Rôle | Voir | Démarrer | Marquer livrée | Signaler un échec | Réassigner | Voir le COD |
| --- | --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Non | Non | Non | Oui | Oui |
| `LIVREUR` assigné | Oui | Oui | Oui | Oui | Non | Oui |
| `LIVREUR` non assigné | Non | Non | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ← Livraisons      [⋯ Actions]│
│ BRN-2511-0842                │
│ ● En cours                   │
│ Livraison · Douala           │
│                              │
│ Client                       │
│ Awa N.                       │
│ +237 6 71 •• •• 89           │
│ [Appeler]   [Itinéraire]     │
│                              │
│ Adresse                      │
│ Bonapriso, rue des Palmiers  │
│ Douala                       │
│ [Voir sur la carte]          │
│                              │
│ Colis (1)                    │
│ Mocassin Glacé · Noir 43     │
│ 1 article                    │
│                              │
│ Paiement                     │
│ À encaisser      52 500 FCFA │
│                              │
│ Livreur                      │
│ Ibrahim K. · [Appeler]       │
│                              │
│ Historique                   │
│ ● Assignée       09:10       │
│ ● En cours       10:02       │
│                              │
│ [Marquer livrée]             │
│ [Signaler un échec]          │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ ← Livraisons    BRN-2511-0842    ● En cours  [⋯]  │
├──────────────────────────┬─────────────────────────┤
│ Client                   │ Adresse                 │
│ Awa N.                   │ Bonapriso, Douala       │
│ +237 6 71 •• •• 89       │ [Voir sur la carte]     │
│ [Appeler]                │                         │
├──────────────────────────┼─────────────────────────┤
│ Colis                    │ Paiement                │
│ Mocassin Noir 43 · 1     │ À encaisser 52 500      │
├──────────────────────────┴─────────────────────────┤
│ [Démarrer la course] [Marquer livrée] [Échec]      │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ ← Livraisons / BRN-2511-0842          [Actions ▾]           │
│          │ ● En cours · Douala · assignée à Ibrahim K.                 │
│          ├──────────────────────────────────┬───────────────────────────┤
│          │ Client                           │ Adresse                   │
│          │ Awa N.                           │ Bonapriso, rue des        │
│          │ +237 6 71 •• •• 89               │ Palmiers, Douala          │
│          │ [Appeler] [WhatsApp]             │ [Voir sur la carte]       │
│          │                                  │                           │
│          │ Colis (1)                        │ Paiement                  │
│          │ Mocassin Glacé · Noir 43         │ COD · 52 500 FCFA         │
│          │ 1 article                        │ À encaisser               │
│          │                                  │                           │
│          │ Historique                       │ Livreur                   │
│          │ ● En cours      10:02            │ Ibrahim K.                │
│          │ ● Assignée      09:10            │ [Réassigner]              │
│          └──────────────────────────────────┴───────────────────────────┘
│          │ [Démarrer] [Marquer livrée] [Signaler un échec]              │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `StatusBadge` | Statut de livraison |
| `AddressCard` | Adresse figée |
| `Timeline` | Historique de la course |
| `Button` | Appeler, itinéraire, démarrer, livrée, échec |
| `BottomSheet` / `Modal` | Confirmation, motif d’échec, réassignation |
| `Select` | Livreur, motif |
| `Checkbox` | COD encaissé |
| `Alert` | Conflit, course déjà clôturée |
| `Skeleton` | Chargement |
| `CopyButton` | Référence |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Livraison introuvable ou non autorisée : « Cette livraison n’est pas disponible. » + retour |
| Chargement | Squelettes de blocs, actions masquées |
| Erreur | « Impossible de charger la livraison. » + « Réessayer » |
| Succès | Détail complet, actions adaptées au statut et au rôle |

Cas complémentaires :

- **Course déjà livrée** : actions de clôture masquées, badge « Livrée le … ».
- **Échec** : motif et commentaire affichés dans la timeline.
- **Conflit** : « Cette course a été mise à jour ailleurs. Rechargez. »
- **Hors ligne (livreur)** : actions mises en file, bandeau de synchronisation.
- **Accès refusé** : page 403, pas de fuite d’adresse.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Livraison {référence} |
| Statut | Statut de la livraison |
| Client | Client |
| Téléphone | Téléphone |
| Bouton appeler | Appeler |
| Bouton WhatsApp | WhatsApp |
| Adresse | Adresse de livraison |
| Voir carte | Voir sur la carte |
| Colis | Colis |
| Article | {quantité} article(s) |
| Paiement | Paiement |
| COD | À encaisser |
| Déjà payé | Déjà payé |
| Livreur | Livreur |
| Non assigné | Non assigné |
| Bouton réassigner | Réassigner |
| Bouton démarrer | Démarrer la course |
| Bouton livrée | Marquer livrée |
| Bouton échec | Signaler un échec |
| Dialogue livrée | Confirmer la livraison ? |
| COD encaissé | J’ai encaissé ce montant |
| Dialogue échec | Signaler un échec |
| Motif | Motif de l’échec |
| Motifs | Client absent, Client injoignable, Adresse introuvable, Client refuse la commande, Autre |
| Commentaire | Commentaire (optionnel) |
| Historique | Historique |
| Introuvable | Cette livraison n’est pas disponible. |
| Erreur | Impossible de charger la livraison. |

## 7. Interactions

1. Les actions visibles dépendent du statut :

| Statut | Livreur assigné | Administration |
| --- | --- | --- |
| `PENDING` | — | Assigner |
| `ASSIGNED` | Démarrer | Réassigner |
| `IN_TRANSIT` | Livrée, Échec | Réassigner |
| `DELIVERED` | — | Consulter |
| `FAILED` | — | Réassigner |
| `RETURNED` | — | Consulter |

2. « Démarrer la course » passe `ASSIGNED → IN_TRANSIT`.
3. « Marquer livrée » ouvre une feuille ; si COD, la case d’encaissement est obligatoire.
4. « Signaler un échec » ouvre une feuille avec motif obligatoire.
5. La réassignation est réservée à l’administration et confirmée.
6. Une action réussie met à jour le statut et la timeline sans rechargement.
7. Hors ligne, l’action est mise en file avec idempotence ; le statut affiché devient « En attente de synchronisation ».
8. Les liens téléphone et carte sont externes.
9. Aucune preuve photo ou signature : ne pas afficher de zone vide promettant ces fonctions.

## 8. Accessibilité WCAG 2.1 AA

- Un `h1` avec la référence ; sections `h2`.
- Timeline en liste ordonnée, dates explicites.
- Actions ≥ 48 px pour le livreur, ≥ 44 px pour l’administration.
- Le statut COD est annoncé en texte, pas seulement en couleur.
- Dialogue avec focus piégé, focus initial sur l’action non destructive.
- Les erreurs de synchronisation sont annoncées en `role="alert"`.
- Titre de page : « Livraison {référence} — Bruny Shopping ».

## 9. Données API

**Endpoint cible absent :** `GET /api/v1/admin/shipments/:id`.

```json
{
  "id": "…",
  "status": "IN_TRANSIT",
  "orderReference": "BRN-2511-0842",
  "zone": { "id": "…", "name": "Douala", "estimatedDays": 1 },
  "customer": { "name": "Awa N.", "phone": "+2376…" },
  "address": { "city": "Douala", "district": "Bonapriso", "details": "…" },
  "items": [{ "name": "Mocassin Glacé", "color": "Noir", "size": "43", "quantity": 1 }],
  "payment": { "method": "COD", "status": "PENDING", "codAmount": 52500 },
  "driver": { "id": "…", "name": "Ibrahim K." },
  "timeline": [
    { "status": "ASSIGNED", "at": "2026-11-11T09:10:00Z", "by": "Dispatch" },
    { "status": "IN_TRANSIT", "at": "2026-11-11T10:02:00Z", "by": "Ibrahim K." }
  ]
}
```

Actions : `PATCH /admin/shipments/:id/status` et `POST /admin/shipments/:id/assign`, déjà décrits en A09 et A09b.

## 10. Écarts et dépendances

- Aucun endpoint livraison.
- Pas de preuve de livraison, de signature, de photo ni de géolocalisation.
- `codCollected` est un booléen ; aucun paiement partiel.
- Le statut `RETURNED` est administratif.
- L’adresse est un snapshot : ne pas éditer depuis cet écran.
- L’accès du livreur doit être filtré côté serveur sur `driverId`.
- Aucune donnée de véhicule, de hub ou de casier.

## 11. Référence

- `backend/prisma/schema.prisma`, `Shipment`, `DeliveryZone`.
- A08, A09, A09b.
