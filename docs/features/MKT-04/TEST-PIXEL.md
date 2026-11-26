# MKT-04 — Test manuel du Pixel Meta

Ce document décrit la vérification avec **Meta Pixel Helper** et **Events Manager**.
Il n'a pas été exécuté : aucun ID réel n'est disponible dans le dépôt.

## 1. Prérequis

1. Créer un Pixel dans Meta Business Manager.
2. Remplacer temporairement dans `frontend/apps/storefront/src/app/core/app-config.ts` :
   ```ts
   metaPixelId: 'CHANGEME_meta_pixel_id',
   ```
   par l'ID réel.
3. **Ne jamais committer cet ID.** Le remettre au placeholder après le test.
4. Lancer l'API et la boutique :
   ```bash
   cd backend && node dist/main.js
   cd frontend && pnpm exec ng serve storefront --host 127.0.0.1 --port 4200
   ```
5. Installer l'extension Chrome **Meta Pixel Helper**.

## 2. Réinitialiser le consentement

Dans la console du navigateur, sur `http://127.0.0.1:4200` :

```js
localStorage.removeItem('brunyshop.consent.v1');
localStorage.removeItem('brunyshop.utm.v1');
location.reload();
```

## 3. Vérifier le refus

1. Le bandeau « Nous respectons votre vie privée » s'affiche.
2. Cliquer sur « Refuser ».
3. Dans Pixel Helper : **aucun événement**, aucun script Meta.
4. Console :
   ```js
   JSON.parse(localStorage.getItem('brunyshop.consent.v1'));
   // analytics: false, marketing: false
   ```

## 4. Vérifier l’acceptation

1. Réinitialiser le consentement.
2. Cliquer sur « Accepter ».
3. Pixel Helper doit afficher **PageView**.
4. Vérifier que le script `connect.facebook.net/en_US/fbevents.js` est chargé.
5. Naviguer vers `/boutique`, `/produit/<slug>` : un **PageView** par navigation.

## 5. Vérifier ViewContent

1. Ouvrir une fiche produit.
2. Pixel Helper doit afficher **ViewContent** avec :
   - `content_name`
   - `content_ids` (SKU des variantes)
   - `content_type: product`
   - `value`
   - `currency: XAF`

## 6. Vérifier AddToCart

1. Choisir une pointure disponible.
2. Cliquer sur « Ajouter au panier ».
3. Pixel Helper doit afficher **AddToCart** avec :
   - `content_ids: [SKU de la variante]`
   - `value = prix unitaire × quantité`
   - `currency: XAF`
   - `num_items`

## 7. Vérifier le retrait du consentement

1. Aller dans le pied de page.
2. Cliquer sur « Gérer mes préférences cookies ».
3. Cliquer sur « Personnaliser ».
4. Décocher « Publicité (Pixel Meta) ».
5. Cliquer sur « Enregistrer mes choix ».
6. Pixel Helper ne doit plus recevoir d’événement.
7. Vérifier la suppression des cookies :
   ```js
   document.cookie; // ne contient plus _fbp ni _fbc
   ```

## 8. Vérifier les UTM

1. Ouvrir :
   ```text
   http://127.0.0.1:4200/?utm_source=facebook&utm_medium=cpc&utm_campaign=soldes-2026&fbclid=test
   ```
2. Console :
   ```js
   JSON.parse(localStorage.getItem('brunyshop.utm.v1'));
   ```
3. Vérifier `source`, `medium`, `campaign`, `fbclid`, `capturedAt`.
4. Recharger sans UTM : les valeurs doivent rester identiques (**first-touch**).

## 9. Vérifier InitiateCheckout et Purchase

**Non exécutable aujourd’hui.**

Les écrans P08/P11/P12 du tunnel DSG-04 ne sont pas implémentés dans l’application
Angular. Les méthodes existent :

- `MetaPixelService.trackInitiateCheckout(cart)`
- `MetaPixelService.trackPurchaseOnce(order)`

Lorsque le tunnel sera livré :

1. P08 ou P11 doit appeler `trackInitiateCheckout` avec les SKU, le total et `num_items`.
2. P12 doit appeler `trackPurchaseOnce` avec `reference`, `total`, `items`.
3. Vérifier **Purchase** dans Pixel Helper.
4. Recharger P12 : **aucun nouveau Purchase** ne doit apparaître.
5. Vérifier la clé :
   ```js
   localStorage.getItem('brunyshop.pixel.purchase.BRN-2611-7K3F');
   ```

## 10. Events Manager

1. Dans Meta Business Manager → Events Manager → **Test Events**.
2. Ouvrir le site avec l’ID de test.
3. Vérifier l’arrivée de `PageView`, `ViewContent`, `AddToCart`.
4. Contrôler les paramètres `content_ids`, `value`, `currency`, `num_items`.
5. Vérifier qu'aucun e-mail, téléphone, nom ou adresse n'apparaît dans les événements.

## 11. Critères d’échec

- Un événement part avant le consentement.
- Un événement part après un refus.
- Le script Meta est présent dans le HTML SSR.
- Purchase part deux fois pour la même référence.
- Les cookies `_fbp`/`_fbc` restent après retrait du consentement.
- Un ID réel est commité.

## 12. Nettoyage

1. Remettre `CHANGEME_meta_pixel_id`.
2. Supprimer les cookies et le localStorage de test.
3. Ne pas committer de capture d’écran contenant l’ID ou des données de test.
