# DSG-04 — Analyse de l'existant

> Périmètre : tunnel de commande et suivi de commande, pages **P08 à P13**.
> Branche : `feature/DSG-04-checkout-tracking-design`.
> Ticket de **conception uniquement** : ce document et les specs qui suivront ne contiennent aucun code applicatif.
> Sources : `design1/bruny shopping/bruny shopping.png`, `docs/design-1/ANALYSE-MAQUETTES.md`, `docs/design-system/`, `frontend/`, `backend/`.
> Date de l'analyse : 10 novembre 2026.

---

## 1. Résumé exécutif

| Constat | Résultat |
| --- | --- |
| Dossiers `design/` et `design-1/` cités par le ticket | **Inexistants** ; la source réelle est `design1/bruny shopping/bruny shopping.png` |
| Maquettes exploitables pour P08–P13 | **3 zones** : tunnel invité (C), confirmation (I), suivi (J) |
| Écrans du tunnel maquettés | **1 page unique** à 3 sections numérotées, en mobile ≈ 390 px |
| Vues 768 px et 1280 px | **Aucune**, pour aucun écran |
| États d'erreur, de chargement et d'échec paiement | **Aucun** |
| Écrans d'attente / échec de paiement (P11b, P11c) | **Absents** de la planche |
| Endpoints backend orders / payments / shipping / tracking | **Aucun exposé** ; seuls les modèles Prisma existent |
| Routes frontend checkout / confirmation / suivi | **Aucune** ; le CTA du panier est `disabled` |
| Composants `@bruny/ui` réutilisables | **15** exportés ; 6 à 8 réellement utiles au tunnel |
| Composants spécifiques au tunnel | **10 à 12 à créer** (StepIndicator, RadioCard, Timeline, etc.) |
| Verdict | La planche fournit l'**intention visuelle** du tunnel, de la confirmation et du suivi. Elle ne fournit ni la découpe en étapes, ni les états, ni les vues larges : ces éléments doivent être **conçus** dans DSG-04, pas extraits. |

**Conséquence :** DSG-04 est une phase de **conception à partir d'un existant partiel**, pas une simple transcription de maquettes. Chaque spec devra distinguer explicitement ce qui est *observé sur la planche*, ce qui est *déduit du design system*, et ce qui est *proposé par DSG-04*.

---

## 2. Méthode et limites

### 2.1 Ce qui a été analysé

1. La planche PNG complète, recadrée par zones (tunnel, confirmation, suivi, planche Design System).
2. Les documents `docs/design-1/ANALYSE-MAQUETTES.md`, `docs/design-system/DESIGN-AUDIT.md`, `tokens-reference.md`, `ASSUMPTIONS.md`.
3. Les tokens et styles réels (`frontend/libs/design-tokens/src/index.scss`, `frontend/apps/storefront/src/styles.scss`).
4. Les 16 composants de `frontend/libs/ui` et leur API publique.
5. Les routes, le panier et les conventions Angular du storefront.
6. Le schéma Prisma et l'état des modules backend `orders`, `payments`, `shipping`.

### 2.2 Limites

- **Une seule image raster** : pas d'export par écran, pas de calques, pas de Figma/Penpot, pas de SVG. Les mesures de padding et de typographie sont approximatives ; seuls les tokens font foi.
- Les écrans sont larges de **392 à 396 px** : la référence mobile est ≈ 390 px, alors que la cible basse du projet est 360 px. Les compositions 360 px doivent être dérivées, pas mesurées.
- Aucune vue ≥ 768 px : les compositions tablette et desktop sont **entièrement à concevoir**.
- Les états dynamiques (erreur, chargement, indisponibilité) ne sont pas dessinés.
- La planche montre un tunnel **connecté** (articles, quantités, prix) mais aucun écran de panier vide, de stock épuisé ou de zone non desservie.

---

## 3. Arborescence pertinente du dépôt

