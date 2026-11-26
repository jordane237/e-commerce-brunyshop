# DSG-05 — Analyse de l'existant (P14 à P27)

> Périmètre : compte client, authentification, pages d'information et pages d'erreur.
> Ticket de **conception uniquement** : aucune spec détaillée ni code applicatif dans ce document.
> Branche : `feature/DSG-05-account-info-pages-design`.
> Date : 10 novembre 2026.

---

## 1. Résumé exécutif

| Constat | Résultat |
| --- | --- |
| Dossiers `/design` et `/design-1` cités par le ticket | **Inexistants** |
| Source visuelle réelle | **1 fichier** : `design1/bruny shopping/bruny shopping.png` (4302 × 5532, 3,4 Mo) |
| Écrans d'authentification (connexion, inscription, mot de passe oublié) | **Aucun** |
| Écran de compte client existant | **1 seul** : zone K, tableau de bord connecté, mobile uniquement |
| Pages d'information (contact, FAQ, livraison, retours, à propos, légales) | **Aucune** |
| Pages d'erreur (404, 500, hors ligne, maintenance) | **Aucune** |
| Vues 768 / 1280 px | **Aucune**, pour aucun écran |
| États vides, erreurs de formulaire, confirmations | **Aucun** |
| Composants `@bruny/ui` réellement disponibles | **16 exports**, et non 10 ; `Tabs` n'existe pas |
| CAPTCHA / Turnstile | **Absent du dépôt**, malgré le brief qui le déclare livré (AUT-11) |
| API mot de passe oublié | **E-mail + code à 6 chiffres**, pas de lien token |
| API compte | `GET /me` seulement ; pas de `PATCH /me`, pas d'adresses, favoris, commandes ni contact |
| Verdict | Le périmètre P14–P27 est à **concevoir à 90 %**. La zone K fournit un point de départ crédible pour P17/P18/P20, pas pour P14–P16, P22–P27. |

**Conséquence :** DSG-05 n'est pas une transcription de maquettes. C'est une phase de conception qui doit :

1. réutiliser les patterns P01–P13 et les tokens DSG-02 ;
2. inventer les écrans absents en restant dans le même langage visuel ;
3. aligner les specs sur les **API réellement disponibles**, pas sur celles supposées par le brief ;
4. documenter chaque dépendance backend comme ticket futur.

---

## 2. Méthode et sources

### 2.1 Exploration réalisée

| Source | Contenu trouvé |
| --- | --- |
| `design1/` | `bruny shopping/bruny shopping.png` uniquement |
| `design/`, `design-1/` | **Absents** |
| `docs/design-1/` | `ANALYSE-MAQUETTES.md` uniquement (pas de specs P01–P07) |
| `docs/design-system/` | `DESIGN-AUDIT.md`, `tokens-reference.md`, `ASSUMPTIONS.md` |
| `docs/design/DSG-04/` | 15 documents, tunnel P08–P13 complet et commité |
| `frontend/libs/ui/` | 16 composants standalone exportés |
| `frontend/apps/storefront/` | 4 routes, aucun écran de compte ni d'erreur |
| `frontend/apps/admin/` | Page de connexion et guards réutilisables comme pattern |
| `backend/src/modules/auth/` | Register, login, refresh, logout, forgot/reset, 2FA, `GET /me` |
| `backend/prisma/schema.prisma` | `User`, `Address`, `Wishlist`, `Order` complets |

### 2.2 Limites

- Une seule image raster, sans calques ni exports : les mesures sont approximatives, les tokens font foi.
- Aucune vue ≥ 768 px : les compositions tablette et desktop sont à concevoir.
- Aucun écran d'erreur, aucun état alternatif, aucun formulaire d'authentification dessiné.
- Les contenus légaux, l'adresse, le RCCM, le NIU et les coordonnées exactes ne sont pas fournis.
- Aucun test utilisateur ni prototype cliquable existant.

---

## 3. Arborescence réelle

