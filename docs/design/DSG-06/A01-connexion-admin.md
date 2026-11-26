# A01 — Connexion à l’espace équipe

## 1. Objectif et contexte

Permettre à un membre de l’équipe Bruny Shopping d’ouvrir une session sécurisée sur le back-office. La page est l’unique porte d’entrée de l’administration ; elle ne doit révéler ni l’existence d’un compte, ni le rôle associé.

- Route cible : `/admin/connexion`
- Accès : public, redirection vers A03 si une session valide existe déjà.
- Suite : A02 si un challenge 2FA est requis, sinon A03.
- Référence visuelle : identité de la zone L, sans reprendre ses données opérationnelles.

## 2. Rôles autorisés

| Rôle | Accès | Remarque |
| --- | --- | --- |
| `SUPER_ADMIN` | Oui | 2FA obligatoire |
| `ADMIN` | Oui | 2FA obligatoire |
| `ORDER_MANAGER` | Oui | 2FA recommandée, non imposée par le backend actuel |
| `STOCK_MANAGER` | Oui | Idem |
| `LIVREUR` | Oui | Redirigé vers A09b après connexion |
| `CUSTOMER` | Non | Message générique, aucune indication de rôle |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│  BRUNY SHOPPING              │
│  Espace équipe               │
│                              │
│  Connexion                   │
│  Accédez à votre back-office.│
│                              │
│  Identifiant ou e-mail       │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│  Mot de passe                │
│  ┌────────────────────────┐  │
│  │                    👁 │  │
│  └────────────────────────┘  │
│                              │
│  [   Se connecter        ]   │
│                              │
│  Mot de passe oublié ?       │
│                              │
│  Accès réservé à l’équipe    │
│  Bruny Shopping.             │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────┐
│              BRUNY SHOPPING                │
│              Espace équipe                 │
│   ┌──────────────────────────────────┐     │
│   │ Connexion                        │     │
│   │ Accédez à votre back-office.     │     │
│   │ Identifiant ou e-mail            │     │
│   │ [______________________________] │     │
│   │ Mot de passe                     │     │
│   │ [__________________________ 👁 ] │     │
│   │ [        Se connecter          ] │     │
│   │ Mot de passe oublié ?            │     │
│   └──────────────────────────────────┘     │
└────────────────────────────────────────────┘
```

### 1280 px

```text
┌───────────────────────┬──────────────────────────────┐
│  PANNEAU MARQUE       │  ZONE FORMULAIRE             │
│  fond navy            │  fond ivoire                 │
│                       │                              │
│  BRUNY SHOPPING       │      Connexion               │
│  L’atelier digital    │      Accédez à votre         │
│  de vos ventes.       │      back-office.            │
│                       │                              │
│  ✓ Commandes suivies  │      Identifiant ou e-mail   │
│  ✓ Stock maîtrisé     │      [__________________]    │
│  ✓ Équipe coordonnée  │      Mot de passe            │
│                       │      [______________ 👁 ]    │
│  Accès réservé à      │      [   Se connecter    ]   │
│  l’équipe Bruny.      │      Mot de passe oublié ?   │
└───────────────────────┴──────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `Input` | Identifiant, mot de passe, icône œil |
| `Button` | Primaire pleine largeur, état chargement |
| `Alert` | Erreur globale, compte verrouillé |
| `Icon` | Logo, œil, cadenas |
| `Spinner` | Dans le bouton uniquement |

Aucun composant nouveau n’est requis. Le panneau de marque est un bloc de mise en page, pas un composant partagé.

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide / initial | Champs vides, focus sur l’identifiant, bouton actif, aucun message |
| Chargement | Bouton désactivé, spinner, libellé « Connexion… », champs en lecture seule |
| Erreur | `Alert` au-dessus du formulaire, message générique ; erreur de champ si vide |
| Succès | Redirection immédiate, aucun message intermédiaire ; A02 ou A03 |

Cas supplémentaires :

