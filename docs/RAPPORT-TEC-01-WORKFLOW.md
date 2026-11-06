# Rappor  d'intervention — BRUNY SHOPPING

> Rapport consolidé de l'ensemble des travaux réalisés : audit du ticket **TEC-01**, verrouillage de la version Node, et mise en place du **workflow Git** (branches, alias, hooks, documentation).

- **Dépôt** : `https://github.com/jordane237/e-commerce-brunyshop`
- **Date** : 21 octobre 2026
- **Périmètre** : infrastructure uniquement (aucun code métier touché)

---

## Sommaire

1. [Audit du ticket TEC-01](#1-audit-du-ticket-tec-01)
2. [Verrouillage de la version Node](#2-verrouillage-de-la-version-node)
3. [Mise en place du workflow Git](#3-mise-en-place-du-workflow-git)
4. [Test de bout en bout](#4-test-de-bout-en-bout)
5. [Liste des fichiers créés et modifiés](#5-liste-des-fichiers-créés-et-modifiés)
6. [Points restants (décisions humaines)](#6-points-restants-décisions-humaines)
7. [Vérifications et limites](#7-vérifications-et-limites)

---

## 1. Audit du ticket TEC-01

Vérification de la structure existante (le ticket était déjà réalisé à ~60 %). Résultat par critère :

| Critère                                            | État       | Preuve / action                                                                                                                                            |
| -------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure `apps/{storefront,admin,api}` + `libs/*` | ⚠️ partiel | `frontend/apps/{storefront,admin}` et `frontend/libs/{ui,data-access,util,design-tokens}` présents ; l'API est dans `backend/` (écart à documenter en ADR) |
| Gestionnaire de paquets verrouillé                 | ✅         | `packageManager: pnpm@12.11.2`                                                                                                                             |
| Node verrouillé (`.nvmrc` + `engines`)             | ⚠️ → ✅    | `.nvmrc` présent ; `engines` absent → **corrigé (voir §2)**                                                                                                |
| Installation en une commande (`pnpm setup`)        | ❌         | Script `setup` absent — **TODO** (non fabriqué pour éviter d'inventer)                                                                                     |
| `.editorconfig`                                    | ✅         | 2 espaces, LF, UTF-8, trim, final newline                                                                                                                  |
| `.gitattributes`                                   | ✅         | `* text=auto eol=lf` + binaires                                                                                                                            |
| `.gitignore` complet                               | ⚠️ → ✅    | `/backend/dist` et `*.log` manquants → **corrigés (voir §3)**                                                                                              |
| `.env.example`                                     | ✅         | Correspond aux variables de `backend/src/config/env.validation.ts`, aucune valeur réelle                                                                   |
| README racine en français                          | ✅         | Déjà complet (prérequis, installation, structure, scripts, docs)                                                                                           |
| ADR monorepo (0001 + 0002)                         | ⚠️         | Existants mais courts (statut/décision/motif)                                                                                                              |
| `dist/`, `node_modules/` trackés                   | ⚠️         | Non trackés au moment de l'audit ; **régresse dans le commit `17d2c1e`** (voir §6)                                                                         |
| Aucun secret versionné                             | ✅         | Scan propre (pas de `.env`, token ni clé en dur)                                                                                                           |

**Décisions d'architecture signalées** :

- Numérotation des ADR : `0003`/`0004` déjà occupés par d'autres sujets → ADR « api-location » et « node-pnpm-pinning » à numéroter `0006`/`0007` si créés.

---

## 2. Verrouillage de la version Node

Alignement de tous les fichiers sur **Node 24.11.0** (la version réellement installée).

| Fichier                 | Avant               | Après                                    |
| ----------------------- | ------------------- | ---------------------------------------- |
| `.nvmrc`                | `24.15.0`           | `24.11.0`                                |
| `package.json` (racine) | pas de `engines`    | `"engines": { "node": ">=24.11.0 <25" }` |
| `README.md`             | prérequis `24.15.0` | prérequis `24.11.0`                      |

- `packageManager: pnpm@12.11.2` déjà présent et inchangé.
- Vérifications : JSON valide, plus aucune référence à `24.15.0` dans le dépôt.

---

## 3. Mise en place du workflow Git

Modèle de branches : **`feature/*` → (merge) → `working` → (merge) → `main`**

```
                   feature/<nom>              working                 main
                  (développement)          (intégration)            (stable)
   git nf <nom> ──────►│                       │                      │
   git publish ────────┼──────────────────────►│                      │
   git release ────────┼───────────────────────┼─────────────────────►│
```

### 3.1 Branches

- `working` créée à l'état actuel, poussée avec `-u`, définie comme branche de travail par défaut.
- `main` alignée sur `working` (merge `--no-ff` pour tracer l'historique), poussée avec `-u`.
- Aucun `--force`, aucune suppression.

### 3.2 Alias Git (versionnés)

Définis dans `aliases.gitconfig`, activés via `git config include.path ../aliases.gitconfig`, et délégués à `scripts/git-flow.sh` :

| Alias          | Action                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| `git nf <nom>` | Crée `feature/<nom>` depuis `working` à jour (valide le kebab-case)     |
| `git sync`     | Met à jour `working` depuis `origin/working`                            |
| `git publish`  | Merge la feature courante dans `working` (`--no-ff`), puis pousse       |
| `git release`  | Merge `working` dans `main` (`--no-ff`, avec confirmation), puis pousse |

### 3.3 Hooks

- **`.husky/pre-push`** (nouveau) : bloque tout push direct sur `main`, sauf via `git release` (qui définit `ALLOW_MAIN_PUSH=1`).
- Hooks existants préservés : `pre-commit` (lint-staged), `commit-msg` (Commitlint / Conventional Commits).

### 3.4 `.gitignore`

Ajouts : `/backend/dist`, `*.log`.

### 3.5 Documentation

`docs/WORKFLOW.md` (français) : flux de branches, commandes du quotidien, garde-fous, convention de commits, nommage des branches, étapes de protection GitHub.

---

## 4. Test de bout en bout

Exécution réelle du flux complet :

1. **`feature/test-workflow`** créée depuis `working` à jour.
2. **Commit** `d734fcf` — validé par lint-staged (prettier) + Commitlint.
3. **`publish`** → merge `--no-ff` vers `working` : `d234a74`, poussé.
4. **`release`** → merge `--no-ff` vers `main` : `2fe9896`.
5. **Test négatif** : push direct sur `main` **bloqué** par le hook (code de sortie 1). ✔
6. **Release réel** : push sur `main` avec `ALLOW_MAIN_PUSH=1` **accepté**. ✔
7. **Interface alias** : `git nf` sans argument affiche l'usage (code 1), prouvant le délègement au script. ✔

---

## 5. Liste des fichiers créés et modifiés

### Créés

| Fichier               | Rôle                                                  |
| --------------------- | ----------------------------------------------------- |
| `.husky/pre-push`     | Hook de blocage des pushes directs sur `main`         |
| `aliases.gitconfig`   | Alias Git versionnés (nf, sync, publish, release)     |
| `scripts/git-flow.sh` | Implémentation des commandes du workflow (exécutable) |
| `docs/WORKFLOW.md`    | Documentation du flux Git (français)                  |

### Modifiés

| Fichier                 | Changement                      |
| ----------------------- | ------------------------------- |
| `.nvmrc`                | `24.15.0` → `24.11.0`           |
| `package.json` (racine) | ajout de `engines.node`         |
| `README.md`             | prérequis Node mis à jour       |
| `.gitignore`            | ajouts `/backend/dist`, `*.log` |

### Configuration locale (non versionnée)

- `git config include.path ../aliases.gitconfig` — à relancer sur tout nouveau clone.

---

## 6. Points restants (décisions humaines)

1. **Protections de branche GitHub** (CLI `gh` non installé) — à faire dans l'interface :
   - `main` : _Do not allow force pushes_ + _Do not allow deletions_ (+ _Require a PR_ selon l'arbitrage ci-dessous).
   - `working` : _Do not allow force pushes_.
   - Étapes détaillées : `docs/WORKFLOW.md` §8.

2. **Arbitrage sur `main`** : le modèle « merge uniquement via PR » entre en conflit avec l'alias `git release` (push direct) :
   - **Option A** — _Require a PR_ sur `main` : `git release` sera bloqué serveur ; ouvrir une PR `working`→`main`.
   - **Option B** (recommandée pour garder l'alias) — pas de _Require a PR_, seulement _no force-push_ ; le hook local protège déjà `main`.

3. **Dette technique — fichiers trackés à tort** dans le commit `17d2c1e` :
   - `backend/dist/**` (~100 fichiers de build), `design1/**` (~60 Mo de maquettes), `Tickets_BRUNY_SHOPPING.*`.
   - Le `.gitignore` est corrigé pour le futur, mais ces fichiers restent trackés.
   - Désindexation (sans supprimer du disque) :
     ```bash
     git rm -r --cached backend/dist design1 Tickets_BRUNY_SHOPPING.csv Tickets_BRUNY_SHOPPING.docx
     git commit -m "chore(repo): untrack build output and design assets"
     ```
   - Purger les ~60 Mo de l'historique nécessiterait `git filter-repo` + force-push → **uniquement avec accord explicite**.

4. **Branche `feature/test-workflow`** : mergée mais toujours présente → suppression possible sur demande.

5. **Script `pnpm setup`** (TEC-01) : toujours absent — à créer si souhaité (non fabriqué pour ne pas inventer de comportement).

---

## 7. Vérifications et limites

### Vérifications passées (par exécution réelle)

- Alias chargés (`include.path`) et script exécutable.
- Commit validé par lint-staged + Commitlint.
- Merges `--no-ff` sans conflit.
- Hook `pre-push` : blocage confirmé (code 1) puis release accepté avec override.
- Version Node cohérente partout, JSON valide.

### Limites

- Protections GitHub non appliquables en local (étapes fournies).
- Aucun build/test applicatif relancé : ces changements sont de la configuration Git/docs, sans impact sur le code TypeScript/Angular.
- Aucune opération destructive effectuée (pas de `--force`, `reset --hard`, ni suppression de branche).
