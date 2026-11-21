# A09b — Mes livraisons du jour (vue livreur)

## 1. Objectif et contexte

Donner au livreur une vue mobile-first de sa tournée, utilisable à moto, en plein soleil, avec une main, parfois hors connexion. Chaque course doit permettre d’appeler, d’ouvrir l’itinéraire, de marquer la livraison ou de signaler un échec en un geste.

- Route cible : `/admin/livraisons/mes-livraisons` (ou `/livreur`)
- Accès : `LIVREUR` uniquement ; un administrateur peut prévisualiser en lecture.
- Optimisations CA #3 : KPI sticky, cartes, cibles 48 px, offline.
- Aucun code applicatif dans DSG-06 : comportement spécifié, prototype non inclus pour cet écran.

## 2. Rôles autorisés

| Rôle | Accès | Actions |
| --- | --- | --- |
| `LIVREUR` | Ses courses uniquement | Appeler, itinéraire, livrée, échec |
| `SUPER_ADMIN` | Prévisualisation | Lecture seule |
| `ADMIN` | Prévisualisation | Lecture seule |
| `ORDER_MANAGER` | Non | — |
| `STOCK_MANAGER` | Non | — |

Un livreur ne peut jamais voir ni modifier la course d’un autre livreur.

## 3. Wireframes

### 360 px — écran principal

```text
┌──────────────────────────────┐
│ ☰  Ma tournée       🔔  [IK]│
│ Mercredi 11 novembre         │
│ ┌──────────────────────────┐ │
│ │ 4 courses restantes      │ │  ← sticky
│ │ 52 500 FCFA à encaisser  │ │
│ │ 3 / 7 livrées  ▓▓▓░░░    │ │
│ └──────────────────────────┘ │
│ ⚠ Hors connexion — 1 action  │
│   en attente de synchronisation│
│                              │
│ ● En cours                   │
│ ┌──────────────────────────┐ │
│ │ 1  BRN-2511-0842         │ │
│ │    Awa N.                │ │
│ │    Bonapriso, Douala     │ │
│ │    Mocassin Noir 43 · 1  │ │
│ │    À encaisser 52 500    │ │
│ │ [📞 Appeler] [🗺 Itinéraire]│
│ │ [✓ Marquer livrée]       │ │
│ │ [Signaler un échec]      │ │
│ └──────────────────────────┘ │
│                              │
│ ○ À venir                    │
│ ┌──────────────────────────┐ │
│ │ 2  BRN-2511-0841         │ │
│ │    Samuel K.             │ │
│ │    Akwa, Douala          │ │
│ │    Déjà payé             │ │
│ │ [Appeler] [Itinéraire]   │ │
│ └──────────────────────────┘ │
│                              │
│ [Tournée] [Historique] [Profil]│
└──────────────────────────────┘
```

### 360 px — feuille « Marquer livrée »

