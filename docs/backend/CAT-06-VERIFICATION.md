# CAT-06 — Vérification des guides de tailles

Branche : `feature/CAT-06-size-guides-api` (`git branch --show-current`).
Date des vérifications : 10 novembre 2026.

## Résultats des 12 contrôles

| # | Vérification | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche dédiée active | ✅ | `feature/CAT-06-size-guides-api` |
| 2 | Build backend | ✅ | `pnpm -C backend build` → Prisma generate + `tsc` sans erreur |
| 3 | Tests unitaires | ✅ | `pnpm -C backend test` → **199/199**, dont **13** `size-guides.service` + **2** cache guides |
| 4 | Tests e2e CAT-06 | ✅ | `test/size-guides.e2e-spec.ts` → **19/19** |
| 5 | E2E sans régression | ✅ | `pnpm -C backend test:e2e` → **133/133** (8 fichiers) |
| 6 | ESLint | ✅ | `eslint src test --max-warnings=0` → 0 erreur / 0 warning |
| 7 | Docker Compose | ✅ | PostgreSQL `15432` et Redis `16379` healthy |
| 8 | Migration + Prisma | ✅ | Migration `20261110160000_cat06_size_guides` appliquée ; client 7.10.0 généré |
| 9 | Seed idempotent | ✅ | `pnpm -C backend db:seed` → **1 guide**, **6 catégories liées**, 20 produits, 220 variantes |
| 10 | GET public | ✅ | Guide seedé **200** (10 hommes / 9 femmes / 19 enfants) ; enfants **200** ; sans guide **404 SIZE_GUIDE_NOT_FOUND** ; UUID inconnu **404 CATEGORY_NOT_FOUND** ; UUID invalide **400 VALIDATION_ERROR** |
| 11 | PUT admin + cache | ✅ | Guide temporaire : **200**, `v1` → `v2`, table triée `[40,42]`, GET public immédiatement `v2` |
| 12 | Rate limits, Swagger, docs, secrets | ✅ | 101e GET **429**, 31e PUT **429** ; OpenAPI **27 paths**, `size-guides` présent ; aucun secret commité |

## Modèle et migration

- `size_guides` créée avec `id`, `name`, `slug`, `description`, `table` JSONB,
  `version`, `publishedAt`, `createdAt`, `updatedAt`.
- `Category.sizeGuideId` relié par FK `ON DELETE SET NULL` + index.
- Migration additive uniquement ; aucune donnée existante modifiée.
- Les identifiants restent des `String` UUID, cohérents avec le schéma existant
  (pas de conversion risquée `text` → `uuid`).

## Décision P05

`docs/design-1/ANALYSE-MAQUETTES.md` indique :

> « Pages sans maquette : P03 Recherche, **P05 Guide des tailles**, P07 Mini-panier »
>
> « **P05 — Guide des tailles : Absent** — Aucune maquette. »

En l’absence de P05 et avec une FK unique par catégorie, le MVP utilise **un
guide global** avec `men` / `women` / `kids`, lié aux six catégories. Cette
décision est documentée dans `docs/backend/size-guides.md`.

## Preuves du seed

```text
✅ Seed terminé avec succès :
   rôles=6  utilisateurs=22
   catégories=6  guides=1  marques=4
   produits=20  variantes=220
   images=40  zones=5  settings=6
```

Vérification SQL :

```text
sneakers|guide-pointures-brunyshop|v1|10
bottes|guide-pointures-brunyshop|v1|10
sandales|guide-pointures-brunyshop|v1|10
chaussures-ville|guide-pointures-brunyshop|v1|10
chaussures-sport|guide-pointures-brunyshop|v1|10
chaussures-enfant|guide-pointures-brunyshop|v1|10
```

Le seed est idempotent (`upsert` sur `slug`). Les modifications admin sont
préservées lors d’un re-seed (`update: {}`).

Le seed produits a été corrigé au passage : il utilisait la fonction
`colorIndex` au lieu de l’index de boucle, produisant `stock: NaN` et faisant
échouer le seed complet.

## Preuve GET public

```json
{
  "id": "…",
  "name": "Guide des pointures — Homme, Femme, Enfant",
  "slug": "guide-pointures-brunyshop",
  "table": {
    "men": [{ "eu": 39, "us": 6.5, "uk": 6, "cm": 24.5 }],
    "women": [{ "eu": 35, "us": 5, "uk": 3, "cm": 22 }],
    "kids": [{ "eu": 20, "us": 4.5, "uk": 3.5, "cm": 12 }]
  },
  "version": "v1",
  "publishedAt": "2026-11-10T00:00:00.000Z",
  "updatedAt": "2026-11-10T00:00:00.000Z"
}
```

Cache : après le premier GET, la clé
`catalog:size-guides:{categoryId}:v1` est présente dans Redis.

## Preuve PUT admin + invalidation cache

```text
GET public: v1 {"men":[{"eu":41,...}]}
PUT admin:  v2 [40,42]
GET après PUT: v2 [40,42]
```

Le tableau envoyé `[42, 40]` a été trié en `[40, 42]` avant stockage. Le cache a
été invalidé immédiatement, sans attendre le TTL de 30 minutes.

## Couverture e2e (19 cas)

- Public : guide seedé, catégorie enfant, catégorie sans guide, UUID inconnu,
  UUID invalide, cache hit, 101e GET → 429.
- Admin : 401 sans JWT, 403 CUSTOMER, 200 STOCK_MANAGER / ADMIN / SUPER_ADMIN.
- Mise à jour : table + version v2 + cache invalidé, doublon EU 400, tri
  automatique, entrée sans US 400, nom seul sans incrément de version, guide
  inconnu 404, body vide 400.
- Audit : `SIZE_GUIDE_UPDATED` avec `before/after` en résumé (`counts`), sans le
  JSON complet.
- Rate limit : 31e PUT → 429.

## Couverture unitaire (15 cas CAT-06)

- Lecture : guide lié + tri, cache hit, catégorie inconnue, guide absent, FK
  cassée.
- Mise à jour : version v2, tri, audit + counts, nom seul sans version, doublon,
  table vide, entrée non positive, body vide, guide inconnu, table identique.
- Cache : clé `catalog:size-guides:*`, TTL 1800 s, invalidation SCAN ciblée.

## Données de référence — réserve explicite

Les tables EU/US/UK/cm sont basées sur des standards et tables fabricants
usuels (ISO 9407, EN 13402, Nike/Adidas/Puma). **Elles ne sont pas validées par
le propriétaire.** Le ticket **CNT-02** doit les confirmer avant production.
Aucune affirmation de validation métier n’est faite.

## Limites connues

1. P05 absente : le format « guide global » n’est pas confirmé visuellement.
2. Données non validées par le propriétaire (CNT-02).
3. Pas d’héritage de guide depuis la catégorie parente.
4. JSONB non requêtable par pointure ; normalisation future si besoin.
5. Pas de POST/DELETE admin ; création par seed uniquement.
6. Le seed ne purge pas Redis ; TTL de 30 min ou purge manuelle après re-seed.
