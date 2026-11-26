# AUT-09 — Analyse design et décisions

> Branche : `feature/AUT-09-customer-login-register-screens`
> Date : 16 novembre 2026
> Périmètre : écrans client P14 (connexion) et P15 (inscription).

---

## 1. Sources réellement disponibles

| Source | État | Usage |
|---|---|---|
| `/design` | **Absent** | — |
| `/design-1` | **Absent** | — |
| `design1/bruny shopping/bruny shopping.png` | Planche unique 4302 × 5532, mobile | Référence visuelle générale |
| `docs/design/DSG-05/P14-connexion.md` | Spec complète | Source de vérité P14 |
| `docs/design/DSG-05/P15-inscription.md` | Spec complète | Source de vérité P15 |
| `docs/design/DSG-05/COMPOSANTS-REQUIS.md` | Inventaire composants | Composants à créer |
| `docs/design/DSG-05/ANALYSE-EXISTANT.md` | Confirme l’absence d’écrans auth | Contexte |
| `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` | Glossaire FR | Ton et microtextes |
| `frontend/libs/design-tokens/src/tokens.css` | Tokens DSG-02 | Couleurs, espacements, focus |

La planche ne contient **aucun écran de connexion ou d’inscription**. Les specs DSG-05 sont donc la référence de structure et de contenu. Les compositions 768 px et 1280 px sont déduites des wireframes textuels.

---

## 2. Structure retenue

### P14 — Connexion

- Header minimal : logo + « Retour à la boutique ».
- Colonne éditoriale desktop : « ESPACE CLIENT », titre, sous-titre, trois points de réassurance.
- Formulaire :
  - « E-mail ou téléphone » (`autocomplete="username"`, `inputmode="email"`) ;
  - « Mot de passe » avec bouton œil ;
  - lien « Mot de passe oublié ? » ;
  - CAPTCHA Turnstile conditionnel ;
  - CTA « Se connecter » / « Connexion… » ;
  - lien « Créer un compte » ;
  - réassurance « Paiement à la livraison · Échange 7 jours ».

### P15 — Inscription

- Header minimal et colonne éditoriale « Rejoignez Bruny Shopping ».
- Onglets E-mail / Téléphone avec `role="tablist"`, `aria-selected` et navigation par flèches.
- Prénom et nom sur deux colonnes à partir de 768 px.
- Identifiant actif : e-mail ou téléphone local avec préfixe `+237`.
- Mot de passe + indicateur de force + confirmation.
- Case CGV avec liens vers les conditions et la politique de confidentialité.
- CAPTCHA conditionnel.
- CTA « Créer mon compte » / « Création du compte… ».
- Panneau de succès neutre, identifiant prérempli, CTA « Se connecter ».

---

## 3. Microtextes validés

### P14

| Emplacement | Texte |
|---|---|
| Micro-titre | ESPACE CLIENT |
| Titre | Se connecter |
| Sous-titre | Retrouvez vos commandes, vos adresses et vos favoris. |
| Identifiant | E-mail ou téléphone |
| Placeholder | vous@exemple.com ou 6 94 28 10 44 |
| Mot de passe | Mot de passe |
| Lien | Mot de passe oublié ? |
| CTA | Se connecter |
| Chargement | Connexion… |
| Inscription | Pas encore de compte ? Créer un compte |
| Réassurance | Paiement à la livraison · Échange 7 jours |
| Identifiant vide | Saisissez votre e-mail ou votre numéro de téléphone. |
| Mot de passe vide | Saisissez votre mot de passe. |
| Identifiant invalide | Saisissez un e-mail valide ou un numéro camerounais (+237 suivi de 9 chiffres). |
| Identifiants incorrects | E-mail/téléphone ou mot de passe incorrect. Vérifiez vos informations ou réinitialisez votre mot de passe. |
| Trop de tentatives | Trop de tentatives. Patientez une minute avant de réessayer. |
| Réseau | Connexion impossible. Vérifiez votre connexion puis réessayez. |

### P15

