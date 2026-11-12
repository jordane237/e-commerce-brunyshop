# A16 — Mon profil

## 1. Objectif et contexte

Permettre à chaque membre de l’équipe de gérer ses informations, son mot de passe, sa double authentification et ses sessions actives. Le profil ne permet jamais de modifier ses propres rôles.

- Route cible : `/admin/profil`
- Accès : tout utilisateur interne authentifié.
- Lecture seule pour l’e-mail et les rôles en V1.
- Toute action sensible exige le mot de passe actuel.

## 2. Rôles autorisés

| Rôle | Modifier nom/téléphone | Changer le mot de passe | Gérer la 2FA | Voir/révoquer ses sessions |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Oui | Oui | Oui | Oui |
| `LIVREUR` | Oui | Oui | Oui | Oui |
| `CUSTOMER` | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Mon profil                   │
│ (AN) Awa N.                  │
│ Admin · awa@bruny.cm         │
│                              │
│ Informations                 │
│ Prénom *  [Awa            ]  │
│ Nom *     [N.             ]  │
│ Téléphone [+237 6 71 •• ••]  │
│ E-mail    [awa@bruny.cm   ]  │
│           (non modifiable)   │
│ [Enregistrer]                │
│                              │
│ Mot de passe                 │
│ [Changer mon mot de passe →] │
│                              │
│ Double authentification      │
│ ● Activée                    │
│ [Gérer la 2FA →]             │
│                              │
│ Sessions actives             │
│ Cet appareil · Douala        │
│ Chrome · maintenant          │
│ Autre appareil · hier        │
│ [Déconnecter]                │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Mon profil                                         │
│ (AN) Awa N. · Admin · awa@bruny.cm                 │
├──────────────────────────┬─────────────────────────┤
│ Informations             │ Double authentification │
│ Prénom  [Awa]            │ ● Activée               │
│ Nom     [N.]             │ [Gérer]                 │
│ Téléphone [+237…]        │                         │
│ E-mail  [awa@…] (lecture)│ Mot de passe            │
│ [Enregistrer]            │ [Changer]               │
├──────────────────────────┴─────────────────────────┤
│ Sessions actives                                   │
│ Cet appareil · Chrome · Douala · maintenant        │
│ Appareil mobile · hier · [Déconnecter]             │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Mon profil                                                   │
│          │ (AN) Awa N. · Admin · membre depuis septembre 2026           │
│          ├──────────────────────────────────┬───────────────────────────┤
│          │ Informations                     │ Sécurité                  │
│          │ Prénom *  [Awa]                  │ Mot de passe              │
│          │ Nom *     [N.]                   │ Dernière modification 09/10│
│          │ Téléphone [+237 6 71…]           │ [Changer mon mot de passe]│
│          │ E-mail    [awa@bruny.cm] lecture │                           │
│          │ [Enregistrer]                    │ Double authentification   │
│          │                                  │ ● Activée                 │
│          │                                  │ [Gérer la 2FA]            │
│          ├──────────────────────────────────┴───────────────────────────┤
│          │ Sessions actives                                             │
│          │ Chrome · Douala · 192.168.1.24 · maintenant  [Cet appareil]  │
│          │ Safari · iPhone · hier                       [Déconnecter]   │
│          └──────────────────────────────────────────────────────────────┘
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `Input` | Prénom, nom, téléphone, mots de passe |
| `Button` | Enregistrer, changer, gérer, déconnecter |
| `StatusBadge` | 2FA activée/inactive |
| `Alert` | Erreurs, succès, avertissement |
| `Modal` | Changement de mot de passe, désactivation 2FA |
| `TwoFactorCodeInput` | Confirmation TOTP |
| `ConfirmDialog` | Révocation de session |
| `Toast` | Succès |
| `Skeleton` | Chargement |
| `PasswordStrengthIndicator` | Nouveau mot de passe |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Aucune session secondaire : « Vous êtes connecté uniquement sur cet appareil. » |
| Chargement | Squelettes d’en-tête et de sections |
| Erreur | « Impossible de charger votre profil. » + « Réessayer » ; erreur de formulaire locale |
| Succès | Profil à jour, toasts après chaque action |

Cas complémentaires :

