# P14 — Connexion

> DSG-05 · groupe Authentification · route `/connexion`
> Endpoint existant : `POST /auth/login`.

---

## 1. Objectif & rôle

Permettre à un client existant de se connecter avec son **e-mail ou son téléphone** et son mot de passe, puis d'accéder à son compte. L'écran doit rester neutre sur l'existence d'un compte et gérer proprement le retour vers la page demandée.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header minimal : logo centré, lien « Retour à la boutique ».
2. Bloc éditorial court : micro-titre « ESPACE CLIENT », `h1` « Se connecter », sous-titre « Retrouvez vos commandes, vos adresses et vos favoris. ».
3. Carte formulaire (padding 20 px, radius 12 px) :
   - champ « E-mail ou téléphone » (`autocomplete="username"`, `inputmode="email"`) ;
   - champ « Mot de passe » avec bouton œil ;
   - lien « Mot de passe oublié ? » aligné à droite ;
   - emplacement CAPTCHA invisible (aucun rendu si désactivé) ;
   - bouton primaire pleine largeur « Se connecter » ;
   - séparateur ;
   - texte « Pas encore de compte ? » + lien « Créer un compte ».
4. Bloc réassurance : « Paiement à la livraison · Échange 7 jours ».
5. Footer réduit.

### 768 px

- Carte centrée de 480 px, marges 48 px.
- Illustration ou bloc navy à gauche (facultatif, 40 %) + formulaire à droite (60 %), sur 720 px.
- Le header reste minimal.

### 1280 px

- Deux colonnes 520 / 480 px, conteneur 1 000 px, centré verticalement.
- Colonne gauche navy : logo, accroche « Vos commandes, vos adresses, vos avantages. », trois points de réassurance.
- Colonne droite : formulaire sur surface blanche, sans carte imbriquée.

```text
┌──────────────────────────────────────────────┐
│  BRUNY SHOPPING            Retour boutique   │
├───────────────────────┬──────────────────────┤
│  NAVY                 │  Se connecter        │
│  Vos commandes,       │  [E-mail ou tél.   ] │
│  vos adresses,        │  [Mot de passe   👁] │
│  vos avantages.       │  Mot de passe oublié │
│                       │  [ Se connecter    ] │
│  ✓ Paiement livraison │  Pas de compte ?     │
│  ✓ Échange 7 jours    │  Créer un compte     │
└───────────────────────┴──────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Input` | TEC-10 | text, password | normal, focus, error, disabled |
| `Button` | TEC-10 | primary, block | normal, loading, disabled |
| `Alert` | NOUVEAU (DSG-04) | danger, info | visible |
| `Toast` | TEC-10 | success, error | — |
| `CaptchaSlot` | NOUVEAU | invisible | inactif si backend absent |
| `AuthLayout` | NOUVEAU | split / centered | — |

---

## 4. États obligatoires

