# A08 — Détail d’une commande

## 1. Objectif et contexte

Permettre de traiter une commande de bout en bout : vérifier le client, l’adresse, les articles, le paiement et la livraison ; confirmer, annuler, assigner un livreur et suivre les changements. C’est l’écran de décision opérationnelle.

- Route cible : `/admin/commandes/:reference`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER` ; `STOCK_MANAGER` en lecture ; `LIVREUR` uniquement si la livraison lui est assignée (vue limitée).
- Aucune modification des articles après création : les prix et noms sont figés.
- L’historique de statut fait foi ; aucun statut ne peut être sauté sans règle explicite.

## 2. Rôles autorisés

| Rôle | Voir | Confirmer | Annuler | Assigner | Note interne | Voir l’adresse complète |
| --- | --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Oui | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Lecture | Non | Non | Non | Non | Oui |
| `LIVREUR` | Sa livraison | Non | Non | Non | Non | Oui |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ← Commandes      [⋯ Actions] │
│ BRN-2511-0843                │
│ ● À valider · 11/11 à 14:20  │
│ 58 000 FCFA                  │
│                              │
│ Client                       │
│ Awa N. · +237 6 71 •• •• 89  │
│ [Appeler]  [WhatsApp]        │
│                              │
│ Livraison                    │
│ Yaoundé — Quartier Bastos    │
│ Estimation 2 jours           │
│ [Voir sur la carte]          │
│                              │
│ Articles (2)                 │
│ Mocassin Glacé · Noir 43     │
│ 1 × 52 000 FCFA              │
│ Sandale Nomade · Beige 38    │
│ 1 × 6 000 FCFA               │
│                              │
│ Paiement                     │
│ MTN MoMo · Payée             │
│ Sous-total      58 000       │
│ Livraison        0           │
│ Total           58 000       │
│                              │
│ [Confirmer la commande]      │
│ [Annuler la commande]        │
│                              │
│ Historique                   │
│ ● Commande créée  14:20      │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ ← Commandes          BRN-2511-0843   [Actions ▾]  │
│ ● À valider · 58 000 FCFA · MTN MoMo payé          │
├──────────────────────────┬─────────────────────────┤
│ Articles                 │ Client                  │
│ Mocassin Noir 43  52 000 │ Awa N.                  │
│ Sandale Beige 38   6 000 │ +237 6 71 •• •• 89      │
│                          │ Yaoundé, Bastos          │
│ Total           58 000   │                         │
├──────────────────────────┴─────────────────────────┤
│ [Confirmer] [Assigner un livreur] [Annuler]        │
│ Historique                                          │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ ← Commandes / BRN-2511-0843          [Actions ▾]            │
│          │ ● À valider · créée le 11/11 à 14:20 · 58 000 FCFA          │
│          ├──────────────────────────────────┬───────────────────────────┤
│          │ Articles (2)                     │ Client                    │
│          │ Mocassin Glacé · Noir 43         │ Awa N.                    │
│          │ 1 × 52 000            52 000     │ +237 6 71 •• •• 89        │
│          │ Sandale Nomade · Beige 38        │ awa@example.com           │
│          │ 1 × 6 000              6 000     │ 3 commandes · 182 000     │
│          │ ─────────────────────────────    │                           │
│          │ Sous-total            58 000     │ Livraison                 │
│          │ Livraison                  0     │ Yaoundé — Bastos          │
│          │ Total                 58 000     │ 2 jours · 0 FCFA          │
│          │                                  │ [Voir sur la carte]       │
│          │ Paiement                         │                           │
│          │ MTN MoMo · Payée · 11/11 14:21   │ Livreur                   │
│          │                                  │ Non assigné               │
│          │ Historique                       │ [Assigner]                │
│          │ ● Créée        14:20             │                           │
│          │ ● Paiement OK  14:21             │ Note interne              │
│          │                                  │ [____________________]    │
└──────────┴──────────────────────────────────┴───────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `StatusBadge` | Statut commande et paiement |
| `Timeline` | Historique des changements |
| `AddressCard` | Adresse de livraison figée |
| `Button` | Confirmer, annuler, assigner, appeler |
| `ActionMenu` | Actions secondaires |
| `Modal` / `BottomSheet` | Annulation, assignation |
| `Select` | Livreur, motif d’annulation |
| `Textarea` | Note interne |
| `ConfirmDialog` | Actions irréversibles |
| `Alert` | Paiement échoué, stock insuffisant, commande annulée |
| `Skeleton` | Chargement |
| `CopyButton` | Référence |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Commande introuvable : « Cette commande n’existe pas ou a été supprimée. » + retour A07 |
| Chargement | Squelettes de blocs ; actions désactivées |
| Erreur | « Impossible de charger la commande. » + « Réessayer » ; erreur d’action en toast |
| Succès | Détail complet, statut à jour, timeline rafraîchie |

Cas complémentaires :

- **Transition refusée** : « Cette commande ne peut pas passer de « Expédiée » à « À valider ». Rechargez la page. »
- **Annulation payée** : avertissement « Le remboursement doit être traité séparément. »
- **Assignation sans livreur disponible** : « Aucun livreur disponibles sur cette zone. »
- **Conflit** : la commande a changé ; bouton « Recharger ».
- **Commande invitée** : afficher « Commande sans compte » et le téléphone comme seul contact.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Commande {référence} |
| Statut | Statut de la commande |
| Client | Client |
| Client invité | Commande sans compte |
| Téléphone masqué | Téléphone |
| Bouton appeler | Appeler |
| Bouton WhatsApp | WhatsApp |
| Livraison | Livraison |
| Adresse | Adresse de livraison |
| Estimation | Estimation |
| Voir carte | Voir sur la carte |
| Articles | Articles |
| Quantité | Quantité |
| Sous-total | Sous-total |
| Remise | Remise |
| Livraison frais | Livraison |
| Total | Total |
| Paiement | Paiement |
| Paiement en attente | En attente de paiement |
| Paiement échoué | Paiement échoué |
| Remboursement | Remboursement à traiter séparément |
| Livreur | Livreur |
| Non assigné | Non assigné |
| Bouton assigner | Assigner un livreur |
| Bouton changer | Changer de livreur |
| Confirmer | Confirmer la commande |
| Confirmation titre | Confirmer cette commande ? |
| Confirmation texte | Le stock sera réservé et la préparation pourra commencer. |
| Annuler | Annuler la commande |
| Annulation titre | Annuler cette commande ? |
| Annulation texte | Le stock réservé sera libéré. Cette action est définitive. |
| Motif | Motif de l’annulation |
| Motifs | Client injoignable, Erreur de commande, Rupture de stock, Demande du client, Autre |
| Note | Note interne |
| Note aide | Visible uniquement par l’équipe. |
| Historique | Historique |
| Vide | Cette commande n’existe pas ou a été supprimée. |
| Erreur | Impossible de charger la commande. |

## 7. Interactions

### Consultation

1. La référence est copiable.
2. Le téléphone est masqué par défaut ; un bouton « Afficher » le révèle si le rôle l’autorise.
3. « Appeler » ouvre `tel:` ; « WhatsApp » ouvre `https://wa.me/…` avec un message prérempli neutre.
4. « Voir sur la carte » ouvre un lien externe, sans intégration cartographique.
5. La timeline est ordonnée du plus récent au plus ancien, avec auteur et horodatage.
6. Les notes internes sont ajoutées en bas, avec `Ctrl`/`Cmd` + `Entrée`.