- **Mot de passe actuel incorrect** : erreur de champ, aucun changement.
- **Nouveau mot de passe identique** : « Choisissez un mot de passe différent de l’actuel. »
- **2FA déjà active** : proposer la gestion, pas un nouvel enrôlement.
- **Désactivation 2FA d’un ADMIN** : avertissement renforcé + code TOTP + mot de passe.
- **Session révoquée** : toast « Session déconnectée. » ; si c’est la session courante, redirection A01.
- **Dernière session** : impossible de révoquer la session courante sans se déconnecter.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Mon profil |
| Rôle | {rôle principal} |
| Membre depuis | Membre depuis {mois année} |
| Section infos | Informations |
| Prénom | Prénom |
| Nom | Nom |
| Téléphone | Téléphone |
| E-mail | E-mail |
| E-mail aide | L’adresse e-mail ne peut pas être modifiée ici. Contactez un administrateur. |
| Enregistrer | Enregistrer |
| Succès infos | Profil mis à jour. |
| Section mot de passe | Mot de passe |
| Dernière modif | Dernière modification le {date} |
| Changer mot de passe | Changer mon mot de passe |
| Mot de passe actuel | Mot de passe actuel |
| Nouveau mot de passe | Nouveau mot de passe |
| Confirmer | Confirmer le nouveau mot de passe |
| Règles | Au moins 12 caractères. |
| Confirmer changement | Changer le mot de passe |
| Succès mot de passe | Mot de passe modifié. |
| Erreur actuel | Mot de passe actuel incorrect. |
| Erreur différent | Choisissez un mot de passe différent de l’actuel. |
| Erreur correspondance | Les mots de passe ne correspondent pas. |
| Section 2FA | Double authentification |
| 2FA active | Activée |
| 2FA inactive | Non activée |
| Gérer 2FA | Gérer la 2FA |
| Activer 2FA | Activer la double authentification |
| Désactiver 2FA | Désactiver la 2FA |
| Avertissement 2FA | Sans 2FA, votre compte est moins protégé. |
| Section sessions | Sessions actives |
| Session actuelle | Cet appareil |
| Dernière activité | Dernière activité {date} |
| Déconnecter | Déconnecter |
| Déconnecter autres | Déconnecter les autres sessions |
| Aucune session | Vous êtes connecté uniquement sur cet appareil. |
| Session révoquée | Session déconnectée. |
| Erreur profil | Impossible de charger votre profil. |

## 7. Interactions

1. Les champs prénom, nom et téléphone sont modifiables ; l’e-mail est en lecture seule.
2. « Enregistrer » ne concerne que la section Informations.
3. « Changer mon mot de passe » ouvre une modale : actuel, nouveau, confirmation.
4. Le nouveau mot de passe doit contenir au moins 12 caractères et être différent de l’actuel.
5. Après changement, les autres sessions peuvent être révoquées automatiquement (option proposée, dépendance backend).
6. « Gérer la 2FA » ouvre A02 en mode gestion ; si la 2FA est inactive, lance l’enrôlement.
7. La désactivation exige mot de passe actuel + code TOTP ou code de secours.
8. Les sessions affichent appareil (user-agent simplifié), IP, date de connexion et activité.
9. « Déconnecter » révoque une session après confirmation.
10. « Déconnecter les autres sessions » révoque toutes les sessions sauf la courante.
11. Aucune suppression de compte, aucun changement de rôle.

## 8. Accessibilité WCAG 2.1 AA

- Sections avec titres `h2`, formulaire avec labels visibles.
- Les champs mot de passe ont un bouton afficher/masquer avec libellé accessible.
- Les exigences de mot de passe sont annoncées et liées au champ.
- Dialogue avec focus piégé, focus initial sur le premier champ.
- La liste des sessions est une liste avec boutons nommés (« Déconnecter Safari sur iPhone »).
- Les erreurs sont annoncées en `role="alert"`.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « Mon profil — Bruny Shopping ».

## 9. Données API

Existant : `GET /api/v1/me` retourne l’utilisateur authentifié.

**Endpoints cibles absents :**

- `PATCH /api/v1/me` avec `{ firstName, lastName, phone }`.
- `POST /api/v1/me/password` avec `{ currentPassword, newPassword }`.
- `DELETE /api/v1/auth/2fa` avec `{ password, code }`.
- `POST /api/v1/auth/2fa/backup-codes/regenerate`.
- `GET /api/v1/auth/sessions`.
- `DELETE /api/v1/auth/sessions/:id`.
- `DELETE /api/v1/auth/sessions` (autres sessions).

```json
{
  "id": "…",
  "firstName": "Awa",
  "lastName": "N.",
  "email": "awa@bruny.cm",
  "phone": "+2376…",
  "roles": ["ADMIN"],
  "status": "ACTIVE",
  "twoFactorEnabled": true,
  "createdAt": "2026-09-01T08:00:00Z",
  "lastPasswordChangeAt": null,
  "sessions": [
    {
      "id": "…",
      "userAgent": "Chrome · macOS",
      "ip": "192.168.1.24",
      "createdAt": "2026-11-11T08:00:00Z",
      "lastSeenAt": "2026-11-11T14:30:00Z",
      "current": true
    }
  ]
}
```

## 10. Écarts et dépendances

- `GET /me` existe, mais aucune mise à jour de profil.
- Aucun endpoint de changement de mot de passe.
- 2FA : setup/verify existent, désactivation et régénération des codes absentes.
- `RefreshToken` permet de lister les sessions, mais aucun endpoint.
- `lastPasswordChangeAt` n’existe pas dans le modèle : soit l’ajouter, soit masquer cette information.
- Les rôles sont en lecture seule ici ; leur gestion est dans A11.
- L’e-mail est immuable en V1 : un changement nécessiterait une vérification.
- Aucune suppression de compte.

## 11. Référence

- `backend/prisma/schema.prisma`, `User`, `RefreshToken`, `BackupCode`.
- `backend/src/modules/auth/auth.controller.ts`.
- A02, A11.
