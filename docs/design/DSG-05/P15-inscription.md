# P15 — Inscription

> DSG-05 · groupe Authentification · route `/inscription`
> Endpoint existant : `POST /auth/register`.

---

## 1. Objectif & rôle

Créer un compte client avec un **e-mail ou un téléphone**, un mot de passe et l'acceptation des CGV. L'écran doit rester neutre en cas de doublon, expliquer les règles du mot de passe et ne jamais bloquer un utilisateur légitime.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header minimal : logo + « Retour à la boutique ».
2. Titre « Créer un compte », sous-titre « Suivez vos commandes et retrouvez vos adresses en un clin d'œil. ».
3. Sélecteur segmenté « E-mail » / « Téléphone » (deux boutons radio stylés, un seul actif).
4. Champs :
   - prénom, nom (2 colonnes sur 360 ? non : empilés) ;
   - identifiant selon l'onglet : e-mail ou téléphone avec préfixe `+237` ;
   - mot de passe + indicateur de force ;
   - confirmation du mot de passe ;
   - case CGV avec lien ;
   - emplacement CAPTCHA invisible.
5. Bouton « Créer mon compte ».
6. Texte « Déjà un compte ? Se connecter ».
7. Réassurance : « Vos données restent privées. »

### 768 px

- Carte 560 px centrée.
- Prénom et nom sur deux colonnes.
- Indicateur de force à droite du champ mot de passe.

### 1280 px

- Deux colonnes 480 / 520 px, conteneur 1 000 px.
- Colonne gauche navy : « Rejoignez Bruny Shopping », trois avantages (suivi, adresses, favoris).
- Colonne droite : formulaire.

```text
┌──────────────────────────────────────────────┐
│  BRUNY SHOPPING            Retour boutique   │
├───────────────────────┬──────────────────────┤
│  Rejoignez            │  Créer un compte     │
│  Bruny Shopping       │  [E-mail][Téléphone] │
│  ✓ Suivi commandes    │  [Prénom][Nom     ]  │
│  ✓ Adresses           │  [E-mail          ]  │
│  ✓ Favoris            │  [Mot de passe  👁]  │
│                       │  ▓▓▓░░ Moyen         │
│                       │  [Confirmer       ]  │
│                       │  ☐ J'accepte les CGV │
│                       │  [Créer mon compte ] │
└───────────────────────┴──────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Input` | TEC-10 | text, email, tel, password | normal, focus, error |
| `Button` | TEC-10 | primary, block | normal, loading, disabled |
| `Checkbox` | TEC-10 | — | coché, décoché, error |
| `PasswordStrengthIndicator` | NOUVEAU | 4 niveaux | vide → fort |
| `Alert` | NOUVEAU | danger, info | — |
| `CaptchaSlot` | NOUVEAU | invisible | inactif |
| `AuthLayout` | NOUVEAU | split | — |

---

## 4. États obligatoires

- **Chargement** : bouton « Création du compte… », champs désactivés.
- **Vide** : formulaire vierge, aucune erreur, focus sur le prénom.
- **Erreur** : erreurs de champ + alerte globale pour 400/429/réseau.
- **Succès** : panneau « Compte créé » avec CTA « Se connecter », identifiant prérempli.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Prénom vide | « Indiquez votre prénom. » |
| Nom vide | « Indiquez votre nom. » |
| Identifiant vide | « Saisissez votre e-mail ou votre numéro de téléphone. » |
| E-mail invalide | « Saisissez un e-mail valide, par exemple vous@exemple.com. » |
| Téléphone invalide | « Saisissez un numéro camerounais à 9 chiffres après +237. » |
| Mot de passe trop court | « Votre mot de passe doit contenir au moins 10 caractères. » |
| Mot de passe courant (WEAK_PASSWORD) | « Ce mot de passe est trop courant. Choisissez une phrase plus difficile à deviner. » |
| Confirmation différente | « Les deux mots de passe ne correspondent pas. » |
| CGV non acceptées | « Acceptez les conditions générales pour créer votre compte. » |
| Version CGV obsolète | « Les conditions ont été mises à jour. Rechargez la page et acceptez la nouvelle version. » |
| Trop de tentatives (429) | « Trop de tentatives. Patientez une minute avant de réessayer. » |
| Réseau | « Impossible de créer votre compte. Vérifiez votre connexion puis réessayez. » |