```text
bruny-shopping/
├── design1/
│   └── bruny shopping/
│       └── bruny shopping.png          # planche unique, 4302 × 5532, 3,4 Mo
├── design/                             # ABSENT
├── design-1/                           # ABSENT
├── docs/
│   ├── design-1/
│   │   └── ANALYSE-MAQUETTES.md        # analyse DSG-03, pas de specs
│   ├── design-system/
│   │   ├── DESIGN-AUDIT.md
│   │   ├── tokens-reference.md
│   │   └── ASSUMPTIONS.md
│   ├── design/
│   │   ├── DSG-04/                     # 15 docs, P08–P13
│   │   └── DSG-05/                     # ce document
│   └── backend/
│       ├── auth.md
│       ├── cart.md
│       └── catalog.md
├── frontend/
│   ├── apps/
│   │   ├── storefront/                 # routes : /boutique, /produit/:slug, /panier, /design-system
│   │   └── admin/                      # /connexion, /produits, /acces-refuse
│   └── libs/
│       ├── ui/                         # 16 composants
│       ├── design-tokens/
│       └── data-access/                # SessionService, CartStore, client API
└── backend/
    ├── prisma/schema.prisma
    └── src/modules/
        ├── auth/                       # implémenté
        ├── users/                      # squelette
        ├── wishlist/                   # squelette
        ├── orders/                     # squelette
        ├── payments/                   # squelette
        └── shipping/                   # squelette
```

### 3.1 Écarts avec l'énoncé du ticket

| Énoncé | Réalité | Décision |
| --- | --- | --- |
| Explorer `/design` et `/design-1` récursivement | Les deux dossiers n'existent pas | Utiliser `design1/` et `docs/design-1/`, le documenter partout |
| DSG-03 « maquettes P01–P07 validées » | Seul `ANALYSE-MAQUETTES.md` existe ; P03/P05/P07 sont absents, aucune vue large | Ne pas prétendre que des specs validées existent |
| `libs/ui` = 10 composants dont `Tabs` | 16 exports, **pas de `Tabs`** | Corriger l'inventaire dans les specs |
| `projects/shop` et `projects/admin` | `apps/storefront` et `apps/admin` | Utiliser les chemins réels |
| AUT-11 CAPTCHA / `TurnstileGuard` | Aucune occurrence dans `backend/src` ni `frontend` | Concevoir un emplacement CAPTCHA, signaler la dépendance backend |
| P16 « e-mail ou téléphone », P16b `/:token` | API : e-mail uniquement, code à 6 chiffres | Aligner les specs sur le contrat réel, proposer l'extension V2 |
| P20 adresse par défaut | `Address` n'a **pas** de champ `isDefault` | Décision à trancher (migration recommandée) |
| P18 facture PDF | Aucun modèle ni endpoint de facture | Marquer V2, bouton désactivé avec explication |

---

## 4. Inventaire des écrans existants (P01–P13)

La planche est une **présentation mobile** : chaque écran est large de 392 à 396 px, sans vue tablette ni desktop.

| Code | Écran | Zone | Coordonnées (x, y, l × h) | Type | Exploitation DSG-05 |
| --- | --- | --- | --- | --- | --- |
| A / B | Tiroirs de navigation | — | 480, 0 et 868, 0 | PNG | Pattern de menu, footer, compte |
| P01 | Accueil | E | 852, 824, 396 × 2396 | PNG | Header, footer, cartes, favoris |
| P02 | Catalogue | F | 1276, 800, 392 × 1568 | PNG | Grille, filtres, breadcrumb |
| P03 | Recherche | — | — | **Absent** | Aucun pattern de recherche dédié |
| P04 | Fiche produit | G | 1696, 800, 396 × 2272 | PNG | Galerie, accordéons, favoris |
| P05 | Guide des pointures | — | — | **Absent** (modèle CAT-06 existe) | Pattern tableau à réutiliser |
| P06 | Panier | H | 2120, 800, 392 × 1276 | PNG | Récapitulatif, états vides |
| P07 | Mini-panier | — | — | **Absent** | — |
| P08–P11 | Tunnel checkout | C | 8, 800, 396 × 2096 | PNG + specs DSG-04 | Stepper, formulaires, erreurs |
| P11b / P11c | Attente / échec paiement | — | — | **Absent** (specs V2) | Pattern d'état d'échec |
| P12 | Confirmation | I | 2540, 800, 396 × 1912 | PNG + spec | Ticket, timeline, compte |
| P13 | Suivi public | J | 2964, 800, 392 × 1904 | PNG + spec | Timeline, statuts, coursier |
| **K** | **Espace client** | **K** | **3416, 800, 396 × 1740** | **PNG** | **Base de P17, P18, P20** |
| L | Back-office Atelier & Dispatch | L | 3888, 816, 392 × 2600 | PNG | **Hors périmètre** |
| D | Planche Design System | D | 432, 800, 392 × 4308 | PNG | Tokens, boutons, formulaires, badges |

