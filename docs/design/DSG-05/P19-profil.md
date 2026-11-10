# P19 — Mon profil

> DSG-05 · groupe Compte · route `/compte/profil`
> Endpoints : `GET /me` **existant** ; `PATCH /me` et `POST /me/password` **à créer**.

---

## 1. Objectif & rôle

Permettre de mettre à jour ses informations personnelles et son mot de passe, et donner accès à la suppression de compte. L'écran doit distinguer clairement ce qui est modifiable immédiatement de ce qui exige une vérification.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Mon compte › Profil ».
2. `h1` « Mon profil ».
3. Carte identité : avatar à initiales + bouton « Changer la photo » (désactivé, V2).
4. Formulaire « Informations personnelles » : prénom, nom, e-mail, téléphone.
5. Aide sous e-mail/téléphone : « Toute modification devra être confirmée. »
6. Bouton « Enregistrer les modifications ».
7. Section « Mot de passe » : bouton « Modifier mon mot de passe » qui déplie trois champs (actuel, nouveau, confirmation) + indicateur de force.
8. Section « Sécurité » : 2FA « Bientôt disponible » (désactivé).
9. **Zone danger** : carte bordée rouge, « Supprimer mon compte », explication courte, lien vers P19b.
10. Bottom nav.

### 768 px

- Deux colonnes : informations à gauche, mot de passe et sécurité à droite.
- Zone danger pleine largeur en bas.

### 1280 px

```text
┌──────────────┬───────────────────────────────────────────────┐
│ MON COMPTE   │ Mon profil                                    │
│ Profil ●     │ ┌──────────────────────┬────────────────────┐ │
│              │ │ Informations         │ Mot de passe       │ │
│              │ │ [Prénom][Nom]        │ [Modifier]         │ │
│              │ │ [E-mail][Téléphone]  │ Sécurité / 2FA     │ │
│              │ │ [Enregistrer]        │                    │ │
│              │ └──────────────────────┴────────────────────┘ │
│              │ ┌ Zone danger ──────────────────────────────┐ │
│              │ │ Supprimer mon compte                     │ │
│              │ └───────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `AccountNav` | NOUVEAU | sidebar | actif |
| `Avatar` | NOUVEAU | lg | — |
| `Input` | TEC-10 | text, email, tel, password | normal, focus, error, disabled |
| `Button` | TEC-10 | primary, ghost, danger | normal, loading |
| `PasswordStrengthIndicator` | NOUVEAU | 4 niveaux | — |
| `Alert` | NOUVEAU | success, danger, info | — |
| `Breadcrumb` | NOUVEAU | — | — |

---

## 4. États obligatoires

- **Chargement** : skeleton du formulaire, champs désactivés.
- **Vide** : aucun champ vide autorisé pour prénom/nom ; e-mail ou téléphone peut être absent selon le compte.
- **Erreur** : validation par champ, erreur 409 si identifiant déjà utilisé, 401 session, réseau.
- **Succès** : toast « Profil mis à jour » + valeurs conservées ; succès mot de passe → déconnexion des autres sessions (comportement backend à confirmer).

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Prénom vide | « Indiquez votre prénom. » |
| Nom vide | « Indiquez votre nom. » |
| E-mail invalide | « Saisissez un e-mail valide. » |
| Téléphone invalide | « Saisissez un numéro camerounais à 9 chiffres après +237. » |
| Aucun identifiant | « Conservez au moins un e-mail ou un numéro de téléphone. » |
| Identifiant déjà utilisé (409) | « Cette information est déjà associée à un autre compte. » |
| Ancien mot de passe incorrect | « Votre mot de passe actuel n'est pas correct. » |
| Nouveau mot de passe trop court | « Votre nouveau mot de passe doit contenir au moins 10 caractères. » |
| Confirmation différente | « Les deux mots de passe ne correspondent pas. » |
| Réseau | « Vos modifications n'ont pas été enregistrées. Vérifiez votre connexion. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Mon profil | neutre | `h1` |
| Section infos | Informations personnelles | neutre | `h2` |
| Label prénom | Prénom * | neutre | — |
| Label nom | Nom * | neutre | — |
| Label e-mail | E-mail | neutre | — |
| Label téléphone | Téléphone | neutre | — |
| Aide identifiants | Toute modification devra être confirmée. | info | — |
| CTA infos | Enregistrer les modifications | action | — |
| Section mot de passe | Mot de passe | neutre | `h2` |
| CTA mot de passe | Modifier mon mot de passe | action | — |
| Label actuel | Mot de passe actuel * | neutre | — |
| Label nouveau | Nouveau mot de passe * | neutre | — |
| Label confirmation | Confirmer le nouveau mot de passe * | neutre | — |
| CTA mot de passe | Mettre à jour le mot de passe | action | — |
| Sécurité | Double authentification | neutre | `h2` |
| 2FA badge | Bientôt disponible | info | — |
| Danger titre | Supprimer mon compte | danger | `h2` |
| Danger corps | Cette action est définitive et supprime vos données personnelles. | clair | — |
| Danger CTA | Supprimer mon compte | action | — |
| Succès profil | Profil mis à jour. | succès | `role="status"` |
| Succès mot de passe | Mot de passe mis à jour. | succès | `role="status"` |

---

## 6. Interactions & comportements

- Validation au blur ; bouton désactivé tant que le formulaire est invalide ou inchangé.
- E-mail/téléphone modifiés : message « Une confirmation vous sera demandée » ; en MVP, l'enregistrement peut être bloqué si le backend ne gère pas la vérification.
- Changement de mot de passe : section repliée par défaut, focus sur le champ actuel à l'ouverture.
- Après changement de mot de passe, les autres sessions sont révoquées (à confirmer côté backend).
- 2FA : bouton désactivé avec `aria-describedby` « Disponible prochainement ».
- Suppression : navigation vers P19b, jamais de suppression directe depuis P19.
- Aucune photo de profil en MVP.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, sections `h2`.
- Labels liés, `autocomplete` (`given-name`, `family-name`, `email`, `tel-national`, `current-password`, `new-password`).
- Erreurs : `aria-invalid`, `aria-describedby`, résumé `role="alert"`.
- Section mot de passe : bouton `aria-expanded` + `aria-controls`.
- Toast : `role="status"`, pas de vol de focus.
- Zone danger : contraste suffisant, bouton danger avec libellé explicite.
- Cibles ≥ 44 px, focus visible, zoom 200 %.
- Aucune suppression accessible au clavier sans confirmation.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Profil | `GET /me` **existant** | Erreur + réessayer |
| Mise à jour | `PATCH /me` **à créer** | Erreur + conserver la saisie |
| Mot de passe | `POST /me/password` **à créer** | Erreur ciblée |
| 2FA | endpoints existants admin uniquement | Désactivé côté client |
| Suppression | `DELETE /me` **à créer** (P19b) | — |

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune maquette de profil | Conçu avec les composants existants |
| `PATCH /me` absent | Dépendance backend explicite |
| 2FA présentée | Désactivée, V2 |
| Photo de profil | Non prévue, V2 |
| Suppression | Page dédiée P19b, pas de modale directe |

---

## 10. Wireframe de référence

Zone K, carte profil (3416, 800), complétée par les patterns de formulaire DSG-02.