- **Chargement** : bouton `loading` « Connexion… », champs désactivés, pas de skeleton (formulaire court).
- **Vide** : formulaire vierge, aucune erreur, focus sur le premier champ.
- **Erreur** : `Alert` en haut du formulaire, `role="alert"`, focus sur l'alerte ; les champs restent remplis.
- **Succès** : redirection immédiate vers `returnUrl` ou `/compte`, toast « Bienvenue, {prénom}. ».

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Identifiant vide | « Saisissez votre e-mail ou votre numéro de téléphone. » |
| Mot de passe vide | « Saisissez votre mot de passe. » |
| Identifiants invalides (401) | « E-mail/téléphone ou mot de passe incorrect. Vérifiez vos informations ou réinitialisez votre mot de passe. » |
| Compte suspendu / désactivé | « Votre compte ne peut pas se connecter pour le moment. Contactez-nous sur WhatsApp. » |
| Trop de tentatives (429) | « Trop de tentatives. Patientez une minute avant de réessayer. » |
| Réseau | « Connexion impossible. Vérifiez votre connexion puis réessayez. » |
| 2FA requis | Bascule vers le champ « Code de vérification ». |
| Code 2FA invalide | « Ce code n'est pas valide. Saisissez le code à 6 chiffres de votre application. » |
| Session expirée | « Votre session a expiré. Reconnectez-vous pour continuer. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Micro-titre | ESPACE CLIENT | neutre | décoratif |
| Titre | Se connecter | action | `h1` |
| Sous-titre | Retrouvez vos commandes, vos adresses et vos favoris. | chaleureux | — |
| Label identifiant | E-mail ou téléphone | neutre | `for`/`id` |
| Placeholder | vous@exemple.com ou 6 94 28 10 44 | aide | — |
| Label mot de passe | Mot de passe | neutre | — |
| Lien | Mot de passe oublié ? | action | — |
| CTA | Se connecter | action | — |
| CTA chargement | Connexion… | statut | `aria-live` |
| Inscription | Pas encore de compte ? | neutre | — |
| Lien inscription | Créer un compte | action | — |
| Réassurance | Paiement à la livraison · Échange 7 jours | rassurant | — |
| 2FA titre | Vérification en deux étapes | neutre | `h2` |
| 2FA aide | Saisissez le code à 6 chiffres de votre application. | aide | — |
| 2FA CTA | Valider le code | action | — |

---

## 6. Interactions & comportements

- Validation au blur, correction en direct ; pas de validation à la frappe initiale.
- `Entrée` soumet le formulaire.
- Le bouton œil bascule l'affichage du mot de passe et conserve le focus.
- `returnUrl` : chemin interne uniquement ; sinon `/compte`.
- Après connexion, `SessionService` stocke le jeton en mémoire ; aucun `localStorage`.
- Si la réponse contient `twoFactorRequired`, le formulaire principal est remplacé par l'étape code, sans rechargement.
- CAPTCHA : emplacement réservé, invisible ; si le backend l'active, le jeton est envoyé avec la requête. En son absence, aucun blocage.
- Déconnexion depuis le compte : `POST /auth/logout`, puis `/boutique`.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, formulaire avec `novalidate`.
- Labels explicites, `autocomplete="username"` et `current-password`.
- Erreurs : `aria-invalid="true"`, `aria-describedby`, résumé `role="alert"`.
- Focus initial sur l'identifiant ; après erreur, focus sur l'alerte.
- Cibles ≥ 44 px, bouton œil avec `aria-label` « Afficher le mot de passe » / « Masquer le mot de passe ».
- Contraste : texte ≥ 4,5:1, bordure de champ ≥ 3:1, focus visible.
- Aucune information par la couleur seule.
- Zoom 200 % : formulaire sur une colonne, aucun défilement horizontal.
- `aria-live="polite"` sur le statut de connexion.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Connexion | `POST /auth/login` **existant** | Erreur + réessayer |
| 2FA | `POST /auth/2fa/verify` **existant** | Erreur + retour |
| Profil | `GET /me` **existant** (via `restore`) | Erreur + réessayer |

Requête : `{ "identifier": "client@exemple.cm", "password": "…" }`.
Réponse : `{ accessToken, user }` ou `{ twoFactorRequired, challengeToken }`.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune maquette de connexion | Conçu avec les composants et tokens existants |
| CAPTCHA annoncé mais absent du backend | Emplacement prévu, inactif tant que le backend ne l'expose pas |
| 2FA client non prévue par le produit | Gérée uniquement si l'API renvoie un challenge |
| Pas de « Se souvenir de moi » | Le refresh cookie assure la persistance ; aucune case inutile |

---

## 10. Wireframe de référence

Aucun fichier dédié dans `design1/`. À produire : `docs/design/DSG-05/P14-connexion.md` (ce document). Pattern de référence : formulaire de connexion admin (`frontend/apps/admin/src/app/features/login/login-page.ts`), adapté aux tokens DSG-02.