**Aucun fichier SVG, PDF, Figma, Sketch ou Penpot.** Aucun export par écran.

---

## 5. Analyse de la zone K — « Espace client »

C'est le seul écran qui préfigure P14–P27. Il représente un **utilisateur déjà connecté**, pas une page de connexion.

### 5.1 Structure observée (mobile)

1. **Header** : hamburger, logo « BRUNY SHOPPING », icône réglages (engrenage), panier.
2. **Carte profil navy** :
   - avatar circulaire avec initiales « JM » ;
   - « Jean-Paul Mbianda » ;
   - téléphone `+237 694 28 10 44` ;
   - badge vert « Vérifié » ;
   - pastille dorée « ★ Cercle Prestige » ;
   - deux blocs : « Ville par défaut — Bonapriso, Douala » et « Privilège Exclusif — Livraison Express Offerte » ;
   - pied de carte : « 2 commandes passées avec succès » et « Concierge dédié actif ».
3. **Commande active** : `#BS-2025-8492`, badge « En acheminement prioritaire », total 52 500 FCFA, « Paiement à la livraison », coursier Ibrahim, estimation « aujourd'hui entre 14h30 et 16h00 », une ligne produit, CTA « Suivre en direct » et « WhatsApp Coursier ».
4. **Historique des commandes** : lien « Voir tout », une carte `#BS-2025-7104`, badge « Livré & Essayé », 24 500 FCFA, ligne produit, boutons « Facture PDF » et « Recommander ».
5. **Adresses & repères** : « 2 repères actifs » ; « Domicile (Par défaut) » badge « Principal », Bonapriso, repère ; « Bureau professionnel », Akwa, repère ; bouton pointillé « Ajouter un nouveau repère de livraison ».
6. **Engagements & conciergerie** : paiement à la livraison, échange 7 jours, assistance WhatsApp 7j/7 ; CTA « Concierge WhatsApp 24/7 » et « Guide des pointures ».
7. **Footer navy** amorcé en bas.

### 5.2 Ce que la zone K permet de réutiliser

| Pattern | Réutilisation |
| --- | --- |
| Carte profil navy avec avatar à initiales | P17, P19 |
| Badge de vérification | P19 |
| Navigation par sections du compte | P17 (à formaliser en sidebar/tabs) |
| Carte commande active | P18, P18b |
| Historique de commandes | P18 |
| Carte adresse avec badge « Par défaut » | P20, P20b |
| Bouton d'ajout en pointillé | P20 |
| Bloc engagements | P17, P22, P25 |

### 5.3 Ce que la zone K ne couvre pas

- Aucune navigation de compte structurée (pas de sidebar, pas d'onglets, pas de fil d'Ariane).
- Aucun écran de connexion, d'inscription, de mot de passe oublié.
- Aucun écran de profil éditable, de suppression de compte.
- Aucun écran de favoris (seulement des icônes cœur sur les cartes produit).
- Aucun état vide, aucun état d'erreur, aucun chargement.
- Aucun desktop : la carte profil et les commandes sont empilées.

