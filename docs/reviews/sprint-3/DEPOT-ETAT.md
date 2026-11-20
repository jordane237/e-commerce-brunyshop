# État du dépôt — Sprint 3

- **Date** : 20 novembre 2026
- **Branche de revue** : `review/sprint-3-final-audit`
- **Dernier commit validé** : `06522bd` (`fix(facebook-cta): restore formatting after coordinate update`)
- **CI** : [run #44702729154, succès](https://github.com/jordane237/e-commerce-brunyshop/actions/runs/44702729154)

## 1. Branches

- `working` reste à l'état de fin de Sprint 2 (`45cd3de`) ; aucun ticket Sprint 3 n'y est mergé.
- La revue a été menée sur la pile Sprint 3, tête `feature/MKT-06-whatsapp-floating-button`.
- Branche de sauvegarde : `backup/sprint-3-before-review-20261119-230733`, poussée sur `origin`.
- Aucun tag de sprint n'existe.

## 2. Commits de revue

Les corrections de revue ont été ajoutées sans réécrire l'historique :

1. `e04a00e` — migration Prisma notifications + scoping `PORT`.
2. `de35fef` — storefront démarré hors Playwright `webServer`.
3. `b9a9989` — Angular CLI direct dans Playwright.
4. `d3219cf` — Gitleaks CLI + exposition des échecs e2e backend.
5. `31ceb20` — tolérance P2025/P2028 notifications.
6. `2743c5e` — rapport de validation.
7. `2c9fdd1` — `allowedHosts` du dev server.
8. `2256327` — coordonnées WhatsApp/Facebook réelles.
9. `06522bd` — correction de formatage CTA Facebook.

## 3. État de travail

- Arbre propre après `06522bd`, hormis le verrou LibreOffice `.~lock.Tickets_BRUNY_SHOPPING.docx#` (non suivi).
- Aucun secret committé ; `.env` reste local et ignoré.
- `Tickets_BRUNY_SHOPPING.docx` est encore suivi par Git malgré la règle locale sur les specs confidentielles.

## 4. Décision restante

Un fast-forward de `working` vers `06522bd` est possible après validation PO. Aucun merge commit n'est nécessaire. La décision sur `Tickets_BRUNY_SHOPPING.docx` reste à trancher (conserver ou retirer du suivi).