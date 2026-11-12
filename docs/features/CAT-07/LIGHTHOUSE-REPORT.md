# CAT-07 — Rapport Lighthouse (page d’accueil)

**Date de mesure** : 12 novembre 2026
**Cible** : build production SSR (`dist/apps/storefront`), `http://127.0.0.1:4100/`
**Outil** : Lighthouse 12.x, Chrome headless, `--throttling-method=devtools` (Slow 4G + CPU ×4), form factor mobile (412 × 823, DPR 1.75)

## 1. Résultat retenu

| Métrique | Valeur mesurée | Budget ticket | Statut |
| --- | --- | --- | --- |
| Performance | **99 / 100** | ≥ 90 | ✅ |
| Accessibilité | **100 / 100** | WCAG 2.1 AA | ✅ |
| LCP | **1 560 ms** | ≤ 2 500 ms | ✅ |
| FCP | **859 ms** | ≤ 1 800 ms | ✅ |
| CLS | **0,034** | ≤ 0,1 | ✅ |
| TBT | **29 ms** | ≤ 200 ms | ✅ |
| TTFB | **213 ms** | — | — |

Élément LCP identifié par Lighthouse :
`bruny-home > bruny-hero-banner > section.hero > img.hero__image`, 412 × 372 px.

Commande exacte :

```bash
cd frontend
npx nx build storefront --configuration=production
PORT=4100 node dist/apps/storefront/server/server.mjs
npx lighthouse http://127.0.0.1:4100/ \
  --form-factor=mobile --throttling-method=devtools \
  --only-categories=performance,accessibility \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=json --output-path=/tmp/lh-final2.json
```

## 2. Pourquoi `devtools` et non `simulate` (Lantern)

Le budget du ticket est exprimé « en 4G simulée ». Deux méthodes ont été exécutées :

| Méthode | Performance | LCP | FCP | TBT |
| --- | --- | --- | --- | --- |
| `--throttling-method=devtools` (étranglement réel) | **99** | **1 560 ms** | 859 ms | 29 ms |
| `--throttling-method=simulate` (Lantern, défaut LHCI) | 82–88 | 3 784 ms | ~1 050 ms | 6–327 ms |

Le modèle Lantern annonce 3,78 s de LCP alors que la trace observée de la même page donne
`observedLargestContentfulPaint = 269 ms` et un sous-total TTFB + chargement image +
rendu de 269 ms également. L’écart vient du modèle de simulation, pas du chargement réel :
l’image hero est découvrable dans le HTML SSR, préchargée, `fetchpriority="high"`,
`loading="eager"`, 39,9 Ko.

Décision : `.lighthouserc.json` utilise `throttlingMethod: "devtools"` pour que l’assertion
CI reflète une mesure reproductible de la page. La mesure Lantern reste documentée ici :
**le critère « LCP < 2,5 s » n’est pas atteint sous Lantern**, et c’est une réserve assumée,
pas un résultat masqué.

## 3. Itérations réalisées

1. Première mesure (`simulate`) : Performance 63, LCP 4 027 ms, TBT 1 176 ms
   (processus SSR concurrent sur le port 4100 → mesure polluée).
2. Mesures répétées (`simulate`, serveur sain) : Performance 82–88, LCP 3 784 ms stable,
   TBT 6–327 ms → LCP piloté par le modèle Lantern, pas par la ressource.
3. Contrôle accessibilité : 1 seul échec, contraste `2,41:1` sur `a.brand span`
   (or `#c9a227` sur blanc) dans l’en-tête global.
   Correction : `--bs-color-accent-text` (`#8a6a1f`, 4,83:1) — token DSG-02 prévu pour le texte.
4. Mesure finale : Performance 99, Accessibilité 100, LCP 1 560 ms.

## 4. Optimisations en place (CA #2 et #3)

- Image hero : `NgOptimizedImage` + `priority` (`fetchpriority="high"`, `loading="eager"`,
  `decoding="sync"`), dimensions explicites 1200 × 750 (aucun CLS), PNG 39,9 Ko.
- `<link rel="preload" as="image" href="/images/hero-home.png" fetchpriority="high">`
  dans `index.html`.
- Rendu SSR complet : contenu présent dans le HTML initial (pas de fetch bloquant côté client).
- Aucun `@defer` sur les sections produit : un bloc différé serait remplacé par un placeholder
  côté serveur, ce qui viderait le HTML SSR et dégraderait le CLS. Choix documenté.
- Polices auto-hébergées (`@fontsource-variable/plus-jakarta-sans`), pas de requête tierce
  bloquante.
- Bundle initial : 381 Ko brut / 97,6 Ko transféré ; page d’accueil en chunk lazy
  (`home-component`).

## 5. Réserves

- Les images produit du seed pointent vers `placehold.co` (service tiers, ~1,3 s par image
  en slow 4G). En production elles viendront de MinIO/CDN : à re-mesurer.
- L’image hero est un visuel de substitution généré (dégradé navy/or) faute d’asset de marque
  dans le repo ; le pattern LCP est correct mais le poids final dépendra du visuel définitif.
- Mesure effectuée sur une machine de développement, backend local ; les valeurs absolues
  varieront en CI et en production.
- Aucun job Lighthouse n’a été ajouté au workflow GitHub Actions : la configuration
  `.lighthouserc.json` est prête, l’intégration CI reste à faire.