- **Identifiants invalides** : « Identifiant ou mot de passe incorrect. » Toujours le même message.
- **Trop de tentatives (429)** : « Trop de tentatives. Réessayez dans quelques minutes. » Le bouton reste désactivé avec un compte à rebours.
- **Compte suspendu ou désactivé (403)** : « Cet accès est suspendu. Contactez un administrateur. »
- **Session existante** : redirection silencieuse vers A03, sans réafficher le formulaire.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre mobile | Connexion |
| Sous-titre | Accédez à votre back-office. |
| Libellé identifiant | Identifiant ou e-mail |
| Aide identifiant | Votre identifiant interne ou votre adresse e-mail. |
| Libellé mot de passe | Mot de passe |
| Bouton | Se connecter |
| Bouton chargement | Connexion… |
| Lien | Mot de passe oublié ? |
| Erreur générique | Identifiant ou mot de passe incorrect. |
| Erreur champs vides | Renseignez votre identifiant et votre mot de passe. |
| Erreur 429 | Trop de tentatives. Réessayez dans quelques minutes. |
| Erreur 403 | Cet accès est suspendu. Contactez un administrateur. |
| Erreur réseau | Connexion impossible. Vérifiez votre réseau et réessayez. |
| Pied de page | Accès réservé à l’équipe Bruny Shopping. |
| Panneau desktop | L’atelier digital de vos ventes. |
| Arguments desktop | Commandes suivies · Stock maîtrisé · Équipe coordonnée |

## 7. Interactions

1. `Entrée` soumet le formulaire depuis n’importe quel champ.
2. L’œil bascule l’affichage du mot de passe ; son libellé accessible change (« Afficher » / « Masquer »).
3. Le lien « Mot de passe oublié ? » ouvre le parcours public existant dans le même onglet.
4. Toute nouvelle saisie efface l’erreur globale, pas l’erreur de champ.
5. Après trois échecs, aucun compteur n’est affiché ; le backend applique seul le verrouillage.
6. En cas de succès sans 2FA, redirection vers l’URL demandée initialement (`returnUrl`) ou A03.
7. Si le livreur se connecte, redirection vers A09b.
8. Le formulaire ne propose ni « se souvenir de moi » ni connexion sociale.

## 8. Accessibilité WCAG 2.1 AA

- `form` avec `autocomplete="on"`, `input type="text"` et `autocomplete="username"`.
- Mot de passe : `type="password"`, `autocomplete="current-password"`.
- Labels visibles et liés par `for`/`id` ; pas de placeholder comme label.
- Erreur globale en `role="alert"` et `aria-live="assertive"`.
- Erreurs de champ avec `aria-invalid="true"` et `aria-describedby`.
- Focus visible double anneau, contrastes ≥ 4,5:1.
- Cibles ≥ 44 px, y compris l’œil et le lien.
- Ordre de tabulation : identifiant → mot de passe → œil → bouton → lien.
- Le panneau de marque est décoratif et masqué aux lecteurs d’écran si dupliqué.
- Titre de page : « Connexion — Bruny Shopping ».

## 9. Données API

Existant : `POST /api/v1/auth/login`, 10 requêtes/minute.

```json
{
  "identifier": "gerant@bruny.cm",
  "password": "••••••••"
}
```

Réponse nominale : utilisateur (`id`, `firstName`, `lastName`, `role`) et jetons. Si un challenge est requis, l’API renvoie un challenge (`setup` ou `verify`) et un jeton temporaire ; le frontend navigue vers A02 sans stocker de jeton d’accès.

| Cas | Statut | Traitement |
| --- | --- | --- |
| Identifiants invalides | 401 | Message générique |
| Compte suspendu | 403 | Message de suspension |
| Trop de requêtes | 429 | Compte à rebours |
| Validation | 400 | Erreur de champ |
| Réseau | — | Message de connexion |

Aucune donnée de rôle n’est affichée avant authentification.

## 10. Écarts et dépendances

- La route réelle actuelle est `/connexion`, pas `/admin/connexion`.
- Aucun CAPTCHA n’est implémenté : ne pas afficher de faux widget.
- Aucun « remember me » côté backend : ne pas le proposer.
- Le parcours de réinitialisation existe côté API mais la page cible n’est pas spécifiée dans DSG-06.
- Le taux de 10 requêtes/minute est backend ; l’UI ne doit pas le contourner.
- Les couleurs codées en dur du login actuel doivent être remplacées par les tokens.

## 11. Référence

- Zone L, header et identité de marque.
- `frontend/apps/admin/src/app/features/login/login-page.ts`.
- `backend/src/modules/auth/auth.controller.ts`.
- Tokens DSG-02 ; composants `Input`, `Button`, `Alert`.
