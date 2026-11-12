# A05 — Créer ou modifier un produit

## 1. Objectif et contexte

Permettre de créer un produit complet — informations, variantes, images, SEO et publication — ou de modifier un produit existant sans perdre de travail. Le formulaire est le cœur du catalogue et doit rester lisible sur mobile malgré sa densité.

- Routes cibles : `/admin/produits/nouveau`, `/admin/produits/:id/modifier`.
- Accès : `SUPER_ADMIN`, `ADMIN`, `STOCK_MANAGER`.
- Les variantes ne sont pas éditées dans ce formulaire : elles renvoient à A05b.
- Les médias utilisent le flux presign → upload → confirm existant.

## 2. Rôles autorisés

| Rôle | Créer | Modifier | Publier | Archiver | Supprimer |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Non | Lecture | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non |

En lecture seule, tous les champs sont désactivés et seule l’action « Retour » reste.

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ← Produits     Enregistrer  │
│ Nouveau produit              │
│ ● 1 Infos ─ 2 Variantes ─ 3 Photos ─ 4 Publication
│                              │
│ Nom du produit *             │
│ [Mocassin Glacé           ]  │
│ Slug                         │
│ [mocassin-glace           ]  │
│ Description *                │
│ [                        ]   │
│ [                        ]   │
│ Catégorie *     [Choisir ▾]  │
│ Marque *        [Choisir ▾]  │
│ Prix de base *  [42 500 FCFA]│
│ Prix promo      [         ]  │
│ Du [date] au [date]          │
│                              │
│ [Enregistrer le brouillon]   │
│ [   Continuer vers variantes ]│
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ ← Produits            Brouillon non enregistré     │
│ Mocassin Glacé                    [Annuler] [Enreg.]│
│ [Infos] [Variantes 12] [Photos 4] [Publication]    │
├────────────────────────────────────────────────────┤
│ Nom *                    │ Catégorie *              │
│ [____________________]   │ [Choisir ▾]              │
│ Slug                     │ Marque *                 │
│ [____________________]   │ [Choisir ▾]              │
│ Description *            │ Prix de base *           │
│ [____________________]   │ [42 500] FCFA            │
│ [____________________]   │ Prix promo / dates       │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬───────────────────────────────────────────────────────────┐
│ SIDEBAR  │ ← Produits / Mocassin Glacé      [Annuler] [Enregistrer] │
│          │ Mocassin Glacé                     ● Brouillon            │
│          ├──────────────────────────────────┬────────────────────────┤
│          │ [Infos] [Variantes 12] [Photos 4]│ Statut                 │
│          │ [Publication]                    │ ● Brouillon            │
│          │                                  │ [Publier]              │
│          │ Nom *                            │                        │
│          │ [_____________________________]  │ Résumé                 │
│          │ Slug                             │ 12 variantes           │
│          │ [_____________________________]  │ 4 photos               │
│          │ Description *                    │ Stock total 12         │
│          │ [_____________________________]  │                        │
│          │ Catégorie *      Marque *        │ Dernière modification  │
│          │ [Choisir ▾]      [Choisir ▾]     │ 11/11/2026 14:32       │
│          │ Prix de base *   Prix promo      │                        │
│          │ [42 500] FCFA    [________]      │ [Supprimer]            │
└──────────┴──────────────────────────────────┴────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `Tabs` / `SegmentedControl` | Infos, Variantes, Photos, Publication (desktop/tablette) |
| `Stepper` | Progression mobile |
| `Input` | Nom, slug, prix, SEO |
| `Textarea` | Description, description SEO |
| `Select` | Catégorie, marque |
| `Button` | Enregistrer, annuler, publier, supprimer |
| `Alert` | Erreurs de validation, produit publié sans stock |
| `ImageUploader` | Photos, alt, ordre, couleur associée |
| `StatusBadge` | Statut du produit |
| `ConfirmDialog` | Suppression, abandon des modifications |
| `Toast` | Succès d’enregistrement |
| `Skeleton` | Chargement en édition |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Création : formulaire vide, slug vide, statut `DRAFT`, focus sur le nom |
| Chargement | Squelette de formulaire en édition ; boutons désactivés |
| Erreur | Erreurs par champ + résumé en haut ; erreur globale si l’enregistrement échoue |
| Succès | Toast « Produit enregistré. », URL passée en mode édition, résumé mis à jour |

Cas complémentaires :

