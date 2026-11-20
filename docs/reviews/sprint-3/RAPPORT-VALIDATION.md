# Rapport de validation — Sprint 3

- **Date** : 20 novembre 2026
- **Branche de revue** : `review/sprint-3-final-audit`
- **Dernier commit validé** : `e04a00e` (`fix(ci): scope PORT to backend e2e processes [TEC-11]`)
- **Périmètre** : 19 tickets, 105 points
- **CI** : [run #101, succès](https://github.com/jordane237/e-commerce-brunyshop/actions/runs/44693959234)

## 1. Décision

Le Sprint 3 est **techniquement intégrable**, avec des réserves documentées qui ne permettent pas de le déclarer entièrement terminé.

- **3 tickets pleinement conformes** : CAT-08, CRT-02, ORD-01.
- **15 tickets conformes avec réserves** : le code peut être mergé, mais un critère de validation reste dépendant d'un autre ticket, d'une validation PO/juridique ou d'une preuve manquante.
- **1 ticket non conforme sur ses critères de validation** : CNT-03. Les documents sont prêts, mais les tarifs, délais et relectures externes ne sont pas validés.

Aucune correction fonctionnelle de tickets, aucun nettoyage de masse et aucune suppression n'ont été effectués pendant cette revue. Ces étapes restent soumises à validation.

## 2. État des 19 tickets

| Ticket | Statut d'audit | Réserve principale |
|---|---|---|
| AUT-09 | ⚠️ Conforme avec réserves | Route « mot de passe oublié » absente ; e2e de connexion/inscription à ajouter. |
| BO-01 | ✅ Conforme avec réserves | Dashboard livré, mais dépend des écrans métier non branchés. |
| BO-03 | ⚠️ Conforme avec réserves | Tests UI de la liste produits insuffisants pour démontrer la DoD. |
| CAT-07 | ⚠️ Conforme avec réserves | « Meilleures ventes » utilise le tri `newest` ; mesure LCP à trancher. |
| CAT-08 | ✅ Conforme | Filtres catalogue testés. |
| CAT-10 | ✅ Conforme avec réserves | Guide des tailles statique au lieu de l'API CAT-06. |
| CNT-03 | ❌ Non conforme | Tarifs/délais `[À confirmer]`, relecture externe absente. |
| CNT-07 | ⚠️ Conforme avec réserves | Dossier KYC prêt, sandbox non obtenu. |
| CRT-02 | ✅ Conforme | Store panier persistant et revalidation testés. |
| CRT-03 | ⚠️ Conforme avec réserves | CTA « Commander » désactivé faute de route P08. |
| CRT-04 | ⚠️ Conforme avec réserves | CTA de commande non activable avant le tunnel. |
| MKT-01 | ⚠️ Conforme avec réserves | Contenus légaux à valider par le propriétaire et un juriste. |
| MKT-02 | ✅ Conforme avec réserves | Formulaire contact fonctionnel ; SMTP et coordonnées réelles à valider. |
| MKT-04 | ⚠️ Conforme avec réserves | `InitiateCheckout` et `Purchase` non démontrables sans P11/P12. |
| MKT-06 | ⚠️ Conforme avec réserves | Masquage tunnel non e2e-testable sans routes ; numéro réel à remplacer. |
| OPS-01 | ✅ Conforme avec réserves | Workflow Docker Scan corrigé, mais un run vert dédié n'a pas été constaté. |
| ORD-01 | ✅ Conforme | API commande idempotente, transactionnelle et testée ; aucun écran ne la consomme. |
| STK-03 | ⚠️ Conforme avec réserves | Backend complet, `GET /admin/stock/alerts` non consommé par l'UI. |
| TEC-13 | ⚠️ Conforme avec réserves | Migration i18n partielle (~271 textes en dur). |

## 3. Consommation frontend ↔ backend

La matrice complète est dans [`FRONTEND-BACKEND-CONSUMPTION.md`](FRONTEND-BACKEND-CONSUMPTION.md).

| Statut | Nombre | Détail |
|---|---:|---|
| ✅ Consommés | 14 | Flux du Sprint 3 réellement branchés côté UI. |
| ❌ Non consommés | 17 | 13 écrans futurs justifiés, 4 oublis. |
| ➖ Hors périmètre | 2 | Health checks d'infrastructure. |

Les quatre oublis à traiter sont :

1. `GET /size-guides/{categoryId}` : guide statique et catégorie non transmise.
2. `GET /admin/stock/alerts` : aucun écran Stock/dashboard ne l'appelle.
3. `POST /auth/forgot-password` et `POST /auth/reset-password` : lien mort dans AUT-09.
4. `POST /orders` : aucun wrapper `OrdersApi` avant P11.

## 4. Corrections d'infrastructure réalisées pendant la revue

La CI est passée de rouge à verte sur les sept jobs (`quality`, `build`, `api-client`, `openapi-check`, `security`, `e2e`, `ci-success`).

- Migration `notifications` renommée pour respecter l'ordre chronologique Prisma.
- Audit de sécurité limité aux dépendances de production ; overrides `body-parser`, `multer` et `vite`.
- Gitleaks exécuté via le binaire CLI épinglé, l'action GitHub exigeant désormais une licence.
- E2E backend et frontend séparés, avec API et storefront démarrés et attendus avant les tests.
- `PORT=4000` limité aux processus backend : Angular SSR ne doit pas hériter de ce port.
- Attente d'hydratation Angular ajoutée aux e2e ; suite frontend sérialisée pour éviter la contention.
- Notifications rendues tolérantes aux suppressions concurrentes (P2025) et aux transactions déjà fermées à l'arrêt (P2028).

## 5. Vérifications exécutées

| Vérification | Résultat |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm build` | ✅ |
| Backend e2e sur base vierge (231 tests) | ✅ |
| Frontend e2e (53 tests) | ✅ |
| `pnpm audit --prod --audit-level=high` | ✅ 0 vulnérabilité haute (6 modérées) |
| Gitleaks sur l'historique local | ✅ aucune fuite |
| CI GitHub complète | ✅ run #101 |

## 6. Limites non levées

- Le tunnel P08–P13 n'existe pas : les parcours panier → commande → confirmation ne sont pas démontrables de bout en bout.
- Aucun ID Meta Pixel ni numéro WhatsApp réel n'a été fourni ; les intégrations restent configurables mais non validées en production.
- Aucun test avec lecteur d'écran réel (NVDA/VoiceOver) n'a été réalisé.
- CNT-03 et les contenus légaux MKT-01 nécessitent une validation humaine externe.
- Le run Docker Scan dédié n'a pas été observé vert après la correction de l'action Trivy.

## 7. Prochaines étapes proposées

1. Valider ce rapport et le périmètre des réserves avec le PO.
2. Traiter les quatre oublis de consommation frontend dans des tickets dédiés.
3. Ouvrir les tickets P08–P13 pour rendre le tunnel et les événements marketing démontrables.
4. Planifier la validation juridique de CNT-03/MKT-01 et la vérification d'accessibilité.
5. Après validation seulement, préparer `CLEANUP-PLAN.md` et les corrections de tickets.
