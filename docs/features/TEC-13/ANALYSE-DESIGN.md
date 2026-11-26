# TEC-13 — Analyse de design et décisions

> Utilitaires transverses du storefront : format FCFA, téléphone camerounais,
> SEO/JSON-LD et socle i18n.
> Branche : `feature/TEC-13-cross-cutting-utils`.
> Références : DSG-07, CAT-07, MKT-02, AUT-09, AUT-11.
> Statut : **implémenté et vérifié localement**, non validé pour la production.

---

## 1. Objectif et périmètre

TEC-13 consolide des règles aujourd’hui dupliquées entre les pages produit,
panier, authentification et contact. Le ticket ne livre pas une refonte visuelle
ni la traduction complète du storefront.

| Critère d’acceptation | Livraison | Statut |
| --- | --- | --- |
| CA #1 — pipe FCFA | `FcfaPipe` et `formatFcfa` dans `@bruny/util` | Livré |
| CA #1 — cas limites | `null`, `undefined`, `NaN`, infini → `—` | Livré |
| CA #2 — téléphone `+237` | Validateurs, normalisation et helpers partagés | Livré |
| CA #2 — consolidation | Ancien validateur local supprimé, formulaires branchés sur `@bruny/util` | Livré |
| CA #3 — SEO | `SeoService` étendu, JSON-LD sur les pages publiques | Livré |
| CA #3 — indexation | `noindex, nofollow` sur connexion et inscription | Livré |
| CA #4 — i18n | Transloco 8.4, locale `fr-CM`, assets et clés de base | Livré |
| CA #4 — migration des textes | Socle uniquement ; textes existants non migrés | Partiel, assumé |

Hors périmètre : traduction de l’administration, sélecteur de langue visible,
migration de tous les microtextes, rédaction des contenus légaux en anglais,
génération automatique des clés de traduction.

---

## 2. Décisions structurantes

### 2.1 Emplacement des utilitaires

Les pipes et validateurs restent dans `frontend/libs/util`. Cette lib est déjà
la dépendance commune du storefront et de l’administration ; créer un second
module « core » aurait dupliqué la surface publique.

### 2.2 Un seul format de téléphone

Deux validateurs coexistent volontairement :

- `phoneValidator` valide un numéro international complet `+237` + 9 chiffres ;
- `localPhoneValidator` valide les 9 chiffres d’un champ dont le préfixe `+237`
  est affiché séparément.

Les formulaires P15 (inscription) et P22 (contact) utilisent le second, car leur
interface montre déjà `+237`. Le backend continue de recevoir le format complet
via `toInternationalPhone` ou `normalizeCameroonPhone`.

Un numéro dont les 9 chiffres commencent par `0` est refusé : le préfixe
international est déjà porté par le champ et un zéro initial produirait un
numéro invalide.

### 2.3 SEO centralisé

`SeoService` reste dans `apps/storefront/src/app/core`. Il est le seul endroit
qui écrit le titre, la description, l’URL canonique, Open Graph, Twitter,
`robots` et le JSON-LD. Les pages ne manipulent pas directement `Title` ou
`Meta`.

Les schémas JSON-LD sont construits dans `structured-data.ts` pour être testables
sans rendre une page. Le script porte un identifiant unique (`bruny-jsonld`) :
la navigation le remplace au lieu d’empiler les schémas.

### 2.4 i18n limité au socle

Transloco a été retenu plutôt qu’`@angular/localize` : le storefront a besoin
d’un chargement de traductions à l’exécution, d’un fallback et d’une structure
par clés. La locale Angular reste `fr-CM` pour les formats `DatePipe` et
`DecimalPipe`.

Le périmètre i18n de TEC-13 est volontairement limité à la configuration, aux
assets et aux clés communes. La migration des textes existants est décrite dans
[`I18N-MIGRATION.md`](./I18N-MIGRATION.md).

---

## 3. Architecture livrée

```text
frontend/libs/util/src/lib/
├── money.ts                    # formatFcfa + effectiveProductPrice
├── fcfa.pipe.ts                # pipe `fcfa`
├── fcfa.pipe.spec.ts           # 9 cas de formatage
├── phone.validator.ts          # validateurs, normalisation, formatage
├── phone.validator.spec.ts      # 15 cas
├── phone-format.pipe.ts        # pipe `phoneFormat`
└── phone-format.pipe.spec.ts

frontend/apps/storefront/src/app/core/
├── seo.service.ts              # métadonnées + JSON-LD
├── seo.service.spec.ts
├── structured-data.ts          # WebSite, Product, FAQPage, etc.
├── structured-data.spec.ts
└── transloco-http.loader.ts    # chargement SSR-aware

frontend/apps/storefront/public/i18n/
├── fr-CM.json
└── en.json
```

---

## 4. Format FCFA

`formatFcfa` applique les règles de DSG-07 :

