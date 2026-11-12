# Changelog — Design System BrunyShop

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnement sémantique.

## [1.0.0] — 2026-11-11

### Ajouté

- `README.md` : point d’entrée, périmètre, priorités des sources, règles de contribution.
- `ACCESSIBILITY.md` : règles WCAG 2.1 AA, contrastes calculés, état par composant et par parcours, protocole de test.
- `TOKENS.md` : index canonique des 120 tokens et règles d’usage.
- `COMPOSANTS.md` : catalogue des 16 composants livrés, contrats, états, défauts et composants manquants.
- `GLOSSAIRE.md` : index des actions, statuts, erreurs et formats.
- `CHANGELOG.md` : ce fichier.
- Liens vers l’inventaire, l’audit WCAG, l’audit de cohérence, les corrections, les tickets, le glossaire complet, les parcours et le gel DSG-07.

### Modifié

- Statut du Design System porté à **1.0.0 gelé pour le MVP**.
- La hiérarchie des sources place désormais le gel, le glossaire et l’accessibilité avant la planche.
- Le catalogue de composants distingue explicitement les composants livrés des composants spécifiés mais absents.

### Corrigé

- Références croisées vers les documents DSG-07.
- Rappel que `--bs-color-border-strong` (`#DCE0E7`) ne doit pas être présenté comme conforme pour une bordure de contrôle.
- Rappel que `#8990A0` est interdit comme placeholder.

### Connu / non résolu

- Bordures de contrôle à 1,32:1 (ticket DSG-07-FIX-C03).
- `aria-describedby` des Checkbox/Radio/Toggle vers un `id` absent (DSG-07-FIX-C04).
- Absence de `StatusBadge`, `CardList`, `ConfirmDialog`, `Tabs`, `Stepper`, `Timeline`, `Alert`, `EmptyState`.
- Aucune maquette desktop, aucun état de focus dans la planche.
- Validation PO des specs DSG-04/05/06 non signée.

## [0.2.0] — 2026-10-24

### Ajouté

- Tokens SCSS et CSS, 120 variables, parité entre les deux fichiers.
- 16 composants standalone dans `@bruny/ui`.
- Route de démonstration `/design-system`.
- Tests Vitest des composants.
- `DESIGN-AUDIT.md`, `ASSUMPTIONS.md`, `tokens-reference.md`.

### Modifié

- Passage des couleurs brutes aux custom properties `--bs-*`.
- Conservation des alias hérités `--color-*` pour les pages non migrées.

### Connu

- La planche ne spécifie ni Toast, ni Skeleton, ni Modal, ni Select, ni Checkbox/Radio/Toggle, ni Table desktop.
- Les contrastes or/WhatsApp/succès sont corrigés par des variantes fortes, mais la planche reste non conforme.

## [0.1.0] — 2026-10-23

### Ajouté

- Audit initial de la planche `design1/bruny shopping/bruny shopping.png`.
- Palette, typographie, espacements, rayons, ombres et composants observés.
- Premières mesures de contraste et recommandations AA.

### Connu

- Une seule planche PNG, aucun export par écran, aucun fichier Figma.
- Valeurs non étiquetées reconstituées dans `ASSUMPTIONS.md`.