---

## 6. Patterns extraits de P01–P13

### 6.1 Navigation

| Contexte | Pattern observé | Décision P14–P27 |
| --- | --- | --- |
| Boutique | Hamburger + logo centré + recherche + panier | Réutiliser le header storefront |
| Fiche produit / panier | Flèche retour + titre + panier | Réutiliser pour les sous-pages |
| Compte connecté (K) | Hamburger + logo + réglages + panier | Ajouter un lien « Compte » explicite |
| Checkout | Header dédié, sans navigation globale | Ne pas réutiliser pour le compte |
| Bas de page | Barre inférieure sur P04/P06/P13 | Ajouter « Compte » à la barre |
| Fil d'Ariane | Présent sur P02 uniquement | Généraliser sur P17–P27 |

**Constat** : il n'existe **aucun lien « Connexion » ou « Mon compte »** dans le header actuel du storefront. P14–P21 seront inaccessibles sans ajouter ce point d'entrée. C'est une décision structurante de DSG-05.

### 6.2 Formulaires

| Pattern | Observation |
| --- | --- |
| Label | Au-dessus du champ, petite taille, gras |
| Obligatoire | Astérisque `*` |
| Téléphone | Préfixe `🇨🇲 +237` non éditable, placeholder `690 00 00 00` |
| Aide | Texte sous le champ, avec icône de validation verte quand pertinent |
| Erreur | **Jamais dessinée** dans la maquette ; DSG-04 a défini le pattern texte + bordure + `aria-describedby` |
| Taille | Champs 44–52 px, radius 8 px |
| Mot de passe | **Aucun champ mot de passe dans la planche** |
| Bouton primaire | Pleine largeur, navy, 52 px |

P14–P16 devront donc **inventer** le pattern mot de passe (œil, force, erreurs) tout en respectant les champs existants.

### 6.3 Boutons

| Variante | Usage observé |
| --- | --- |
| `primary` navy | Action principale |
| `secondary` or bordé | Action secondaire prestige |
| `ghost` neutre bordé | Action tertiaire |
| `whatsapp` vert | Contact direct |
| `danger` rouge | Suppression, promo |
| Lien | « Conditions d'échange sous 7j → » |

### 6.4 Cartes et sections

- Fond `surface` blanc, bordure 1 px `#ECE9E2`, radius 12 px, ombre légère.
- Micro-titre doré en majuscules (`accent-text #8A6A1F`) puis titre navy.
- Badges sémantiques (succès, info, neutre, promo).
- Listes en cartes plutôt qu'en tableaux sur mobile.
- Réassurance toujours en bas de page.

### 6.5 Ton et microtextes

- Vouvoiement, français local, verbes d'action.
- Chaleur commerciale : « Votre commande est entre de bonnes mains », « Concierge dédié ».
- Incohérences déjà relevées en DSG-04 et à ne pas propager : « Ydé », « pointure » vs « taille », casse des titres, « 100% » sans espace, promesses non tenues.

### 6.6 Tokens

| Famille | Valeurs à respecter |
| --- | --- |
| Couleurs | `primary #131B2E`, `accent #C89B3C`, `accent-text #8A6A1F`, `canvas #FAFAF7`, `surface #FFFFFF`, `success #1E8E5A`, `success-strong #0F7A40`, `danger #D62839`, `warning #B98500`, `info #2F5D8A`, WhatsApp `#25D366` / `#0F7A40` |
| Typographie | Plus Jakarta Sans, 12 → 48 px |
| Breakpoints | 360 / 768 / 1280 px, conteneur 1200 px |
| Cibles | 44 px minimum, contrôles 44 / 52 px |
| Rayons | 8 / 12 / 20 / full |
| Focus | double anneau navy |

---

## 7. Composants `@bruny/ui` réellement réutilisables

Contrairement au brief, **16 composants** sont exportés, et `Tabs` n'existe pas.