```text
bruny-shopping/
├── design1/
│   └── bruny shopping/
│       └── bruny shopping.png          # planche unique (4302 × 5532)
├── docs/
│   ├── design-1/
│   │   ├── ANALYSE-MAQUETTES.md        # DSG-03 : P01–P07
│   │   └── specs/                      # specs P01–P07 (gabarit 10 sections)
│   ├── design-system/
│   │   ├── DESIGN-AUDIT.md
│   │   ├── tokens-reference.md
│   │   └── ASSUMPTIONS.md              # hypothèses A01–A49
│   └── design/
│       └── DSG-04/                     # présent document + specs à venir
├── frontend/
│   ├── libs/
│   │   ├── design-tokens/src/index.scss
│   │   ├── ui/src/                     # 16 composants, 15 exports publics
│   │   └── data-access/                # CartStore, catalogue
│   └── apps/
│       ├── storefront/src/app/
│       │   ├── app.routes.ts           # /boutique, /produit/:slug, /panier, /design-system
│       │   └── features/{catalog,product,cart,design-system}/
│       └── admin/
└── backend/
    ├── prisma/schema.prisma            # Order, OrderItem, Payment, Shipment, DeliveryZone
    └── src/modules/
        ├── orders/                     # squelette, README seulement
        ├── payments/                   # squelette, README seulement
        ├── shipping/                   # squelette, README seulement
        └── cart/                       # POST /cart/validate (CRT-01) — seul endpoint panier
```

### 3.1 Écarts avec l'énoncé du ticket

| Énoncé | Réalité | Décision |
| --- | --- | --- |
| « analyser `/design` et `/design-1` » | Ni l'un ni l'autre n'existe | Utiliser `design1/bruny shopping/bruny shopping.png` et le signaler dans chaque doc |
| « maquettes P08 à P13 » | Une seule page de tunnel, plus confirmation et suivi | Découper la page unique en P09/P10/P11 et concevoir P08, P11b, P11c |
| « prototype Figma/Penpot » | Aucun outil ni fichier source | Option B : Mermaid + wireframes ASCII + 10 scénarios testés |

---

## 4. Cartographie des maquettes disponibles

Coordonnées dans l'image source (x, y, largeur, hauteur) :

| Zone | Écran | Coordonnées | Exploitation DSG-04 |
| --- | --- | --- | --- |
| A / B | Tiroirs de navigation | 480, 0 et 868, 0 | Hors périmètre (support du shell) |
| **C** | **Tunnel de commande invité** | **8, 800, 396 × 2096** | **P08, P09, P10, P11** |
| D | Planche Design System | 432, 800, 392 × 4308 | Référence composants et tokens |
| E / F / G / H | P01, P02, P04, P06 | 852 → 2120, 800 | Contexte amont (panier, entrée tunnel) |
| **I** | **Commande confirmée** | **2540, 800, 396 × 1912** | **P12** |
| **J** | **Suivi de commande** | **2964, 800, 392 × 1904** | **P13** |
| K | Espace client | 3416, 800, 396 × 1740 | Hors périmètre (accès au suivi) |
| L | Back-office « Atelier & Dispatch » | 3888, 816, 392 × 2600 | Hors périmètre storefront |

### 4.1 Correspondance ticket ↔ maquette

| Code | Page | Maquette | 360 | 768 | 1280 | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| P08 | Démarrage du checkout | Zone C (haut) | Dérivé | **À concevoir** | **À concevoir** | Partiel |
| P09 | Coordonnées | Zone C (section 1) | Dérivé | **À concevoir** | **À concevoir** | Partiel |
| P10 | Livraison | Zone C (section 2) | Dérivé | **À concevoir** | **À concevoir** | Partiel |
| P11 | Paiement | Zone C (section 3) | Dérivé | **À concevoir** | **À concevoir** | Partiel |
| P11b | Attente de confirmation de paiement | **Aucune** | **À concevoir** | **À concevoir** | **À concevoir** | **Absent** |
| P11c | Échec de paiement | **Aucune** | **À concevoir** | **À concevoir** | **À concevoir** | **Absent** |
| P12 | Confirmation | Zone I | Dérivé | **À concevoir** | **À concevoir** | Partiel |
| P13 | Suivi public | Zone J | Dérivé | **À concevoir** | **À concevoir** | Partiel |

**Taux de couverture stricte : 0 écran sur 8 est maquetté aux trois largeurs.** En mobile, 5 écrans sur 8 disposent d'une intention visuelle ; 3 sont à inventer entièrement.