```text
┌──────────────────────────────┐
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
│ Marquer la course 1 livrée ? │
│ BRN-2511-0842 · Awa N.       │
│                              │
│ Montant à encaisser          │
│ 52 500 FCFA                  │
│ ☐ J’ai encaissé ce montant   │
│                              │
│ [     Confirmer la livraison ]│
│ [        Annuler            ]│
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Ma tournée · mercredi 11 novembre       🔔   [IK] │
│ ┌──────────────┬──────────────┬─────────────────┐ │
│ │ 4 restantes  │ 52 500 FCFA  │ 3 / 7 livrées   │ │
│ └──────────────┴──────────────┴─────────────────┘ │
│ ┌────────────────────────┬───────────────────────┐ │
│ │ 1 · BRN-2511-0842      │ 2 · BRN-2511-0841     │ │
│ │ Awa N. · Bonapriso     │ Samuel K. · Akwa      │ │
│ │ 52 500 à encaisser     │ Déjà payé             │ │
│ │ [Appeler] [Itinéraire] │ [Appeler] [Itinéraire]│ │
│ └────────────────────────┴───────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────────────────────────────────────────────────────────┐
│ Ma tournée · mercredi 11 novembre                   🔔  [IK]│
│ ┌──────────────┬──────────────┬───────────────────────────┐  │
│ │ 4 restantes  │ 52 500 FCFA  │ 3 / 7 livrées ▓▓▓░░░      │  │
│ └──────────────┴──────────────┴───────────────────────────┘  │
│ ┌────────────────────────────┬─────────────────────────────┐ │
│ │ Course 1 · En cours        │ Course 2 · À venir          │ │
│ │ BRN-2511-0842 · Awa N.     │ BRN-2511-0841 · Samuel K.   │ │
│ │ Bonapriso, Douala          │ Akwa, Douala                │ │
│ │ 52 500 FCFA à encaisser    │ Déjà payé                   │ │
│ │ [Appeler] [Itinéraire]     │ [Appeler] [Itinéraire]      │ │
│ │ [Marquer livrée] [Échec]   │                             │ │
│ └────────────────────────────┴─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DeliveryCardMobile` | Nouveau : course, adresse, COD, actions 48 px |
| `KpiCard` (sticky) | Bandeau de KPI collant en haut |
| `Button` | Appeler, itinéraire, livrée, échec |
| `BottomSheet` | Confirmation de livraison, motif d’échec |
| `StatusBadge` | En cours, à venir, livrée, échec |
| `OfflineBanner` | État hors connexion et file d’attente |
| `Toast` | Confirmation et synchronisation |
| `EmptyState` | Aucune course aujourd’hui |
| `Skeleton` | Chargement |
| `Tabs` | Tournée, Historique, Profil (barre basse) |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucune course aujourd’hui. » + « Voir l’historique » ; le KPI affiche 0 |
| Chargement | Squelettes de KPI et de deux cartes |
| Erreur | « Impossible de charger votre tournée. » + « Réessayer » ; les données en cache restent visibles si disponibles |
| Succès | Tournée triée, KPI à jour, badge de synchronisation |

Cas complémentaires :

- **Hors connexion** : bandeau persistant, actions mises en file, carte marquée « En attente ».
- **Synchronisation** : toast « 1 action synchronisée. » ; conflit → « Cette course a changé. Vérifiez auprès du dispatch. »
- **Échec de livraison** : motif obligatoire, commentaire optionnel, la course sort de la tournée active.
- **COD non coché** : impossible de confirmer une livraison COD sans encaissement.
- **Course déjà livrée par un autre appareil** : statut rafraîchi, action annulée avec message.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Ma tournée |
| Date | {jour} {date} |
| KPI restantes | {n} course(s) restante(s) |
| KPI COD | {montant} à encaisser |
| KPI progression | {livrées} / {total} livrées |
| Hors ligne | Hors connexion — {n} action(s) en attente de synchronisation |
| Synchronisé | Tout est synchronisé |
| Section en cours | En cours |
| Section à venir | À venir |
| Section terminées | Terminées |
| Bouton appeler | Appeler |
| Bouton itinéraire | Itinéraire |
| Bouton livrée | Marquer livrée |
| Bouton échec | Signaler un échec |
| Montant COD | À encaisser |
| Déjà payé | Déjà payé |
| Feuille titre | Marquer la course {n} livrée ? |
| Feuille COD | J’ai encaissé ce montant |
| Feuille confirmer | Confirmer la livraison |
| Feuille annuler | Annuler |
| Échec titre | Signaler un échec |
| Motif | Motif de l’échec |
| Motifs | Client absent, Client injoignable, Adresse introuvable, Client refuse la commande, Autre |
| Commentaire | Commentaire (optionnel) |
| Échec confirmer | Confirmer l’échec |
| Vide | Aucune course aujourd’hui. |
| Erreur | Impossible de charger votre tournée. |
| En attente | En attente de synchronisation |
| Conflit | Cette course a changé. Vérifiez auprès du dispatch. |
| Onglet tournée | Tournée |
| Onglet historique | Historique |
| Onglet profil | Profil |

## 7. Interactions

