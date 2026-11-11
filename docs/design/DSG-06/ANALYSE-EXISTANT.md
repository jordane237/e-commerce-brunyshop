# DSG-06 — Analyse de l'existant (back-office A01–A16)

> Périmètre : administration BRUNY SHOPPING, desktop **et** mobile.
> Ticket de **conception uniquement** : ce document ne contient ni spec détaillée ni code applicatif.
> Branche : `feature/DSG-06-admin-backoffice-design`.
> Date : 10 novembre 2026.

---

## 1. Résumé exécutif

| Constat | Résultat |
| --- | --- |
| Dossiers `/design` et `/design-1` cités par le ticket | **Inexistants** ; la source réelle est `design1/bruny shopping/bruny shopping.png` (4302 × 5532) |
| Écrans back-office dans la planche | **1 seule zone** : zone L « Atelier & Dispatch Coursiers », mobile, 392 × 2600 |
| Écrans A01–A16 déjà maquettés | **Aucun** au sens du ticket ; la zone L préfigure A03, A06, A09 et A09b |
| Vues desktop admin | **Aucune** : la zone L est mobile ; le shell admin actuel fournit une sidebar codée |
| Admin existant | **3 routes** : `/connexion`, `/produits`, `/acces-refuse` |
| Page produits actuelle | Liste **publique** (`GET /products`), sans création, édition, filtre, action ni vue mobile en cartes |
| Composants `@bruny/ui` | **16 exports**, pas 10 ; **`Tabs` n'existe pas** |
| APIs admin réellement exposées | Produits (create/patch/archive/variants/duplicate), guides tailles (update), médias (presign/confirm/delete/reorder), notifications (lecture) |
| APIs admin manquantes | Dashboard, lecture produits admin, stock, commandes, livraisons, clients, utilisateurs, coupons, avis, paramètres, audit, profil |
| Rôles backend | `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`, `STOCK_MANAGER`, `LIVREUR`, `CUSTOMER` ; guards opérationnels |
| Verdict | La zone L donne l'**ADN visuel** et quelques patterns mobile. Le reste (dashboard, catalogue complet, commandes, livraisons, clients, paramètres, audit) est **à concevoir**, avec la majorité des APIs **à créer**. |

**Conséquence :** DSG-06 n'est pas une transcription de maquettes. C'est une phase de conception qui doit :

1. réutiliser strictement les tokens DSG-02 et les 16 composants TEC-10 ;
2. s'inspirer de la densité et de la hiérarchie de la zone L, sans recopier ses fausses données ;
3. distinguer chaque endpoint existant d'un endpoint à créer ;
4. spécifier les conversions tableaux → cartes et la vue livreur comme des parcours de première classe.

---

## 2. Méthode, sources et limites

### 2.1 Exploration réalisée

| Source | Contenu trouvé |
| --- | --- |
| `design1/` | `bruny shopping/bruny shopping.png` uniquement |
| `design/`, `design-1/` | **Absents** (vérifié par `find`) |
| `docs/design-1/` | `ANALYSE-MAQUETTES.md` uniquement |
| `docs/design-system/` | `DESIGN-AUDIT.md`, `tokens-reference.md`, `ASSUMPTIONS.md` |
| `docs/design/DSG-04/` | 15 documents, tunnel P08–P13 |
| `docs/design/DSG-05/` | 30 documents, compte et informations P14–P27 |
| `frontend/apps/admin/` | Login, shell sidebar, page produits, guards, 403 |
| `frontend/libs/ui/` | 16 composants standalone exportés |
| `backend/src/modules/` | Auth, catalogue admin, médias, guides tailles, notifications, audit (écriture), settings/orders/reviews/users squelettes |
| `backend/prisma/schema.prisma` | Modèles et enums complets, aucune table de véhicule, hub, casier ou bordereau |
| `backend/openapi.json` | **27 chemins** exposés, dont 10 seulement sous `/admin` |

### 2.2 Limites

- Une seule image raster, sans calques, exports ni fichier Figma/Penpot.
- La zone L est une **maquette de présentation** : ses chiffres, noms, références et statuts ne sont pas des données réelles.
- Aucune vue 768 px ni 1280 px pour l'admin : les compositions larges sont à concevoir.
- Aucun état de chargement, vide, erreur ou succès n'est dessiné.
- Aucun test utilisateur, aucune préférence du gérant sur la navigation desktop.
- Les APIs commandes, livraisons, clients, coupons, avis, paramètres et audit ne sont pas implémentées : les specs devront fournir des contrats cibles et des fallbacks.

---

## 3. Arborescence réelle

```text
bruny-shopping/
├── design/                              # ABSENT
├── design-1/                            # ABSENT
├── design1/
│   └── bruny shopping/
│       └── bruny shopping.png           # planche unique, 4302 × 5532, 3,4 Mo
├── docs/
│   ├── design-1/
│   │   └── ANALYSE-MAQUETTES.md
│   ├── design-system/
│   │   ├── DESIGN-AUDIT.md
│   │   ├── tokens-reference.md
│   │   └── ASSUMPTIONS.md
│   ├── design/
│   │   ├── DSG-04/                      # 15 docs, P08–P13
│   │   └── DSG-05/                      # 30 docs, P14–P27
│   └── backend/                         # auth, catalog, media, admin-products, etc.
├── frontend/
│   ├── apps/
│   │   ├── admin/                       # /connexion, /produits, /acces-refuse
│   │   └── storefront/                  # boutique SSR
│   └── libs/
│       ├── ui/                          # 16 composants
│       ├── design-tokens/               # 120 variables
│       └── data-access/                 # SessionService, CatalogApi, etc.
└── backend/
    ├── prisma/schema.prisma
    └── src/modules/
        ├── auth/                        # complet, 2FA admin
        ├── catalog/                     # public + admin produits + guides tailles
        ├── media/                       # presign / confirm / reorder
        ├── notifications/               # admin dead-letters
        ├── audit/                       # écriture uniquement
        ├── orders/                      # squelette, README
        ├── payments/                    # squelette
        ├── shipping/                    # squelette
        ├── users/                       # squelette
        ├── reviews/                     # squelette
        └── settings/                    # squelette
```