- nombre entier, arrondi au plus proche ;
- séparateur de milliers ;
- espace insécable `U+00A0` avant `FCFA` et entre les groupes ;
- aucune décimale ;
- `null`, `undefined`, `NaN` et l’infini affichent `—`.

Le séparateur produit par `Intl.NumberFormat('fr-CM')` varie selon l’ICU
(`U+202F` ou `U+00A0`). Le formateur normalise donc tous les espaces de
groupement en `U+00A0` pour garantir un rendu identique entre Node et les
navigateurs.

Exemples :

| Entrée | Sortie |
| --- | --- |
| `15000` | `15 000 FCFA` |
| `0` | `0 FCFA` |
| `1250000` | `1 250 000 FCFA` |
| `15000.7` | `15 001 FCFA` |
| `null` | `—` |

`PriceTagComponent` utilise déjà `FcfaPipe`; son test vérifie explicitement
l’absence d’espace fine `U+202F`.

---

## 5. Téléphone camerounais

### Règles

- format international : `+237` suivi de 9 chiffres, premier chiffre non nul ;
- format local : 9 chiffres, premier chiffre non nul ;
- les espaces, tirets, points et parenthèses sont ignorés ;
- un champ vide est toléré ; `Validators.required` gère l’obligation ;
- les lettres et un préfixe `237` sans `+` sont refusés.

### Helpers publics

| Fonction | Rôle |
| --- | --- |
| `phoneValidator` | valide un numéro international complet |
| `localPhoneValidator` | valide les 9 chiffres d’un champ préfixé |
| `isCameroonPhoneNumber` | test booléen international |
| `isCameroonLocalPhoneNumber` | test booléen local |
| `normalizeCameroonPhone` | produit `+237XXXXXXXXX` quand possible |
| `toInternationalPhone` | convertit une saisie locale pour l’API |
| `formatCameroonPhone` | affiche `+237 6 99 12 34 56` |
| `PhoneFormatPipe` | expose le formatage aux templates |

Le message d’erreur est partagé et aligné sur DSG-07 :
`Saisissez un numéro camerounais à 9 chiffres (ex. 6 71 23 45 67).`

---

## 6. SEO et JSON-LD

### `SeoService`

`setPageMeta` accepte :

- `title`, `description`, `canonicalPath` ;
- `ogType` (`website`, `product`, `article`) ;
- `ogImage`, `ogImageAlt` ;
- `noIndex` ;
- `jsonLd`.

La signature historique `set(title, description, path)` reste disponible pour
les pages qui n’ont pas encore été migrées.

Le service écrit les balises Open Graph, Twitter Card, `robots`, le lien
canonique et un script JSON-LD unique. Les URL d’images sont résolues avec
`siteUrl`, jamais avec l’origine de la requête SSR.

Le contenu JSON-LD échappe `<` en `\u003c` : une description produit contenant
`</script>` ne peut pas fermer prématurément la balise.

### Schémas livrés

| Page | Schéma |
| --- | --- |
| Accueil | `WebSite` + `Organization` |
| Boutique | `CollectionPage` |
| Fiche produit | `Product` avec `Offer`, prix XAF et disponibilité |
| À propos | `AboutPage` |
| Contact | `ContactPage` |
| FAQ | `FAQPage` avec toutes les questions/réponses |

Les pages connexion et inscription sont explicitement en
`noindex, nofollow` et ne publient aucun JSON-LD.

---

## 7. i18n

- Transloco `8.4.0`, configuré dans `app.config.ts`.
- Langue par défaut et fallback : `fr-CM`.
- Langues déclarées : `fr-CM`, `en`.
- `LOCALE_ID` Angular : `fr-CM`, avec `registerLocaleData`.
- Chargement HTTP depuis `/i18n/<lang>.json`.
- En SSR, le loader résout l’origine depuis `REQUEST` ; à défaut, il utilise
  `APP_CONFIG.siteUrl`.
- La traduction par défaut est chargée au démarrage de l’application.
- Aucun `transloco-keys-manager` n’est installé.

Les clés de base couvrent `common`, `validation` et `errors`. Elles ne sont pas
encore utilisées par les écrans existants : c’est un socle prêt à recevoir la
migration, pas une traduction complète.

---

## 8. Écarts et limites assumés

| Sujet | Choix | Raison |
| --- | --- | --- |
| Textes existants | Non migrés | Volume trop important pour un ticket transverse ; migration planifiée |
| Langue `en` | Fichier présent, non exposé dans l’UI | Aucun sélecteur de langue demandé |
| Administration | Hors i18n | Périmètre du ticket limité au storefront |
| Dates | Pas de pipe ajouté | DSG-07 et l’administration divergent encore ; à trancher |
| Pages légales | Contenu français non externalisé | Relecture juridique et traduction à planifier |
| JSON-LD produit | Pas d’`aggregateRating` | Aucune donnée d’avis fiable à exposer |

---

## 9. Vérifications associées

Les commandes, résultats et contrôles SSR sont consignés dans
[`VERIFICATION.md`](./VERIFICATION.md).
