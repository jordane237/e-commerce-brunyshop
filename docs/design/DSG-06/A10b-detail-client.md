# A10b — Fiche client

## 1. Objectif et contexte

Donner une vision complète d’un client : identité, statut, adresses, commandes, avis et valeur. Permettre au service client de suspendre ou réactiver un compte avec confirmation, sans supprimer l’historique.

- Route cible : `/admin/clients/:id`
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER` (lecture et suspension selon rôle).
- Aucune modification des données d’identité par l’admin en V1.
- Aucune suppression physique : les commandes doivent survivre.

## 2. Rôles autorisés

| Rôle | Voir | Modifier le statut | Voir les adresses | Voir les commandes | Voir les avis |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Non | Oui | Oui | Oui |
| `STOCK_MANAGER` | Non | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ← Clients         [⋯ Actions]│
│ (AN) Awa N.       ● Actif    │
│ awa@example.com              │
│ +237 6 71 •• •• 89           │
│ Cliente depuis septembre 2026│
│                              │
│ 3 commandes · 182 000 FCFA   │
│                              │
│ Adresses (2)                 │
│ Maison · Bonapriso, Douala   │
│ Bureau · Akwa, Douala        │
│                              │
│ Commandes récentes           │
│ BRN-2511-0843 · 58 000       │
│ ● À valider                  │
│ BRN-2510-0712 · 74 000       │
│ ● Livrée                     │
│ [Voir toutes les commandes]  │
│                              │
│ Avis (1)                     │
│ ★★★★★ Mocassin Glacé         │
│ [Voir l’avis]                │
│                              │
│ [Suspendre le compte]        │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ ← Clients        Awa N.        ● Actif   [Actions]│
│ awa@example.com · +237 6 71 •• •• 89               │
├──────────────────────────┬─────────────────────────┤
│ 3 commandes              │ 182 000 FCFA dépensés   │
│ 1 avis                   │ Depuis sept. 2026       │
├──────────────────────────┴─────────────────────────┤
│ Adresses (2)                                       │
│ Commandes récentes (liste)                         │
│ Avis (1)                                           │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ ← Clients / Awa N.                    [Actions ▾]          │
│          │ (AN) Awa N.  ● Actif · cliente depuis septembre 2026         │
│          │ awa@example.com · +237 6 71 •• •• 89                         │
│          ├──────────────────────────────┬───────────────────────────────┤
│          │ Commandes récentes           │ Adresses (2)                  │
│          │ BRN-2511-0843  58 000  À valider │ Maison · Bonapriso         │
│          │ BRN-2510-0712  74 000  Livrée    │ Bureau · Akwa              │
│          │ [Tout voir]                  │                               │
│          ├──────────────────────────────┤ Avis (1)                      │
│          │ Statistiques                 │ ★★★★★ Mocassin Glacé          │
│          │ 3 commandes · 182 000 FCFA   │ [Voir]                        │
│          │ Panier moyen 60 666 FCFA     │                               │
│          └──────────────────────────────┴───────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `AddressCard` | Adresses enregistrées |
| `StatusBadge` | Statut du compte |
| `DataTable` / `CardList` | Commandes récentes |
| `Timeline` | Activité du compte (optionnel V1) |
| `Button` | Voir tout, suspendre, réactiver |
| `ConfirmDialog` | Suspension / réactivation |
| `Textarea` | Motif de suspension |
| `Alert` | Compte désactivé, commande en cours |
| `EmptyState` | Aucune commande, aucun avis |
| `Skeleton` | Chargement |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Client introuvable : « Ce client n’existe pas ou a été supprimé. » + retour |
| Chargement | Squelettes d’en-tête, de stats et de listes |
| Erreur | « Impossible de charger la fiche client. » + « Réessayer » |
| Succès | Fiche complète, actions selon rôle et statut |

Cas complémentaires :

- **Suspension** : motif obligatoire, dialogue « Le client ne pourra plus passer commande. »
- **Réactivation** : confirmation simple.
- **Commandes en cours** : avertissement avant suspension, mais suspension autorisée.
- **Aucune commande** : état vide avec lien vers A07.
- **Aucun avis** : « Ce client n’a pas encore laissé d’avis. »

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | {prénom} {nom} |
| Cliente depuis | Client depuis {mois année} |
| Statut | Statut du compte |
| Contact | Contact |
| Commandes | Commandes |
| Dépensé | Total dépensé |
| Panier moyen | Panier moyen |
| Adresses | Adresses |
| Aucune adresse | Aucune adresse enregistrée. |
| Commandes récentes | Commandes récentes |
| Tout voir | Voir toutes les commandes |
| Aucune commande | Aucune commande pour ce client. |
| Avis | Avis |
| Aucun avis | Ce client n’a pas encore laissé d’avis. |
| Bouton suspendre | Suspendre le compte |
| Bouton réactiver | Réactiver le compte |
| Dialogue suspension | Suspendre ce compte ? |
| Texte suspension | Le client ne pourra plus passer commande. L’historique est conservé. |
| Motif | Motif de la suspension |
| Confirmer suspension | Suspendre |
| Succès suspension | Compte suspendu. |
| Succès réactivation | Compte réactivé. |
| Introuvable | Ce client n’existe pas ou a été supprimé. |
| Erreur | Impossible de charger la fiche client. |

## 7. Interactions

1. L’e-mail et le téléphone sont copiables ; le téléphone peut être masqué selon la politique.
2. « Voir toutes les commandes » ouvre A07 filtré sur ce client.
3. Une commande ouvre A08.
4. Un avis ouvre A13 filtré sur cet avis.
5. « Suspendre » exige un motif et affiche les conséquences ; « Réactiver » est direct avec confirmation.
6. Un compte `DISABLED` ne peut pas être réactivé par l’admin : message « Ce compte est désactivé définitivement. »
7. Aucune édition de nom, d’e-mail ou d’adresse : le client gère ses données.
8. Aucune réinitialisation de mot de passe depuis cette fiche.
9. Aucune suppression, aucune anonymisation en V1.

## 8. Accessibilité WCAG 2.1 AA

- Un `h1` avec le nom, sections en `h2`.
- Avatar décoratif ; le nom reste le titre.
- Les statistiques sont une liste de définitions.
- Dialogue de suspension avec focus piégé, focus initial sur « Annuler ».
- Les changements de statut sont annoncés en `aria-live="polite"`.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « {nom} — Clients — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `GET /api/v1/admin/customers/:id`
- `PATCH /api/v1/admin/customers/:id/status` avec `{ status: "SUSPENDED", reason }`.

```json
{
  "id": "…",
  "firstName": "Awa",
  "lastName": "N.",
  "email": "awa@example.com",
  "phone": "+2376…",
  "status": "ACTIVE",
  "createdAt": "2026-09-01T08:00:00Z",
  "stats": { "orders": 3, "totalSpent": 182000, "averageBasket": 60666 },
  "addresses": [
    { "id": "…", "label": "Maison", "city": "Douala", "district": "Bonapriso", "line": "…", "landmark": "…" }
  ],
  "recentOrders": [
    { "reference": "BRN-2511-0843", "total": 58000, "status": "PENDING_CONFIRMATION", "createdAt": "…" }
  ],
  "reviews": [
    { "id": "…", "product": "Mocassin Glacé", "rating": 5, "status": "APPROVED" }
  ]
}
```

## 10. Écarts et dépendances

- Aucun endpoint client, aucune table de statistiques.
- Le statut `DISABLED` est terminal ; seule la suspension est réversible.
- Les adresses appartiennent au client et ne sont pas éditables ici.
- Aucune procédure RGPD d’anonymisation : à cadrer hors DSG-06.
- Les commandes invitées ne sont rattachables à aucun compte.
- Les avis sont modérés dans A13, pas ici.

## 11. Référence

- `backend/prisma/schema.prisma`, `User`, `Address`, `Order`, `Review`.
- A10, A07, A13.
