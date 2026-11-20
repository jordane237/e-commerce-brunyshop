# Vérification de démarrage — Sprint 3

- **Date** : 20 novembre 2026
- **Branche** : `review/sprint-3-final-audit`
- **Commit** : `06522bd`

## 1. Frontend storefront

Commande :

```bash
pnpm -C frontend dev:storefront
```

Résultat :

- Serveur Angular démarré sur `http://localhost:4200`.
- Réponse HTTP `200` sur `/`.
- `allowedHosts: true` ajouté à la configuration `serve` pour éviter le refus de `localhost:4200`.
- Le rendu HTML contient bien :
  - `https://wa.me/237679176296`
  - `https://www.facebook.com/profile.php?id=100087026340515`

## 2. Backend

Commande attendue :

```bash
PORT=4000 pnpm -C backend dev
```

Le `PORT=4000` est volontairement limité au processus backend pour ne pas entrer en conflit avec Angular SSR. Les e2e backend démarrent l'API sur ce port et attendent sa disponibilité.

## 3. Limites connues

- L'erreur `getaddrinfo ENOTFOUND brunyshop.cm` est bénigne : elle vient de la génération robots/sitemap en environnement local.
- Le tunnel P08–P13 n'existe pas ; les parcours panier → commande → confirmation ne sont pas démontrables.
- Le Pixel Meta reste configurable mais non validé faute d'ID réel.