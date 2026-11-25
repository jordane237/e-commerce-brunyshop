# BO-06 — Vérification du téléversement d’images par glisser-déposer

Date : 25 novembre 2026

Branche : `feat/BO-06-product-image-upload-drag-drop`

Ticket : #86 — « Téléversement d’images produit par glisser-déposer »

## A. Résumé

BO-06 remplace le champ texte d’images du formulaire produit par un gestionnaire
de galerie complet, intégré à l’onglet « Images » de BO-04 :

- sélection multiple et glisser-déposer sur ordinateur ;
- sélection depuis la galerie ou prise de photo sur mobile ;
- file d’attente avec progression réelle, vérification, optimisation, erreurs et
  nouvelle tentative ;
- aperçus avant et après téléversement ;
- réorganisation par glisser-déposer et boutons accessibles haut/bas ;
- image principale persistée par l’ordre du catalogue ;
- association d’une couleur existante du produit, y compris multi-mots
  (`BLEU MARINE`) ;
- modification du texte alternatif ;
- suppression confirmée, avec promotion automatique de la suivante ;
- ajout d’une image externe par URL lors de la création ;
- respect des limites du serveur et validation authoritative côté API.

Décisions techniques principales :

- réutilisation du flux sécurisé presign + confirm de CAT-05, sans nouvelle
  table ni nouvelle dépendance ;
- ajout de `GET /admin/media/config` pour exposer les limites sans divulguer la
  configuration de stockage ;
- ajout de `PATCH /admin/media/images/:id/metadata` pour le texte alternatif et
  la couleur ;
- image principale = position `0`, persistée via le réordonnancement existant ;
- fichiers choisis avant la création du brouillon conservés localement puis
  envoyés après la création, afin de ne jamais créer de ligne `ProductImage`
  orpheline ;
- composant galerie maintenu monté hors du `@switch` des onglets pour ne pas
  perdre la file d’attente lors d’un changement d’onglet ;
- glisser-déposer HTML5 sans bibliothèque, avec boutons haut/bas pour le clavier
  et les écrans tactiles.

## B. Git

- Branche de base : `working`, HEAD `8a69bf4` (BO-05 fusionné).
- Branche créée : `feat/BO-06-product-image-upload-drag-drop`.
- Aucun commit BO-06 avant la vérification finale.
- Commit final créé sans signature GPG, conformément à la demande explicite.
- Aucun push effectué.

## C. Analyse préalable

- BO-04 fournit le formulaire à onglets, le brouillon, la publication et le guard
  de modifications non enregistrées.
- CAT-05 fournit le presign, le confirm, la validation magic bytes, `sharp`, le
  stockage local/S3, la suppression et l’audit.
- Le modèle `ProductImage` possède déjà `alt`, `position` et `variantColor` :
  aucune migration n’est nécessaire.
- Le catalogue public utilise déjà la première image comme image principale.
- `design1/bruny shopping/bruny shopping.png` ne contient pas d’écran dédié au
  téléversement ; l’interface reprend la hiérarchie et les composants du
  back-office existant.
- La couleur des variantes est une chaîne normalisée en majuscules ; les
  couleurs multi-mots sont acceptées par l’API et le segment de stockage est
  slugifié.

## D. Implémentation

### Backend

- `GET /admin/media/config` expose la taille maximale, le quota, la durée de
  signature et les formats autorisés.
- `PATCH /admin/media/images/:id/metadata` met à jour `alt` et/ou
  `variantColor`, avec validation de la couleur active du produit.
- Les couleurs multi-mots sont acceptées au presign, au confirm et à la mise à
  jour ; le libellé est normalisé (`BLEU MARINE`) et la clé de stockage utilise
  un slug (`bleu-marine`).
- Une couleur retirée des variantes reste conservée sur l’image existante tant
  qu’elle n’est pas modifiée.
- Audit `MEDIA_UPDATED` et invalidation du cache catalogue après modification.
- Les tests couvrent la configuration, la validation, la couleur invalide, le
  texte alternatif, la slugification et les refus.

### Frontend

- Nouveau composant `ProductImagesComponent` : dropzone, caméra, file d’attente,
  progression HTTP réelle, états, aperçus, réorganisation, principale, couleur,
  texte alternatif, suppression et URL externe.
