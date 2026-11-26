# Guides des tailles (CAT-06)

Documentation du modèle `SizeGuide`, du seed de référence et des endpoints
public/admin des guides de pointures.

## Décision de modélisation

### Un guide global, trois publics

La maquette **P05 est absente** du dépôt : `docs/design-1/ANALYSE-MAQUETTES.md`
indique explicitement « P05 Guide des tailles : Absent ». La planche ne contient
que P01, P02, P04 et P06, et aucun onglet Homme/Femme/Enfant n’est dessiné.

`Category.sizeGuideId` est une FK **unique par catégorie**. Avec trois guides
distincts, une catégorie comme Sneakers ne pourrait exposer qu’un seul public.
Le MVP retient donc :

- **un guide global** `guide-pointures-brunyshop` ;
- trois tableaux `men`, `women`, `kids` dans le même document ;
- les six catégories seedées pointent vers ce guide.

Si le propriétaire confirme trois pages distinctes, une relation N-N ou un guide
par public pourra être ajouté dans un ticket dédié. Cette décision est
documentée pour éviter toute ambiguïté.

### JSONB plutôt qu’une table normalisée

`SizeGuide.table` est un `Json` Prisma (JSONB PostgreSQL) :

```json
{
  "men": [{ "eu": 39, "us": 6.5, "uk": 6, "cm": 24.5 }],
  "women": [{ "eu": 35, "us": 5, "uk": 3, "cm": 22 }],
  "kids": [{ "eu": 20, "us": 4.5, "uk": 3.5, "cm": 12 }]
}
```

Avantages : ajout d’un public ou d’une colonne sans migration, validation DTO
stricte, versioning simple.

Alternative : table normalisée `SizeGuideEntry(sizeGuideId, public, eu, us, uk,
cm)`, requêtable mais plus rigide. Elle sera envisagée si des recherches
`WHERE eu = ...` ou des jointures par pointure deviennent nécessaires.

## Modèle Prisma

```prisma
model SizeGuide {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  table       Json
  version     String    @default("v1")
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  categories  Category[]
  @@map("size_guides")
}

model Category {
  sizeGuideId String?
  sizeGuide   SizeGuide? @relation(fields: [sizeGuideId], references: [id], onDelete: SetNull)
  @@index([sizeGuideId])
}
```

- `publishedAt: null` signifie que le guide n’est pas publié (aucun filtrage
  automatique en MVP : le guide est retourné s’il est lié à la catégorie).
- `onDelete: SetNull` : supprimer un guide détache les catégories sans les
  supprimer.
- Les identifiants restent des `String` (UUID générés), cohérents avec le reste
  du schéma ; aucune conversion `text` → `uuid` n’a été faite.

## Endpoint public

### `GET /api/v1/size-guides/:categoryId`

Public, sans JWT, `ParseUUIDPipe`, 100 requêtes/min/IP.

```bash
curl http://localhost:4000/api/v1/size-guides/<uuid-categorie>
```