### Transitions

| Statut actuel | Actions autorisées | Statut suivant |
| --- | --- | --- |
| `PENDING_CONFIRMATION` | Confirmer, annuler | `CONFIRMED` ou `CANCELLED` |
| `AWAITING_PAYMENT` | Annuler | `CANCELLED` |
| `CONFIRMED` | Préparer, annuler | `PREPARING` ou `CANCELLED` |
| `PAID` | Préparer, annuler | `PREPARING` ou `CANCELLED` |
| `PREPARING` | Expédier (si livraison assignée) | `SHIPPED` |
| `SHIPPED` | Consulter la livraison | A09c |
| `DELIVERED` | Consulter | — |
| `DELIVERY_FAILED` | Réassigner | `SHIPPED` après nouvelle tentative |
| `CANCELLED` | Consulter | — |
| `RETURN_REQUESTED` | Traiter le retour (hors V1) | — |

7. « Confirmer » vérifie que le stock est disponible ; sinon message et lien A06.
8. « Annuler » exige un motif, demande confirmation et libère les réservations.
9. « Expédier » est désactivé tant qu’aucun livreur n’est assigné.
10. L’assignation ouvre la liste des livreurs de la zone ; elle crée un `Shipment` si nécessaire.
11. Toute action réussie affiche un toast et met à jour la timeline sans recharger la page.
12. Aucun bouton « Rembourser » : le remboursement n’est pas implémenté.

