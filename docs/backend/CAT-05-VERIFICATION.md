# CAT-05 — Vérification du téléversement sécurisé des images

Branche : `feature/CAT-05-secure-media-upload` (`git branch --show-current`).
Date des vérifications : 10 novembre 2026.

## Résultats des 12 contrôles

| # | Vérification | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche dédiée active | ✅ | `feature/CAT-05-secure-media-upload` |
| 2 | Build backend | ✅ | `pnpm -C backend build` → Prisma generate + `tsc` sans erreur |
| 3 | Tests unitaires | ✅ | `pnpm -C backend test` → **184/184**, dont **31** média (14 image-processor, 14 media.service, 3 fake storage) |
| 4 | Tests e2e média | ✅ | `test/media-upload.e2e-spec.ts` → **18/18** avec `STORAGE_PROVIDER=fake` |
| 5 | E2E sans régression | ✅ | `pnpm -C backend test:e2e` → **114/114** (7 fichiers) |
| 6 | ESLint | ✅ | `eslint src test --max-warnings=0` → 0 erreur / 0 warning |
| 7 | Docker Compose | ✅ | `bruny-minio` (19000/19001), `bruny-postgres` (15432), `bruny-redis` (16379) healthy |
| 8 | Prisma | ✅ | Migration `20261110140000_cat05_product_image_storage_key` appliquée + client 7.10.0 généré |
| 9 | Démarrage + readiness | ✅ | `PORT=4020 node dist/main.js` → `GET /api/v1/health/ready` **200** (DB + Redis up) |
| 10 | Presign + PUT + confirm réels | ✅ | presign **200**, PUT MinIO **200**, confirm **201**, `ProductImage` visible sur `GET /products/sneakers-urbanstep-lady` |
| 11 | Refus PDF + suppression + delete | ✅ | PUT PDF **200**, confirm **400 INVALID_IMAGE_TYPE**, brut **404** ; DELETE **204**, WebP **404** |
| 12 | 3 versions MinIO + Swagger/docs/secrets | ✅ | 3 objets `.jpg`, `.webp`, `-thumb.webp` ; OpenAPI 25 paths / 6 occurrences `admin/media` ; aucun secret commité |

Le serveur de vérification écoute sur **4020** : le port `4000` était déjà
occupé par une ancienne instance locale. MinIO est exposé sur **19000**.

## Preuves du flow réel

### Presign

```json
{
  "uploadUrl": "http://localhost:19000/brunyshop-media/products/sneakers-urbanstep-lady/rose/861643ef-...jpg?X-Amz-...",
  "key": "products/sneakers-urbanstep-lady/rose/861643ef-4009-437e-b110-8b26fa0892d3.jpg",
  "publicUrl": "http://localhost:19000/brunyshop-media/products/sneakers-urbanstep-lady/rose/861643ef-...jpg",
  "expiresIn": 300,
  "method": "PUT",
  "headers": { "Content-Type": "image/jpeg" }
}
```

### Confirm (201)

```json
{
  "id": "6ec54cfd-be2f-40e4-b6c7-284601b61684",
  "url": "http://localhost:19000/brunyshop-media/products/sneakers-urbanstep-lady/rose/861643ef-...webp",
  "thumbnailUrl": "http://localhost:19000/brunyshop-media/products/sneakers-urbanstep-lady/rose/861643ef-...-thumb.webp",
  "alt": "Test manuel CAT-05",
  "variantColor": "ROSE"
}
```

### 3 versions dans MinIO

```text
products/sneakers-urbanstep-lady/rose/861643ef-...-thumb.webp
products/sneakers-urbanstep-lady/rose/861643ef-....jpg
products/sneakers-urbanstep-lady/rose/861643ef-....webp
```

Le JPEG optimisé remplace le fichier brut lorsque la clé se termine par `.jpg` ;
pour une clé `.png`/`.webp`, le brut est supprimé puis les trois versions sont
écrites.

### Refus d’un PDF déguisé en JPEG

```json
{
  "statusCode": 400,
  "code": "INVALID_IMAGE_TYPE",
  "message": "Format non autorisé. Formats acceptés : JPEG, PNG, WebP."
}
```

Après refus : fichier brut **404**, aucune ligne `ProductImage`, audit
`MEDIA_UPLOAD_REJECTED`.

### Suppression

`DELETE /api/v1/admin/media/images/:id` → **204** ; les trois objets deviennent
**404** et `GET /api/v1/products/:slug` ne contient plus l’image (cache Redis
invalidé).

## Couverture e2e (18 cas)

- RBAC : 401 sans JWT, 403 `CUSTOMER`, 200 `STOCK_MANAGER` / `ADMIN` / `SUPER_ADMIN`.
- Presign : type PDF refusé, taille > 5 Mo, produit inexistant, quota de 10 images, body vide.
- Confirm : image valide (3 versions + cache), PDF refusé (nettoyage + audit), clé absente (404), clé d’un autre produit (400), fichier réel > 5 Mo.
- Gestion : reorder + delete avec invalidation, image inconnue (404), image étrangère (400).
- Audit : `MEDIA_UPLOAD_REJECTED` et `MEDIA_UPLOADED`.
- Rate limit : 31e presign en moins de 60 s → **429**.

## Couverture unitaire (31 cas)

- `image-processor` : JPEG/PNG/WebP, PDF, ZIP, MZ, texte, SVG, image corrompue,
  fichier vide, taille max, dimensions des 3 versions, rotation EXIF.
- `media.service` : presign (OK, 404, quota, taille), confirm (OK, PDF, clé
  absente, quota concurrent, échec DB), delete (3 versions, 404), reorder
  (transaction, image étrangère).
- `FakeStorageProvider` : upload/download/delete, presign, `putRaw`, `clear`.

## Limites connues

1. **MinIO absent de la CI** : les e2e utilisent `FakeStorageProvider` ; le
   bucket réel n’est vérifié qu’en local (ou dans un job d’intégration dédié).
2. **Pas de scan antivirus** : les magic bytes et le décodage sharp bloquent les
   fichiers non image, mais un fichier image malveillant (exploit décodeur)
   relève d’une défense en profondeur (ClamAV/worker asynchrone).
3. **Pas de quota par utilisateur** : la limite est par produit ; un quota par
   acteur reste à définir.
4. **Cohérence storage/DB** : pas de transaction distribuée ; le nettoyage est
   best-effort et journalisé.
5. **UI admin** : les maquettes décrivent l’upload, mais le frontend admin ne
   l’implémente pas encore ; le contrat API est prêt.
6. **Mode local** : l’URL présignée locale repose sur un token HMAC court ;
   MinIO/S3 reste la voie recommandée en dev/prod.