**Doublon** : l'API renvoie `201` avec la même structure qu'un succès. L'UI affiche donc toujours le succès, sans jamais révéler l'existence du compte.

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Créer un compte | action | `h1` |
| Sous-titre | Suivez vos commandes et retrouvez vos adresses en un clin d'œil. | chaleureux | — |
| Onglet e-mail | E-mail | neutre | `role="tab"` |
| Onglet téléphone | Téléphone | neutre | `role="tab"` |
| Label prénom | Prénom * | neutre | — |
| Label nom | Nom * | neutre | — |
| Label e-mail | E-mail * | neutre | — |
| Label téléphone | Numéro de téléphone * | neutre | — |
| Aide téléphone | Format camerounais : 9 chiffres après +237. | aide | — |
| Label mot de passe | Mot de passe * | neutre | — |
| Aide mot de passe | Au moins 10 caractères. Une phrase longue est plus sûre qu'un mot court. | aide | — |
| Force | Faible · Moyen · Bon · Excellent | statut | `aria-live` |
| Label confirmation | Confirmer le mot de passe * | neutre | — |
| CGV | J'accepte les conditions générales de vente et la politique de confidentialité. | juridique | — |
| CTA | Créer mon compte | action | — |
| CTA chargement | Création du compte… | statut | — |
| Déjà inscrit | Déjà un compte ? | neutre | — |
| Lien | Se connecter | action | — |
| Succès titre | Votre compte est créé | succès | `role="status"` |
| Succès corps | Connectez-vous avec l'identifiant que vous venez d'utiliser. | aide | — |
| Succès CTA | Se connecter | action | — |

---

## 6. Interactions & comportements

- Bascule e-mail/téléphone : conserve les autres champs, vide l'identifiant, déplace le focus.
- Validation au blur ; force du mot de passe calculée à la frappe (longueur, variété, mots courants).
- La confirmation n'est validée qu'après saisie des deux champs.
- `termsVersion` envoyé : `"1.0"` (valeur de `Setting.terms.version`).
- Le téléphone est normalisé en `+237XXXXXXXXX` avant envoi.
- Succès : arrêt du formulaire, panneau de confirmation, lien vers P14 avec identifiant en `queryParams`.
- Aucune connexion automatique : l'API ne renvoie pas de jeton à l'inscription.
- CAPTCHA : jeton envoyé s'il est actif ; sinon requête normale.

---

## 7. Accessibilité (WCAG 2.1 AA)

- Groupe d'onglets avec `role="tablist"`, `aria-selected`, navigation par flèches.
- Chaque champ a un label lié, `aria-required="true"`, `autocomplete` adapté (`given-name`, `family-name`, `email`, `tel-national`, `new-password`).
- Erreurs : `aria-invalid`, `aria-describedby`, résumé `role="alert"`.
- Indicateur de force : texte + couleur, jamais la couleur seule ; `aria-live="polite"`.
- CGV : case 44 px, lien accessible, erreur liée.
- Focus initial sur le prénom ; après succès, focus sur le titre du panneau.
- Cibles ≥ 44 px, contraste AA, zoom 200 % sans perte.
- Aucun délai d'expiration du formulaire.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Inscription | `POST /auth/register` **existant** | Erreur + réessayer |
| Version CGV | `Setting.terms.version` (ou `"1.0"`) | `"1.0"` |

Requête :

```json
{
  "email": "client@exemple.cm",
  "password": "phrase-longue-et-solide",
  "firstName": "Jean-Paul",
  "lastName": "Mbarga",
  "termsAccepted": true,
  "termsVersion": "1.0"
}
```

Réponse `201` : `{ id, emailMasked, phoneMasked, firstName, lastName, status, createdAt, message }`.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune maquette d'inscription | Conçue avec les composants existants |
| API : prénom/nom facultatifs | L'UI les rend obligatoires pour un compte utilisable |
| API : e-mail **ou** téléphone | Onglets exclusifs, un seul identifiant envoyé |
| Doublon neutre | Aucun message « compte existant » |
| CAPTCHA absent | Emplacement prévu, inactif |
| Pas de vérification e-mail livrée | Le compte reste `PENDING_VERIFICATION` mais peut se connecter ; ne pas promettre un e-mail de vérification |

---

## 10. Wireframe de référence

Aucun fichier dédié dans `design1/`. À produire : ce document. Pattern de formulaire : DSG-02 et P09 (coordonnées).