1. La tournée est triée par urgence opérationnelle : `IN_TRANSIT` d’abord, puis `ASSIGNED`, puis terminées.
2. Le bandeau KPI reste collé sous le header au scroll ; il ne dépasse pas 120 px.
3. Les actions sont pleine largeur ou en grille 2 colonnes, avec une hauteur minimale de **48 px**.
4. « Appeler » ouvre `tel:` avec le numéro du client.
5. « Itinéraire » ouvre l’application de cartes via `geo:` ou une URL Maps avec l’adresse ; aucun suivi GPS.
6. « Marquer livrée » ouvre une feuille :
   - si COD, la case « J’ai encaissé ce montant » est obligatoire ;
   - sinon, confirmation simple.
7. « Signaler un échec » ouvre une feuille avec motifs ; « Autre » exige un commentaire.
8. Chaque action est envoyée avec une clé d’idempotence pour éviter les doublons.
9. Hors ligne, l’action est stockée localement, la carte passe en « En attente », et la synchronisation reprend au retour du réseau.
10. En cas de conflit, le serveur fait foi ; l’action locale est marquée « Refusée » avec explication.
11. L’historique affiche les courses livrées et échouées des 7 derniers jours, en lecture seule.
12. Le profil permet de se déconnecter ; aucune modification de rôle.
13. Aucune photo, signature ou preuve de livraison en V1 (aucun champ backend).

## 8. Accessibilité WCAG 2.1 AA

- Cibles **48 × 48 px** minimum, espacement de 12 px entre actions.
- Texte ≥ 16 px pour les informations critiques, ≥ 18 px pour les montants.
- Contraste renforcé pour une lecture en extérieur ; aucune information par la couleur seule.
- Boutons avec libellés visibles ; icônes toujours accompagnées de texte.
- Feuilles avec focus piégé, titre annoncé, `Échap` pour fermer.
- Le bandeau hors ligne est en `role="status"` et reste lisible.
- L’ordre de lecture suit l’ordre de tournée.
- Les montants sont annoncés en toutes lettres par les lecteurs d’écran.
- Titre de page : « Ma tournée — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `GET /api/v1/admin/shipments/mine?date=today`
- `PATCH /api/v1/admin/shipments/:id/status` avec `{ status, reason?, note?, codCollected?, idempotencyKey }`
- `GET /api/v1/admin/shipments/mine/history?days=7`

```json
{
  "date": "2026-11-11",
  "summary": { "remaining": 4, "total": 7, "delivered": 3, "codExpected": 52500 },
  "items": [
    {
      "id": "…",
      "sequence": 1,
      "orderReference": "BRN-2511-0842",
      "customerName": "Awa N.",
      "phone": "+2376…",
      "address": "Bonapriso, Douala",
      "zone": "Douala",
      "items": [{ "name": "Mocassin Glacé", "color": "Noir", "size": "43", "quantity": 1 }],
      "paymentMethod": "COD",
      "codAmount": 52500,
      "status": "IN_TRANSIT",
      "updatedAt": "…"
    }
  ]
}
```

Transitions autorisées pour le livreur : `ASSIGNED → IN_TRANSIT`, `IN_TRANSIT → DELIVERED`, `IN_TRANSIT → FAILED`. Toute autre transition est refusée.

## 10. Écarts et dépendances

- Aucun endpoint livreur, aucune notion de tournée persistée.
- `Shipment` n’a ni séquence, ni créneau, ni preuve de livraison.
- Le statut `RETURNED` est géré par l’administration, pas par le livreur.
- Aucun service worker ni base locale n’existe : l’offline est une cible à implémenter.
- Les actions offline doivent être idempotentes et réconciliées ; pas de confiance aveugle au client.
- Aucun suivi GPS temps réel.
- Les liens `tel:` et cartes sont externes ; aucune dépendance cartographique.
- Le livreur ne voit que ses courses ; le filtrage doit être serveur, pas seulement UI.

## 11. Référence

- CA #3 du brief DSG-06.
- Zone L, cartes coursier et actions.
- `backend/prisma/schema.prisma`, `Shipment`, `ShipmentStatus`.
- A09, A09c, `RESPONSIVE-PATTERNS.md`.
