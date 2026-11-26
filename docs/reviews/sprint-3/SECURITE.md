# Sécurité — Sprint 3

- **Date** : 20 novembre 2026
- **Branche** : `review/sprint-3-final-audit`
- **Commit** : `06522bd`

## 1. Audit des dépendances

- Audit limité aux dépendances de production : `pnpm audit --prod --audit-level=high`.
- Résultat : 0 vulnérabilité haute, 6 modérées.
- Overrides ajoutés : `body-parser`, `multer`, `vite`.

## 2. Secrets

- Aucun `.env` réel, `.pem`, `.key` ou log suivi par Git.
- Le `.env` racine est présent localement et ignoré.
- Gitleaks exécuté sur l'historique local : aucune fuite détectée.
- Gitleaks CLI épinglé dans la CI car l'action GitHub exige désormais une licence.

## 3. Infrastructure CI

- Les sept jobs CI sont verts sur le dernier run : `quality`, `security`, `build`, `api-client`, `openapi-check`, `e2e`, `ci-success`.
- Run de référence : [44702729154](https://github.com/jordane237/e-commerce-brunyshop/actions/runs/44702729154).

## 4. Réserves

- `OPS-01` : le run Docker Scan dédié n'a pas été observé vert après correction de l'action Trivy.
- Aucun test avec lecteur d'écran réel (NVDA/VoiceOver) n'a été réalisé.
- Les contenus légaux MKT-01 et les politiques CNT-03 nécessitent une validation humaine externe.