---

## 5. Analyse détaillée — Zone C, tunnel invité

### 5.1 Structure observée (de haut en bas)

1. **En-tête de tunnel** : flèche retour, logo « BRUNY SHOPPING » + « Douala & Yaoundé Express », badge « 100% Sécurisé ».
2. **Stepper horizontal** : `1 Coordonnées` — `2 Livraison` — `3 Paiement`.
3. **Bandeau de réassurance** : « Commande directe sans inscription ».
4. **Carte 1 — « Vos Coordonnées »**
   - « Nom et Prénom * » ;
   - « Numéro WhatsApp / Appel Livreur * » avec préfixe `🇨🇲 +237` et exemple `694 28 10 44` ;
   - texte d'aide et badge « Appel avant livraison ».
5. **Carte 2 — « Adresse de Livraison »**
   - ville : « Douala (Livraison Express 24h - 1 500 FCFA) » ;
   - quartier : « Bonapriso » ;
   - « Point de repère pour le livreur * » + mention « Indispensable » + zone de texte.
6. **Carte 3 — « Mode de Paiement »**
   - option sélectionnée « Paiement à la Livraison », badge « RECOMMANDÉ », description « Espèces, Orange Money ou MTN MoMo remis directement au livreur », coche verte « Vous essayez vos chaussures avant de payer » ;
   - option désactivée « Orange Money & MTN MoMo Direct », badge « Bientôt disponible ».
7. **« Articles Commandés (2) »** + lien « Modifier » ; deux lignes produit avec pointure, quantité et prix.
8. **Récapitulatif** : sous-total 52 500 FCFA, livraison « GRATUIT (OFFERT) », total 52 500 FCFA.
9. **« GARANTIES & CONFIANCE CLIENT »** : essayage, zéro avance, support 237.
10. **Carte WhatsApp** (aide).
11. **Aucun CTA final « Confirmer la commande » visible** dans la capture.

### 5.2 Lecture critique

- La page est **monolithique** : les trois étapes sont empilées et numérotées, mais rien n'indique si elles sont séquentielles, toutes visibles ou repliables. Le stepper suggère une progression ; la mise en page suggère un formulaire unique. **Décision DSG-04 : tunnel linéaire en 3 écrans**, le stepper devient la navigation principale et chaque écran ne contient qu'une carte.
- L'absence de CTA final est un **défaut de maquette**, pas une intention. Un tunnel sans action de validation est inutilisable : DSG-04 spécifie un CTA principal par étape (« Continuer vers la livraison », « Continuer vers le paiement », « Confirmer la commande »).
- Le récapitulatif est **dupliqué** entre P06 (panier) et la zone C. Il doit devenir un composant unique `OrderSummaryCard`, avec une variante compacte pour mobile et une variante latérale persistante en desktop.
- Les champs sont **pré-remplis** dans la maquette (nom, téléphone, quartier) : il s'agit d'un état « rempli », pas d'un état initial. Aucun état vide, aucune erreur, aucun focus ne sont dessinés.
- La ville et le quartier sont des listes fermées en pratique (zones de livraison) mais dessinés comme des champs texte. **Décision : selects**, avec frais et délai affichés par zone.
- Le préfixe téléphonique est figé sur `+237` : cohérent avec le marché camerounais, à conserver comme préfixe non éditable en MVP.
- Le badge « 100% Sécurisé » et la mention « sans carte bancaire » doivent être **exacts** : en MVP, aucun paiement en ligne n'est encaissé.

### 5.3 Découpage proposé

| Écran | Contenu | CTA principal |
| --- | --- | --- |
| **P08 — Démarrage** | Récapitulatif léger, rappel des 3 étapes, garanties, entrée dans le tunnel | « Commencer ma commande » |
| **P09 — Coordonnées** | Nom, téléphone WhatsApp, consentement contact | « Continuer vers la livraison » |
| **P10 — Livraison** | Ville, quartier, point de repère, créneau, frais | « Continuer vers le paiement » |
| **P11 — Paiement** | Mode de paiement, récapitulatif complet, CGV | « Confirmer la commande » |
| **P11b — Attente** | Statut d'initialisation / confirmation (V2 Mobile Money) | « Actualiser le statut » |
| **P11c — Échec** | Cause, conservation du panier, nouvelle tentative | « Réessayer » |

