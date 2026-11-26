# Audit CAT-07 — Page d'accueil de la boutique

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Conforme P01 : bannière, catégories, Nouveautés, Meilleures ventes, Promotions, réassurance, Facebook | ⚠️ | `home.component.html` et sections `hero-banner`, `categories-pills`, `product-section`, `reassurance-band`, `facebook-cta`. « Meilleures ventes » utilise `sort: 'newest'` — aucun tri popularité backend (`home-data.service.ts:66-80`) |
| 2 | Rendu côté serveur, image principale préchargée | ✅ | SSR vérifié dans `VERIFICATION.md` §1 ; `fetchpriority="high"` et preload documentés ; e2e `ssr` de la fiche produit et tests de sections |
| 3 | LCP inférieur à 2,5 s en 4G simulée | ⚠️ | LCP 1 560 ms en throttling `devtools`, mais 3 784 ms en simulation Lantern (`LIGHTHOUSE-REPORT.md` §2) |
| 4 | Squelettes de chargement et état d'erreur avec reprise | ✅ | Skeletons dans `categories-pills.component.html:11` et `product-section` ; boutons « Réessayer » et `retry` couverts par tests |

## 2. Conformité au cahier des charges

Le CDC §6.1 (accueil) est couvert fonctionnellement. Deux écarts : la section « Meilleures ventes » n'a pas de sémantique de popularité, et la mesure de performance dépend de la méthode de throttling. Aucun texte produit inventé.

## 3. Qualité du code

- `HomeDataService` isole quatre chargements et leurs erreurs ; pas de `HttpClient` brut.
- Signaux en lecture seule, `OnPush`, composants standalone.
- Aucun TODO/FIXME.
- `allFailed` gouverne l'état d'erreur global.

## 4. Tests

- **16 tests unitaires** dans `features/home` (7 fichiers).
- Lighthouse exécuté et documenté (`LIGHTHOUSE-REPORT.md`).
- Pas de test e2e dédié à l'accueil ; la non-régression passe par le catalogue et la fiche produit.
- Suite frontend 515/515.

## 5. Sécurité

- Aucun secret ; le numéro WhatsApp du hero vient de `APP_CONFIG` depuis MKT-06.
- Les appels API passent par le client typé et les intercepteurs communs.
- Pas de donnée personnelle.

## 6. Documentation

- `ANALYSE-DESIGN.md`, `VERIFICATION.md`, `LIGHTHOUSE-REPORT.md` complets.
- Les échecs de specs UI préexistants sont honnêtement documentés.
- Pas d'impact OpenAPI.

## 7. Points d'attention

- « Meilleures ventes » trompeur pour le PO : c'est un tri par nouveauté.
- Le budget LCP n'est pas tenu avec la méthode Lantern.
- P01 n'a pas de spec design versionnée ; conformité visuelle non prouvée.
- Le SSR de `/` dépend d'une API accessible (comportement préexistant).

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **merge acceptable avec réserve**. Soit ajouter un tri popularité/ventes côté backend, soit renommer la section ; trancher la méthode de mesure LCP avec le PO.
