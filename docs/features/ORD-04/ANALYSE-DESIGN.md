# ORD-04 — Analyse et design (page de confirmation de commande + lien WhatsApp)

> Branche : `feat/ORD-04-order-confirmation-whatsapp`
> (fusionnée avec `working` pour récupérer ORD-05/ORD-06 et les évolutions récentes).
> Ticket : Issue #57, épopée ORD, dépendance ORD-01 (création de commande) et ORD-03 (checkout).

## 1. Ce qui existait déjà

| Élément | État constaté |
| --- | --- |
| Route `/confirmation` | Présente dans `app.routes.ts`, chargement dynamique de `ConfirmationPage` |
| `CheckoutStore.order` | Signal en mémoire, alimenté par `submit()` après `POST /api/v1/orders` |
| `CheckoutStore.submittedItems` | Snapshot des lignes du panier au moment de la commande |
| `WhatsAppService` | Service centralisé, construction de lien `wa.me` prérempli par contexte |
| Page de suivi public | `/suivi` (ORD-05/ORD-06) avec référence + téléphone |
| `EmptyStateComponent` | État vide réutilisable |
| `FcfaPipe` | Formatage des montants en FCFA |

## 2. Décisions retenues

1. **Accès éphémère** : la page lit `CheckoutStore` en mémoire. Après rechargement,
   l'état est vide et un état « Commande introuvable » est affiché. Aucune donnée
   sensible n'est exposée par URL.
2. **Numéro copiable** : bouton avec API `navigator.clipboard`, puis repli
   `document.execCommand('copy')`, feedback `role="status"` / `role="alert"`.
3. **Récapitulatif serveur** : sous-total, remise, livraison, total et lignes
   issues de la réponse de création de commande.
4. **Livraison** : destinataire, téléphone, ville, quartier, point de repère et
   mode de paiement COD.
5. **WhatsApp** : lien prérempli avec la référence de commande via
   `WhatsAppService.buildLink({ page: 'confirmation', orderReference })`.
6. **Suivi** : lien vers `/suivi` prérempli avec la référence et le téléphone
   normalisé (`toOrderPhone`).
7. **Responsive** : empilement des champs de livraison sous 640 px et actions pleine
   largeur.

## 3. Limitations documentées

- Le backend ne fournit pas encore de jeton sécurisé de consultation de commande.
  L'accès repose donc sur l'état en mémoire du checkout ; un rechargement affiche
  l'état vide. Ce point reste un blocage backend à traiter dans un ticket dédié.
- Les logs GitHub Actions restent inaccessibles (`gh` absent, pas de token) ;
  aucun workflow n'a été modifié.

## 4. Fichiers

**Créés**
- `frontend/apps/storefront/src/app/features/confirmation/confirmation-page.spec.ts`
- `docs/features/ORD-04/ANALYSE-DESIGN.md`
- `docs/features/ORD-04/VERIFICATION.md`

**Existants mobilisés**
- `frontend/apps/storefront/src/app/features/confirmation/confirmation-page.ts`
- `frontend/apps/storefront/src/app/features/confirmation/confirmation-page.html`
- `frontend/apps/storefront/src/app/features/confirmation/confirmation-page.scss`
- `frontend/apps/storefront/src/app/features/checkout/checkout.store.ts`
- `frontend/apps/storefront/src/app/core/services/whatsapp.service.ts`
