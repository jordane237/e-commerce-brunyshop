# ORD-03 — Tunnel de commande en 3 étapes

> Branche : `feat/ORD-03-checkout-three-steps`, créée depuis `working`.
> Ticket : Issue #56 (épopée ORD). Dépend de ORD-01 (création de commande) et
> s'appuie sur les zones de livraison seedées par TEC-07.

---

## 1. Périmètre livré

Tunnel public `/commande` en trois étapes, sans création de compte :

1. **Coordonnées** — nom complet, téléphone camerounais, e-mail facultatif.
2. **Livraison** — ville, quartier, point de repère et zone de livraison
   (frais et délai réels lus en base).
3. **Paiement** — paiement à la livraison (COD) uniquement, CGV obligatoires,
   CAPTCHA invisible lorsque Turnstile est activé.

Le brouillon (coordonnées, livraison, étape courante, moyen de paiement, clé
d'idempotence) survit à un rechargement via `localStorage`
(`bruny.checkout.v1`). Il est effacé après succès.

## 2. Ce qui existait déjà

| Élément | Réutilisation |
| --- | --- |
| `POST /api/v1/orders` (ORD-01) | Contrat inchangé : invité, idempotent, CAPTCHA, frais recalculés serveur |
| `CartStore` / `CartApi.validate` | Lignes, sous-total, remise, stock, revalidation serveur |
| `deliveryZone` Prisma + seed TEC-07 | Source de vérité des zones et des frais |
| `@bruny/ui` | `input`, `radio`, `button`, `cgv-checkbox`, `captcha`, `empty-state` |
| `PublicConfigService` | Activation conditionnelle du CAPTCHA |
| `normalizeCameroonPhone` / `localPhoneValidator` | Validation et format `+237…` |

## 3. Décisions et limites

### 3.1 Endpoint `GET /api/v1/shipping/zones` (intérimaire)

Aucune API de devis de livraison n'existait (SHP-01 #70 ouvert). Plutôt que
d'inventer des frais côté navigateur, un endpoint public **read-only** a été
ajouté au module `shipping` :

- `GET /api/v1/shipping/zones` → `[{ id, name, cities, fee, estimatedDays }]`
  trié par frais croissants ;
- aucune écriture, aucun calcul de commande : `OrdersService` revérifie la
  zone et ses frais à la création (source de vérité inchangée) ;
- cet endpoint est destiné à être remplacé/absorbé par le devis SHP-01
  (adresse → frais), il ne prétend pas le remplacer.

### 3.2 E-mail

`CreateOrderDto` ne transporte pas d'e-mail. Le champ reste dans le brouillon
et n'est **pas** envoyé à l'API. La confirmation par e-mail reste à faire
quand le contrat de commande l'exposera.

### 3.3 Ligne d'adresse

`AddressSnapshot.line` est obligatoire côté serveur alors que le tunnel ne
collecte qu'un point de repère (pas de carnet d'adresses, ACC-04 non livré).
`line` et `landmark` reçoivent donc le point de repère ; le commentaire du
mapping le documente.

### 3.4 Paiement

Seul COD est sélectionnable. Mobile Money est affiché, désactivé, marqué
« Bientôt » : aucun paiement Mobile Money n'est simulé ni promis. `PAY-01`
(#63) reste ouvert.

### 3.5 Idempotence

- Clé UUID v4 générée dans le brouillon, envoyée dans `Idempotency-Key`.
- Conservée telle quelle si l'envoi échoue (réessai sûr).
- Régénérée uniquement lorsque l'empreinte du payload change (lignes, zone,
  coordonnées, moyen de paiement), pour éviter le conflit `IDEMPOTENCY_CONFLICT`
  sur une commande différente.

### 3.6 Étape et navigation

Le tunnel est interne au composant (pas de sous-routes) ; l'étape est
restaurée depuis le brouillon après contrôle des prérequis. Une étape déjà
validée peut être rejointe depuis la barre de progression.

## 4. Fichiers principaux

**Backend**

- `backend/src/modules/shipping/shipping.controller.ts`
- `backend/src/modules/shipping/shipping.service.ts`
- `backend/src/modules/shipping/dto/delivery-zone.dto.ts`
- `backend/src/modules/shipping/shipping.module.ts`

**Frontend**

- `frontend/libs/data-access/src/lib/shipping-api.ts`
- `frontend/apps/storefront/src/app/features/checkout/checkout.model.ts`
- `frontend/apps/storefront/src/app/features/checkout/checkout.store.ts`
- `frontend/apps/storefront/src/app/features/checkout/checkout-page.{ts,html,scss}`
- `frontend/apps/storefront/src/app/features/checkout/components/checkout-recap/`
- `frontend/apps/storefront/src/app/features/checkout/checkout.routes.ts`
- Entrées du tunnel : `cart-summary`, `mini-cart` et route `/commande`.

## 5. Design

Le tunnel réutilise les tokens `--bs-*` et les composants du design system
(`docs/design-system/`). La planche `design1/bruny shopping/bruny shopping.png`
n'a pas été comparée pixel par pixel : la mise en page (stepper horizontal,
carte formulaire, récapitulatif latéral, passage en colonne sous 900 px) suit
les conventions des pages panier/catalogue existantes.