- Validation préalable par magic bytes et taille, puis validation authoritative
  par le backend.
- Téléversement limité à deux fichiers simultanés ; les autres restent en file.
- Les fichiers invalides sont refusés avec un message lisible et peuvent être
  retirés ou réessayés.
- Le formulaire parent sérialise la galerie, bloque la publication sans image,
  attend la fin des téléversements et envoie les fichiers différés après la
  création du brouillon.
- La couleur et le texte alternatif sont enregistrés immédiatement pour les
  images persistées, avec retour arrière en cas d’erreur.
- Le composant reste monté lors du changement d’onglet ; sa visibilité est
  pilotée par `hidden`.
- Correction de responsive : `minmax(0, 1fr)` et `min-width: 0` empêchent la
  barre d’onglets de forcer le formulaire à dépasser la largeur mobile.

## E. Fichiers principaux

### Créés

- `backend/src/modules/media/dto/update-image.dto.ts` : contrat de mise à jour
  des métadonnées.
- `frontend/apps/admin/src/app/features/products/product-form/product-images/` :
  composant, template, styles, types, validation de fichiers et tests.
- `docs/frontend/BO-06-VERIFICATION.md` : ce rapport.

### Modifiés

- `backend/src/modules/media/media.service.ts` : configuration, métadonnées,
  couleur multi-mots et invalidation.
- `backend/src/modules/media/admin-media.controller.ts` : nouvelles routes.
- `backend/src/modules/media/dto/media-response.dto.ts` : `MediaConfigDto`.
- `backend/src/modules/media/dto/presign-upload.dto.ts` et
  `confirm-upload.dto.ts` : couleurs avec espaces.
- `backend/src/modules/media/media-audit.actions.ts` : `MEDIA_UPDATED`.
- `backend/src/modules/media/media.service.test.ts` : 21 tests.
- `backend/test/media-upload.e2e-spec.ts` : 21 tests E2E.
- `backend/openapi.json` : 45 paths.
- `frontend/libs/data-access/src/lib/admin-media-api.ts` : configuration,
  progression réelle via `HttpBackend`, métadonnées.
- `frontend/libs/data-access/src/generated/api-types.ts` : types régénérés.
- `frontend/apps/admin/src/app/features/products/product-form/product-form.*` :
  intégration, validation, envoi différé et responsive.
- `frontend/apps/admin/src/app/features/products/product-form/product-form.component.spec.ts` :
  15 tests.
- `docs/backend/media.md` : documentation des nouvelles routes.

## F. Tests et vérifications

| Commande | Résultat réel |
| --- | --- |
| `cd backend && pnpm lint` | OK |
| `cd backend && pnpm exec tsc --noEmit -p tsconfig.build.json` | OK |
| `cd backend && pnpm build` | OK |
| `cd backend && pnpm exec vitest run src/modules/media/media.service.test.ts src/modules/media/image-processor.service.test.ts` | 35/35 tests |
| `cd backend && pnpm exec vitest run --config vitest.e2e.config.ts test/media-upload.e2e-spec.ts` | 21/21 tests |
| `cd frontend && pnpm exec vitest run apps/admin/src/app/features/products/product-form --maxWorkers=2` | 26/26 tests |
| `cd frontend && pnpm exec nx lint admin` | OK |
| `cd frontend && pnpm exec nx run-many -t typecheck` | OK (admin + storefront) |
| `cd frontend && pnpm exec nx build admin` | OK ; warning NG8113 préexistant sur `bulk-actions-bar` |
| `pnpm openapi:export` puis `pnpm api:generate` | 45 paths, types régénérés |
| Prettier sur les fichiers BO-06 | OK |

### Vérification navigateur réelle

Parcours Chrome headless via Playwright, avec compte SUPER_ADMIN temporaire et
2FA TOTP :

1. connexion réelle et validation du second facteur ;
2. téléversement de deux JPEG avec délai réseau simulé ;
3. observation des états « Téléversement », « Vérification » et de la barre de
   progression HTTP ;
4. refus d’un PDF avec message explicite ;
5. définition de la seconde image comme principale ;
6. association de la couleur `BLEU MARINE` et modification du texte alternatif ;
7. rechargement complet et vérification de la persistance de l’ordre, de la
   couleur et du texte alternatif ;
