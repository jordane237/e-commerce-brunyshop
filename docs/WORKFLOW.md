# Workflow Git — BRUNY SHOPPING

Ce document décrit le flux de branches, les commandes du quotidien et les conventions de commit du dépôt.

## 1. Modèle de branches

```
                   feature/<nom>              working                 main
                  (développement)          (intégration)            (stable)
                       │                       │                      │
   git nf <nom> ──────►│                       │                      │
   git publish ────────┼──────────────────────►│                      │
   git release ────────┼───────────────────────┼─────────────────────►│
                       │                       │                      │
                 tu développes          les features y          ne reçoit que des
                 et commites ici         sont mergées           merges depuis working
                                          (via publish)         (via release uniquement)
```

Flux : **`feature/*` → (merge) → `working` → (merge) → `main`**

- `feature/<nom>` : branches courtes où se fait le développement. Créées depuis `working` à jour.
- `working` : branche d'intégration, branche de travail par défaut. Les features y sont mergées.
- `main` : branche stable, toujours fonctionnelle. **Aucun commit direct** ; elle ne reçoit que des merges depuis `working`.

## 2. Prérequis (une seule fois par clone)

Les alias Git (`nf`, `sync`, `publish`, `release`) sont versionnés dans `aliases.gitconfig` et activés par :

```bash
git config include.path ../aliases.gitconfig
```

> Cette commande est déjà faite sur ta machine. Sur un nouveau clone, relance-la (ou `pnpm setup` quand il existera).

Les hooks Husky (`pre-commit`, `commit-msg`, `pre-push`) s'installent automatiquement via le script `prepare` (`husky`) au `pnpm install`.

## 3. Commandes du quotidien

| Commande       | Action                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| `git nf <nom>` | Crée `feature/<nom>` à partir de `working` à jour (kebab-case requis)   |
| `git sync`     | Met à jour `working` depuis `origin/working`                            |
| `git publish`  | Merge la feature courante dans `working` (`--no-ff`), puis pousse       |
| `git release`  | Merge `working` dans `main` (`--no-ff`, avec confirmation), puis pousse |

### Exemple complet d'une tâche

```bash
git nf ajout-panier        # 1. branche feature/ajout-panier depuis working à jour
# ... développement + git commit ...
git publish                # 2. merge feature -> working + push
# (revenir sur working et faire un autre nf pour la tâche suivante, ou)
git release                # 3. merge working -> main + push (release stable)
```

### Commandes Git brutes (sans alias)

```bash
git checkout working && git pull                 # sync
git checkout -b feature/<nom>                    # nf (manuel)
git checkout working && git merge --no-ff feature/<nom> && git push   # publish (manuel)
git checkout main && git merge --no-ff working && git push            # release (manuel, bloqué par le hook)
```

## 4. Garde-fous

### Hook `pre-push` (`.husky/pre-push`)

Bloque tout `git push` **direct** sur `main`. Seul `git release` peut pousser sur `main` : il définit `ALLOW_MAIN_PUSH=1` dans l'environnement, ce qui lève le blocage de façon contrôlée.

```bash
# Ceci échoue (bloqué) :
git checkout main && git push origin main
# Ceci passe (via release) :
git release
```

### Hooks Husky existants

- `pre-commit` : exécute `lint-staged` (ESLint + Prettier) sur les fichiers stagés.
- `commit-msg` : valide le message avec Commitlint (Conventional Commits).

## 5. Convention de commits

Conventional Commits, imposé par Commitlint (`commitlint.config.mjs` + `@commitlint/config-conventional`) :

```
<type>(<portée>) : <description en minuscules, impératif, sans point final>

feat      : une nouvelle fonctionnalité
fix       : un correctif
chore     : tâche de maintenance sans effet utilisateur
docs      : documentation
style     : formatage, sans effet sur le sens
refactor  : restructuration sans changement de comportement
test      : ajout ou correction de tests
build     : chaîne de build ou dépendances
ci        : configuration CI
perf      : amélioration de performance
revert    : annulation d'un commit précédent
```

Exemples : `feat(panier): ajouter le calcul du total FCFA`, `chore(repo): aligner Node sur 24.11.0`.

## 6. Nommage des branches

- `feature/<nom>` : kebab-case en minuscules, chiffres et tirets uniquement (ex. `feature/ajout-panier`). Le script `nf` valide ce format.
- `working` et `main` : noms fixes, ne jamais renommer.

## 7. Règles de protection

- **Ne jamais** faire de commit direct sur `main`.
- **Ne jamais** pousser en force (`git push --force`) sur `working` ou `main`.
- Les merges se font avec `--no-ff` pour conserver une historique explicite du flux.
- Les protections de branche côté GitHub (bloque les pushes directs + force-pushs sur `main`) sont à configurer manuellement — voir la section suivante.

## 8. Protéger les branches sur GitHub (à faire manuellement)

Le CLI `gh` n'est pas installé ; ces règles se configurent dans l'interface web :

1. Ouvre `https://github.com/jordane237/e-commerce-brunyshop/settings/branches`.
2. Sur `main`, clique **Add branch protection rule** et active :
   - **Require a pull request before merging** (nombre de reviews selon ton besoin, ex. 1).
   - **Require status checks to pass before merging** (ex. `ci` — la workflow `.github/workflows/ci.yml`).
   - **Do not allow force pushes**.
   - **Do not allow deletions**.
3. Répète sur `working` si tu veux la protéger (recommandé : **Do not allow force pushes** uniquement, car `working` reçoit des pushes réguliers via `git publish`).

> ⚠️ **Point à trancher** : activer « Require a pull request before merging » sur `main` **bloquera aussi `git release`** (qui fait un push direct). Deux options :
>
> - **Option A (flux strict)** : garder « Require a pull request » sur `main` et remplacer `git release` par l'ouverture d'une PR `working` → `main` sur GitHub.
> - **Option B (flux release direct)** : ne **pas** activer « Require a pull request » sur `main`, mais activer « Do not allow force pushes » + restreindre les pushes à toi/bot. `git release` continue de fonctionner (déjà protégé en local par le hook).
>
> Le hook local `pre-push` protège `main` dans les deux cas, même sans réglage GitHub.

## 9. Nettoyage à prévoir (hors workflow)

Le commit `17d2c1e` a versionné par erreur : `backend/dist/**` (build), `design1/**` (~60 Mo de maquettes) et les fichiers `Tickets_BRUNY_SHOPPING.*`. Le `.gitignore` a été corrigé pour le futur, mais ces fichiers restent trackés. Pour les désindexer **sans les supprimer du disque** :

```bash
git rm -r --cached backend/dist design1 Tickets_BRUNY_SHOPPING.csv Tickets_BRUNY_SHOPPING.docx
git commit -m "chore(repo): untrack build output and design assets"
git push origin working   # puis git release
```

Pour purger les ~60 Mo de l'historique (optionnel, plus complexe) : utiliser `git filter-repo`, ce qui nécessite un force-push et une coordination de tous les clones — **à faire uniquement avec un accord explicite**.
