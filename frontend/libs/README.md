# libs/ — Bibliothèques partagées

Bibliothèques consommées par `storefront` et `admin` — **jamais entre elles sans frontière explicite** (vérifié par ESLint module boundaries).

| Dossier          | Rôle                                                          |
| ---------------- | ------------------------------------------------------------- |
| `ui/`            | Composants visuels partagés (Button, Input, ProductCard…)     |
| `data-access/`   | Client API généré depuis l'OpenAPI, modèles, stores à signaux |
| `util/`          | Pipes (prix FCFA), validateurs (téléphone +237), helpers      |
| `design-tokens/` | Variables CSS/SCSS : couleurs, typographie, espacements       |