| Composant | Usage P14–P27 | Limite |
| --- | --- | --- |
| `Button` | Tous les CTA | — |
| `Input` | Login, inscription, profil, contact, code | Pas de `textarea`, pas de force de mot de passe |
| `Select` | Sujet du contact, filtres commandes | Pas de recherche |
| `Checkbox` | CGV, consentement, remember me | — |
| `Radio` | Choix de civilité, type d'adresse | — |
| `Badge` | Statuts, « Vérifié », « Par défaut » | 9 variantes disponibles |
| `Toast` | Succès, erreurs transitoires | — |
| `Skeleton` | Chargements | — |
| `Spinner` | Boutons, vérifications | — |
| `Modal` | Confirmations, CGV | Base pour `ConfirmDialog` (focus trap existant) |
| `ProductCard` | P21 favoris | — |
| `PriceTag` | Commandes, favoris | — |
| `Table` | Historique desktop, pagination interne | Pas de composant Pagination autonome |
| `Icon` | Partout | Jeu à confirmer |
| `Toggle` | Préférences, 2FA future | — |
| `SizeSelector` | Non utilisé | — |

### 7.1 Composants présents mais non exportés

Aucun. En revanche, plusieurs composants du brief sont **absents** : `Tabs`.

---

## 8. Composants manquants pour P14–P27

| Composant | Écrans | Priorité | Base existante |
| --- | --- | --- | --- |
| `Accordion` | P23 FAQ, P24/P25 | Haute | Aucune |
| `Timeline` | P18b | Haute | Spécifié DSG-04 |
| `Avatar` | P17, P19 | Haute | Cercle à initiales observé |
| `Pagination` | P18 | Haute | Logique interne de `Table` |
| `Breadcrumb` | P17–P27 | Haute | P02 |
| `ConfirmDialog` | P19b, P20 | Haute | `Modal` + focus trap |
| `EmptyState` | P18, P20, P21 | Haute | Aucune |
| `StatutBadge` | P18, P18b | Haute | `Badge` |
| `ErrorPage` | P27b–P27e | Haute | Aucune |
| `FormFieldGroup` | Tous les formulaires | Moyenne | `Input` |
| `PasswordStrengthIndicator` | P15, P16b | Moyenne | Aucune |
| `Stepper` | P19b suppression | Moyenne | Aucune |
| `AccountNav` / `AccountSidebar` | P17–P21 | Haute | Aucune |
| `Textarea` | P22 contact, P20 repère | Haute | Spécifié DSG-04 |
| `CopyButton` | P18b, P19 | Basse | Spécifié DSG-04 |
| `AddressCard` | P20 | Haute | Spécifié DSG-04 |
| `SearchField` | P27b | Basse | `Input type=search` |

**Principe** : réutiliser `Button`, `Input`, `Badge`, `Modal`, `ProductCard`, `Toast`, `Table` avant de créer. Aucun composant ne doit redéfinir une couleur ou un espacement.

---

## 9. Existant backend et frontend

### 9.1 Authentification réellement disponible

| Fonction | Endpoint | État | Écart avec le brief |
| --- | --- | --- | --- |
| Inscription | `POST /auth/register` | **Implémenté** | E-mail ou téléphone, réponse neutre en cas de doublon |
| Connexion | `POST /auth/login` | **Implémenté** | `identifier` = e-mail **ou** téléphone |
| Refresh | `POST /auth/refresh` | **Implémenté** | Cookie httpOnly |
| Déconnexion | `POST /auth/logout` | **Implémenté** | — |
| Mot de passe oublié | `POST /auth/forgot-password` | **Implémenté** | **E-mail uniquement**, réponse 202 neutre |
| Réinitialisation | `POST /auth/reset-password` | **Implémenté** | `email` + `code` 6 chiffres + `newPassword` |
| 2FA | `POST /auth/2fa/setup`, `/verify` | **Implémenté** | Réservé aux rôles admin |
| Profil | `GET /me` | **Implémenté** | Lecture seule |
| Mise à jour profil | `PATCH /me` | **Absent** | P19 en dépend |
| CAPTCHA | — | **Absent** | Aucun `TurnstileGuard`, aucune clé |

