# CAT-11 — Test Open Graph avec Facebook Sharing Debugger

## Prérequis

- Application storefront SSR démarrée (`ng serve storefront` ou build SSR)
- URL publique du produit (production ou via ngrok en local)
- Image produit accessible sans authentification, dimensions ≥ 200×200, ratio 1.91:1 recommandé (1200×630)

## Vérification SSR

```bash
curl -s http://localhost:4000/produit/<slug> | grep -E 'og:title|og:description|og:image|og:url|og:type|product:price:amount|product:price:currency'
```

Attendu dans le HTML rendu côté serveur :

- `<meta property="og:title" content="... | BRUNY SHOPPING" />`
- `<meta property="og:description" content="..." />`
- `<meta property="og:image" content="https://..." />`
- `<meta property="og:url" content="https://brunyshop.cm/produit/<slug>" />`
- `<meta property="og:type" content="product" />`
- `<meta property="product:price:amount" content="..." />`
- `<meta property="product:price:currency" content="XAF" />`
- JSON-LD `Product` avec `offers.price` et `priceCurrency: "XAF"`

## Facebook Sharing Debugger

1. Aller sur `https://developers.facebook.com/tools/debug/`
2. Coller l’URL du produit
3. Cliquer sur `Debug`
4. Vérifier :
   - `og:title`
   - `og:description`
   - `og:image` visible
   - `og:url`
   - `og:type = product`
5. Si l’aperçu ne s’affiche pas, cliquer sur `Scrape Again`
6. Capturer les screenshots dans ce dossier pour preuve

## Points de contrôle

- `og:image` doit être une URL absolue
- Image accessible avec statut HTTP 200
- Prix présent via `product:price:amount` et `product:price:currency`
- JSON-LD Product présent dans le HTML SSR