# A11 — Utilisateurs internes

## 1. Objectif et contexte

Gérer les comptes de l’équipe et leurs rôles : créateur de contenu, gestionnaire de commandes, livreur, administrateur. L’écran doit empêcher toute élévation de privilèges et toute perte du dernier `SUPER_ADMIN`.

- Route cible : `/admin/utilisateurs`
- Accès : `SUPER_ADMIN` complet ; `ADMIN` limité aux rôles non administratifs.
- Un utilisateur peut porter **plusieurs rôles** (`UserRole[]`) ; l’UI doit le refléter.
- La création passe par une invitation, jamais par un mot de passe temporaire affiché.

## 2. Rôles autorisés

| Rôle | Voir | Inviter | Modifier les rôles | Suspendre | Réinitialiser la 2FA |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui, tous rôles | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui, sauf `ADMIN`/`SUPER_ADMIN` | Oui, sauf comptes admin | Oui, sauf admins | Oui, sauf admins |
| `ORDER_MANAGER` | Non | Non | Non | Non | Non |
| `STOCK_MANAGER` | Non | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non |

Règles absolues :

- Personne ne peut modifier ses propres rôles ni se suspendre.
- Le dernier `SUPER_ADMIN` actif ne peut être ni suspendu, ni rétrogradé.
- Un `ADMIN` ne peut pas attribuer `ADMIN` ou `SUPER_ADMIN`.

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Utilisateurs                 │
│ 8 comptes · 7 actifs         │
│ [ + Inviter un utilisateur ] │
│ [Rechercher un nom ou e-mail]│
│ [Filtres 1]                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ (IK) Ibrahim K.  ● Actif │ │
│ │ Ibrahim@bruny.cm         │ │
│ │ [Livreur]                │ │
│ │ Dernière connexion : hier│ │
│ │ 2FA activée              │ │
│ │                    [⋯]   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ (AN) Awa N.      ● Actif │ │
│ │ Awa@bruny.cm             │ │
│ │ [Admin] [Commandes]      │ │
│ │ Dernière connexion : 2 h │ │
│ │ 2FA activée              │ │
│ │                    [⋯]   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Utilisateurs                     [ + Inviter ]     │
│ [Rechercher…] [Rôle ▾] [Statut ▾]                  │
├────────────────────────────────────────────────────┤
│ Nom           E-mail            Rôles     Statut   │
│ Ibrahim K.    ibrahim@bruny.cm  Livreur   Actif    │
│ Awa N.        awa@bruny.cm      Admin     Actif    │
│ Samuel K.     samuel@bruny.cm   Livreur   Suspendu │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Utilisateurs                        [ + Inviter un utilisateur]│
│          │ 8 comptes · 7 actifs · 1 suspendu                            │
│          │ [Rechercher nom ou e-mail…] [Rôle] [Statut] [Reset]          │
│          ├──────────────────────────────────────────────────────────────┤
│          │ Nom          E-mail             Rôles          Statut  Dern. │
│          │ Awa N.       awa@bruny.cm       Admin, Cdes    Actif   2 h   │
│          │ Ibrahim K.   ibrahim@bruny.cm   Livreur        Actif   hier  │
│          │ Samuel K.    samuel@bruny.cm    Livreur        Suspendu 3 j  │
│          ├──────────────────────────────────────────────────────────────┤
│          │ 1–20 sur 8                                                   │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DataTable` | Desktop |
| `CardList` | Mobile |
| `SearchField` | Nom, e-mail |
| `FilterBar` / `FilterDrawer` | Rôle, statut |
| `StatusBadge` | `UserStatus` |
| `RoleBadge` | Rôles multiples |
| `Modal` / `BottomSheet` | Invitation, édition des rôles |
| `Checkbox` | Attribution des rôles |
| `Button` | Inviter, enregistrer, suspendre |
| `ConfirmDialog` | Suspension, retrait de rôle |
| `Alert` | Dernier SUPER_ADMIN, auto-modification |
| `EmptyState` | Aucun utilisateur |
| `Skeleton` | Chargement |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | « Aucun utilisateur interne. » + CTA « Inviter un utilisateur » (SUPER_ADMIN) |
| Chargement | Squelettes de lignes |
| Erreur | « Impossible de charger les utilisateurs. » + « Réessayer » |
| Succès | Liste et compteurs à jour, toast après action |

Cas complémentaires :

- **Auto-modification** : actions désactivées sur sa propre ligne, avec explication.
- **Dernier SUPER_ADMIN** : retrait du rôle et suspension bloqués.
- **Invitation en attente** : statut `PENDING_VERIFICATION`, badge « Invitation envoyée », action « Renvoyer ».
- **E-mail déjà utilisé** : erreur `409` explicite.
- **Échec d’envoi d’invitation** : le compte est créé mais l’e-mail échoue ; message et action « Renvoyer l’invitation ».

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Utilisateurs |
| Compteur | {n} comptes · {n} actifs |
| Recherche | Rechercher un nom ou un e-mail |
| Filtre rôle | Rôle |
| Filtre statut | Statut |
| Colonne nom | Nom |
| Colonne e-mail | E-mail |
| Colonne rôles | Rôles |
| Colonne statut | Statut |
| Colonne dernière | Dernière connexion |
| Jamais connecté | Jamais connecté |
| 2FA | 2FA |
| Bouton inviter | Inviter un utilisateur |
| Titre invitation | Inviter un utilisateur |
| Prénom | Prénom |
| Nom | Nom |
| E-mail | E-mail professionnel |
| Téléphone | Téléphone (optionnel) |
| Rôles | Rôles |
| Aide rôles | Un utilisateur peut cumuler plusieurs rôles. |
| Envoyer | Envoyer l’invitation |
| Succès invitation | Invitation envoyée à {e-mail}. |
| Menu | Modifier les rôles, Suspendre, Réactiver, Réinitialiser la 2FA |
| Dialogue suspension | Suspendre ce compte ? |
| Texte suspension | L’utilisateur perdra immédiatement l’accès au back-office. |
| Confirmer suspension | Suspendre |
| Dernier super admin | Impossible de retirer le dernier SUPER_ADMIN actif. |
| Auto-modification | Vous ne pouvez pas modifier votre propre compte ici. |
| Erreur e-mail | Cette adresse e-mail est déjà utilisée. |
| Vide | Aucun utilisateur interne. |
| Erreur | Impossible de charger les utilisateurs. |

## 7. Interactions

1. La recherche porte sur le prénom, le nom et l’e-mail.
2. Le filtre « Rôle » accepte plusieurs valeurs ; le filtre statut est unique.
3. Le tri par défaut est le nom alphabétique.
4. « Inviter » ouvre une modale avec prénom, nom, e-mail, téléphone optionnel et rôles.
5. Les rôles proposés dépendent de l’appelant : un `ADMIN` ne voit pas `ADMIN` ni `SUPER_ADMIN`.
6. L’invitation crée un compte `PENDING_VERIFICATION` et envoie un lien d’activation à durée limitée.
7. « Modifier les rôles » ouvre la même modale, sans e-mail modifiable.
8. Le retrait d’un rôle demande confirmation s’il s’agit du dernier rôle de l’utilisateur.
9. « Suspendre » exige un motif, révoque les sessions et bloque la connexion.
10. « Réinitialiser la 2FA » supprime le secret et les codes de secours ; l’utilisateur devra réenrôler à sa prochaine connexion.
11. Aucune suppression de compte : suspension uniquement.
12. Aucun mot de passe n’est saisi ni affiché par un administrateur.

## 8. Accessibilité WCAG 2.1 AA

- Tableau avec `aria-sort` ; rôles affichés en liste de badges textuels.
- Modale avec `role="dialog"`, `aria-modal`, focus piégé et restitution.
- Les rôles sont des cases à cocher avec description de leurs permissions.
- Les erreurs de formulaire sont liées et annoncées.
- L’action « Renvoyer l’invitation » est accessible au clavier.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « Utilisateurs — Bruny Shopping ».

## 9. Données API

**Tous les endpoints sont à créer :**

- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users/invite`
- `PATCH /api/v1/admin/users/:id/roles`
- `PATCH /api/v1/admin/users/:id/status`
- `POST /api/v1/admin/users/:id/resend-invite`
- `POST /api/v1/admin/users/:id/reset-2fa`

