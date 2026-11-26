# TEC-13 — Vérification

> Date des vérifications : **16 novembre 2026**.
> Branche : `feature/TEC-13-cross-cutting-utils`.
> Environnement : Node.js `v24.15.0`, Angular `22.2.2`, Nx `23.3`, Vitest `4`.
> Les résultats ci-dessous proviennent de commandes réellement exécutées dans le
> dépôt, après la dernière modification de code.

---

## 1. Compilation, lint et formatage

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C frontend exec nx run storefront:typecheck` | ✅ | `tsc --noEmit`, aucune erreur |
| `pnpm -C frontend lint` | ✅ | ESLint frontend, aucune erreur |
| `pnpm exec prettier --check` sur les fichiers modifiés | ✅ | Trois fichiers réalignés avant le contrôle final |

Le typecheck a d’abord révélé deux erreurs introduites pendant le ticket :

- chemin d’import erroné du loader Transloco ;
- `ValidationErrors` utilisé sans import dans le formulaire de contact.

Les deux causes ont été corrigées ; le typecheck final passe.

---

## 2. Tests frontend

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C frontend exec vitest run --maxWorkers=2` | ✅ | **80 fichiers, 399 tests passés** |
| Tests ciblés TEC-13 | ✅ | SEO, JSON-LD, téléphone, FCFA, contact, inscription, catalogue, FAQ, à propos |

Couverture ajoutée ou mise à jour :

- **9 tests** `FcfaPipe` : groupement, millions, arrondi, négatif, `null`,
  `undefined`, `NaN`, infini et absence de `U+202F` ;
- **15 tests** téléphone : formats international et local, séparateurs, champ
  vide, longueurs, préfixe zéro, lettres et helpers de normalisation ;
- **3 tests** `PhoneFormatPipe` ;
- **7 tests** `SeoService` : titre, canonical, Open Graph, Twitter, `noindex`,
  remplacement/suppression du JSON-LD et échappement de `</script>` ;
- **4 tests** `structured-data` : accueil, pages simples, produit et FAQ ;
- specs de pages et de formulaires alignées sur les nouveaux messages et
  validateurs.

### Incident corrigé

La première suite complète a échoué sur un test téléphone : `+237069912345`
était accepté parce que le validateur ne contrôlait que la longueur. Les
expressions régulières exigent désormais un premier chiffre non nul. Le test
ciblé puis la suite complète ont été relancés et passent.

---

## 3. Builds

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C frontend build:storefront` | ✅ | Build production SSR réussi |
| `pnpm -C frontend build:admin` | ✅ | Build production admin réussi |

Les deux builds ont été relancés après la correction du validateur téléphone.

---

## 4. Vérification SSR

Le serveur a été démarré avec :

```bash
PORT=4101 node frontend/dist/apps/storefront/server/server.mjs
```

| Contrôle | Résultat |
| --- | --- |
| `GET /` | **200** |
| `GET /faq` | **200** |
| `GET /a-propos` | **200** |
| `GET /contact` | **200** |
| `GET /connexion` | **200** |
| Attribut `lang` | `fr-CM` sur les cinq pages |
| Titre d’accueil | `Chaussures à Douala et Yaoundé \| BRUNY SHOPPING` |
| Titre FAQ | `Questions fréquentes \| BRUNY SHOPPING` |
| JSON-LD accueil | **1 script**, `WebSite` + `Organization` |
| JSON-LD FAQ | **1 script**, `FAQPage` avec questions |
| JSON-LD À propos / Contact | **1 script** chacun |
| JSON-LD connexion | **0 script** |
| `robots` connexion | `noindex, nofollow` |
| `robots` pages publiques | `index, follow` |
| `GET /i18n/fr-CM.json` | **200**, `application/json` |
| Journal serveur | Aucune erreur au démarrage ni pendant les requêtes |

Le serveur de vérification a été arrêté après les contrôles.

---

## 5. Contrôles fonctionnels

| Élément | Vérification |
| --- | --- |
| `15000` → `15 000 FCFA` | Test unitaire, espace `U+00A0` |
| `null` / `NaN` / infini → `—` | Tests unitaires |
| `+237 6 99 12 34 56` | Validateur et pipe de formatage |
| Normalisation vers `+237699123456` | Tests des helpers |
| Inscription et contact | Champs locaux à 9 chiffres + préfixe visuel |
| SEO produit | `og:type=product`, image et JSON-LD `Product` |
| JSON-LD unique | Remplacement et suppression testés |
| Injection `</script>` | Contenu échappé en `\u003c` |
| Locale Angular | `LOCALE_ID = fr-CM` |

---

## 6. Ce qui n’a pas été vérifié ou reste incomplet

| Élément | Raison |
| --- | --- |
| Migration complète des textes | Hors périmètre TEC-13 ; environ 271 occurrences restent en dur |
| Sélecteur de langue | Non demandé ; l’application reste en `fr-CM` |
| Traduction anglaise des écrans | Fichier `en.json` présent, aucun écran ne l’expose |
| Administration i18n | Hors périmètre |
| Audit visuel, Lighthouse, axe-core | Aucun outil ni capture demandés pour TEC-13 |
| Tests backend | Aucun fichier backend modifié par ce ticket |
| Validation en production | Non réalisée ; le ticket est vérifié localement |

---

## 7. Fichiers exclus du commit

- `frontend/angular.json` : modification locale antérieure à TEC-13, non liée au
  ticket.
- `.~lock.Tickets_BRUNY_SHOPPING.docx#` : verrou bureautique non suivi.
- `frontend/dist/**` : artefacts de build ignorés par Git.