### 9.2 Contrats à connaître pour les specs

- **Mot de passe** : minimum 10 caractères, maximum 128, liste noire de mots courants. Pas de règle de majuscule/chiffre imposée par le DTO actuel.
- **Inscription** : `termsAccepted` et `termsVersion` obligatoires. Version courante `1.0`.
- **Doublon** : réponse `201` identique avec un identifiant factice. L'UI ne doit **jamais** annoncer « cet e-mail existe déjà ».
- **Connexion** : `INVALID_CREDENTIALS` générique, sans distinction e-mail/téléphone.
- **Reset** : la page doit demander **e-mail + code + nouveau mot de passe**, pas un lien `/:token`.
- **Session** : jeton d'accès en mémoire, refresh cookie. Pas de `localStorage`. Conséquence SSR : les pages compte doivent gérer l'absence de session côté serveur et rediriger au rendu client.
- **Guard** : le storefront n'en a aucun ; l'admin fournit un `authGuard` avec `returnUrl`, réutilisable comme pattern.

### 9.3 Autres modules

| Module | État | Impact |
| --- | --- | --- |
| `orders` | Squelette, aucun contrôleur | P18/P18b nécessitent `GET /orders`, `GET /orders/:reference` |
| `users` | Squelette | `PATCH /me`, suppression de compte |
| `wishlist` | Squelette, modèle Prisma présent | P21 nécessite `GET/POST/DELETE /wishlist` |
| `addresses` | **Aucun module**, modèle `Address` présent | P20/P20b nécessitent CRUD |
| `contact` | **Aucun module** | P22 nécessite `POST /contact` ou fallback mailto |
| `invoices` | **Aucun modèle** | P18b « Facture PDF » = V2 |

### 9.4 Modèle de données utile

| Modèle | Champs clés | Manque pour P14–P27 |
| --- | --- | --- |
| `User` | `email?`, `phone?`, `firstName`, `lastName`, `status`, `termsVersion`, `termsAcceptedAt`, `deletedAt` | Aucun champ « avatar », « préférence de contact » |
| `Address` | `label`, `city`, `district`, `line`, `landmark?`, `phone` | **Pas de `isDefault`**, pas de `createdAt` exploitable pour l'ordre |
| `Wishlist` | `userId`, `productId` | API absente |
| `Order` | `reference`, `status`, `subtotal`, `shippingFee`, `total`, `addressSnapshot`, `createdAt` | Pas de facture |
| `OrderStatus` | 13 valeurs | « Livré & Essayé » n'existe pas : dériver l'affichage |

### 9.5 Frontend existant

- Routes : `/boutique`, `/produit/:slug`, `/panier`, `/design-system`, wildcard → `/boutique`.
- **Aucune route** `/connexion`, `/inscription`, `/compte`, `/faq`, `/contact`, `/404`.
- Header minimal : logo, Boutique, Panier, WhatsApp. **Aucun lien compte.**
- Footer : une ligne de texte. Aucun footer riche.
- `SessionService` : `login`, `refresh`, `restore`, `logout`, `user`, `roles`, `token`.
- Aucun écran n'appelle `restore()` au démarrage.
- `CartStore` existe ; le panier n'est pas fusionné à la connexion.
- Admin : page de connexion et guards (`authGuard`, `guestGuard`) réutilisables comme référence.

---

## 10. Incohérences et écarts détectés

