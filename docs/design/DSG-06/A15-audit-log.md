# A15 — Journal d’audit

## 1. Objectif et contexte

Consulter les actions sensibles réalisées dans le back-office : qui a modifié quoi, quand, depuis quelle adresse IP, avec les valeurs avant et après. Le journal est **immuable** et en lecture seule.

- Route cible : `/admin/audit`
- Accès : `SUPER_ADMIN`, `ADMIN`.
- Source : modèle `AuditLog`, déjà alimenté par les services backend.
- Aucune création, modification ou suppression depuis cet écran.

## 2. Rôles autorisés

| Rôle | Voir | Filtrer | Voir le détail avant/après | Exporter |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui, avec masquage des secrets | Non (endpoint absent) |
| `ADMIN` | Oui | Oui | Oui, avec masquage des secrets | Non |
| `ORDER_MANAGER` | Non | Non | Non | Non |
| `STOCK_MANAGER` | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Journal d’audit              │
│ [Rechercher une entité]      │
│ [Filtres 2]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ Awa N. · il y a 12 min   │ │
│ │ PRODUCT.UPDATE           │ │
│ │ Mocassin Glacé           │ │
│ │ IP 192.168.1.24          │ │
│ │ [Voir le détail]         │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Ibrahim K. · hier 18:40  │ │
│ │ ORDER.STATUS_CHANGED     │ │
│ │ BRN-2511-0842            │ │
│ │ [Voir le détail]         │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Journal d’audit                                    │
│ [Rechercher…] [Utilisateur ▾] [Entité ▾] [Date ▾] │
├────────────────────────────────────────────────────┤
│ Date        Utilisateur  Action        Entité      │
│ 11/11 14:32 Awa N.       PRODUCT.UPDATE Mocassin   │
│ 10/11 18:40 Ibrahim K.   ORDER.STATUS  BRN-…0842   │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Journal d’audit                                              │
│          │ [Rechercher une entité ou un identifiant…]                   │
│          │ [Utilisateur] [Entité] [Action] [Période] [Reset]            │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Date        Acteur      Action           Entité       IP     │
│          │ 11/11 14:32 Awa N.      PRODUCT.UPDATE   Mocassin     192…   │
│          │ 10/11 18:40 Ibrahim K.  ORDER.STATUS     BRN-…0842   10…    │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Détail : avant / après (JSON), user-agent, horodatage exact  │
│          │ 1–50 sur 1 248                              ‹ 1 2 … 25 ›     │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DataTable` | Desktop |
| `CardList` | Mobile |
| `SearchField` | Entité, identifiant |
| `FilterBar` / `FilterDrawer` | Acteur, entité, action, période |
| `SidePanel` / `Modal` | Détail avant/après |
| `Timeline` | Variante mobile du détail |
| `Badge` | Type d’action |
| `CopyButton` | Identifiant d’entité |
| `EmptyState` | Aucun événement |
| `Skeleton` | Chargement |
| `Pagination` | 50 par page |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucune action enregistrée pour cette période. » |
| Chargement | Squelettes de lignes |
| Erreur | « Impossible de charger le journal d’audit. » + « Réessayer » |
| Succès | Liste paginée, filtres actifs, total |

Cas complémentaires :

- **Aucun résultat** : « Aucune action ne correspond à vos filtres. »
- **Entrée incomplète** : `before` ou `after` absent → afficher « Non disponible ».
- **Données sensibles** : les champs de type mot de passe, secret 2FA ou jeton sont remplacés par `••••`.
- **Export** : bouton absent tant que l’endpoint n’existe pas.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Journal d’audit |
| Recherche | Rechercher une entité ou un identifiant |
| Filtre utilisateur | Utilisateur |
| Filtre entité | Entité |
| Filtre action | Action |
| Filtre période | Période |
| Colonne date | Date |
| Colonne acteur | Acteur |
| Colonne action | Action |
| Colonne entité | Entité |
| Colonne IP | Adresse IP |
| Bouton détail | Voir le détail |
| Titre détail | Détail de l’action |
| Avant | Avant |
| Après | Après |
| Non disponible | Non disponible |
| User-agent | Navigateur |
| Identifiant | Identifiant |
| Vide | Aucune action enregistrée pour cette période. |
| Aucun résultat | Aucune action ne correspond à vos filtres. |
| Erreur | Impossible de charger le journal d’audit. |

## 7. Interactions

1. La recherche porte sur `entityId` et le nom de l’entité.
2. Les filtres acteur, entité, action et période sont cumulatifs et reflétés dans l’URL.
3. Le tri par défaut est la date décroissante ; aucun autre tri n’est proposé.
4. « Voir le détail » ouvre un panneau latéral (desktop) ou une modale (mobile).
5. Le détail affiche les objets avant/après sous forme de paires clé-valeur, pas de JSON brut.
6. Les valeurs longues sont tronquées avec un bouton « Afficher tout ».
7. Les secrets sont masqués côté serveur ; l’UI ne les reçoit jamais.
8. Aucun bouton d’export, de suppression ou de purge.
9. La pagination est serveur, 50 lignes par page.
10. Le journal est strictement en lecture seule.

## 8. Accessibilité WCAG 2.1 AA

- Tableau avec en-têtes et `caption`.
- Le détail est un dialogue nommé, focus piégé, restitution.
- Les paires avant/après utilisent une liste de définitions.
- Les adresses IP et identifiants sont copiables et lisibles en monospace.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « Journal d’audit — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `GET /api/v1/admin/audit?userId=&entity=&action=&from=&to=&search=&page=`
- `GET /api/v1/admin/audit/:id`
- `GET /api/v1/admin/audit/export` (hors V1)

```json
{
  "items": [
    {
      "id": "…",
      "createdAt": "2026-11-11T14:32:00Z",
      "user": { "id": "…", "name": "Awa N." },
      "action": "PRODUCT.UPDATE",
      "entity": "Product",
      "entityId": "…",
      "ip": "192.168.1.24"
    }
  ],
  "total": 1248,
  "page": 1,
  "limit": 50
}
```

## 10. Écarts et dépendances

- `AuditLog` est écrit par `AuditLogService`, mais aucun endpoint de lecture.
- Aucun endpoint d’export : ne pas afficher de bouton actif.
- `before`/`after` sont du JSON libre : l’UI doit gérer les valeurs nulles et imbriquées.
- `userAgent` peut être absent pour les entrées anciennes.
- La conservation et la purge du journal relèvent du backend, pas de l’UI.
- Les journaux peuvent contenir des données personnelles : accès restreint et masquage.

## 11. Référence

- `backend/prisma/schema.prisma`, `AuditLog`.
- A14, `MICROTEXTES.md`.