P08 est un **écran d'entrée** hors décompte des 3 étapes : le stepper n'y affiche aucune étape active.

---

## 6. Analyse détaillée — Zone I, confirmation (P12)

### 6.1 Structure observée

1. En-tête storefront : hamburger, logo, panier.
2. Hero doré : « Commande Confirmée avec Succès ! ».
3. Message nominatif : « Merci Jean-Paul. Votre commande #BS-2025-8492 est prise en compte par notre atelier de Douala. »
4. Bandeau : « EN PRÉPARATION POUR LIVRAISON EXPRESS SOUS 24H ».
5. Ticket navy : référence `#BS-2025-8492`, date « 24 Mai 2025 à 14:32 », « 2 PAIRES SÉLECTIONNÉES ».
6. Articles commandés, puis récapitulatif financier.
7. « Détails d'Expédition & Coursier » : badge « Douala Express », destinataire, téléphone, « Orange Money actif », adresse Bonapriso + repère, « Créneau estimé : Demain entre 10h et 13h ».
8. CTA WhatsApp, « Suivre mon colis en temps réel », « ← Retour à la boutique ».
9. Engagements, puis pied de page.

### 6.2 Lecture critique

- L'écran est **dense** : il mélange confirmation, ticket, suivi logistique et réassurance. En mobile, la hiérarchie est acceptable ; en desktop, il faudra deux colonnes (confirmation + ticket à gauche, expédition et actions à droite).
- « Orange Money actif » alors que le paiement sélectionné est le paiement à la livraison : **incohérence** à corriger. Le mode affiché doit être « Paiement à la livraison » et le montant « à régler au coursier ».
- La référence `#BS-2025-8492` ne respecte pas le format du schéma Prisma (`BRN-2610-7K3F`). **Décision : format `BRN-YYMM-XXXX`**, affiché sans `#` dans les champs copiables, avec `#` uniquement en valeur d'affichage.
- L'écran **n'a aucun état** : ni chargement (confirmation en cours), ni erreur (référence introuvable), ni cas « commande déjà confirmée ».
- Le lien de suivi est un CTA secondaire ; il doit devenir l'action principale après la confirmation, avec un accès direct à P13.
- Aucune mention de **CGV acceptées**, ni d'empreinte de commande, ni de moyen de contact en cas de problème.

---

## 7. Analyse détaillée — Zone J, suivi public (P13)

### 7.1 Structure observée

1. En-tête : retour, « Suivi de Commande / BRUNY SHOPPING Cameroun », WhatsApp.
2. Référence `#BS-2025-8492` + badge « Expédition Express ».
3. Carte verte : « COURSE ACTIVE / En cours d'acheminement / Arrivée estimée : Aujourd'hui à 11h45 ».
4. Coursier : « Ibrahim ★4.9 / Coursier Express Douala (Moto Fleet #14) » + « Appel direct » et « Repère WhatsApp ».
5. Timeline « Étapes de la Livraison » :
   - Commande enregistrée — 14:32 ;
   - Préparation & Contrôle Qualité — 16:15 ;
   - Pris en charge par Ibrahim — 09:30 ;
   - En cours de livraison vers Bonapriso — badge « EN COURS » ;
   - Essayage & Paiement à domicile — « À venir ».
6. Carte adresse + mini-carte Bonapriso + repère.
7. « Total à régler 52 500 FCFA » + « PAIEMENT SÉCURISÉ ».
8. Garantie échange 7 jours.
9. CTA « Demander un échange gratuit (7 jours) » et WhatsApp.
10. Bandeau de réassurance à 3 colonnes, puis barre inférieure (Boutique / Recherche / Commandes actif / WhatsApp).

### 7.2 Lecture critique

- La page est **publique de fait** dans la maquette : elle s'ouvre directement après la confirmation, sans authentification. Le ticket demande explicitement une URL publique avec référence + téléphone (ou code). **Décision : deux modes** — accès direct par lien signé depuis P12, et accès manuel par formulaire référence + téléphone. Le formulaire devient un état de P13, pas une page séparée.
- La timeline **n'affiche pas de dates complètes** (heures seules, « Aujourd'hui », « Demain »). Il faut un format stable : date + heure pour les étapes passées, estimation pour l'étape courante.
- Les statuts dessinés (5 étapes) ne correspondent pas à l'enum `OrderStatus` / `ShipmentStatus` du backend. **Décision : une table de correspondance unique**, documentée dans la spec P13, avec 5 étapes d'affichage dérivées des statuts réels.
- L'estimation « Aujourd'hui à 11h45 » est une promesse ferme : la spec doit prévoir le cas « estimation indisponible » et ne jamais afficher une heure passée.
- Les boutons « Appel direct » et « Repère WhatsApp » exposent le numéro du coursier : **données personnelles**. La spec doit prévoir masquage si le coursier n'est pas assigné, et journalisation minimale.
- La mini-carte est un décor : aucun service de cartographie n'est intégré. **Décision : image statique ou bloc adresse sans carte interactive en MVP**, à signaler comme dépendance.
- La barre inférieure réapparaît ici alors qu'elle est absente de la zone C : **incohérence de shell** à trancher (voir §10).