| # | Sujet | Constat | Décision proposée |
| --- | --- | --- | --- |
| 1 | Écrans d'authentification | Aucun dans la planche | Concevoir P14–P16b sans référence visuelle, avec les composants existants |
| 2 | Pages d'information | Aucune | Concevoir P22–P27 en contenu éditorial |
| 3 | Pages d'erreur | Aucune | Concevoir 4 layouts dédiés |
| 4 | Navigation compte | Zone K sans sidebar ni fil d'Ariane | Créer `AccountNav` : onglets mobile, sidebar ≥ 1024 px |
| 5 | Point d'entrée compte | Aucun lien dans le header | Ajouter « Mon compte » / icône utilisateur |
| 6 | Référence commande | `#BS-2025-8492` dans la zone K | Aligner sur `BRN-YYMM-XXXX` (DSG-04) |
| 7 | Compteur commandes | « 2 commandes passées » mais 1 seule dans l'historique | Ne pas afficher de compteur non fiable ; utiliser le total API |
| 8 | Statut « Livré & Essayé » | Absent de `OrderStatus` | Dériver : `DELIVERED` + `paymentStatus = SUCCEEDED` |
| 9 | « En acheminement prioritaire » | Statut marketing absent du backend | Mapper sur `SHIPPED` / `IN_TRANSIT` |
| 10 | « Facture PDF » | Aucun endpoint | V2, bouton désactivé + explication |
| 11 | « Cercle Prestige » | Aucun modèle de fidélité | Retirer ou afficher comme programme éditorial sans avantage calculé |
| 12 | « Concierge dédié » | Aucun modèle | Traiter comme libellé marketing vers WhatsApp |
| 13 | « Suivre en direct » | Pas de suivi GPS | Renommer « Suivre ma commande » vers P13 |
| 14 | Adresse par défaut | Pas de champ `isDefault` | Migration recommandée ; sinon première adresse |
| 15 | Mot de passe oublié | API e-mail + code, brief lien token | Specs alignées sur le code ; lien token en V2 |
| 16 | Téléphone oublié | API e-mail uniquement | MVP e-mail ; téléphone en V2 |
| 17 | CAPTCHA | Absent du code | Emplacement prévu, activable quand le backend l'expose |
| 18 | `Tabs` | Annoncé dans le brief, inexistant | Ne pas l'utiliser ; onglets accessibles natifs ou `AccountNav` |
| 19 | Vues larges | Aucune | Concevoir 360 / 768 / 1280 |
| 20 | États | Aucun | 4 états par écran, états vides dédiés |
| 21 | Contrastes | Or sur clair et blanc sur vert échouent AA | Utiliser `accent-text`, `success-strong`, `whatsapp-strong` |
| 22 | Footer | Une ligne dans le code, riche dans la maquette | Formaliser le footer storefront |
| 23 | Barre inférieure | Présente sur P04/P06/P13, absente ailleurs | Décider son périmètre, ajouter « Compte » |
| 24 | Recherche | Pas de page dédiée, champ dans le catalogue | P27b renvoie vers `/boutique?q=` |
| 25 | CGV | Version `1.0`, texte non fourni | Contenu-type à rédiger + validation PO/juriste |

---

## 11. Décisions de cohérence pour P14–P27

1. **Un seul header storefront**, avec un point d'entrée compte explicite (icône + libellé accessible). Le header checkout de DSG-04 reste séparé.
2. **Un shell compte** : sidebar à partir de 1024 px, onglets horizontaux défilables en 768 px, liste verticale en 360 px. Fil d'Ariane sur toutes les sous-pages.
3. **Auth alignée sur l'API réelle** : `identifier` pour la connexion, e-mail + code pour la réinitialisation. Le lien token est documenté comme V2.
4. **Aucune énumération de comptes** : messages neutres à l'inscription, à la connexion et au mot de passe oublié.
5. **Suppression de compte** : double confirmation, mot de passe + code, saisie `SUPPRIMER`, explication des conséquences, `deletedAt` côté backend.
6. **Adresses** : `isDefault` à ajouter au schéma ; à défaut, la plus ancienne est marquée par défaut, sans promesse.
7. **Commandes** : statuts dérivés de `OrderStatus`, jamais de libellé inventé. Timeline réutilisée depuis DSG-04.
8. **Favoris** : `ProductCard` réutilisée, état vide soigné, API à créer.
9. **Pages d'information** : contenu éditorial réel, dates de mise à jour, version CGV `1.0`.
10. **Pages d'erreur** : layout minimal (header + contenu + footer réduit), ton rassurant, action de sortie.
11. **Accessibilité** : 44 px, focus visible, `aria-describedby`, `aria-live`, `alertdialog` pour les suppressions.
12. **Tokens uniquement** : aucune couleur brute, `accent-text` pour l'or sur clair, `success-strong` pour le texte de succès.
13. **Aucune promesse non tenue** : pas de « facture disponible » si l'endpoint n'existe pas, pas de « temps réel », pas de « Cercle Prestige » avec avantages non calculés.