### 3.1 Écarts avec les documents existants

| Source | Énoncé | Réalité |
| --- | --- | --- |
| `DESIGN-AUDIT.md` | 13 écrans, dont 3 back-office distincts et 1 vue livreur | La planche ne contient qu'**une** zone L continue ; les vues « Pilotage & Stocks », « Gestion des commandes » et « Mes livraisons » n'existent pas comme cadres séparés |
| Ticket DSG-06 | 20 écrans | 16 écrans numérotés + **5 sous-vues** = **21 specs** (A05b, A09b, A09c, A10b, A12b) |
| Ticket DSG-06 | 10 composants UI dont `Tabs` | 16 composants exportés, **pas de `Tabs`** |
| Ticket DSG-06 | Routes `/admin/login`, `/admin/2fa`, `/admin` | Routes réelles : `/connexion`, `/produits`, `/acces-refuse` ; base href `/` |
| Brief général | CAPTCHA / Turnstile livré | Aucune occurrence dans `backend/src` ni `frontend` |
| Brief général | Modèle `Order`, `Shipment`, `Coupon`, `Review` complets | Modèles Prisma présents, **aucun endpoint** exposé |

---

## 4. Inventaire visuel P01–P27 et zone admin

La planche est une présentation **mobile** ; chaque écran mesure 392 à 396 px de large.

| Code | Écran | Zone / coordonnées | Type | Exploitation DSG-06 |
| --- | --- | --- | --- | --- |
| P01 | Accueil | E — 852, 824, 396 × 2396 | PNG | Patterns de cartes, header, footer |
| P02 | Catalogue | F — 1276, 800, 392 × 1568 | PNG | Grille, filtres, breadcrumb |
| P03 | Recherche | — | Absent | Aucun pattern de recherche dédié |
| P04 | Fiche produit | G — 1696, 800, 396 × 2272 | PNG | Galerie, accordéons, badges |
| P05 | Guide des pointures | — | Absent | Modèle CAT-06 existe ; pattern tableau à créer |
| P06 | Panier | H — 2120, 800, 392 × 1276 | PNG | Récapitulatif, états vides |
| P07 | Mini-panier | — | Absent | — |
| P08–P11 | Tunnel | C — 8, 800, 396 × 2096 | PNG + specs | Formulaires, stepper, erreurs |
| P11b/P11c | Attente / échec paiement | — | Absents | Specs V2 |
| P12 | Confirmation | I — 2540, 800, 396 × 1912 | PNG + spec | Timeline, récapitulatif |
| P13 | Suivi | J — 2964, 800, 392 × 1904 | PNG + spec | Timeline, statuts, coursier |
| P14–P16b | Auth client | — | Specs DSG-05 | Champs, force mot de passe |
| P17–P21 | Compte client | K — 3416, 800, 396 × 1740 | PNG + specs | Cartes, navigation compte |
| P22–P26 | Information | — | Specs DSG-05 | Contenus éditoriaux |
| P27–P27e | Légal / erreurs | — | Specs DSG-05 | Layouts d'erreur |
| **L** | **Back-office « Atelier & Dispatch Coursiers »** | **3888, 816, 392 × 2600** | **PNG** | **Unique référence admin : A03, A06, A09, A09b** |
| D | Design System | 432, 800, 392 × 4308 | PNG | Tokens, boutons, champs, badges |

**Aucun SVG, PDF, Figma, Sketch ou Penpot. Aucun export par écran. Aucune vue desktop.**

---

## 5. Analyse de la zone L — seule référence back-office

### 5.1 Structure observée (mobile, de haut en bas)

1. **Header** : hamburger, logo « BRUNY SHOPPING », statut « Akwa Hub (Douala) · En ligne », panier avec pastille 6.
2. **Hero navy** : badge doré « BACK-OFFICE », « Terminal Opérateur #237-DLA », titre « Atelier & Dispatch Coursiers », sous-titre sur les livraisons Douala/Yaoundé et les stocks, boutons « Hub Principal Actif » (statut vert) et « Rafraîchir ».
3. **Indicateurs clés** : grille 2 × 2 de cartes KPI — chiffre du jour 485 000 FCFA / 14 commandes / +18 % vs hier ; 6 courses actives / Douala Centre & Sud / délai moyen 38 min ; 4 paires à préparer / pointures 41, 42, 43 / 2 colis urgents 16 h ; encaissement livraison 98 % / espèces et Mobile Money / MTN & Orange.
4. **Alerte stock critique** : bordure et fond rouges, icône triangle, « Pointure 42 sur Mocassin Glacé Bruny : plus que 1 exemplaire en réserve Akwa », boutons « Détails réserve » et « Réapprovisionner ».
5. **Flotte & dispatch** : titre, badge « 2/3 motos mobilisées », deux cartes coursier.
   - Ibrahim, Moto Fleet #14, zone Bonapriso/Bonanjo, pastille verte « Proche repère », commande assignée `#BS-2025-8492`, client, adresse, article, 52 500 FCFA, badge « À encaisser (Cash) », boutons WhatsApp et Appel rapide.
   - Samuel, Moto Fleet #08, zone Akwa/Deido, badge « Au hub (Atelier) », 2 livraisons en attente, deux lignes de commandes avec montants, boutons « Remettre colis » et WhatsApp.
