# Analyse des maquettes — DSG-03 (P01 à P07)

> Source unique : `design1/bruny shopping/bruny shopping.png` (le dossier s'appelle `design1`, pas `/design-1`).
> Analyse réalisée le 24 octobre 2026, avant toute production de specs.
> Complément : `docs/design-system/DESIGN-AUDIT.md` (audit DSG-01/02) et `docs/design-system/ASSUMPTIONS.md`.

## 1. Résumé exécutif

| Constat                                | Résultat                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Fichiers de maquette                   | **1 seul PNG** (planche de présentation), aucun export par écran, aucun SVG/PDF/Figma                            |
| Écrans identifiés                      | **11 écrans produit + 1 planche Design System**                                                                 |
| Pages du ticket couvertes en mobile    | **P01, P02, P04, P06** (4 sur 7)                                                                                |
| Pages sans maquette                    | **P03 Recherche, P05 Guide des tailles, P07 Mini-panier**                                                       |
| Couverture 768 px et 1280 px           | **Aucune**, pour aucune page                                                                                    |
| États (chargement, vide, erreur, succès) | Quasiment aucun ; seuls des états nominaux et deux alertes sont dessinés                                      |
| Design System                          | Base solide et cohérente, à étendre (galerie, barre d'achat fixe, panier, filtres, réassurance, navigation)     |
| Risque principal                       | Les critères 1 et 2 du ticket ne peuvent pas être validés en l'état : 3 pages et toutes les vues ≥ 768 px manquent |

**Conclusion :** la planche suffit à spécifier P01, P02, P04 et P06 en mobile, pas à clôturer DSG-03. Les phases suivantes doivent produire P03, P05, P07 et les déclinaisons 768/1280, puis les états manquants.

## 2. Inventaire du dossier `design1`

| Élément              | Détail                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Fichier              | `design1/bruny shopping/bruny shopping.png`                                              |
| Poids / format       | 3,4 Mo — PNG RVBA, 4302 × 5532 px                                                        |
| Nature               | Une planche unique : colonnes d'écrans mobiles juxtaposés sur fond sombre, plus une planche DS |
| Exports séparés      | Aucun                                                                                    |
| Sources éditables    | Aucune (pas de Figma, Sketch, SVG, PDF ni JSON de tokens)                               |
| Assets               | Logo, photos produits, icônes aplatis dans le PNG ; non réutilisables tels quels          |
| Vues desktop/tablette | Aucune                                                                                  |

Les écrans sont larges de **392 à 396 px** sur la planche, ce qui correspond à un viewport mobile de type 390 px. Cette échelle ne permet pas de mesurer finement les tailles de texte ; les valeurs typographiques restent celles validées dans `tokens-reference.md`.

## 3. Cartographie de la planche

Coordonnées approximatives dans l'image source (x, y, largeur, hauteur) :

| Zone | Écran                                      | Coordonnées              | Rôle pour DSG-03                     |
| ---- | ------------------------------------------ | ------------------------ | ------------------------------------ |
| A    | Tiroir de navigation — état « Nouveautés » | 480, 0, 324 × 784        | Support global (non compté P01–P07)  |
| B    | Tiroir de navigation — état « Mocassins »  | 868, 0, 324 × 784        | Support global                       |
| C    | Tunnel de commande invité                  | 8, 800, 396 × 2096       | Hors périmètre P01–P07 (checkout)    |
| D    | Planche « Design System Mobile 2025 »      | 432, 800, 392 × 4308     | Référence composants/tokens          |
| E    | **Accueil**                                | 852, 824, 396 × 2396     | **P01**                              |
| F    | **Catalogue — Mocassins & Richelieu**      | 1276, 800, 392 × 1568    | **P02**                              |
| G    | **Fiche produit**                          | 1696, 800, 396 × 2272    | **P04**                              |
| H    | **Panier**                                 | 2120, 800, 392 × 1276    | **P06**                              |
| I    | Commande confirmée                         | 2540, 800, 396 × 1912    | Hors périmètre (après checkout)      |
| J    | Suivi de commande                          | 2964, 800, 392 × 1904    | Hors périmètre                      |
| K    | Espace client                              | 3416, 800, 396 × 1740    | Hors périmètre                      |
| L    | Back-office « Atelier & Dispatch »         | 3888, 816, 392 × 2600    | Hors périmètre storefront            |

Aucune zone ne correspond à une recherche, à un guide des pointures ou à un mini-panier.

## 4. Correspondance P01–P07

| Code | Page                | Maquette disponible | Mobile | 768 | 1280 | Statut              |
| ---- | ------------------- | ------------------- | ------ | --- | ---- | ------------------- |
| P01  | Accueil             | Zone E              | Oui    | Non | Non  | Partiel             |
| P02  | Catalogue           | Zone F              | Oui    | Non | Non  | Partiel             |
| P03  | Recherche           | Aucune              | Non    | Non | Non  | **Absent**          |
| P04  | Fiche produit       | Zone G              | Oui    | Non | Non  | Partiel             |
| P05  | Guide des tailles   | Aucune              | Non    | Non | Non  | **Absent**          |
| P06  | Panier              | Zone H              | Oui    | Non | Non  | Partiel             |
| P07  | Mini-panier         | Aucune              | Non    | Non | Non  | **Absent**          |

Points d'entrée visibles pour les pages absentes :

- **P03** : icône loupe dans l'en-tête de P01/P02, entrée « Recherche » dans la barre inférieure de P04/P06.
- **P05** : lien « Guide des pointures » sur P04, lien « Guide des Pointures » dans le pied de page, bouton « Guide des pointures » dans l'espace client.
- **P07** : icône panier avec pastille dans tous les en-têtes. Aucun retour visuel après « Ajouter » (ni tiroir, ni toast) n'est dessiné sur P01, P02 ou P04.

## 5. Couverture des breakpoints

| Page              | 360 px | 768 px | 1280 px | Remarque                                                       |
| ----------------- | ------ | ------ | ------- | -------------------------------------------------------------- |
| P01 Accueil       | Partiel (≈390) | — | — | Grille 2 colonnes, rayon horizontal, barre inférieure absente  |
| P02 Catalogue     | Partiel (≈390) | — | — | 2 colonnes, filtres en barre, pas de colonne latérale           |
| P03 Recherche     | —      | —      | —       | Rien                                                            |
| P04 Fiche produit | Partiel (≈390) | — | — | Galerie pleine largeur, barre d'achat fixe, footer + bottom nav |
| P05 Guide tailles | —      | —      | —       | Rien                                                            |
| P06 Panier        | Partiel (≈390) | — | — | 1 colonne, récapitulatif empilé                                 |
| P07 Mini-panier   | —      | —      | —       | Rien                                                            |

**Conséquence :** le critère d'acceptation « conçus en 360 / 768 / 1280 px » est couvert à environ **33 %** (mobile seulement, 4 pages sur 7). Les compositions tablette et desktop sont à concevoir, en réutilisant les tokens et composants existants.

## 6. Analyse page par page

### P01 — Accueil (zone E)

Structure observée, de haut en bas :

1. **En-tête** : menu hamburger, loupe, logo « BRUNY SHOPPING » centré, panier avec pastille « 2 ».
2. **Hero éditorial** sur photo sombre : badge « ÉDITION DOUALA & YAOUNDÉ 2025 », titre, paragraphe, CTA blanc « Découvrir la Collection → », CTA WhatsApp vert, deux réassurances.
3. **Rayons Phares** : cinq pastilles photo (Mocassins, Richelieu, Sneakers, Bottines, Femme Chic) en défilement horizontal, lien « Catalogue 2025 ».
4. **Nouveautés de la Semaine** : grille 2 colonnes de cartes produit, badges, notes, prix barrés, pointures, CTA « Ajouter », lien « Voir tout › ».
5. **Garanties Bruny Shopping** : trois cartes illustrées (paiement, livraison, échange).
6. **Meilleures Ventes** : grille 2 colonnes, badges « BEST-SELLER » et « EXCLUSIF », mention « Stock Douala Limité ».
7. **Avis client** : note 5 étoiles, badge « Avis Vérifié Cameroun », citation, auteur.
8. **Bandeau concierge** navy : titre, texte, CTA WhatsApp.
9. Pas de pied de page ni de barre inférieure visibles sur cet écran.

Composants DS mobilisés : Button (4 variantes), Badge, ProductCard, PriceTag implicite, icônes.
Composants à créer : en-tête storefront, hero, pastille de rayon, en-tête de section, carte de réassurance, carte d'avis, bandeau concierge, barre inférieure.

États : aucun chargement, aucune liste vide, aucune erreur.

### P02 — Catalogue (zone F)

Structure :

1. En-tête identique à P01.
2. Fil d'Ariane « Accueil › Chaussures Homme › Mocassins & Richelieu ».
3. Titre de rayon, indicateur vert et volume « 48 modèles disponibles en direct atelier & Douala ».
4. Barre d'outils : bouton « Filtres 2 », select « Popularité ».
5. Ligne « ACTIFS » : puces de filtres supprimables.
6. Grille 2 colonnes de cartes produit : favori, badges, note, nom, accroche, prix, prix barré, pointures en stock, CTA « Commander ».
7. Bouton « Afficher plus de modèles (24 restants) », compteur « Affichage de 4 sur 48 articles ».
8. Bloc de réassurance à trois lignes.

Composants DS mobilisés : Button, Badge, ProductCard, Select, icônes.
À créer : fil d'Ariane, puce de filtre, tiroir/panneau de filtres, carte de réassurance.

États : aucun squelette de chargement, aucun état « 0 résultat », aucune erreur de chargement, aucun état de chargement du bouton « Afficher plus ».

### P04 — Fiche produit (zone G)

Structure :

1. En-tête : retour, titre « Détail Produit », partage, panier avec pastille.
2. Galerie : photo principale, deux badges, favori, compteur « 1/5 », cinq vignettes.
3. Bloc identité : collection, note et localisation, titre, prix, prix barré, économie, disponibilité.
4. Sélecteur de couleur (3 pastilles) et de pointure (5 tailles + alerte « Plus que 2 ! »), lien guide.
5. Aide au choix (« Chausse normalement… »).
6. Trois blocs de réassurance.
7. Accordéons : description/fabrication (ouvert), entretien, avis.
8. Pied de page navy avec liens.
9. **Barre d'achat fixe** : total, taille choisie, « Ajouter Panier », WhatsApp.
10. Barre inférieure : Boutique, Recherche, Commandes, WhatsApp.

Le critère 3 du ticket (barre d'achat fixe panier + WhatsApp sur mobile) est donc **maquetté**.

Composants DS mobilisés : Button, Badge, PriceTag, SizeSelector, icônes.
À créer : galerie produit, pastille de couleur, accordéon, barre d'achat fixe, bloc disponibilité, pied de page, barre inférieure.

États : stock faible représenté ; pas de rupture, pas d'erreur d'ajout, pas de confirmation d'ajout, pas de chargement de galerie.

### P06 — Panier (zone H)

Structure :

1. En-tête : retour, « Mon Panier (2 articles) », pastille « LIVRAISON OFFERTE DÈS 2 PAIRES », aide.
2. Bandeau de succès « Félicitations ! » avec badge « ACTIF ».
3. Deux lignes panier : visuel + badge, nom, pointure, couleur, prix, stepper, suppression.
4. Champ code privilège/parrain avec bouton « Appliquer ».
5. Récapitulatif : sous-total, livraison barrée puis « Gratuit », total, mentions TVA/paiement.
6. Trois réassurances.
7. CTA « Commander (Passer à la caisse) → » et CTA WhatsApp.
8. Mention de sécurité et de confirmation.
9. Barre inférieure avec « Commandes » actif et pastille.

Composants DS mobilisés : Button, Badge, Input (code promo), icônes, PriceTag implicite.
À créer : ligne de panier, stepper de quantité, récapitulatif de commande, bandeau de succès.

États : panier plein uniquement ; aucun panier vide, aucun code invalide/valide, aucun échec de mise à jour de quantité, aucune livraison indisponible.

### P03 — Recherche (absente)

Aucune maquette. Doivent être conçus : champ de recherche avec effacement, suggestions, recherches récentes, résultats, tri/filtres, état vide avec alternatives, état d'erreur, chargement. Les composants Input, Button, ProductCard et Skeleton existent déjà.

### P05 — Guide des tailles (absent)

Aucune maquette. Les liens présents sur P04, le pied de page et l'espace client prouvent que la page est attendue. Doivent être conçus : explication de la mesure, tableau des correspondances (EU/CM), conseils de chaussant, cas des demi-pointures, CTA WhatsApp, retour produit. Le composant Table peut servir de base.

### P07 — Mini-panier (absent)

Aucune maquette. Aucun feedback d'ajout n'est dessiné. Doivent être conçus : tiroir latéral ou panneau, ligne de panier compacte, sous-total, frais de livraison, CTA panier/checkout, état vide, comportement mobile plein écran. Le composant Modal peut être étendu en panneau latéral.

## 7. Inventaire des composants Design System

| Composant / motif           | Présent sur P01 | P02 | P04 | P06 | Statut DS                        |
| --------------------------- | --------------- | --- | --- | --- | -------------------------------- |
| Button                      | Oui             | Oui | Oui | Oui | Existe — variantes à vérifier     |
| Badge                       | Oui             | Oui | Oui | Oui | Existe — jeu de variantes à étendre |
| Product Card                | Oui             | Oui | —   | —   | Existe                           |
| Size Selector               | Dans carte      | Dans carte | Oui | — | Existe                        |
| Price Tag                   | Oui             | Oui | Oui | Oui | Existe                           |
| Input / champ               | —               | —   | —   | Code promo | Existe                    |
| Select                      | —               | Tri | —   | —   | Existe                           |
| Checkbox / Radio / Toggle   | —               | —   | —   | —   | Non utilisé sur ces pages        |
| Modal                       | —               | —   | —   | —   | Non utilisé (base pour P07)      |
| Toast                       | —               | —   | —   | —   | Non utilisé (retour d'ajout à définir) |
| Skeleton / Spinner          | —               | —   | —   | —   | Non maquetté                     |
| Table                       | —               | —   | —   | —   | Non utilisé (base pour P05)      |
| En-tête storefront          | Oui             | Oui | Variante | Variante | **À créer**              |
| Barre inférieure            | —               | —   | Oui | Oui | **À créer**                      |
| Hero                        | Oui             | —   | —   | —   | **À créer**                      |
| Rayon / pastille catégorie  | Oui             | —   | —   | —   | **À créer**                      |
| En-tête de section          | Oui             | —   | —   | —   | **À créer**                      |
| Carte de réassurance        | Oui             | Oui | Oui | Oui | **À créer**                      |
| Carte d'avis                | Oui             | —   | Avis (accordéon) | — | **À créer**              |
| Bandeau concierge           | Oui             | —   | —   | —   | **À créer**                      |
| Fil d'Ariane                | —               | Oui | Retour | —   | **À créer**                      |
| Puce de filtre              | —               | Oui | —   | —   | **À créer**                      |
| Galerie produit             | —               | —   | Oui | —   | **À créer**                      |
| Pastille de couleur         | —               | —   | Oui | —   | **À créer**                      |
| Accordéon                   | —               | —   | Oui | —   | **À créer**                      |
| Barre d'achat fixe          | —               | —   | Oui | —   | **À créer**                      |
| Ligne de panier + stepper   | —               | —   | —   | Oui | **À créer**                      |
| Récapitulatif de commande   | —               | —   | —   | Oui | **À créer**                      |
| Pied de page                | —               | —   | Oui | —   | **À créer** (hors DSG-02)        |

Divergences à arbitrer :

- **ProductCard** : trois libellés de CTA pour la même action (« Ajouter », « Commander », « Ajouter Panier ») ; la carte du catalogue masque l'accroche, le prix barré et certaines pointures. Le composant devra supporter deux densités (accueil / catalogue).
- **Badge** : la maquette empile « NOUVEAU », « CUIR VÉRITABLE », « ÉLITE OR », « -20 % », « BEST-SELLER », « EXCLUSIF », « DERNIÈRES PIÈCES », « CUIR GRAINÉ », « CUIR ITALIEN », « ACTIF ». Le DS doit définir des variantes sémantiques, pas une variante par libellé.
- **SizeSelector** : l'alerte « Plus que 2 ! » est un badge au-dessus de la taille ; le composant actuel gère un état stock faible, à confirmer sur ce rendu.
- **Boutons** : la maquette mélange boutons navy, blancs, vert WhatsApp et contours dorés ; les contrastes doivent être corrigés (voir §9).
- **En-tête** : deux dispositions (logo centré avec menu à gauche ; retour + titre sur P04), plus une variante panier. À formaliser comme un shell.

## 8. Relevé des microtextes

### P01 — Accueil

- « ÉDITION DOUALA & YAOUNDÉ 2025 »
- « Collection Prestige 2025 – Les Souliers d'Exception »
- « Mocassins italiens, Richelieu et Sneakers haut de gamme. Confort souverain, cuirs tannés végétalement et élégance intemporelle. »
- « Découvrir la Collection → » · « Commander par WhatsApp (+237) »
- « Essai à domicile » · « Paiement à la réception »
- « Rayons Phares » · « Catalogue 2025 » · « Mocassins » · « Richelieu » · « Sneakers » · « Bottines » · « Femme Chic »
- « ARRIVAGE EXCLUSIF » · « Nouveautés de la Semaine » · « Voir tout › »
- « NOUVEAU » · « CUIR VÉRITABLE » · « ÉLITE » · « 4.9 (38 avis) » · « 5.0 (52 avis) »
- « Mocassin Cuir Glacé » · « Richelieu Oxford… » · « 24 500 FCFA » · « 32 000 FCFA » · « 28 000 FCFA » · « 35 000 FCFA » · « Ajouter »
- « CONFIANCE & SÉRÉNITÉ » · « Garanties Bruny Shopping »
- « Paiement à la livraison » / « Payez en espèces ou Mobile Money (Orange / MTN) après essayage complet chez vous. »
- « Livraison 24h / 48h » / « Courses expresses à Douala & Yaoundé. Expéditions sécurisées dans tout le Cameroun. »
- « Échange Garanti 7 Jours » / « Pas la bonne pointure ? Notre coursier repasse pour un échange immédiat sans frais. »
- « SÉLECTION PLÉBISCITÉE » · « Meilleures Ventes » · « Stock Douala Limité » · « BEST-SELLER » · « EXCLUSIF »
- « Sneaker Riviera Blanc » · « Mocassin Suède… » · « 22 000 FCFA » · « 26 000 FCFA »
- « Avis Vérifié Cameroun » · « Service impeccable à Bonapriso, reçu en moins de 24h et la qualité du cuir est remarquable. J'ai pu essayer avant de régler le coursier via Orange Money. »
- « Marc E. » · « Client à Douala (Bonapriso) »
- « CONSEILLER DÉDIÉ EN DIRECT » · « Une question sur une pointure ? »
- « Discutez en direct avec notre équipe basée à Douala pour choisir la taille exacte et confirmer votre livraison. »
- « Discuter sur WhatsApp (+237) »

### P02 — Catalogue

- « Accueil › Chaussures Homme › Mocassins & Richelieu »
- « Mocassins & Richelieu »
- « 48 modèles disponibles en direct atelier & Douala »
- « Filtres 2 » · « Popularité » · « ACTIFS: » · « Pointure 42 × » · « Cuir Véritable × » · « En Stock… »
- « NOUVEAU » · « CUIR ITALIEN » · « ÉLITE OR » · « -20% » · « DERNIÈRES PIÈCES » · « CUIR GRAINÉ »
- « Mocassin Cuir… » · « Semelle cousue Blake &… » · « Richelieu Oxford » · « Patine d'art dégradée… » · « Soulier Derby Cuir » · « Résistance accrue &… »
- « 24 500 FCFA » / « 32 000 FCFA » · « 28 000 FCFA » / « 35 000 FCFA » · « 26 000 FCFA » · « 27 500 FCFA »
- « POINTURES EN STOCK : » · « Commander »
- « Afficher plus de modèles (24 restants) » · « Affichage de 4 sur 48 articles »
- « Essai à la livraison » / « Livraison express Douala & Yaoundé »
- « Paiement Cash ou Mobile » / « Orange Money & MTN Mobile Money »
- « Échange garanti sous 7j » / « Changement de pointure sans tracas »

### P04 — Fiche produit

- « Détail Produit »
- « CUIR VÉRITABLE GARANTI » · « -25% Promo » · « 1/5 »
- « COLLECTION HÉRITAGE 2025 » · « 4.9 (38 avis) » · « Douala/Ydé »
- « Mocassin Cuir Glacé Noir Prestige Imperial »
- « 24 500 FCFA » · « 32 000 FCFA » · « Économisez 7 500 FCFA »
- « En stock à Douala — Expédié en 24h chrono »
- « Couleur : Noir Ébène » · « Pointure : 41 (Sélectionnée) » · « Plus que 2 ! » · « Guide des pointures »
- « Chausse normalement. Si vous hésitez entre 2 pointures, optez pour la plus grande. »
- « Livraison Express 24h Douala & Yaoundé » / « 1 500 FCFA uniquement — Offerte dès 2 paires commandées. »
- « Paiement à la Livraison après Essayage » / « Payez chez vous en Espèces, Orange Money ou MTN Mobile Money. »
- « Échange de pointure gratuit sous 7 jours » / « Le livreur revient échanger gratuitement si la taille ne vous va pas. »
- « Description & Fabrication d'Exception »
- « Le mocassin Prestige Imperial incarne l'excellence du vestiaire masculin formel. Confectionné à partir d'un cuir de veau pleine fleur glacé à la main, il offre un lustre profond résistant aux éraflures légères. »
- « Tige : 100% cuir de veau pleine fleur patiné. » · « Doublure intérieure : Cuir respirant traité anti-humidité. » · « Semelle : Cousu Blake artisanal avec insert gomme protecteur. » · « Finition : Mors décoratif discret en métal inoxydable noir mat. »
- « Entretien Spécial Climat Tropical » · « Avis Clients Vérifiés (38) »
- « Guide des Pointures » · « Suivi Colis Douala & Yaoundé » · « Paiement à la Livraison » · « Orange & MTN Mobile Money » · « Conditions Générales »
- « © 2025 BRUNY SHOPPING Cameroun. Tous droits réservés. »
- « TOTAL À PAYER » · « Taille choisie : 41 » · « Ajouter Panier » · « WhatsApp (+237) »
- Barre inférieure : « Boutique » · « Recherche » · « Commandes » · « WhatsApp »

### P06 — Panier

- « Mon Panier (2 articles) » · « LIVRAISON OFFERTE DÈS 2 PAIRES »
- « Félicitations ! » · « ACTIF » · « Vous bénéficiez de la Livraison Gratuite à Douala & Yaoundé (Offre spéciale 2 paires). »
- « Mocassin Cuir Glacé Noir P… » · « Pointure : 41 » · « Noir Ébène » · « 24 500 FCFA »
- « Richelieu Oxford Patine C… » · « Pointure : 42 » · « Havane Patiné » · « 28 000 FCFA »
- « Avez-vous un code privilège ou parrain ? » · « EX: BRUNY237 » · « Appliquer »
- « Récapitulatif de la commande » · « Sous-total (2 articles) » · « 52 500 FCFA »
- « Livraison express (Douala / Ydé) » · « 1 500 FCFA » · « Gratuit »
- « Total à payer » · « TVA comprise • Payable à la réception »
- « Paiement à la livraison : Payez en espèces ou Orange/MTN MoMo après essayage. »
- « Échange garanti sous 7 jours : Changement de pointure gratuit et immédiat. »
- « Boutique & Conciergerie : Service client local basé à Akwa, Douala. »
- « Commander (Passer à la caisse) → » · « Commander rapidement via WhatsApp (+237) »
- « Sécurisé sans carte bancaire • Confirmation instantanée par SMS/WhatsApp »

### Navigation (support global)

- « BRUNY SHOPPING » · « Nouveautés » · « Chaussures Homme » · « Mocassins & Richelieu » · « Sneakers & Casual » · « Assistance WhatsApp 237 »
- « Livraison sécurisée Douala, Yaoundé & régions »
- « Conseiller BRUNY SHOPPING » · « Douala Akwa & Yaoundé Bastos »

### Incohérences rédactionnelles relevées

| Problème | Occurrences | Recommandation |
| --- | --- | --- |
| Trois libellés pour ajouter au panier | « Ajouter » (P01), « Commander » (P02), « Ajouter Panier » (P04) | « Ajouter au panier » partout ; réserver « Commander » au passage en caisse |
| « pointure » / « taille » | « Guide des pointures », « Taille choisie : 41 », « guide des tailles » (ticket) | Utiliser « pointure » pour les chaussures, « guide des pointures » pour la page P05 |
| Abréviation « Ydé » | P04 note, P06 livraison | Écrire « Yaoundé » |
| Trois formulations du paiement | « Paiement à la réception », « Paiement à la livraison », « Paiement à la Livraison » | « Paiement à la livraison » |
| « Essai » / « essayage » | « Essai à domicile », « Essai à la livraison », « après essayage » | « Essayage à domicile » pour l'action, « essai » pour l'expérience |
| Titre d'écran | « Détail Produit » | « Fiche produit » ou « Détail du produit » |
| Accent manquant | « Prestige Imperial » | « Prestige Impérial » si le nom commercial le permet |
| Formulation taille | « Chausse normalement. » | « Cette pointure taille normalement. » |
| Alerte trop familière | « Plus que 2 ! » | « Plus que 2 en stock » |
| Casse | « Mon Panier (2 articles) » | « Mon panier (2 articles) » |
| Mention de stock | « Stock Douala Limité » | « Stock limité à Douala » |
| Téléphone générique | « (+237) » dans tous les CTA | Afficher le numéro complet ou un libellé « WhatsApp » sans faux numéro |
| Espace avant % | « 100% cuir » | « 100 % cuir » (typographie française) |
| Promesse de marque | Rayon « Femme Chic » alors que la marque est « Chaussure Homme » | Décision propriétaire : retirer le rayon ou assumer une offre mixte |

## 9. Accessibilité et qualité des maquettes

| Point | Constat | Impact |
| --- | --- | --- |
| Or sur fond clair | Micro-titres dorés et badges or avec texte blanc (contraste ≈ 2,4:1) | Échec AA — utiliser `--bs-color-accent-text` et du texte navy sur or |
| Blanc sur vert WhatsApp | CTA « WhatsApp » blanc sur `#25D366` (1,98:1) | Échec AA — fond `#0F7A40` ou texte navy |
| Blanc sur vert succès | Badges/statuts (4,14:1) | AA grand texte seulement — utiliser `#0F7A40` |
| Taille des cibles | Puces de pointure et favoris proches de 44 px | À vérifier à l'implémentation, surtout en grille 2 colonnes |
| Information par la couleur | Pastilles de couleur sans nom visible à côté de chaque option | Ajouter le nom de la couleur et un état sélectionné non chromatique |
| Focus | Aucun état de focus dessiné | Appliquer `bs-focus-ring` du DS |
| Barre d'achat + barre inférieure | Deux barres fixes superposées sur P04 | Prévoir la hauteur cumulée et le dégagement du contenu sur petits écrans |
| Textes tronqués | Noms de produits coupés (« Mocassin Cuir… ») sans alternative | Prévoir deux lignes ou un titre complet accessible |

## 10. États manquants par page

| Page | Chargement | Vide | Erreur | Succès |
| --- | --- | --- | --- | --- |
| P01 | Non | Non | Non | Non |
| P02 | Non | Non | Non | Non |
| P03 | Non (page absente) | Non | Non | Non |
| P04 | Non | Non | Non | Aucun retour d'ajout au panier |
| P05 | Non (page absente) | Non | Non | Non |
| P06 | Non | Non | Non | Bandeau livraison offerte seulement |
| P07 | Non (page absente) | Non | Non | Non |

À produire en phase 2 : squelettes de cartes et de galerie, état « aucun résultat » avec suggestion de rayon, erreurs de chargement avec réessai, erreurs de formulaire (code promo, quantité, stock), confirmations d'ajout, rupture de stock, panier vide, échec WhatsApp.

## 11. Confrontation rapide avec l'existant

| Élément | Maquette | Code actuel (`frontend/apps/storefront`) | Écart |
| --- | --- | --- | --- |
| Accueil P01 | Page éditoriale complète | Route `/` redirige vers `/boutique` ; le catalogue contient un hero « Trouvez votre prochaine paire. » | Page d'accueil à créer ou hero à remplacer |
| Catalogue P02 | Filtres, tri, puces actives, 2 colonnes | `/boutique` existe avec recherche, mais filtres et grille à confronter | Specs de filtres à produire |
| Recherche P03 | Absente | Aucune route ; champ de recherche dans le catalogue | Page à concevoir |
| Fiche produit P04 | Galerie, guide, barre fixe | `/produit/:slug` avec ajout au panier | Galerie, guide et barre fixe manquants |
| Guide P05 | Absent | Aucune route ; liens absents | Page à concevoir |
| Panier P06 | 2 articles, promo, récapitulatif | `/panier` avec état vide et récapitulatif | Promo et états à confronter |
| Mini-panier P07 | Absent | Aucun tiroir ni toast d'ajout | À concevoir |
| Shell mobile | Header + barre inférieure | Header spécifique aux pages | Shell commun à créer |

Les composants du DSG-02 sont disponibles dans `@bruny/ui` ; P01, P02 et P04 en réutilisent une partie. Le code reste la référence pour les contraintes techniques, la maquette pour l'intention visuelle.

## 12. Décisions à valider (critère 5)

1. Confirmer la cible mobile : 360 px (Android bas de gamme) ou 390 px (maquette) comme largeur de référence.
2. Valider les compositions 768 et 1280 px : grille 3/4 colonnes, filtres latéraux, galerie et achat en deux colonnes, suppression de la barre inférieure.
3. Valider le périmètre de P01 : page d'accueil distincte ou catalogue éditorialisé.
4. Valider le contenu de P05 : tableau EU/CM, demi-pointures, conseils et CTA WhatsApp.
5. Valider P07 : tiroir latéral desktop et plein écran mobile.
6. Arbitrer les libellés (pointure/taille, paiement à la livraison, CTA panier) et le rayon « Femme Chic ».
7. Valider la stratégie de retour d'ajout au panier : tiroir P07, toast ou les deux.

## 13. Prochaines étapes (phase 2)

1. Produire les specs P01, P02, P04, P06 en 360/768/1280 à partir des zones E, F, G, H.
2. Concevoir P03, P05, P07 sur le même langage visuel.
3. Décliner tous les états (chargement, vide, erreur, succès) avec microtextes français.
4. Cartographier chaque bloc vers un composant `@bruny/ui` existant ou à créer.
5. Faire valider par le propriétaire, puis archiver la version validée.