---

## 8. Design system : ce qui existe, ce qui manque

### 8.1 Tokens disponibles (DSG-02)

| Famille | Valeurs |
| --- | --- |
| Couleurs | `primary #131B2E`, `accent #C89B3C`, `accent-text #8A6A1F`, `canvas #FAFAF7`, `surface #FFFFFF`, `success #1E8E5A`, `success-strong #0F7A40`, `danger #D62839`, `warning #B98500`, `whatsapp #25D366` |
| Typographie | Plus Jakarta Sans ; échelle 12 → 48 px |
| Breakpoints | 360 / 768 / 1280 px ; conteneur 1200 px |
| Cibles | 44 px minimum ; contrôles 44 / 52 px |
| Rayons | 8 / 12 / 20 / full |
| Focus | anneau `bs-focus-ring` |

### 8.2 Composants `@bruny/ui` réellement réutilisables

| Composant | Usage dans P08–P13 | Limite |
| --- | --- | --- |
| `Button` | Tous les CTA (`primary`, `secondary`, `ghost`, `whatsapp`) | — |
| `Input` | Nom, téléphone, référence de suivi | Pas de masque de téléphone |
| `Select` | Ville, quartier, créneau | Pas de recherche |
| `Radio` | Mode de paiement (base) | Pas de variante carte |
| `Checkbox` | Acceptation CGV | — |
| `Badge` | Statuts, « Recommandé », « Bientôt disponible » | Variantes sémantiques à cadrer |
| `PriceTag` | Prix unitaires et totaux | — |
| `Spinner` / `Skeleton` | Chargement, vérification de référence | — |
| `Toast` | Copie de référence, erreurs transitoires | — |
| `Modal` | Aide, confirmation d'abandon | Base pour panneau |
| `Icon` | Flèches, statuts, WhatsApp | Jeu d'icônes à vérifier |

### 8.3 Composants à créer

| Composant | Écrans | Priorité |
| --- | --- | --- |
| `StepIndicator` | P09, P10, P11 | Haute |
| `RadioCard` | P11 | Haute |
| `OrderSummaryCard` | P08, P11, P12 | Haute |
| `AddressForm` (+ `Textarea`) | P10 | Haute |
| `Alert` / `Banner` | Tous (erreurs, avertissements, succès) | Haute |
| `Timeline` | P13 | Haute |
| `PaymentMethodSelector` | P11 | Moyenne |
| `CopyButton` | P12, P13 | Moyenne |
| `ProgressBar` | P11b | Moyenne |
| `StickyActionBar` | P09–P11 mobile | Moyenne |
| `OrderLineItem` | P08, P11, P12 | Moyenne |
| `TrustPanel` | P08, P12, P13 | Basse |

> Le composant `Textarea` n'existe pas : il est nécessaire au « point de repère ». Il peut être ajouté à `Input` ou créé séparément ; la spec devra trancher.

---

## 9. Existant backend et frontend

### 9.1 Modèles Prisma disponibles

