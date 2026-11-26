# MKT-01 — Vérification

> Date des vérifications : **16 novembre 2026**.
> Environnement : Node.js `v24.15.0`, Angular `22.2.2`, Nx, Vitest 4 + jsdom.
> Aucune vérification n’a été simulée : les résultats ci-dessous proviennent des commandes
> exécutées dans le dépôt.

---

## 1. Résultats des commandes

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C frontend exec nx run storefront:typecheck` | ✅ | `tsc --noEmit` passe |
| `pnpm -C frontend exec nx run admin:typecheck` | ✅ | `tsc --noEmit` passe |
| `pnpm -C frontend lint` | ✅ | `eslint .` sans erreur ni avertissement |
| `pnpm -C frontend exec vitest run --maxWorkers=2` | ✅ | **76 fichiers, 361 tests passés** |
| `pnpm -C frontend build:storefront` | ✅ | Build production + bundles SSR générés |
| `pnpm -C frontend build:admin` | ✅ | Build production admin généré |

### Note sur la première exécution des tests

`pnpm -C frontend test` (workers par défaut) a produit **357 tests réussis sur 361** avec
quatre timeouts à 5 s :

- `catalog-page.spec.ts` : « appends the next page through Voir plus » ;
- `catalog-page.spec.ts` : « resets filters but keeps the sort » (conséquence du timeout précédent) ;
- `admin/app.routes.spec.ts` : « sends STOCK_MANAGER to 403 on audit » ;
- `admin/app.routes.spec.ts` : « sends CUSTOMER to 403 on an admin route ».

Les deux fichiers ont été relancés isolément : **6/6** et **7/7** tests passent.
La suite complète relancée avec `--maxWorkers=2` passe **361/361**. Les échecs initiaux
sont donc liés à la charge des workers, pas au code MKT-01. Aucun test n’a été ignoré,
modifié ou affaibli.

---

## 2. Vérification SSR

Le build storefront a été servi avec :

```bash
cd frontend
NODE_OPTIONS=--max-old-space-size=8192 PORT=4000 \
  node dist/apps/storefront/server/server.mjs
```

### Pages MKT-01

| Route | HTTP | `h1` | Titre rendu | Canonical |
| --- | --- | --- | --- | --- |
| `/a-propos` | 200 | 1 | À propos \| BRUNY SHOPPING | `https://brunyshop.cm/a-propos` |
| `/faq` | 200 | 1 | Questions fréquentes \| BRUNY SHOPPING | `https://brunyshop.cm/faq` |
| `/livraison` | 200 | 1 | Livraison \| BRUNY SHOPPING | `https://brunyshop.cm/livraison` |
| `/retours` | 200 | 1 | Retours et échanges \| BRUNY SHOPPING | `https://brunyshop.cm/retours` |
| `/guide-des-tailles` | 200 | 1 | Guide des tailles \| BRUNY SHOPPING | `https://brunyshop.cm/guide-des-tailles` |
| `/cgv` | 200 | 1 | Conditions générales de vente \| BRUNY SHOPPING | `https://brunyshop.cm/cgv` |
| `/politique-confidentialite` | 200 | 1 | Politique de confidentialité \| BRUNY SHOPPING | `https://brunyshop.cm/politique-confidentialite` |
| `/mentions-legales` | 200 | 1 | Mentions légales \| BRUNY SHOPPING | `https://brunyshop.cm/mentions-legales` |

Contrôles complémentaires :

- le footer et ses liens sont présents dans le HTML SSR de chaque page ;
- la balise `meta name="description"` et `og:url` sont rendues côté serveur ;
- `/confidentialite` répond **302** vers `/politique-confidentialite`, puis **200** avec le
  bon titre après suivi de la redirection ;
- `/boutique` répond **200** et inclut le nouveau footer (non-régression du layout) ;
- `/robots.txt` répond **200** en `text/plain` ;
- `/sitemap.xml` répond **200** en `application/xml` avec **10 URL**.

### Limites SSR constatées

- **`/` (accueil) ne répond pas en SSR** : la requête expire après 60 s. Le composant
  d’accueil existant appelle `/api/v1` pendant le rendu serveur ; sans backend, l’appel
  se heurte au serveur Express lui-même et bloque le rendu. Ce comportement est antérieur
  à MKT-01 et n’a pas été introduit par ces pages. Il n’a pas été corrigé (hors périmètre).
- Avec la limite de heap Node par défaut (4 Go), la requête sur `/` provoque un OOM.
  Les pages MKT-01 répondent normalement avec `--max-old-space-size=8192` ; aucune
  d’entre elles ne déclenche de consommation mémoire anormale.
- La redirection Angular est un **302**, pas un 301. Pour un SEO strict, un 301 serait
  préférable ; la redirection côté serveur n’a pas été modifiée.

Aucune mesure Lighthouse n’a été exécutée : le dépôt ne contient ni configuration
Lighthouse CI ni script associé. Aucun contrôle visuel par capture d’écran n’a été
demandé ni réalisé.

---

## 3. Vérifications structurelles d’accessibilité

Contrôlées par les specs et l’inspection du HTML SSR :

- un seul `h1` par page ;
- `nav aria-label="Sommaire de la page"` et `aria-current` dans le sommaire ;
- accordéons avec `aria-expanded`, `aria-controls`, `role="region"` et `aria-labelledby` ;
- tableaux avec `caption`, `th scope="col"` et `th scope="row"` ;
- alternatives textuelles sur l’image d’À propos ;
- liens de contact explicites (`Demander un retour`, `Nous contacter`, etc.) ;
- focus visible et cibles ≥ 44 px définis dans les styles ;
- contrastes basés sur les tokens DSG-02 (`accent-text`, `success-strong`, `danger-strong`).

Non réalisés : audit axe-core, navigation clavier manuelle, lecteur d’écran, zoom 200 %
et test de contraste outillé. Ces contrôles restent à faire avant validation finale.

---

## 4. Ce qui n’a pas pu être vérifié

| Élément | Raison |
| --- | --- |
| Validation propriétaire et juriste | Aucune signature dans le dépôt ; voir `CONTENT-VALIDATION.md` |
| Identité légale complète | CNT-03 absent ; placeholders dans `legal.ts` |
| Tables de pointures définitives | CNT-02 non validé |
| `GET /delivery-zones` | Endpoint non implémenté ; tableau statique |
| Contact et suivi de commande | Pages P22 et P13 absentes |
| Lighthouse / performances réelles | Aucun outil ni configuration CI |
| Rendu de `/` en SSR | Blocage pré-existant lié aux appels API de l’accueil |

---

## 5. Fichiers exclus du commit

- `frontend/angular.json` : modification antérieure au ticket, non liée à MKT-01.
- `.~lock.Tickets_BRUNY_SHOPPING.docx#` : fichier de verrou bureautique non suivi.
- `frontend/dist/**` : artefacts de build ignorés par Git.