```json
{
  "items": [
    {
      "id": "…",
      "firstName": "Awa",
      "lastName": "N.",
      "email": "awa@bruny.cm",
      "roles": ["ADMIN", "ORDER_MANAGER"],
      "status": "ACTIVE",
      "lastLoginAt": "2026-11-11T12:00:00Z",
      "twoFactorEnabled": true
    }
  ],
  "total": 8,
  "active": 7
}
```

Rôles disponibles : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`, `STOCK_MANAGER`, `LIVREUR`. `CUSTOMER` n’est jamais attribuable ici.

## 10. Écarts et dépendances

- Aucun endpoint utilisateur interne.
- Le modèle lie `User` à `Role` via `UserRole` : l’API doit exposer un tableau, pas un rôle unique.
- Aucun service d’invitation ni de lien d’activation n’est documenté.
- `lastLoginAt` existe ; `twoFactorSecret` permet de déduire l’état 2FA.
- La révocation de session existe via `RefreshToken`, sans endpoint admin.
- Aucune suppression, aucune réaffectation des commandes.
- La protection du dernier `SUPER_ADMIN` doit être serveur, pas seulement UI.

## 11. Référence

- `backend/prisma/schema.prisma`, `User`, `UserRole`, `Role`.
- `backend/src/modules/auth/auth.controller.ts`.
- A16, `MICROTEXTES.md`.
