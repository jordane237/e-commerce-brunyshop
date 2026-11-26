# Design System BrunyShop

**Version** : 1.0.0
**Statut** : gel MVP documentaire (11 novembre 2026)
**Portée** : storefront, espace client, back-office et interface livreur.

## 1. À quoi sert ce dossier

Ce dossier est la référence unique pour :

- les **tokens** de couleur, typographie, espacement, rayon, ombre et mouvement ;
- les **composants** Angular de `@bruny/ui` et leurs états ;
- les **règles d’accessibilité** WCAG 2.1 AA ;
- le **vocabulaire** des microtextes ;
- l’**historique** des décisions de design.

Il ne remplace pas les specs écran. Il fournit le socle commun que les specs doivent respecter.

## 2. Documents

| Document | Rôle | Quand le consulter |
|---|---|---|
| [`DESIGN-AUDIT.md`](./DESIGN-AUDIT.md) | Audit initial de la planche et des écarts | Comprendre l’origine des tokens |
| [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) | Valeurs reconstituées et hypothèses | Doute sur une valeur non étiquetée |
| [`TOKENS.md`](./TOKENS.md) | Index canonique des tokens | Choisir une couleur, un espace, un focus |
| [`tokens-reference.md`](./tokens-reference.md) | Table détaillée des 120 variables SCSS/CSS | Implémenter ou vérifier une variable |
| [`COMPOSANTS.md`](./COMPOSANTS.md) | Catalogue des composants et de leurs états | Construire un écran |
| [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) | Règles, contrastes calculés, tests | Vérifier un écran ou un composant |
| [`GLOSSAIRE.md`](./GLOSSAIRE.md) | Index du vocabulaire et des formats | Écrire un libellé |
| [`CHANGELOG.md`](./CHANGELOG.md) | Historique des versions | Savoir ce qui a changé |

Les livrables de la revue finale sont dans [`../design/DSG-07/`](../design/DSG-07/README.md) :

- inventaire, audit WCAG, audit de cohérence ;
- corrections, tickets post-gel ;
- glossaire complet, parcours UX ;
- gel MVP.

## 3. Ordre de priorité des sources

En cas de contradiction :

1. **Décision de gel** (`DESIGN-FREEZE.md`) ;
2. **Glossaire des microtextes** ;
3. **Audit d’accessibilité** et `ACCESSIBILITY.md` ;
4. **Spec d’écran** DSG-04/05/06 ;
5. **Tokens** et composants ;
6. **Planche PNG** ;
7. **Audit initial** et hypothèses.

La planche est une intention visuelle, pas une vérité pixel-perfect. Une valeur de la planche qui échoue AA est remplacée par le token conforme.

## 4. Ce qui est livré

| Élément | État |
|---|---|
| Tokens SCSS et CSS | Livrés, 120 variables, parité vérifiée |
| 16 composants `@bruny/ui` | Livrés |
| Route de démonstration `/design-system` | Livrée |
| Tests Vitest des composants | Livrés |
| Documentation Design System | Livrée (ce dossier) |
| Audit WCAG des 58 vues | Livré dans DSG-07 |
| Glossaire complet | Livré dans DSG-07 |
| Parcours UX | Livré dans DSG-07 |
| Maquettes desktop | **Non livrées** |
| Composants `StatusBadge`, `CardList`, `ConfirmDialog`, `Tabs`, `Stepper`, `Timeline`, `Alert`, `EmptyState` | **Non livrés** |

## 5. Ce qui n’est pas garanti

- Aucune conformité WCAG n’est certifiée : l’audit porte sur les sources et le code, pas sur des tests utilisateurs réels.
- Les composants non implémentés sont spécifiés, pas rendus.
- La planche ne couvre pas le desktop, les états de focus, les erreurs et les chargements.
- Les validations DSG-04/05/06 ne sont pas signées.
- Les parcours décrivent la cible, pas l’état actuel du produit.

## 6. Règles de contribution

1. **Aucune couleur brute** dans un composant ou une spec : utiliser `var(--bs-…)`.
2. **Aucun libellé hors glossaire** : ajouter la chaîne au glossaire avant la maquette.
3. **Aucun composant sans état** : normal, survol, focus, actif, désactivé, chargement, erreur, vide.
4. **Aucune action icône seule** sans `aria-label`.
5. **Aucune information par la couleur seule**.
6. **Aucun texte sous 12 px** pour une information.
7. **Aucune cible sous 44 × 44 px**.
8. **Aucun mouvement** sans `prefers-reduced-motion`.
9. **Aucune promesse** d’une fonctionnalité absente du backend.
10. **Toute dérogation** est écrite, datée et associée à un ticket.

## 7. Structure du code

```text
frontend/libs/design-tokens/   tokens SCSS + CSS
frontend/libs/ui/src/lib/      16 composants standalone
frontend/apps/storefront/      démo /design-system
frontend/apps/admin/           back-office
```

Les composants sont standalone, en signals, `ChangeDetectionStrategy.OnPush`, sans dépendance à une librairie UI externe. Les tokens sont consommés via custom properties ; les alias hérités `--color-*` restent disponibles pour les pages non migrées.

## 8. Vérification rapide

```bash
pnpm -C frontend lint
pnpm -C frontend test
pnpm -C frontend build
```

La route `/design-system` permet de vérifier visuellement les composants. Les contrastes se vérifient avec `TOKENS.md` et `ACCESSIBILITY.md`, pas à l’œil.

## 9. Contact et gouvernance

Le Design System est maintenu par l’équipe design/frontend. Toute évolution majeure passe par une revue d’accessibilité et une entrée dans le `CHANGELOG.md`. La version 1.0.0 est gelée pour le MVP ; les ajouts de composants sont des tickets post-gel.