6. **Commandes récentes à valider** : badge « 1 en attente », carte commande `#BS-2025-8493`, « Expédition interurbaine », enregistrée il y a 12 minutes, 58 000 FCFA, paiement MTN MoMo confirmé, article, destination Yaoundé, destinataire, mention « Pointure 43 réservée physiquement au casier #B12 », boutons « Modifier » et « Valider & imprimer bordereau ».
7. **Réassurance** : paiement à la livraison, échange 7 jours, assistance WhatsApp 7j/7.

### 5.2 Patterns réellement exploitables

| Pattern | Observation | Réutilisation |
| --- | --- | --- |
| Hero opérationnel navy | Badge contexte, titre, sous-titre, statut et action | A03, en-têtes de section |
| KPI card | Libellé, valeur forte, contexte, variation ou alerte | A03, A06 |
| Alerte stock actionnable | Message précis + deux actions | A03, A06 |
| Carte coursier | Avatar, flotte, zone, statut, commande, montant, actions | A09, A09b, A09c |
| Carte commande à valider | Référence, statut, total, paiement, article, destination, destinataire, actions | A07, A08 |
| Badges de statut | Couleur + texte, parfois point | Tous les écrans |
| Boutons pleine largeur mobile | Primaire navy, secondaire bordé, WhatsApp vert | Tous les écrans |
| Réassurance | Trois lignes icône + titre + détail | A03, A09b |
| Densité mobile | Sections aérées, cartes empilées, aucune table | RESPONSIVE-PATTERNS |

### 5.3 Ce que la zone L ne couvre pas

- Aucune sidebar desktop, aucun fil d'Ariane, aucun menu de modules.
- Aucun écran de connexion ou de 2FA admin.
- Aucune table desktop, aucun filtre, aucune pagination, aucune action bulk.
- Aucune gestion de produit, variante, image, SEO ou catégorie.
- Aucun client, utilisateur interne, coupon, avis, paramètre ou audit.
- Aucun état vide, chargement, erreur, 403 ou session expirée.
- Aucune donnée réelle : chiffres, véhicules, hubs et casiers ne sont pas modélisés.

### 5.4 Enseignements pour A01–A16

1. L'admin doit être **dense mais respirant** : cartes, titres courts, chiffres forts, actions immédiatement visibles.
2. Le mobile n'est pas une version dégradée : c'est un contexte de travail (gérant, livreur) avec des actions critiques à portée de pouce.
3. Les statuts doivent être **textuels et colorés**, jamais une simple pastille.
4. Les montants COD et les alertes stock sont des informations de premier plan, pas des détails.
5. Le ton est direct et professionnel : « À préparer », « Réapprovisionner », « Remettre colis », sans jargon.

---

## 6. Patterns extraits de P01–P27

### 6.1 Navigation

| Contexte | Pattern existant | Décision admin |
| --- | --- | --- |
| Storefront | Header hamburger, logo, panier | Ne pas réutiliser |
| Admin actuel | Sidebar 250 px sticky, devient une barre supérieure sous 700 px | Remplacer par sidebar rétractable + drawer mobile |
| Admin actuel | Aucun fil d'Ariane | Ajouter un `Breadcrumb` sur toutes les pages internes |
| Admin actuel | Aucun menu de notifications | Ajouter un accès notifications dans le header |
| Zone L | Header avec statut de hub | Reprendre le principe d'un statut contextuel, sans inventer de hub |
| Compte client | Sidebar ≥ 1024 px, onglets 768 px, liste 360 px | Reprendre la logique adaptative pour la navigation admin |

### 6.2 Formulaires

| Pattern | Observation | Décision admin |
| --- | --- | --- |
| Label | Au-dessus du champ, 600, 14 px | Conserver |
| Obligatoire | Astérisque + `aria-required` | Conserver |
| Aide | Sous le champ, texte discret | Conserver |
| Erreur | Bordure danger + texte + `aria-describedby` (DSG-04/05) | Conserver, jamais une alerte globale seule |
| Téléphone | Préfixe `+237` non éditable | Conserver |
| Champs | 44–52 px, radius 8 px | Conserver, densité admin 36–44 px pour les filtres |
| Formulaire long | Aucun pattern existant | Onglets + sections, sauvegarde explicite |
| Actions | Primaire à droite, secondaire à gauche | Conserver sur desktop ; barre sticky sur mobile |

### 6.3 Boutons

| Variante | Usage |
| --- | --- |
| `primary` navy | Action principale : créer, enregistrer, valider |
| `secondary` bordé | Action secondaire : annuler, dupliquer |
| `ghost` | Action tertiaire, filtres, pagination |
| `danger` | Archiver, annuler une commande, désactiver |
| `whatsapp` | Contact coursier/client, réservé au contact |
| Icône seule | Actions de ligne, avec `aria-label` obligatoire |

### 6.4 Cartes et tableaux

- Cartes : fond blanc, bordure `--bs-color-border`, radius 12 px, ombre légère, padding 16–20 px.
- Micro-titre doré `--bs-color-accent-text` en majuscules, puis titre navy.
- Tableaux desktop : en-têtes majuscules 12 px, lignes 56–64 px, actions à droite.
- Mobile : **aucune table**, uniquement des cartes empilées avec champs prioritaires.
- Badges : texte + couleur + parfois icône ; jamais la couleur seule.
- KPI : valeur en 30–38 px, libellé 12–14 px, contexte 13 px.

### 6.5 Ton et microtextes

- Vouvoiement, français clair, verbes d'action.
- Admin : direct et efficace, pas de jargon technique, pas de marketing.
- Les erreurs expliquent **comment corriger**, pas seulement ce qui a échoué.
- Les actions destructives annoncent leurs conséquences.
- Les statuts sont traduits en français, jamais affichés en enum brut.

