# P16 — Mot de passe oublié

> DSG-05 · groupe Authentification · route `/mot-de-passe-oublie`
> Endpoint existant : `POST /auth/forgot-password` (e-mail uniquement, réponse neutre `202`).

---

## 1. Objectif & rôle

Permettre de demander un code de réinitialisation sans révéler si un compte existe. L'écran doit expliquer la suite (code à 6 chiffres, validité courte) et offrir une sortie claire si l'e-mail n'arrive pas.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header minimal.
2. Titre « Mot de passe oublié », sous-titre « Saisissez l'e-mail associé à votre compte. Nous vous enverrons un code à 6 chiffres. ».
3. Carte : champ « E-mail », aide « Utilisez l'adresse saisie lors de l'inscription. », emplacement CAPTCHA invisible, bouton « Envoyer le code ».
4. Lien « Revenir à la connexion ».
5. Encadré d'aide : « Pas d'accès à votre e-mail ? Écrivez-nous sur WhatsApp. »
6. Footer réduit.

### 768 px

Carte centrée 480 px, marges 48 px. Même hiérarchie.

### 1280 px

Deux colonnes 480 / 480 px. Gauche navy : « Un code, pas un lien » + explication en trois points (code à 6 chiffres, valable quelques minutes, usage unique). Droite : formulaire.

```text
┌──────────────────────────────────────────────┐
│  BRUNY SHOPPING            Retour boutique   │
├───────────────────────┬──────────────────────┤
│  Réinitialisez        │  Mot de passe oublié │
│  votre mot de passe   │  [E-mail          ]  │
│  ① Recevez un code    │  [Envoyer le code ]  │
│  ② Saisissez-le       │  ← Revenir connexion │
│  ③ Choisissez un      │  Pas d'e-mail ?      │
│     nouveau mot de passe                     │
└───────────────────────┴──────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Input` | TEC-10 | email | normal, focus, error |
| `Button` | TEC-10 | primary, block | normal, loading |
| `Alert` | NOUVEAU | success, danger, info | — |
| `CaptchaSlot` | NOUVEAU | invisible | inactif |
| `AuthLayout` | NOUVEAU | split | — |

---

## 4. États obligatoires

- **Chargement** : bouton « Envoi… », champ désactivé.
- **Vide** : champ vierge, aucune erreur.
- **Erreur** : e-mail invalide, 429, réseau.
- **Succès** : panneau neutre « Si un compte correspond à cette adresse, un code vient d'être envoyé. » + CTA « Saisir le code ».

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| E-mail vide | « Saisissez l'e-mail associé à votre compte. » |
| E-mail invalide | « Saisissez un e-mail valide, par exemple vous@exemple.com. » |
| Trop de demandes (429) | « Trop de demandes. Patientez une minute avant de réessayer. » |
| Réseau | « L'envoi a échoué. Vérifiez votre connexion puis réessayez. » |
| Service indisponible | « Le service est momentanément indisponible. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp. » |

Aucun message ne doit confirmer ou infirmer l'existence du compte.

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Mot de passe oublié | neutre | `h1` |
| Sous-titre | Saisissez l'e-mail associé à votre compte. Nous vous enverrons un code à 6 chiffres. | aide | — |
| Label | E-mail * | neutre | — |
| Placeholder | vous@exemple.com | aide | — |
| Aide | Utilisez l'adresse saisie lors de l'inscription. | aide | — |
| CTA | Envoyer le code | action | — |
| CTA chargement | Envoi… | statut | — |
| Retour | Revenir à la connexion | action | — |
| Aide WhatsApp | Pas d'accès à votre e-mail ? Écrivez-nous sur WhatsApp. | aide | — |
| Succès titre | Vérifiez votre boîte e-mail | succès | `role="status"` |
| Succès corps | Si un compte correspond à cette adresse, un code à 6 chiffres vient d'être envoyé. Il est valable quelques minutes. | neutre | — |
| Succès CTA | Saisir le code | action | — |
| Renvoi | Renvoyer le code | action | — |
| Renvoi délai | Vous pourrez demander un nouveau code dans {secondes} s. | info | `aria-live` |

---

## 6. Interactions & comportements

- Validation au blur, correction en direct.
- `Entrée` soumet.
- Succès : remplace le formulaire par le panneau de confirmation, focus sur le titre.
- Le CTA « Saisir le code » mène à P16b avec l'e-mail en `queryParams` (jamais le code).
- Renvoi possible après 60 s, avec compte à rebours annoncé sans saturation.
- Aucun code n'est affiché ni journalisé côté client.
- CAPTCHA : actif uniquement si le backend l'expose.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, label lié, `autocomplete="email"`, `inputmode="email"`.
- Erreur : `aria-invalid`, `aria-describedby`, `role="alert"`.
- Succès : `role="status"` + `aria-live="polite"`.
- Focus initial sur l'e-mail ; après succès, focus sur le titre.
- Cibles ≥ 44 px, contraste AA, focus visible.
- Compte à rebours : `aria-live="off"` pendant le décompte, annonce à 0.
- Zoom 200 % sans perte.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Demande de code | `POST /auth/forgot-password` **existant** | Message neutre + WhatsApp |

Requête : `{ "email": "client@exemple.cm" }`.
Réponse : `202 { "ok": true }`, identique si le compte n'existe pas.

**Limite actuelle** : l'API n'accepte que l'e-mail. Le téléphone est documenté en V2 (extension `forgot-password`).

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Ticket : « e-mail OU téléphone » | MVP e-mail uniquement, aligné sur l'API |
| Ticket : « lien reset » | L'API envoie un **code à 6 chiffres**, pas un lien |
| Aucune maquette | Conçu avec les composants existants |
| CAPTCHA absent | Emplacement prévu, inactif |

---

## 10. Wireframe de référence

Aucun fichier dédié. À produire : ce document.