- **`Order`** : `reference` unique, `guestName`, `guestPhone`, `status` (`PENDING_CONFIRMATION` par défaut), montants entiers XAF, `paymentMethod`, `paymentStatus`, `addressSnapshot` JSON, `source`, `deletedAt`, `idempotencyKey` unique.
- **`OrderItem`**, **`Payment`** (`provider`, `providerRef`, `status`, `rawPayloadHash`), **`Shipment`** (`zoneId`, `driverId`, `status`, `deliveredAt`, `codCollected`), **`DeliveryZone`** (`cities`, `fee`, `estimatedDays`).
- Ces modèles couvrent le besoin fonctionnel. **Aucune migration n'est demandée par DSG-04.**

### 9.2 Endpoints

| Besoin | Endpoint | État |
| --- | --- | --- |
| Valider le panier | `POST /cart/validate` | **Existe** (CRT-01) |
| Créer la commande | `POST /orders` | **Absent** |
| Lire une commande | `GET /orders/:reference` | **Absent** |
| Lister les zones de livraison | `GET /delivery-zones` | **Absent** |
| Initier / confirmer un paiement | `POST /payments` | **Absent** |
| Suivre publiquement | `GET /tracking/:reference` | **Absent** |

Les modules `orders`, `payments`, `shipping` ne contiennent que des README. **DSG-04 ne doit pas inventer de contrat définitif** : chaque spec décrit les *données nécessaires à l'écran* et les rattache aux modèles existants, en laissant le contrat HTTP aux tickets d'implémentation.

### 9.3 Frontend

- Routes actuelles : `/boutique`, `/produit/:slug`, `/panier`, `/design-system`, wildcard → `/boutique`.
- Aucune route `/commande`, `/confirmation`, `/suivi`.
- `CartStore` fournit `lines()`, `count()`, `total()`, `remove()`.
- Le CTA « Continuer la commande » du panier est **`disabled`** : point d'entrée à activer lors de l'implémentation.
- Aucun formulaire réactif typé n'existe encore pour un tunnel ; les composants `Input`/`Select` sont standalone et compatibles Reactive Forms.
- Aucune gestion de panier vide côté checkout : à spécifier (redirection ou état dédié).

---

## 10. Incohérences et écarts relevés

| # | Sujet | Constat | Décision proposée |
| --- | --- | --- | --- |
| 1 | Structure du tunnel | Page unique à 3 sections vs stepper à 3 étapes | Tunnel linéaire en 3 écrans |
| 2 | CTA final | Absent de la maquette | Ajouter un CTA par étape + barre d'action mobile |
| 3 | Référence | `#BS-2025-8492` vs `BRN-2610-7K3F` | Format `BRN-YYMM-XXXX` |
| 4 | Moyen de paiement | « Orange Money actif » sur une commande COD | Afficher le mode réellement choisi |
| 5 | Statuts | 5 étapes dessinées vs enums backend | Table de correspondance unique en spec P13 |
| 6 | Accès au suivi | Suivi ouvert sans garde | Lien signé + formulaire référence/téléphone |
| 7 | Shell | En-têtes et barres différents selon les écrans | Shell checkout dédié (sans bottom-nav) ; shell storefront pour P12/P13 |
| 8 | Devise | `FCFA` dans la maquette | Conserver `FCFA`, cohérent avec P01–P07 et le pipe `fcfa` |
| 9 | Ville | Douala / Yaoundé seulement | Select alimenté par `DeliveryZone`, message hors zone |
| 10 | Créneau | « Demain entre 10h et 13h » | Créneaux proposés par zone, estimation non garantie |
| 11 | CGV | Absentes | Checkbox obligatoire en P11 + lien |
| 12 | États | Aucun | 4 états par écran (nominal, chargement, vide, erreur) |
| 13 | Vues larges | Aucune | Compositions 768 / 1280 à concevoir |
| 14 | Accessibilité | Contrastes or/blanc et vert/blanc en échec AA | Utiliser `accent-text`, `success-strong`, texte navy sur or |
| 15 | Mini-carte | Décor sans service | Bloc adresse statique en MVP |

---

## 11. Décisions de cohérence proposées