### 6.6 Tokens à respecter

| Famille | Valeurs |
| --- | --- |
| Couleurs | `primary #131B2E`, `accent #C89B3C`, `accent-text #8A6A1F`, `canvas #FAFAF7`, `surface #FFFFFF`, `success #1E8E5A`, `success-strong #0F7A40`, `danger #D62839`, `warning #B98500`, `info #2F5D8A` |
| Typographie | Plus Jakarta Sans, 11 → 48 px ; texte admin 14–16 px |
| Espacements | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px |
| Rayons | 8 px contrôles, 12 px cartes, 20 px feuilles, full pastilles |
| Cibles | 44 px minimum ; **48 px pour la vue livreur** |
| Focus | double anneau navy, visible sur tous les fonds |
| Layout | conteneur 1200 px, sidebar 240–260 px |

### 6.7 Visualisation de données

- Aucun graphique dans la planche. A03 prévoit un **placeholder** de courbe CA 7 jours, avec alternative tableau et résumé textuel.
- Aucune bibliothèque de charts n'est installée : le composant `ChartPlaceholder` est spécifié, l'implémentation réelle est un ticket futur.
- Les KPI doivent toujours être calculables à partir d'une API ; aucun chiffre inventé en dur.

---

## 7. Composants `@bruny/ui` réutilisables

`frontend/libs/ui/src/index.ts` exporte **16 composants**. Le brief en annonce 10 et cite `Tabs` : c'est faux.

| Composant | Réutilisation admin | Limite constatée |
| --- | --- | --- |
| `Button` | Tous les CTA, y compris loading et icônes | Pas de variante `danger-ghost` explicite |
| `Input` | Login, formulaires, recherche, filtres | Pas de `type=search` dédié, pas de suffixe |
| `Select` | Filtres, catégories, marques, rôles | Pas de recherche pour listes longues |
| `Checkbox` | Sélection de lignes, variantes, consentements | Pas d'état indéterminé documenté |
| `Radio` | Choix de type de coupon, portée | — |
| `Badge` | Statuts simples, compteurs | 9 variantes, mais pas de mapping métier |
| `Toast` | Succès et erreurs transitoires | Un seul message à la fois |
| `Skeleton` | Chargements de tables et cartes | Pas de variante « ligne de tableau » |
| `Spinner` | Boutons et vérifications | — |
| `Modal` | Base de `ConfirmDialog` | Focus trap et Échap déjà implémentés |
| `Table` | Base de `DataTable` desktop | Pas de sélection, bulk, colonnes figées ni expansion |
| `Icon` | Partout | Jeu d'icônes à confirmer |
| `Toggle` | Paramètres, activation coupon, 2FA | — |
| `ProductCard` | Aperçu produit, boutique | Trop orienté storefront pour A04 |
| `PriceTag` | Montants, paniers, commandes | Pas de variante compacte admin |
| `SizeSelector` | Aperçu des pointures | Non adapté à la grille de variantes |

### 7.1 Problèmes du code admin actuel

- `app.scss` et `login-page.ts` codent les couleurs en dur (`#1f2a44`, `#c9a227`, `#f5f6f8`) au lieu des tokens.
- La sidebar n'est pas un drawer : elle devient une barre horizontale sous 700 px, sans menu complet.
- `ProductsPage` appelle l'API **publique** et n'affiche que les produits publiés ; elle ne peut ni créer, ni éditer, ni archiver.
- Aucune table admin, aucun filtre, aucune action, aucun état vide avec CTA.
- Le shell n'a ni breadcrumb, ni notifications, ni menu utilisateur, ni lien vers les autres modules.
- L'admin n'a aucune route 404 dédiée : le wildcard redirige vers `/produits`.
- Le login gère déjà le challenge 2FA et l'enrôlement dans la même page ; A01/A02 devront clarifier cette séparation visuelle.

---

## 8. Composants manquants à spécifier

