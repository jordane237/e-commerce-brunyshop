# P16b — Réinitialisation du mot de passe

> DSG-05 · groupe Authentification · route `/reinitialiser-mot-de-passe`
> Endpoint existant : `POST /auth/reset-password` — e-mail + code 6 chiffres + nouveau mot de passe.

---

## 1. Objectif & rôle

Finaliser la réinitialisation avec le code reçu par e-mail, en imposant un mot de passe conforme et une confirmation. L'écran doit distinguer clairement un code erroné d'un code expiré et permettre de recommencer sans perdre l'e-mail.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header minimal.
2. Titre « Nouveau mot de passe », sous-titre « Saisissez le code reçu par e-mail, puis choisissez un nouveau mot de passe. ».
3. Rappel de l'e-mail concerné, avec lien « Modifier ».
4. Carte :
   - champ « Code à 6 chiffres » (`inputmode="numeric"`, `autocomplete="one-time-code"`, `maxlength=6`) ;
   - champ « Nouveau mot de passe » + œil + indicateur de force ;
   - champ « Confirmer le mot de passe » ;
   - aide « Au moins 10 caractères. » ;
   - bouton « Réinitialiser mon mot de passe ».
5. Lien « Renvoyer un code » (vers P16).
6. Footer réduit.

### 768 px

Carte 520 px centrée, champs espacés de 20 px.

### 1280 px

Deux colonnes 480 / 500 px. Gauche navy : rappel de sécurité « Ne partagez jamais ce code. Bruny Shopping ne vous appellera jamais pour le demander. » Droite : formulaire.

```text
┌──────────────────────────────────────────────┐
│  BRUNY SHOPPING            Retour boutique   │
├───────────────────────┬──────────────────────┤
│  Sécurité             │  Nouveau mot de passe│
│  Ne partagez jamais   │  Code [1 2 3 4 5 6]  │
│  ce code.             │  [Nouveau mot de passe]│
│                       │  ▓▓▓▓░ Bon           │
│                       │  [Confirmer        ] │
│                       │  [Réinitialiser    ] │
└───────────────────────┴──────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Input` | TEC-10 | text numeric, password | normal, focus, error |
| `Button` | TEC-10 | primary, block | normal, loading |
| `PasswordStrengthIndicator` | NOUVEAU | 4 niveaux | — |
| `Alert` | NOUVEAU | danger, success | — |
| `AuthLayout` | NOUVEAU | split | — |

---

## 4. États obligatoires

- **Chargement** : bouton « Réinitialisation… », champs désactivés.
- **Vide** : e-mail absent → redirection P16 ; code et mots de passe vides sinon.
- **Erreur** : code invalide/expiré, mot de passe faible, confirmation différente, 429, réseau.
- **Succès** : panneau « Mot de passe modifié » + CTA « Se connecter », redirection automatique après 3 s.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Code vide | « Saisissez le code à 6 chiffres reçu par e-mail. » |
| Code incomplet | « Le code contient exactement 6 chiffres. » |
| Code invalide | « Ce code n'est pas valide. Vérifiez les 6 chiffres reçus par e-mail. » |
| Code expiré | « Ce code a expiré. Demandez un nouveau code pour continuer. » |
| Nouveau mot de passe vide | « Choisissez un nouveau mot de passe. » |
| Mot de passe trop court | « Votre mot de passe doit contenir au moins 10 caractères. » |
| Mot de passe courant | « Ce mot de passe est trop courant. Choisissez une phrase plus difficile à deviner. » |
| Confirmation différente | « Les deux mots de passe ne correspondent pas. » |
| Trop de tentatives (429) | « Trop de tentatives. Patientez une minute avant de réessayer. » |
| Réseau | « La réinitialisation a échoué. Vérifiez votre connexion puis réessayez. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Nouveau mot de passe | neutre | `h1` |
| Sous-titre | Saisissez le code reçu par e-mail, puis choisissez un nouveau mot de passe. | aide | — |
| Rappel e-mail | Code envoyé à {email masqué} | info | — |
| Lien | Modifier | action | — |
| Label code | Code à 6 chiffres * | neutre | — |
| Aide code | Consultez votre boîte e-mail, y compris les indésirables. | aide | — |
| Label mot de passe | Nouveau mot de passe * | neutre | — |
| Aide mot de passe | Au moins 10 caractères. Une phrase longue est plus sûre. | aide | — |
| Force | Faible · Moyen · Bon · Excellent | statut | `aria-live` |
| Label confirmation | Confirmer le mot de passe * | neutre | — |
| CTA | Réinitialiser mon mot de passe | action | — |
| CTA chargement | Réinitialisation… | statut | — |
| Renvoi | Renvoyer un code | action | — |
| Sécurité | Ne partagez jamais ce code. Bruny Shopping ne vous appellera jamais pour le demander. | rassurant | — |
| Succès titre | Mot de passe modifié | succès | `role="status"` |
| Succès corps | Vous pouvez maintenant vous connecter avec votre nouveau mot de passe. | aide | — |
| Succès CTA | Se connecter | action | — |

---

## 6. Interactions & comportements

- L'e-mail provient de `queryParams` ; s'il manque, redirection vers P16.
- Le champ code accepte uniquement les chiffres, colle et efface proprement.
- Validation au blur ; le code est vérifié à la soumission (pas d'appel à chaque frappe).
- Succès : `SessionService.clear()` par sécurité, puis redirection P14.
- Renvoi : retour P16 avec l'e-mail prérempli ; aucun code précédent n'est conservé.
- Aucun mot de passe n'est stocké localement.
- CAPTCHA : non requis sur cet écran dans l'API actuelle.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique ; e-mail rappelé en texte, pas seulement en placeholder.
- `autocomplete="one-time-code"` et `new-password`.
- Code : `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength="6"`, `aria-describedby`.
- Erreurs : `aria-invalid`, `aria-describedby`, résumé `role="alert"`.
- Succès : `role="status"`, focus sur le titre.
- Cibles ≥ 44 px, contraste AA, focus visible.
- Zoom 200 % : formulaire sur une colonne.
- Aucune limite de temps côté client ; le code expire côté serveur.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Réinitialisation | `POST /auth/reset-password` **existant** | Erreur + renvoyer un code |

Requête :

```json
{
  "email": "client@exemple.cm",
  "code": "482913",
  "newPassword": "nouvelle-phrase-solide"
}
```

Réponse : `{ "ok": true }`.

**Écart avec le ticket** : l'API n'utilise pas de route `/:token` ; elle attend l'e-mail et le code. Le lien token reste une évolution V2.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Ticket : route `/:token` | Route sans token, e-mail + code, alignée sur l'API |
| Aucune maquette | Conçu avec les composants existants |
| Code à 6 chiffres | `inputmode` numérique, collage autorisé |
| Pas de lien magique | Ne pas promettre un lien dans les e-mails |

---

## 10. Wireframe de référence

Aucun fichier dédié. À produire : ce document.