- **Brouillon** : sauvegarde sans validation stricte, description et catégorie peuvent manquer.
- **Publication** : refusée si aucune variante avec stock (`PUBLISHED_REQUIRES_STOCK`), si prix promo invalide, ou si champs obligatoires vides.
- **Modifications non enregistrées** : dialogue à la navigation, « Quitter sans enregistrer ? ».
- **Conflit** : `409` ou version obsolète → « Ce produit a été modifié entre-temps. Rechargez pour voir la dernière version. »
- **Échec d’image** : l’image reste en erreur avec « Réessayer » et n’empêche pas d’enregistrer le reste.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre création | Nouveau produit |
| Titre édition | Modifier le produit |
| Onglet 1 | Informations |
| Onglet 2 | Variantes |
| Onglet 3 | Photos |
| Onglet 4 | Publication |
| Nom | Nom du produit |
| Aide nom | Le nom affiché sur la boutique. |
| Slug | Adresse du produit |
| Aide slug | Générée depuis le nom. Modifiable avant la première publication. |
| Description | Description |
| Catégorie | Catégorie |
| Marque | Marque |
| Prix | Prix de base |
| Prix promo | Prix promotionnel |
| Dates promo | Du / au |
| Bouton brouillon | Enregistrer le brouillon |
| Bouton enregistrer | Enregistrer |
| Bouton publier | Publier |
| Bouton annuler | Annuler |
| Bouton supprimer | Supprimer le produit |
| Erreur requise | Ce champ est obligatoire. |
| Erreur prix | Le prix doit être un entier positif en FCFA. |
| Erreur promo | Le prix promotionnel doit être inférieur au prix de base. |
| Erreur dates | La date de fin doit suivre la date de début. |
| Erreur stock | Ajoutez du stock à au moins une variante avant de publier. |
| Succès | Produit enregistré. |
| Abandon | Quitter sans enregistrer ? |
| Conflit | Ce produit a été modifié entre-temps. Rechargez la page. |

## 7. Interactions

1. Le slug est généré depuis le nom tant qu’il n’a pas été modifié manuellement.
2. Le prix est saisi en chiffres, formaté à la perte de focus (`42 500`), sans décimales.
3. Le prix promo active les dates ; les dates sans prix promo sont ignorées.
4. « Enregistrer » en création crée le produit puis reste sur la page en mode édition.
5. « Continuer vers variantes » enregistre d’abord, puis ouvre A05b.
6. L’onglet Variantes affiche un compteur et un lien vers A05b ; il ne contient pas la grille.
7. Les images se réordonnent par glisser-déposer ou boutons monter/descendre ; la première est principale.
8. Chaque image possède un texte alternatif obligatoire avant publication.
9. « Publier » ouvre une confirmation si le produit n’a pas encore d’image.
10. La suppression est logique et renvoie vers A04 avec un toast.

## 8. Accessibilité WCAG 2.1 AA

- Onglets avec `role="tablist"`, `role="tab"`, `aria-selected`, navigation flèches.
- Chaque étape mobile est un `fieldset` avec `legend`.
- Champs obligatoires : `required` + `aria-required="true"` + astérisque expliquée.
- Erreurs liées par `aria-describedby` ; résumé d’erreurs focusable en tête de formulaire.
- Prix : `inputmode="numeric"` et texte d’aide sur le format.
- Upload : bouton accessible, annonce de progression, alternative clavier au glisser-déposer.
- Le dialogue d’abandon piège le focus et le restitue.
- Titre de page : « Nouveau produit — Bruny Shopping » ou « Modifier {nom} — Bruny Shopping ».

## 9. Données API

Existant :

- `POST /api/v1/admin/products` — création avec `variants[]` ou `colors[]` + `sizes[]`.
- `PATCH /api/v1/admin/products/:id` — métadonnées et statut, sans variantes.
- `DELETE /api/v1/admin/products/:id` — suppression logique.
- `POST /api/v1/admin/media/presign`, `POST /confirm`, `DELETE /images/:id`, `PATCH /images/reorder`.

Payload de création :

```json
{
  "name": "Mocassin Glacé",
  "slug": "mocassin-glace",
  "description": "…",
  "categoryId": "…",
  "brandId": "…",
  "basePrice": 42500,
  "promoPrice": 38000,
  "promoStart": "2026-11-15T00:00:00Z",
  "promoEnd": "2026-11-30T23:59:59Z",
  "status": "DRAFT",
  "seoTitle": "Mocassin Glacé — Bruny Shopping",
  "seoDescription": "…"
}
```

**Manquants :** `GET /admin/products/:id` pour l’édition, `GET /admin/brands`, `GET /admin/categories` (CRUD admin). Le catalogue public expose `GET /categories` mais pas les marques.

## 10. Écarts et dépendances

- L’API de détail admin n’existe pas : l’édition ne peut pas être implémentée telle quelle.
- Les marques n’ont aucun endpoint.
- Le backend ne gère pas de version de produit ; le conflit ne peut être détecté que par `updatedAt`.
- La limite d’images et le poids maximal ne sont pas documentés : à fixer côté backend avant implémentation.
- Le prix est un entier XAF, jamais un décimal.
- La publication exige du stock ; l’UI doit expliquer la règle avant l’erreur.
- Le formulaire ne duplique pas A05b : aucun champ de variante ici.

## 11. Référence

- Zone L, cartes et statuts.
- `backend/src/modules/catalog/admin/admin-products.controller.ts`.
- `backend/prisma/schema.prisma`, modèles `Product`, `ProductVariant`, `ProductImage`.
- A04, A05b, A06.