| # | Composant | Usage | Base | Priorité |
| --- | --- | --- | --- | --- |
| 1 | `DataTable` | Tables desktop, tri, sélection, bulk, pagination | `Table` | P0 |
| 2 | `CardList` | Conversion mobile des tables | Aucune | P0 |
| 3 | `FilterBar` | Filtres desktop inline | `Input`, `Select` | P0 |
| 4 | `FilterDrawer` | Filtres mobile en bottom sheet | `Modal` | P0 |
| 5 | `ActionMenu` | Actions secondaires (kebab) | Aucune | P0 |
| 6 | `StatCard` / `KpiCard` | Dashboard et stock | Aucune | P0 |
| 7 | `StatusBadge` | Mapping statuts métier FR | `Badge` | P0 |
| 8 | `ConfirmDialog` | Actions destructives | `Modal` | P0 |
| 9 | `Timeline` | Audit, statuts commande, mouvements | DSG-04 | P0 |
| 10 | `ImageUploader` | Images produit, presign/confirm | `Modal`, `Button` | P0 |
| 11 | `VariantGridGenerator` | Grille couleurs × pointures (CA #4) | Aucune | P0 |
| 12 | `TwoFactorCodeInput` | Code 6 chiffres + code de secours | `Input` | P0 |
| 13 | `CommandPalette` | Navigation rapide Cmd/Ctrl+K | `Modal` | P2 |
| 14 | `AddressCard` | Commande, livraison, client | DSG-05 | P1 |
| 15 | `BulkActionsBar` | Sélection multiple | Aucune | P0 |
| 16 | `ChartPlaceholder` | CA 7 jours, alternative tableau | Aucune | P1 |
| 17 | `Breadcrumb` | Toutes les pages | DSG-05 | P0 |
| 18 | `EmptyState` | Tous les écrans | DSG-05 | P0 |
| 19 | `Alert` | Erreurs, alertes stock | DSG-04 | P0 |
| 20 | `BottomSheet` | Drawer mobile, actions | `Modal` | P0 |
| 21 | `SearchField` | Recherche debounced | `Input` | P1 |
| 22 | `Tabs` / `SegmentedControl` | Formulaire produit, paramètres | Aucune | P1 |
| 23 | `CopyButton` | Référence commande, SKU | DSG-04 | P1 |
| 24 | `RoleBadge` | Rôles internes | `Badge` | P2 |
| 25 | `DeliveryCardMobile` | Vue livreur (CA #3) | Aucune | P0 |
| 26 | `FileDropzone` | Import CSV futur | `ImageUploader` | P2 |
| 27 | `PasswordStrengthIndicator` | Profil admin | DSG-05 | P2 |
| 28 | `Stepper` | Création produit | DSG-05 | P0 |
| 29 | `ActivityFeed` | Audit récent, dashboard | `Timeline` | P2 |

**Principe** : réutiliser les 16 composants avant de créer. `DataTable` doit composer `Table` plutôt que le réécrire. `CardList` est le pendant mobile officiel de chaque table.

---

## 9. Réalité backend

### 9.1 Endpoints réellement exposés

Préfixe global : `/api/v1` (`setGlobalPrefix('api')` + versioning URI).

| Domaine | Endpoint | Rôle autorisé |
| --- | --- | --- |
| Auth | `POST /auth/login` | Public, 10 req/min |
| Auth | `POST /auth/refresh`, `POST /auth/logout` | Public / authentifié |
| Auth | `POST /auth/forgot-password`, `POST /auth/reset-password` | Public |
| Auth 2FA | `POST /auth/2fa/setup`, `POST /auth/2fa/verify` | Challenge token |
| Profil | `GET /me` | Authentifié |
| Produits admin | `POST /admin/products` | `STOCK_MANAGER`, `ADMIN`, `SUPER_ADMIN` |
| Produits admin | `PATCH /admin/products/:id`, `DELETE /admin/products/:id` | idem |
| Produits admin | `PUT /admin/products/:id/variants`, `POST /admin/products/:id/duplicate` | idem |
| Guides tailles | `PUT /admin/size-guides/:id` | idem |
| Médias | `POST /admin/media/presign`, `POST /admin/media/confirm` | idem |
| Médias | `DELETE /admin/media/images/:id`, `PATCH /admin/media/images/reorder` | idem |
| Notifications | `GET /admin/notifications/dead-letters`, `GET /admin/notifications/:id` | `ADMIN`, `SUPER_ADMIN` |
| Catalogue public | `GET /products`, `GET /products/:slug`, `GET /categories` | Public |
| Guides publics | `GET /size-guides/:categoryId` | Public |
| Panier | `POST /cart/validate` | Public |
| Santé | `GET /health/live`, `GET /health/ready` | Public |

### 9.2 Contrats de création de produit (CAT-04) — déjà utilisables

- `POST /admin/products` accepte `variants[]` explicites **ou** `colors[]` + `sizes[]` (produit cartésien).
- Limites : 30 couleurs, 30 pointures, **300 variantes maximum**.
- SKU générés côté serveur ; slugs générés si absents.
- `PATCH /admin/products/:id` ne modifie **pas** les variantes (route dédiée).
- `PUT /admin/products/:id/variants` remplace l'ensemble des variantes ; `reservedStock` est interdit ; suppression refusée si une variante est liée à une commande (`409 VARIANT_HAS_ORDERS`).
- Codes d'erreur à traduire dans l'UI : `VALIDATION_ERROR`, `PROMO_PRICE_INVALID`, `PROMO_WINDOW_INVALID`, `PUBLISHED_REQUIRES_STOCK`, `DUPLICATE_VARIANT`, `SKU_ALREADY_EXISTS`, `SLUG_ALREADY_EXISTS`, `CATEGORY_NOT_FOUND`, `BRAND_NOT_FOUND`, `VARIANT_NOT_OWNED`, `RESERVED_STOCK_FORBIDDEN`, `VARIANT_HAS_ORDERS`.
- Publication refusée si aucune variante n'a de stock (`PUBLISHED_REQUIRES_STOCK`).
- Médias : presign → PUT direct → confirm (validation magic bytes, JPEG/PNG/WebP, génération WebP + vignette 400 × 400).

### 9.3 APIs manquantes par écran

| Écran | Données nécessaires | Existant | À créer |
| --- | --- | --- | --- |
| A01 Connexion | Login, erreurs, rate limit | `POST /auth/login` | CAPTCHA (absent), lien mot de passe oublié admin |
| A02 2FA | Setup, verify, backup codes | `POST /auth/2fa/setup`, `/verify` | Désactivation, régénération des codes |
| A03 Dashboard | KPI, commandes, stock, alertes | **Rien** | `GET /admin/dashboard` |
| A04 Liste produits | Liste admin, filtres, tri, pagination | **Aucun GET admin** ; `GET /products` est public et ne renvoie que le publié | `GET /admin/products`, `GET /admin/products/:id`, filtre statut/catégorie/marque/stock |
| A05 Produit | Création, édition, statut, SEO, images | `POST`, `PATCH`, `DELETE` | `GET /admin/products/:id`, `GET /admin/brands`, `GET /admin/categories` (CRUD éventuel) |
| A05b Variantes | Grille, bulk, SKU, prix, stock | `POST` avec `colors/sizes`, `PUT /:id/variants` | Aperçu SKU avant création, endpoint de prévisualisation ou règle client documentée |
| A06 Stock | Stock, réservé, seuil, mouvements | **Rien** ; modèles `ProductVariant`, `StockMovement` présents | `GET /admin/stock`, `POST /admin/stock/adjust`, `GET /admin/stock/movements` |
| A07 Commandes | Liste, filtres, recherche | **Rien** ; modèle `Order` présent | `GET /admin/orders` |
| A08 Détail commande | Détail, statut, livreur, audit, notes | **Rien** | `GET /admin/orders/:reference`, `PATCH /admin/orders/:reference/status`, `POST /admin/orders/:reference/assign`, notes internes |
| A09 Livraisons | Liste, filtres, COD | **Rien** ; modèle `Shipment` présent | `GET /admin/shipments` |
| A09b Mes livraisons | Tournée du livreur, COD, offline | **Rien** | `GET /admin/shipments/mine`, `PATCH /admin/shipments/:id/status`, sync offline |
| A09c Détail livraison | Commande, adresse, statut | **Rien** | `GET /admin/shipments/:id` |
| A10 Clients | Liste, compteurs, CA | **Rien** | `GET /admin/customers` |
| A10b Détail client | Profil, adresses, commandes, avis | **Rien** | `GET /admin/customers/:id`, `PATCH /admin/customers/:id/status`, anonymisation future |
| A11 Utilisateurs | Staff, rôles, dernier login | **Rien** | CRUD `/admin/users`, rôles, reset 2FA |
| A12 Coupons | Liste, activation | **Rien** ; modèle `Coupon` présent | `GET/POST/PATCH /admin/coupons` |
| A12b Coupon | Formulaire, prévisualisation | **Rien** | `POST/PATCH /admin/coupons`, `POST /admin/coupons/validate` |
| A13 Avis | Liste, modération | **Rien** ; modèle `Review` présent | `GET /admin/reviews`, `PATCH /admin/reviews/:id` |
| A14 Paramètres | Settings, zones, notifications, sécurité | **Rien** ; modèles `Setting`, `DeliveryZone` présents | `GET/PATCH /admin/settings`, CRUD `/admin/delivery-zones`, test SMTP |
| A15 Audit | Liste, filtres, export CSV | Écriture seulement (`AuditLogService`) | `GET /admin/audit`, `GET /admin/audit/export` |
| A16 Profil admin | Infos, mot de passe, 2FA, sessions | `GET /me` | `PATCH /me`, `POST /me/password`, `DELETE /auth/2fa`, `GET /auth/sessions`, `DELETE /auth/sessions` |

### 9.4 Enums à traduire dans l'interface

| Enum | Valeurs |
| --- | --- |
| `UserStatus` | `ACTIVE`, `SUSPENDED`, `DISABLED`, `PENDING_VERIFICATION` |
| `ProductStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `OrderStatus` | 13 valeurs, de `PENDING_CONFIRMATION` à `EXCHANGED` |
| `PaymentStatus` | `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED` |
| `PaymentMethod` | `COD`, `MOBILE_MONEY`, `CARD` |
| `ShipmentStatus` | `PENDING`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `FAILED`, `RETURNED` |
| `ReviewStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `CouponType` | `PERCENTAGE`, `FIXED_AMOUNT` |
| `StockMovementReason` | `RESTOCK`, `RESERVATION`, `RELEASE`, `PURCHASE`, `CANCELLATION`, `ADJUSTMENT`, `RETURN` |
| Rôles | `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`, `STOCK_MANAGER`, `LIVREUR`, `CUSTOMER` |

### 9.5 RBAC réel et cible

| Écran | SUPER_ADMIN | ADMIN | ORDER_MANAGER | STOCK_MANAGER | LIVREUR |
| --- | --- | --- | --- | --- | --- |
| A01/A02 | ✅ | ✅ | ✅ | ✅ | ✅ |
| A03 Dashboard | ✅ complet | ✅ complet | ✅ commandes | ✅ stock | ✅ livraisons |
| A04–A05b Catalogue | ✅ | ✅ | ❌ | ✅ | ❌ |
| A06 Stock | ✅ | ✅ | lecture | ✅ | ❌ |
| A07–A08 Commandes | ✅ | ✅ | ✅ | lecture | ❌ |
| A09–A09c Livraisons | ✅ | ✅ | ✅ | ❌ | ✅ (ses livraisons) |
| A10–A10b Clients | ✅ | ✅ | ✅ | ❌ | ❌ |
| A11 Utilisateurs | ✅ | ✅ (hors SUPER_ADMIN) | ❌ | ❌ | ❌ |
| A12–A12b Coupons | ✅ | ✅ | ✅ | ❌ | ❌ |
| A13 Avis | ✅ | ✅ | ✅ | ❌ | ❌ |
| A14 Paramètres | ✅ | ✅ (sections restreintes) | ❌ | ❌ | ❌ |
| A15 Audit | ✅ | ✅ | ❌ | ❌ | ❌ |
| A16 Profil | ✅ | ✅ | ✅ | ✅ | ✅ |

Règle : les actions non autorisées sont **masquées**, pas désactivées. Les routes sont protégées par `authGuard` + `roleGuard`, qui laisse déjà passer `SUPER_ADMIN` partout.

---

## 10. Incohérences et écarts détectés

| # | Sujet | Constat | Décision proposée |
| --- | --- | --- | --- |
| 1 | Dossiers design | `/design` et `/design-1` absents | Utiliser `design1/bruny shopping/bruny shopping.png` |
| 2 | Nombre d'écrans | Le prompt annonce 20, la liste en contient 21 | Spécifier **21 vues** : 16 numérotées + 5 sous-vues |
| 3 | Vues back-office | `DESIGN-AUDIT` annonce 3 back-offices + 1 vue livreur ; la planche n'a qu'une zone L | Ne pas prétendre que des écrans distincts existent ; les concevoir |
| 4 | Desktop admin | Aucune maquette 1280 px | Concevoir sidebar + tables + densité desktop |
| 5 | Shell actuel | Sidebar 250 px codée en dur, sans drawer ni breadcrumb | Remplacer par un `AdminShell` spécifié |
| 6 | Couleurs admin | `#1f2a44`, `#c9a227`, `#f5f6f8` en dur | Migrer vers les tokens DSG-02 |
| 7 | Route admin | `/connexion` et `/produits`, pas `/admin/login` | Les specs utilisent les routes du ticket ; l'implémentation mappera selon le base href |
| 8 | `Tabs` | Annoncé dans le brief, inexistant | Créer `Tabs`/`SegmentedControl` ou utiliser des onglets natifs accessibles |
| 9 | Liste produits | Page actuelle branchée sur l'API publique | A04 exige `GET /admin/products` |
| 10 | Marques | Aucun endpoint marque, même public | `GET /admin/brands` à créer |
| 11 | Création produit | Le backend accepte `colors[]` + `sizes[]` | La grille A05b peut générer le payload sans attendre d'API dédiée |
| 12 | SKU | Générés côté serveur, non prévisualisables | A05b affiche un **aperçu indicatif** et signale que le SKU final peut différer en cas de collision |
| 13 | Stock | Modèles présents, aucun endpoint | A06 dépend d'APIs à créer |
| 14 | « 98 % d'encaissement » | Aucune métrique ni table de rapprochement | Remplacer par « COD collecté / COD attendu » calculé |
| 15 | « 2/3 motos mobilisées » | Aucun modèle véhicule, flotte ou hub | Supprimer ou afficher un simple compteur de livraisons |
| 16 | « Moto Fleet #14 » | Aucun champ véhicule | Retirer de la spec ; utiliser le nom du livreur |
| 17 | « Casier #B12 » | Aucun modèle d'emplacement | Retirer ; le stock est par variante |
| 18 | « Hub Principal » | Aucun modèle de hub | Retirer ; zone de livraison uniquement |
| 19 | « Expédition interurbaine » | N'existe pas dans `OrderStatus` | Dériver de la `DeliveryZone` ou ajouter un badge informatif, sans nouveau statut |
| 20 | Références `#BS-2025-…` | Format réel `BRN-YYMM-XXXX` | Utiliser le format réel |
| 21 | Téléphone `+237 671 ••• •• 89` | Masquage réel `***5678` | Aligner sur `maskPhone` |
| 22 | « Urgent 16h » | Aucun SLA ni champ de priorité | Retirer ou dériver d'un délai de zone |
| 23 | « Imprimer bordereau » | Aucun endpoint ni template | V2 ; bouton désactivé avec explication |
| 24 | Graphique CA | Aucune série, aucun endpoint | `ChartPlaceholder` + tableau alternatif |
| 25 | CAPTCHA | Absent du code | Emplacement prévu, inactif |
| 26 | 2FA | Setup/verify seulement, pas de désactivation | A16 documente la dépendance |
| 27 | Sessions actives | Modèle `RefreshToken`, aucun endpoint de liste | A16 documente la dépendance |
| 28 | Audit | Écriture seulement | A15 en lecture seule, dépendance backend |
| 29 | Paramètres | Modèle `Setting`, aucun contrôleur | A14 dépend d'APIs à créer |
| 30 | Zones livraison | Modèle `DeliveryZone`, aucun endpoint admin | CRUD à créer |
| 31 | Export CSV | Aucun support | A15 : export côté client ou endpoint futur, pas les deux |
| 32 | Offline livreur | Aucun service worker ni file de sync | A09b spécifie le comportement cible et les conflits |
| 33 | Carte / itinéraire | Aucun fournisseur maps | Lien `geo:`/Maps externe, pas de carte intégrée |
| 34 | Rôle `CUSTOMER` | Présent en base, absent du prompt | Le documenter comme rôle client, hors accès admin |
| 35 | Notifications | Endpoint dead-letters existe, pas de centre de notifications | Option V2, hors périmètre A01–A16 |

---

## 11. Décisions de cohérence pour A01–A16

1. **Identité admin** : même navy, or et ivoire que la boutique, mais densité plus forte, micro-titres dorés, cartes blanches, tableaux compacts. L'admin doit être plaisant, pas austère.
2. **Un seul shell admin** : sidebar fixe/rétractable ≥ 1024 px, drawer < 1024 px, header avec fil d'Ariane, recherche globale (V2) et menu utilisateur.
3. **Mobile-first réel** : 360 px est la base ; chaque table possède une `CardList` équivalente ; les filtres passent en drawer ; les actions destructives en bottom sheet.
4. **Réutilisation stricte** : 16 composants TEC-10 d'abord ; les 29 composants manquants sont spécifiés, pas improvisés dans les specs.
5. **RBAC visible** : chaque spec liste les rôles et les actions ; les entrées de menu sont filtrées ; le dashboard s'adapte au rôle.
6. **Aucune donnée inventée** : les KPI, alertes, badges et compteurs proviennent d'APIs ou sont absents. Les placeholders sont explicitement identifiés.
7. **Statuts traduits** : aucun enum brut à l'écran ; tableau de correspondance unique dans `MICROTEXTES.md`.
8. **États complets** : chargement, vide, erreur, succès sur chaque écran ; les états vides proposent l'action suivante.
9. **Actions destructives** : `ConfirmDialog` avec conséquences, focus initial sur « Annuler », never one-click.
10. **Accessibilité** : 44 px (48 px livreur), labels, `aria-describedby`, `aria-sort`, `aria-current`, focus visible, contraste AA, pas de couleur seule.
11. **Aucun faux backend** : les specs distinguent « existant », « à créer » et « fallback ». Les écrans dont l'API manque restent spécifiés mais marqués bloqués pour l'implémentation.
12. **Prototype** : Option C recommandée — page HTML statique du générateur couleurs × pointures, plus Mermaid et wireframes ASCII pour le reste. Aucun code Angular.
13. **Validation bloquante** : `VALIDATION.md` signé par le gérant, et par un livreur test pour A09b, avant tout ticket d'implémentation.

---

## 12. Plan de production

### 12.1 Périmètre exact : 21 vues, 8 groupes

Le ticket parle de 20 écrans, mais énumère 16 écrans numérotés et 5 sous-vues. Le périmètre réel est donc de **21 specs**.

| Groupe | Vues | Fichiers |
| --- | --- | --- |
| 1 — Authentification | A01, A02 | `A01-connexion-admin.md`, `A02-2fa.md` |
| 2 — Dashboard | A03 | `A03-dashboard.md` |
| 3 — Catalogue | A04, A05, A05b, A06 | `A04-liste-produits.md`, `A05-creation-edition-produit.md`, `A05b-variant-generator.md`, `A06-gestion-stock.md` |
| 4 — Commandes & livraisons | A07, A08, A09, A09b, A09c | `A07-liste-commandes.md`, `A08-detail-commande.md`, `A09-liste-livraisons.md`, `A09b-my-deliveries.md`, `A09c-detail-livraison.md` |
| 5 — Clients & utilisateurs | A10, A10b, A11 | `A10-liste-clients.md`, `A10b-detail-client.md`, `A11-utilisateurs-internes.md` |
| 6 — Promotions & avis | A12, A12b, A13 | `A12-promotions.md`, `A12b-edition-coupon.md`, `A13-avis-clients.md` |
| 7 — Paramètres & audit | A14, A15 | `A14-parametres.md`, `A15-audit-log.md` |
| 8 — Profil | A16 | `A16-profil-admin.md` |

### 12.2 Documents transverses

| Document | Contenu |
| --- | --- |
| `CARTOGRAPHIE.md` | Diagramme Mermaid, 8 groupes, routes, guards, redirections |
| `RESPONSIVE-PATTERNS.md` | Règles DataTable → CardList, filtres, actions, pagination, bulk |
| `COMPOSANTS-REQUIS.md` | 29 composants avec props, états, a11y, priorité |
| `MICROTEXTES.md` | Chaînes FR par écran + traduction exhaustive des enums |
| `PROTOTYPE.md` | Option C : démo HTML statique du générateur + Mermaid + 18 scénarios |
| `VALIDATION.md` | Checklist gérant + livreur, CA #2/#3/#4, signature bloquante |
| `README.md` | Index et guide de lecture |

### 12.3 Gabarit des 21 specs

Chaque spec suivra les **11 sections** : objectif et rôle, rôles autorisés, wireframes 360/768/1280, composants, 4 états, microtextes FR, interactions, accessibilité, données API, écarts, wireframe de référence.

---

## 13. Risques

| Risque | Impact | Mitigation |
| --- | --- | --- |
| APIs admin absentes | Specs non implémentables | Contrats cibles + fallbacks + dépendances explicites |
| Une seule maquette admin mobile | Dérive desktop | Wireframes 1280 px détaillés, shell et tables spécifiés |
| Fausses données de la zone L | Specs irréalistes | Retirer véhicules, hubs, casiers, SLA et métriques non modélisées |
| 29 composants à créer | Charge sous-estimée | Priorisation P0/P1/P2 et réutilisation stricte |
| Générateur de variantes | Fonctionnalité critique | Spec dédiée + prototype HTML + tests utilisateur |
| Vue livreur offline | Sync et conflits complexes | Périmètre MVP clair : cache lecture + actions en attente, résolution documentée |
| RBAC incomplet | Fuites ou frustration | Matrice par écran, boutons masqués, guards backend |
| Validation non signée | Blocage d'implémentation | `VALIDATION.md` avec responsables et points ouverts |
| Accessibilité mobile terrain | Utilisation impossible en plein soleil | Contraste renforcé, 48 px, texte ≥ 16 px, test livreur |
| Périmètre 20 vs 21 | Oubli d'une sous-vue | Liste nominative des 21 fichiers au README et à la validation |

---

## 14. Points à trancher avant production

1. **Routes** : conserver `/connexion` et `/produits` ou basculer vers `/admin/*` ? Les specs peuvent rester neutres, mais l'implémentation doit choisir.
2. **Dashboard** : les KPI « CA du jour » et « commandes du jour » sont-ils calculés sur `createdAt` ou sur `paidAt` ? Décision proposée : `createdAt` pour le volume, `paidAt` pour le CA.
3. **Annulation de commande** : motifs libres ou liste fermée ? Décision proposée : liste fermée + note obligatoire.
4. **Stock** : autoriser un ajustement négatif sous zéro ? Décision proposée : non, stock plancher à 0, motif obligatoire.
5. **A09b offline** : actions autorisées hors ligne limitées à « Marquer livrée » et « Échec » avec file d'attente, ou lecture seule ? Décision proposée : file d'attente avec indicateur « en attente de synchronisation ».
6. **Export audit CSV** : côté client à partir de la page courante, ou endpoint dédié ? Décision proposée : endpoint dédié, sinon export désactivé.
7. **A11** : un ADMIN peut-il créer un autre ADMIN ? Décision proposée : non, seul SUPER_ADMIN attribue ADMIN/SUPER_ADMIN.
8. **A16** : la désactivation 2FA est-elle autorisée pour tous les rôles ? Décision proposée : oui pour les rôles non privilégiés, validation renforcée pour ADMIN/SUPER_ADMIN.

Aucun de ces points ne bloque la rédaction des specs : ils seront tranchés dans chaque document et listés dans `VALIDATION.md`.

---

J'attends ta validation avant de produire les specs.
