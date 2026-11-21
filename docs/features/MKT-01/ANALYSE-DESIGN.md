# MKT-01 — Analyse de design et décisions

> Pages statiques et légales du storefront BRUNY SHOPPING.
> Branche : `feature/MKT-01-static-legal-pages`.
> Sources : DSG-05 (P22–P27, `CONTENUS.md`, `GLOSSAIRE-MICROTEXTES.md`), DSG-02 (tokens), seed CAT-06.

---

## 1. Périmètre livré

| Page | Route | Référence DSG-05 | Rendu |
| --- | --- | --- | --- |
| À propos | `/a-propos` | P26 | SSR, sommaire |
| FAQ | `/faq` | P23 | SSR, sommaire + accordéons |
| Livraison | `/livraison` | P24 | SSR, tableau + cartes mobile |
| Retours et échanges | `/retours` | P25 | SSR, sommaire |
| Guide des tailles | `/guide-des-tailles` | P25/CAT-06 | SSR, 3 tableaux |
| CGV | `/cgv` | P27 | SSR, 12 articles |
| Confidentialité | `/politique-confidentialite` | P27 | SSR, 11 sections |
| Mentions légales | `/mentions-legales` | P27 | SSR, 6 sections |

Redirection : `/confidentialite` → `/politique-confidentialite` (compatibilité avec les liens existants de `CgvCheckboxComponent`).

Hors périmètre : page Contact P22, page de suivi P13, espace client, checkout. Ces pages n’existent pas encore dans le dépôt ; aucun faux formulaire ni lien mort n’a été créé.

---

## 2. Lecture du design

- Les pages P22–P27 sont des spécifications textuelles avec wireframes 360/768/1280, sans visuel dédié.
- Aucun composant `Breadcrumb`, `Alert`, `EmptyState` ou `Tabs` n’existe dans `libs/ui`. Le fil d’Ariane est donc rendu par le layout éditorial, sans nouvelle abstraction générique.
- Les tokens DSG-02 fournissent déjà les couleurs, espacements, rayons, focus et cibles tactiles. Aucun token nouveau n’a été ajouté.
- Le contenu éditorial est centralisé dans `docs/design/DSG-05/CONTENUS.md` ; les textes des composants en sont la transcription directe.

---

## 3. Architecture retenue

```text
apps/storefront/src/app/
├── core/
│   ├── app-config.ts          # APP_CONFIG : nom, URL de production, e-mail support
│   ├── legal.ts               # identité légale + placeholders
│   └── seo.service.ts         # title, description, canonical, OG, Twitter, robots
├── features/
│   ├── info/
│   │   ├── about/             # P26
│   │   ├── faq/               # P23
│   │   ├── delivery/          # P24
│   │   ├── returns/           # P25
│   │   └── size-guide/        # guide statique CAT-06
│   ├── legal/
│   │   ├── cgv/               # P27
│   │   ├── privacy/           # P27
│   │   └── legal-notice/      # P27
│   └── shared/components/legal-page-layout/
├── layout/components/footer/
└── styles.scss                # bloc éditorial global `.prose`
libs/ui/src/lib/
├── accordion/
└── table-of-contents/
```

### Pourquoi ces emplacements

- `LegalPageLayoutComponent` est dans `features/shared` : les groupes `info` et `legal` l’utilisent sans import croisé entre eux.
- `TableOfContentsComponent` et `AccordionComponent` sont dans `libs/ui` : composants réutilisables, exportés par `@bruny/ui`.
- Le footer remplace le footer inline de `app.html` et devient le point unique des liens transverses.

---

## 4. Composants et comportements

### `TableOfContentsComponent`

- `nav aria-label="Sommaire de la page"`, titre `h2`.
- Desktop : colonne sticky ; mobile : bloc statique.
- Clic : défilement vers la section, `history.replaceState` pour l’ancre, focus sur la cible (`tabindex="-1"`).
- `aria-current="true"` sur la section active, mise à jour par `IntersectionObserver` (désactivé hors navigateur et si l’API est absente).
- Mouvement réduit respecté via `prefers-reduced-motion`.

### `AccordionComponent`

- Ouverture unique par instance, bouton `aria-expanded` / `aria-controls`, panneau `role="region"` / `aria-labelledby`.
- Utilisé pour la FAQ courte de Livraison et les 18 questions de la FAQ.
- Limite assumée : la FAQ utilise une instance par catégorie ; l’ouverture unique s’applique donc à l’intérieur d’une catégorie, pas entre catégories.

### `LegalPageLayoutComponent`

- Fil d’Ariane, `h1` unique, chapô, date `<time>`, version.
- Sommaire conditionnel, contenu projeté dans `.prose`, bloc de contact `mailto`.
- Largeur de lecture : `75ch`, interlignage `1.7`.

### Footer