| Emplacement | Texte |
|---|---|
| Titre | Créer un compte |
| Sous-titre | Suivez vos commandes et retrouvez vos adresses en un clin d'œil. |
| Onglets | E-mail / Téléphone |
| Prénom / Nom | Prénom / Nom |
| E-mail | E-mail |
| Téléphone | Numéro de téléphone |
| Aide téléphone | Format camerounais : 9 chiffres après +237. |
| Mot de passe | Mot de passe |
| Aide mot de passe | Au moins 10 caractères. Une phrase longue est plus sûre qu'un mot court. |
| Force | Faible · Moyen · Bon · Excellent |
| Confirmation | Confirmer le mot de passe |
| CGV | J'accepte les conditions générales de vente et la politique de confidentialité. |
| CTA | Créer mon compte |
| Chargement | Création du compte… |
| Déjà inscrit | Déjà un compte ? Se connecter |
| Succès | Votre compte est créé |
| Succès corps | Connectez-vous avec l'identifiant que vous venez d'utiliser. |
| Prénom vide | Indiquez votre prénom. |
| Nom vide | Indiquez votre nom. |
| E-mail invalide | Saisissez un e-mail valide, par exemple vous@exemple.com. |
| Téléphone invalide | Saisissez un numéro camerounais à 9 chiffres après +237. |
| Mot de passe court | Votre mot de passe doit contenir au moins 10 caractères. |
| Mot de passe courant | Ce mot de passe est trop courant. Choisissez une phrase plus difficile à deviner. |
| Diversité | Mélangez au moins deux catégories : minuscules, majuscules, chiffres, symboles. |
| Confirmation | Les deux mots de passe ne correspondent pas. |
| CGV | Acceptez les conditions générales pour créer votre compte. |

**Aucune promesse d’e-mail de vérification** : le backend ne fournit pas encore ce parcours.

---

## 4. Tokens et composants

Tokens utilisés : `--bs-color-primary`, `--bs-color-accent-text`, `--bs-color-canvas`, `--bs-color-surface`, `--bs-color-danger*`, `--bs-color-success*`, `--bs-color-warning`, `--bs-space-*`, `--bs-radius-*`, `--bs-shadow-focus`, `--bs-touch-target`, `--bs-control-height-lg`.

Composants réutilisés :

- `ButtonComponent` (`block`, `loading`, variantes DSG) ;
- `InputComponent` (labels, hint, error, `aria-invalid`, `aria-describedby`, toggle mot de passe) ;
- `CaptchaComponent` (browser-only, contrôle Turnstile) ;
- `ToastService` / `ToastComponent` ;
- `IconComponent`.

Composants créés :

- `PasswordStrengthIndicatorComponent` (signals, 4 niveaux, `aria-live`) ;
- `CgvCheckboxComponent` (FormControl, liens légaux, ARIA) ;
- `AuthLayoutComponent` (coquille responsive P14/P15).

`PasswordInputComponent` n’a pas été créé : `InputComponent` fournit déjà le bouton œil, `aria-label` et `aria-pressed`. `InputComponent` a été étendu avec `ControlValueAccessor` pour fonctionner avec `formControlName`.

---

## 5. Décisions et écarts

| Sujet | Décision |
|---|---|
| Maquettes P14/P15 | Specs DSG-05 utilisées comme source de vérité |
| Mot de passe | 10–128, liste noire, au moins 2 classes ; aucune majuscule obligatoire |
| Liste noire | Miroir frontend dans `libs/util`, réexporté par `libs/core` |
| Login | Champ unique `identifier`, pas d’envoi `email`/`phone` séparés |
| Téléphone | Saisie locale 9 chiffres, normalisation `+237XXXXXXXXX` |
| Redirection | `returnUrl` (TEC-12) puis `redirect` (ticket), chemins internes uniquement |
| Valeur par défaut | `/compte` avec page provisoire protégée, en attendant P17 |
| CGV | `termsVersion = '1.0'` en constante, faute d’exposition par `/config` |
| Doublon | Panneau de succès identique, aucune révélation |
| 2FA client | Pas de parcours boutique ; message explicite si challenge |
| Throttle/verrouillage | Gestion de `TOO_MANY_ATTEMPTS` (401) et 429 |
| CAPTCHA | Jeton requis seulement si `turnstileEnabled` |
| Routes P27 | Liens CGV/confidentialité prêts, pages à livrer avec P27 |

---

## 6. Risques et suites

- P16/P16b : mot de passe oublié et réinitialisation par code.
- P27 : contenus légaux réels avant mise en production.
- P17 : remplacer la page `/compte` provisoire.
- Vérification e-mail et 2FA client non livrées.
- Maintenir la liste noire frontend et backend synchronisée.
- Tester avec un lecteur d’écran réel (NVDA/VoiceOver) avant mise en production.