```json
{
  "id": "…",
  "name": "Guide des pointures — Homme, Femme, Enfant",
  "slug": "guide-pointures-brunyshop",
  "description": "Mesurez votre pied du talon au bout de l’orteil le plus long…",
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

Erreurs :

| Cas | Statut | Code |
|---|---|---|
| UUID invalide | 400 | `VALIDATION_ERROR` |
| Catégorie inexistante | 404 | `CATEGORY_NOT_FOUND` |
| Catégorie sans guide | 404 | `SIZE_GUIDE_NOT_FOUND` |
| FK cassée vers un guide absent | 404 | `SIZE_GUIDE_NOT_FOUND` |

Le MVP **ne remonte pas** vers le guide de la catégorie parente. Cette règle
pourra évoluer si des sous-catégories sont ajoutées.

### Cache

- Clé : `catalog:size-guides:{categoryId}:v1`.
- TTL : `CACHE_SIZE_GUIDES_TTL_SECONDS` (1800 s par défaut).
- Invalidation : `CatalogCacheService.invalidateSizeGuides()`,
  `SCAN catalog:size-guides:*`, jamais `KEYS`.
- Les caches produits/catégories ne sont pas touchés.
- Fail-open : une panne Redis est un miss, l’API continue depuis PostgreSQL.

## Endpoint admin

### `PUT /api/v1/admin/size-guides/:id`

Rôles : `STOCK_MANAGER`, `ADMIN`, `SUPER_ADMIN`. 30 requêtes/min/IP.

```json
{
  "name": "Guide des pointures 2027",
  "description": "Mesurez votre pied…",
  "table": {
    "men": [
      { "eu": 42, "us": 8.5, "uk": 8, "cm": 26.5 },
      { "eu": 41, "us": 8, "uk": 7.5, "cm": 25.7 }
    ]
  }
}
```

Règles :

- `name`, `description` et `table` sont tous optionnels, mais un body vide est
  refusé (`400 VALIDATION_ERROR`).
- Chaque entrée doit contenir `eu`, `us`, `uk`, `cm` strictement positifs.
- Au moins une pointure doit être fournie.
- Pas de doublon `eu` dans un même public.
- Les tableaux sont **triés par EU croissant côté service**, même si le client
  envoie un ordre différent.
- Une modification de `table` incrémente `v1` → `v2`.
- Un changement de `name` ou `description` seul ne change pas la version.
- Un audit `SIZE_GUIDE_UPDATED` est écrit avec un résumé
  `{ name, version, counts }` — jamais le JSON complet.
- Le cache `catalog:size-guides:*` est invalidé après la mise à jour.
- La création de nouveaux guides n’est pas exposée en MVP ; elle se fait par le
  seed. Le CA #3 ne demande que la modification.

Exemple de réponse : même structure que le GET public, avec `version: "v2"`.

## Validation et cohérence

- Le DTO `SizeGuideTableDto` valide les tableaux imbriqués et les champs requis.
- Le service revalide les valeurs positives, les doublons et le tri (défense en
  profondeur).
- Une incohérence de conversion EU/US peut être signalée en log mais ne bloque
  pas : les tables varient selon les marques.
- Aucun champ `version` fourni par le client n’est accepté (whitelist).

## Seed

Fichier : `backend/prisma/seeds/size-guides.seed.ts`.

```bash
pnpm -C backend db:seed
```

- Upsert sur `slug` : `pnpm db:seed` est relançable sans doublon.
- Les modifications admin sont préservées au re-seed (`update: {}`) ; le seed ne
  réécrit pas la table existante.
- Les six catégories sont liées via `Category.sizeGuideId`.
- Le seed produit a aussi été corrigé pour calculer un stock numérique (la
  variable de couleur utilisée était une fonction, ce qui produisait `NaN`).

Variables nécessaires au seed complet (voir `.env.example`) :
`SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD`,
`SEED_CUSTOMER_PASSWORD`.

### Source des données — à valider

Les tables sont inspirées des conversions usuelles EU/US/UK/cm (ISO 9407
Mondopoint, EN 13402, tables fabricants Nike/Adidas/Puma).

> ⚠️ **Les données ne sont pas validées par le propriétaire.** Elles doivent
> être vérifiées avant mise en production dans le cadre du ticket **CNT-02**.
> Le seed et ce document le mentionnent explicitement ; aucune validation
> métier ne doit être supposée acquise.

## Workflow admin

1. L’admin ouvre le guide depuis la fiche produit (lien « Guide des pointures »).
2. Il modifie les tableaux via `PUT /admin/size-guides/:id`.
3. Le service trie, valide, incrémente la version et écrit l’audit.
4. Le cache est invalidé : la prochaine lecture publique sert la nouvelle
   version depuis PostgreSQL.
5. En cas d’erreur 400, aucune modification n’est enregistrée.

## Limites connues

1. P05 absente : le choix « guide global » n’a pas été validé visuellement.
2. Données de conversion non validées par le propriétaire (CNT-02).
3. JSONB non requêtable par pointure ; normalisation possible plus tard.
4. Pas d’héritage depuis la catégorie parente.
5. Pas de création/suppression admin (seed uniquement).
6. Le cache n’est pas purgé automatiquement par le seed ; le TTL de 30 min ou
   une purge Redis manuelle s’applique après un re-seed.