1. **Parcours linéaire** : P08 (entrée) → P09 → P10 → P11 → P12 → P13, avec retour possible sans perte de saisie.
2. **Trois étapes visibles** dans le stepper ; P08 n'en affiche aucune comme active.
3. **Un seul CTA primaire par écran**, doublé d'une barre d'action collante en mobile contenant le total.
4. **Paiement MVP = paiement à la livraison** uniquement ; Mobile Money affiché mais désactivé avec « Bientôt disponible » ; P11b/P11c spécifiés en V2.
5. **Récapitulatif unique** (`OrderSummaryCard`) réutilisé en P08, P11, P12.
6. **Validation en direct** : erreur affichée au blur puis mise à jour à la saisie ; message expliquant comment corriger.
7. **Microtextes français**, vouvoiement, verbes d'action ; « pointure » pour les chaussures.
8. **Aucune promesse non tenue** : pas de « paiement sécurisé en ligne », pas de suivi temps réel par GPS.
9. **Accessibilité** : cibles 44 px, focus visible, erreurs liées par `aria-describedby`, statuts annoncés via `aria-live`.
10. **Confidentialité** : téléphone et adresse masqués partiellement sur P13 avant vérification.

---

## 12. Risques

| Risque | Impact | Mitigation |
| --- | --- | --- |
| Concevoir sans contrat API | Specs déconnectées de l'implémentation | Décrire les données par écran, les rattacher au schéma Prisma, ne pas figer les URLs |
| Absence de vues desktop | Incohérence à l'implémentation | Produire 768/1280 dès les specs, avec grille et composants nommés |
| P11b/P11c inventés | Sur-spécification d'une V2 | Les marquer V2, limiter à un écran d'attente et un écran d'échec |
| Suivi public | Fuite de données personnelles | Vérification référence + téléphone, masquage, lien signé |
| Statuts backend instables | Timeline incohérente | Table de correspondance documentée et validée |
| Absence de CGV | Blocage juridique | Checkbox + lien, mention explicite dans VALIDATION.md |

---

## 13. Plan de production des specs

| Ordre | Document | Contenu |
| --- | --- | --- |
| 1 | `PARCOURS.md` | Flux global, transitions, règles de reprise, matrice écrans × états |
| 2 | `P08-checkout-start.md` | Entrée, récap léger, garanties |
| 3 | `P09-coordonnees.md` | Formulaire identité + téléphone |
| 4 | `P10-livraison.md` | Zone, quartier, repère, créneau, frais |
| 5 | `P11-paiement.md` | Mode de paiement, CGV, récap, confirmation |
| 6 | `P11b-attente-paiement.md` | Attente V2 |
| 7 | `P11c-echec-paiement.md` | Échec V2 |
| 8 | `P12-confirmation.md` | Ticket, expédition, actions |
| 9 | `P13-suivi-public.md` | Vérification, timeline, coursier |
| 10 | `COMPOSANTS-REQUIS.md` | Inventaire, API proposée, états |
| 11 | `MICROTEXTES.md` | Tous les libellés FR, erreurs comprises |
| 12 | `PROTOTYPE.md` | Mermaid + wireframes ASCII + 10 scénarios |
| 13 | `VALIDATION.md` | Checklist signable par le PO |
| 14 | `README.md` | Index, conventions, statut |

Chaque spec P0X suivra le gabarit en **10 sections** : objectif, wireframes 360/768/1280, composants, 4 états, microtextes FR, interactions, accessibilité WCAG 2.1 AA, données API, écarts, référence.

---

## 14. Points à valider avant rédaction

1. Le découpage **P08 = écran d'entrée** hors des 3 étapes.
2. Le passage d'une page unique à **trois écrans linéaires**.
3. Le **format de référence** `BRN-YYMM-XXXX`.
4. Le périmètre **V2** de P11b/P11c.
5. L'accès au suivi : **lien signé + formulaire référence/téléphone**.
6. Le shell : **checkout sans bottom-nav**, storefront avec bottom-nav sur P12/P13.
7. La présence d'une **checkbox CGV** en P11.
8. Le prototype en **Option B** (Mermaid + ASCII + scénarios), faute d'outil de maquettage.

J'attends ta validation avant de produire les specs.