## 8. Accessibilité WCAG 2.1 AA

- Un `h1` avec la référence, sections en `h2`.
- La timeline est une liste ordonnée avec dates lisibles.
- Les changements de statut sont annoncés en `aria-live="polite"`.
- Le dialogue d’annulation piège le focus et le restitue.
- Le motif est obligatoire et lié à son erreur.
- Les montants utilisent un format lisible par les lecteurs d’écran (« 58 000 francs CFA »).
- Les liens téléphone et carte ont des libellés explicites.
- Cibles ≥ 44 px ; focus visible ; contrastes AA.
- Titre de page : « Commande {référence} — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `GET /api/v1/admin/orders/:reference`
- `PATCH /api/v1/admin/orders/:reference/status`
- `POST /api/v1/admin/orders/:reference/assign`
- `POST /api/v1/admin/orders/:reference/notes`

```json
{
  "reference": "BRN-2511-0843",
  "status": "PENDING_CONFIRMATION",
  "createdAt": "2026-11-11T14:20:00Z",
  "customer": { "id": null, "name": "Awa N.", "phone": "+237671…", "email": "…" },
  "items": [
    {
      "name": "Mocassin Glacé",
      "color": "Noir",
      "size": "43",
      "quantity": 1,
      "unitPrice": 52000,
      "lineTotal": 52000
    }
  ],
  "subtotal": 58000,
  "discount": 0,
  "shippingFee": 0,
  "total": 58000,
  "payment": { "method": "MOBILE_MONEY", "status": "SUCCEEDED", "paidAt": "…" },
  "address": { "city": "Yaoundé", "district": "Bastos", "details": "…" },
  "zone": { "id": "…", "name": "Yaoundé", "estimatedDays": 2 },
  "shipment": null,
  "timeline": [
    { "status": "PENDING_CONFIRMATION", "at": "2026-11-11T14:20:00Z", "by": "Système" }
  ]
}
```

Statuts de commande : 13 valeurs de `PENDING_CONFIRMATION` à `EXCHANGED`. Le backend doit refuser toute transition non listée et renvoyer `409`.

## 10. Écarts et dépendances

- Aucun endpoint commande n’existe.
- Aucun endpoint de note interne, d’assignation ou d’historique.
- Le remboursement et les retours ne sont pas implémentés.
- Le modèle `Order` ne stocke pas d’historique de statut : une table d’événements est nécessaire pour la timeline.
- L’adresse est un `addressSnapshot` JSON : l’UI doit tolérer les champs absents.
- Le numéro de téléphone doit être masqué selon la politique backend ; ne pas exposer en clair par défaut.
- Aucune impression de facture ou de bordereau.

## 11. Référence

- Zone L, carte commande à valider.
- `backend/prisma/schema.prisma`, `Order`, `OrderItem`, `Shipment`.
- A07, A09, A09c, `MICROTEXTES.md`.