- Trois navigations nommées (Boutique, Aide, Informations légales) + bloc marque.
- Cibles ≥ 44 px, focus visible, contrastes issus des tokens.
- Aucun réseau social ni newsletter : non prévus par le périmètre et non configurés.

---

## 5. SEO

- `SeoService.setPageMeta()` est appelé à l’initialisation de chaque page.
- Balises produites : `title`, `meta description`, `robots`, Open Graph (`title`, `description`, `url`, `type`, `site_name`, `locale`) et Twitter (`card`, `title`, `description`).
- URL canonique basée sur `APP_CONFIG.siteUrl = https://brunyshop.cm`, jamais sur l’origine de la requête SSR.
- `robots.txt` : pages privées exclues, sitemap déclaré.
- `sitemap.xml` : 10 URL publiques. Les fiches produit ne sont pas générées dynamiquement (hors périmètre) ; le sitemap devra être généré côté serveur lorsqu’un catalogue réel sera publié.

### Limites SEO connues

- Pas de données structurées JSON-LD (`Organization`, `FAQPage`) : non demandées par le ticket.
- Pas de `hreflang` : site monolingue français.
- Pas de génération automatique du sitemap : fichier statique à maintenir.

---

## 6. Accessibilité (WCAG 2.1 AA)

- Un seul `h1` par page, hiérarchie `h2`/`h3` cohérente.
- Tableaux avec `caption`, `th scope="col"` et `th scope="row"`.
- Tableau Livraison doublé de cartes mobiles avec libellés visibles ; le tableau est masqué sous 768 px.
- Liens explicites, aucun « cliquez ici ».
- Contrastes : `--bs-color-accent-text` pour l’or sur fond clair, `--bs-color-success-strong` / `--bs-color-danger-strong` pour les verdicts.
- Focus visible sur liens, boutons et zones de tableau défilantes.
- Aucune information portée par la seule couleur : les marques ✓/✗ sont décoratives et le texte porte le sens.
- `prefers-reduced-motion` respecté par le sommaire.
- Vérification manuelle restante : zoom 200 %, lecteur d’écran et contraste outillé (Lighthouse CI absent du dépôt).

---

## 7. Données et replis

| Donnée | Source réelle | Décision |
| --- | --- | --- |
| Zones de livraison | `GET /delivery-zones` **n’existe pas** | Table statique issue du seed P24, signalée comme indicative |
| Guide des tailles | Seed CAT-06 `size-guides.seed.ts` | Recopié dans le composant, en attente CNT-02 |
| Identité légale | `core/legal.ts` | Placeholders explicites si CNT-03 absent |
| FAQ | `CONTENUS.md` | 18 Q/R statiques |
| Contact | Aucun endpoint de contact storefront | `mailto:support@brunyshop.cm` |
| Suivi de commande | Page P13 absente | Renvoi vers l’e-mail support avec la référence |

Aucun appel réseau n’est effectué par ces pages : le rendu SSR est complet et déterministe.

---

## 8. Écarts assumés par rapport aux specs

| Spec | Écart | Raison |
| --- | --- | --- |
| P22 Contact | Page non créée ; CTA `mailto` | P22 hors périmètre MKT-01, formulaire non disponible |
| P23 recherche instantanée + filtres | Non implémentés | Décision de périmètre MVP ; 18 questions restent consultables par catégorie |
| P23 `?categorie=` et ancre profonde | Non implémentés | Dépend de la recherche/filtre reportés |
| P24 `GET /delivery-zones` | Table statique | Endpoint inexistant |
| P24 « Suivre ma commande » | `mailto` | Page P13 absente |
| P25 référence préremplie | Non disponible | Aucune commande en session sur ces pages |
| P25 « produits soldés » | Non mentionné | Point juridique non tranché (voir CONTENT-VALIDATION) |
| P27 sections masquées si donnée absente | Placeholders visibles | Permet au propriétaire d’identifier précisément les champs manquants ; à retirer avant production |
| P27 sommaire en accordéon mobile | Sommaire statique | Le composant TOC est déjà compact et accessible ; pas de double interaction |
| Sitemap dynamique | Fichier statique | Aucune route produit générée côté serveur à ce stade |

---

## 9. Performance

- Chaque page est chargée en lazy loading ; le build produit un chunk distinct par page (≈ 7–9 kB brut pour les pages légales).
- Le hero de À propos porte `width`/`height` et `loading="eager"` ; les autres images du site ne sont pas modifiées.
- Aucune police ni bibliothèque supplémentaire ajoutée.
- Le build storefront passe ; la mesure Lighthouse n’a pas été exécutée (aucune configuration CI dans le dépôt).

---

## 10. Vérifications associées

Les commandes exécutées et leurs résultats réels sont consignés dans [`VERIFICATION.md`](./VERIFICATION.md).
