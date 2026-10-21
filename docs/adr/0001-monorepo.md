# ADR 0001 — Monorepo

- Statut : accepté
- Décision : garder API et frontends dans un dépôt unique, avec workspaces pnpm et workspace Nx dédié au frontend.
- Motif : une seule base de documentation et de CI, contrats API synchronisés, changements transversaux revus ensemble. Le backend reste un package indépendant afin de ne pas imposer les outils Angular/Nx au runtime API.
