# Protection de la branche `main`

Ce document décrit la configuration requise côté GitHub pour sécuriser la branche `main` du dépôt BRUNY SHOPPING.

---

## 1. Branch protection rule pour `main`

Aller dans : **Settings → Branches → Add branch protection rule**

**Branche name pattern :** `main`

### Checks requis

| Option | Cocher |
|---|---|
| Require a pull request before merging | ✅ |
| Require approvals | ✅ (1 minimum, **2 recommandé**) |
| Require status checks to pass before merging | ✅ |
|  - *Find required status checks* | ➤ Cocher **ci-success** (job agrégateur) |
| Require branches to be up to date before merging | ✅ |
| Require conversation resolution before merging | ✅ |
| Do not allow bypassing the above settings | ✅ (même les admins soumis) |
| Restrict who can push to matching branches | ☐ (optionnel) |

### Historique linéaire

| Option | Cocher |
|---|---|
| Require linear history | ✅ (si équipe utilise squash/rebase) |

### Paramètres de sécurité

| Panneau | Action |
|---|---|
| Settings → Code security and analysis | **Secret scanning** activé |
| Settings → Code security and analysis | **Push protection** activé |

### Dependabot

| Panneau | Action |
|---|---|
| Settings → Code security and analysis | **Dependabot** activé |

Le fichier `.github/dependabot.yml` est présent à la racine et configure :
- Mise à jour hebdomadaire des dépendances **pnpm** (dossier `/`)
- Mise à jour hebdomadaire des **actions GitHub**

---

## 2. Vérification par status check

> **Règle d'or** : cocher le status check **`ci-success`** (job agrégateur), et **non** chaque job individuellement. Cela évite les faux positifs lorsque l'un des jobs est temporairement ignoré.

Le job `ci-success` échoue si l'un des jobs suivants a échoué :

- `quality`
- `build`
- `e2e`
- `security`
- `openapi-check`

Le status check `ci-success` est celui qui doit être coché pour autoriser la fusion.

---

## 3. Procédure de livraison

### Avec Pull Request (recommandé)
1. Créer une branche `feature/...` ou `fix/...`
2. Développer, tester localement (`pnpm lint`, `pnpm test`, `pnpm test:e2e`)
3. Ouvrir une PR vers `main` (1 ou 2 relecteurs requis)
4. CI s'exécute automatiquement (jobs `quality`, `build`, `e2e`, `security`, `openapi-check`, `ci-success`)
5. Quand tous les checks sont verts, la PR est mergée (squash recommandé)
6. Le merge de `working` → `main` est géré par les scripts Git (voir `docs/WORKFLOW.md`)

### Push direct (interdit sur `main`)

Le hook Husky `.husky/pre-push` bloque les pushes directs sur `main`.
Seul `git release` (via `scripts/git-flow.sh`) est autorisé à pousser sur `main`, en définissant `ALLOW_MAIN_PUSH=1`.

---

## 4. Secrets

| Section | Configuration |
|---|---|
| Settings → Secrets and variables → Actions | Utiliser les secrets GitHub natifs (`JWT_SECRET`, `COOKIE_SECRET`) |
| Secret scanning | Activé (Détection de secrets accidentellement commités) |
| Push protection | Activé (Blocage de push si un secret est détecté) |

Les valeurs de test utilisées en CI sont des constantes inline dans le workflow (`JWT_SECRET`, `COOKIE_SECRET`, etc.), **jamais** de secrets réels.

---

## 5. Références

- Documentation GitHub : https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- Gitleaks : https://github.com/gitleaks/gitleaks
- Dependabot : https://docs.github.com/en/code-security/dependabot
