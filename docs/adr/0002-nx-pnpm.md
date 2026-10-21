# ADR 0002 — Nx et pnpm

- Statut : accepté
- Décision : pnpm pour les workspaces et Nx pour graphe, cache et tâches Angular.
- Motif : déduplication des dépendances et tâches reliées aux projets frontend. Les builds SSR utilisent les builders Angular CLI standard; Nx les orchestre sans remplacer leur pipeline.