---

## 12. Plan de production

### 12.1 Les 22 écrans

| Groupe | Écrans | Fichiers |
| --- | --- | --- |
| Authentification | P14, P15, P16, P16b | `P14-connexion.md`, `P15-inscription.md`, `P16-mot-de-passe-oublie.md`, `P16b-reinitialisation-mot-de-passe.md` |
| Compte | P17, P18, P18b, P19, P19b, P20, P20b, P21 | 8 fichiers |
| Information | P22, P23, P24, P25, P26, P27 | 6 fichiers |
| Erreur | P27b, P27c, P27d, P27e | 4 fichiers |

### 12.2 Documents transverses

| Document | Contenu |
| --- | --- |
| `CARTOGRAPHIE.md` | Diagramme Mermaid des 4 groupes, routes, guards, redirections |
| `CONTENUS.md` | FAQ 15–20 Q/R, livraison, retours, à propos, mentions légales, CGV, confidentialité |
| `COMPOSANTS-REQUIS.md` | 11–17 composants avec props, états, a11y, priorité |
| `MICROTEXTES.md` | Toutes les chaînes FR par écran, erreurs comprises |
| `PROTOTYPE.md` | Option B : Mermaid + wireframes ASCII + 20 scénarios |
| `VALIDATION.md` | Checklist signable, signature bloquante |
| `README.md` | Index et guide de lecture |

### 12.3 Gabarit

Chaque spec PXX suivra les **10 sections** du ticket : objectif, wireframes 360/768/1280, composants, 4 états, microtextes, interactions, accessibilité, données API, écarts, référence.

---

## 13. Risques

| Risque | Impact | Mitigation |
| --- | --- | --- |
| Concevoir sans maquettes d'auth | Incohérence visuelle | Réutiliser strictement tokens, champs et boutons DSG-02 |
| API compte incomplète | Specs non implémentables | Lister chaque endpoint manquant, prévoir les fallbacks |
| `isDefault` absent | Adresse par défaut impossible | Décision explicite + ticket de migration |
| CAPTCHA absent | CA non couvert | Emplacement prévu, dépendance backend documentée |
| Contenus légaux non fournis | Blocage juridique | Placeholders explicites + validation PO/juriste |
| Suppression de compte | Risque légal et UX | Double confirmation, conséquences claires, conservation des commandes |
| Suivi public | Fuite de données | Réutiliser le modèle protégé de DSG-04 |
| Absence de vues larges | Implémentation divergente | Wireframes 768/1280 détaillés |
| « Cercle Prestige » | Promesse commerciale | Retirer ou requalifier en contenu éditorial |

---

## 14. Points à valider

1. L'alignement de P16/P16b sur l'API réelle (**e-mail + code**, pas de lien token en MVP).
2. L'ajout d'un champ **`isDefault`** au modèle `Address` (migration future).
3. Le retrait de **« Cercle Prestige »** ou son statut purement éditorial.
4. Le report de **« Facture PDF »** en V2.
5. L'ajout du **point d'entrée compte** dans le header et la barre inférieure.
6. La structure de navigation du compte : **sidebar desktop, onglets mobile**.
7. Le périmètre du **CAPTCHA** : emplacement prévu, activation conditionnée au backend.
8. Le contenu des **CGV, mentions légales et politique de confidentialité** à faire valider par le propriétaire et un juriste.

J'attends ta validation avant de produire les specs.