8. contrôle à 390 px : aucune image cassée, caméra `capture="environment"`,
   puis correction et remesure du débordement horizontal
   (`scrollWidth = 390`) ;
9. création d’un produit avec un fichier sélectionné avant la sauvegarde, puis
   vérification du téléversement automatique après création du brouillon ;
10. suppression des produits, images, fichiers et utilisateur temporaires.

Captures : `/tmp/bo06-images-tab.png`, `/tmp/bo06-images-reloaded.png`,
`/tmp/bo06-images-mobile.png`, `/tmp/bo06-creation-result.png` et
`/tmp/bo06-layout-390.png`.

La vérification navigateur a révélé puis fait corriger deux défauts réels :

- la couleur persistée n’était pas resélectionnée après rechargement à cause des
  options natives rendues dynamiquement ;
- l’envoi différé après création était bloqué par l’état `disabled` du
  formulaire pendant la sauvegarde.

## G. Démarrage réel

- API NestJS sur `:4000` : `GET /api/v1/health/live` → 200.
- Admin Angular sur `:4201` : page de connexion → 200.
- Proxy admin vers l’API vérifié.
- Stockage local actif en développement ; les fichiers sont servis par
  `GET /api/v1/media/files` avec `200 image/webp`.
- PostgreSQL, Redis et Mailpit démarrés via Docker Compose.
- Les serveurs de vérification ont été arrêtés après le parcours.

## H. Critères d’acceptation

| Critère | Statut | Justification |
| --- | --- | --- |
| Sélection multiple de fichiers | Validé | Champ multiple et ajout par lot. |
| Glisser-déposer | Validé | Dropzone et réorganisation HTML5. |
| Progression réelle | Validé | Événements HTTP observés dans le navigateur et testés. |
| Aperçus avant envoi | Validé | Object URLs avec révocation. |
| Réorganisation et image principale | Validé | Drag, boutons et persistance de l’ordre. |
| Association couleur | Validé | Couleur active, multi-mots, persistance vérifiée. |
| Texte alternatif | Validé | Mise à jour API et persistance vérifiée. |
| Suppression | Validé | Confirmation, stockage et réordonnancement. |
| Mobile, galerie et caméra | Validé | Interface responsive, sélection galerie et capture. |
| Refus clairs | Validé | PDF refusé avec message et retry. |
| URL signées et sécurité | Validé | Flux CAT-05 conservé et validations backend. |
| Persistance | Validé | Rechargement complet et base vérifiés. |
| Absence d’images orphelines à la création | Validé | Fichiers conservés localement avant le brouillon. |
| Tests backend et frontend | Validé | 35 unitaires, 21 E2E, 26 frontend. |
| Lint, typecheck, build | Validé | Tous réussis. |
| Aucun commit/push non autorisé | Validé | Commit final non signé explicitement autorisé, aucun push. |

## I. Limites et points restants

- Les formats restent JPEG, PNG et WebP ; HEIC n’est pas accepté.
- Le glisser-déposer HTML5 n’est pas fiable sur les navigateurs tactiles : les
  boutons haut/bas restent la voie accessible.
- La disponibilité de la caméra dépend du navigateur et de l’appareil.
- Le téléversement est limité à deux fichiers simultanés.
- Les fichiers bruts téléversés via une URL signée puis abandonnés avant le
  confirm ne sont pas encore purgés par un job de nettoyage périodique ; aucune
  ligne `ProductImage` orpheline n’est créée.
- Les images externes par URL sont validées comme URL HTTP(S) mais leur contenu
  n’est pas téléchargé ni optimisé par le backend.
- La suite backend complète n’a pas été relancée pour ce ticket ; l’échec E2E
  préexistant ORD-02 documenté en BO-05 reste hors périmètre.
- Le warning Angular NG8113 sur `bulk-actions-bar` est antérieur à BO-06.

## J. Conclusion

BO-06 est implémenté et intégré au formulaire BO-04. Les flux de téléversement,
de refus, de progression, de persistance, de réorganisation et de création
différée ont été vérifiés par tests automatisés et par un parcours navigateur
réel. Le débordement mobile détecté pendant la vérification a été corrigé et
remesuré. Aucun push n’a été effectué.
