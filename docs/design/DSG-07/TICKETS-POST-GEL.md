# Tickets post-gel — DSG-07

**Date** : 11 novembre 2026
**Règle** : ces corrections ne sont pas appliquées dans DSG-07, faute de maquettes éditables ou parce qu’elles relèvent de l’implémentation. Elles entrent au backlog après le gel.

## 1. Priorités

| Priorité | Signification |
|---|---|
| P0 | À traiter avant l’implémentation de l’écran concerné |
| P1 | À traiter avant la mise en production |
| P2 | Amélioration de confort ou de cohérence |

## 2. Corrections transverses

| # | Écran(s) / composant | Incohérence | Correction attendue | Priorité | Ticket |
|---|---|---|---|---|---|
| 01 | Tous | Hiérarchie des boutons principale / WhatsApp / secondaire | Une seule action primaire navy par écran ; WhatsApp réservé au contact | P1 | DSG-07-FIX-01 |
| 02 | P01, P02, P04, P06, P13, A09b | Contrastes de marque : or 2,45:1, blanc/WhatsApp 1,98:1, succès 4,14:1, warning 3,27:1 | Utiliser `accent-text`, `whatsapp-strong`, `success-strong`, `warning-strong` | P0 | DSG-07-FIX-02 |
| 03 | Formulaires, tables | Bordures de contrôle 1,21–1,32:1 | Bordure de contrôle ≥3:1 (`#6B7280`) et focus visible | P0 | DSG-07-FIX-03 |
| 04 | Checkbox, Radio, Toggle | `aria-describedby` vers un `id` absent | Ajouter l’`id` du message et tester l’annonce | P0 | DSG-07-FIX-04 |
| 05 | P02, P06, P18b, A03–A13 | Statuts non centralisés | Créer `StatusBadge` avec mapping domaine/statut/ton | P0 | DSG-07-FIX-05 |
| 06 | P01, P02, P04, P21 | CTA et densité ProductCard divergents | Propriété `density` + CTA canonique | P1 | DSG-07-FIX-06 |
| 07 | Tous | Espace normale dans `25 000 FCFA` | Espace insécable ; `XAF` réservé aux payloads | P1 | DSG-07-FIX-07 |
| 08 | P01, P02, P04, P05 | Stock faible/épuisé non exposé | `stockState` + libellés accessibles | P1 | DSG-07-FIX-08 |
| 09 | P07, P19b, A11, A12b | `ConfirmDialog` absent | `role=alertdialog`, focus « Annuler », restitution | P0 | DSG-07-FIX-09 |
| 10 | A03–A15 | `CardList` mobile absente | Même contrat que `DataTable`, priorités mobile | P0 | DSG-07-FIX-10 |
| 11 | P15, P17, A05, A14 | `Tabs` cité mais absent | Composant accessible ou remplacement natif | P1 | DSG-07-FIX-11 |
| 12 | P08–P13, A03, A08, A09c | Stepper/Timeline absents | Listes ordonnées, `aria-current`, statuts textuels | P1 | DSG-07-FIX-12 |
| 13 | Tous | Alertes et états vides non centralisés | `Alert` + `EmptyState` avec tons et actions | P1 | DSG-07-FIX-13 |
| 14 | Storefront, compte, admin, livreur | Quatre shells sans règle | Documenter et implémenter les shells ; bottom-nav hors tunnel | P1 | DSG-07-FIX-14 |
| 15 | P01, P02, P04 | Trois CTA d’ajout au panier | « Ajouter au panier » partout | P1 | DSG-07-FIX-15 |
| 16 | P08–P11 | « Continuer » / « Suivant » | « Continuer » | P1 | DSG-07-FIX-16 |
| 17 | P01, P04, P06, P12, P13 | Trois formulations du paiement | « Paiement à la livraison » | P1 | DSG-07-FIX-17 |
| 18 | P12, P13, P18, A03, A07 | Trois formats de date | « 15 janv. 2025 », « aujourd’hui à 14 h 30 » | P2 | DSG-07-FIX-18 |
| 19 | P14–P16b, P22, A01 | Erreurs e-mail/téléphone divergentes | Messages canoniques du glossaire | P1 | DSG-07-FIX-19 |
| 20 | P19b, A04, A12, A14 | Confirmations destructives divergentes | « Confirmer la suppression ? » + conséquences | P1 | DSG-07-FIX-20 |
| 21 | P01–P05, DSG-04/05 | « pointure » / « taille » | « pointure » pour les chaussures | P2 | DSG-07-FIX-21 |
| 22 | Tous | Casses de titres multiples | Majuscule initiale, micro-libellés en capitales | P2 | DSG-07-FIX-22 |
| 23 | P04, P06, zone K/L | « Ydé » | « Yaoundé » | P2 | DSG-07-FIX-23 |
| 24 | P04, P06, A06 | « Plus que 2 ! », « Stock Douala Limité » | « Plus que 2 en stock », « Stock limité à Douala » | P2 | DSG-07-FIX-24 |
| 25 | P04, P08–P11, A09b | CTA sticky et barres superposées | Une seule barre sticky, dégagement du contenu | P0 | DSG-07-FIX-25 |
| 26 | P02, P18, A04–A15 | Breadcrumb absent ou variable | Sous header, au-dessus du titre | P1 | DSG-07-FIX-26 |
| 27 | Formulaires | Erreurs sous/au-dessus/globales | Sous le champ + résumé `role=alert` | P1 | DSG-07-FIX-27 |
| 28 | P02, P18, A04, A07, A10, A12, A15 | Pagination variable | Bas centré desktop, « Voir plus » mobile | P2 | DSG-07-FIX-28 |
| 29 | P19b, A04, A12, A14 | Actions destructives variables | Bouton danger + confirmation obligatoire | P1 | DSG-07-FIX-29 |
| 30 | P02, P18, A04, A07 | Filtres sidebar/top/drawer | Top bar desktop, drawer mobile | P1 | DSG-07-FIX-30 |
| 31 | P06, P08–P12 | Récapitulatif dupliqué | `OrderSummaryCard` unique, sticky desktop | P1 | DSG-07-FIX-31 |
| 32 | P04, P05 | Guide pointure éloigné du sélecteur | Lien sous le sélecteur de pointure | P2 | DSG-07-FIX-32 |
| 33 | P17–P21 | Navigation compte variable | Sidebar ≥1024, tabs 768, liste 360 | P1 | DSG-07-FIX-33 |
| 34 | P03 | Écran absent | Concevoir recherche, suggestions, états | P0 | DSG-07-FIX-34 |
| 35 | P05 | Écran absent | Concevoir guide, tableau EU/CM, demi-pointures | P0 | DSG-07-FIX-35 |
| 36 | P07 | Écran absent | Concevoir mini-panier, tiroir, focus trap, vide | P0 | DSG-07-FIX-36 |
| 37 | P01, P02, P04, P06 | Aucun focus/état dans le PNG | Mettre à jour la planche ou produire des exports annotés | P0 | DSG-07-FIX-37 |
| 38 | P01–P27, A01–A16 | Aucune vue desktop/tablette | Produire 768/1280 ou valider les wireframes textuels | P1 | DSG-07-FIX-38 |
| 39 | P01, P02, P04, P06 | Titres tronqués | Deux lignes ou alternative accessible | P2 | DSG-07-FIX-39 |
| 40 | P06, P18b, A15 | Statuts marketing non supportés | Retirer ou requalifier en libellé éditorial | P1 | DSG-07-FIX-40 |
| 41 | P17, P18b, P19 | Facture PDF, Cercle Prestige, GPS | Retirer ou marquer « bientôt disponible » | P1 | DSG-07-FIX-41 |
| 42 | A03, A09b | Données non modélisées (flotte, hubs, casiers) | Remplacer par données disponibles | P1 | DSG-07-FIX-42 |
| 43 | A04, A11, A15 | Actions de table sans contexte | Nom accessible incluant la ligne | P0 | DSG-07-FIX-43 |
| 44 | A09b | Contraste extérieur et hors ligne non démontrés | Tester en plein soleil, documenter le mode hors ligne | P1 | DSG-07-FIX-44 |
| 45 | Tous | Validation PO absente | Signer les checklists DSG-04/05/06 et le gel | P0 | DSG-07-FIX-45 |

## 3. Tickets techniques de composants

Ces tickets sont des sous-tickets d’implémentation, à traiter avec les précédents.

| # | Composant | Défaut technique | Correction | Priorité | Ticket |
|---|---|---|---|---|---|
| C01 | Button | Bordure secondaire/ghost sous 3:1 | Bordure de contrôle conforme ou variante pleine | P1 | DSG-07-FIX-C01 |
| C02 | Button | `ariaLabel` optionnel pour `iconOnly` | Rendre le nom accessible obligatoire | P0 | DSG-07-FIX-C02 |
| C03 | Input / Select | Bordure 1,32:1 | Bordure `#6B7280` et focus conservé | P0 | DSG-07-FIX-C03 |
| C04 | Checkbox / Radio / Toggle | Erreur non reliée | Corriger `id` + `aria-describedby` + test | P0 | DSG-07-FIX-C04 |
| C05 | Checkbox / Radio / Toggle | Contour de choix sous 3:1 | Renforcer contour/piste | P1 | DSG-07-FIX-C05 |
| C06 | ProductCard | Liens dupliqués, CTA générique | Un lien principal, nom accessible contextualisé | P1 | DSG-07-FIX-C06 |
| C07 | PriceTag | Prix barré sans libellé | Ajouter « Prix initial » en SR-only | P2 | DSG-07-FIX-C07 |
| C08 | SizeSelector | État indisponible non nommé | Nom accessible avec état et stock | P0 | DSG-07-FIX-C08 |
| C09 | Toast | Fermeture automatique sans pause | Pause au survol/focus ou durée annulable | P1 | DSG-07-FIX-C09 |
| C10 | Skeleton | Chargement non annoncé seul | `aria-busy` + texte sur le conteneur | P1 | DSG-07-FIX-C10 |
| C11 | Table | Actions sans nom de ligne, caption optionnelle | Contexte de ligne + caption obligatoire | P0 | DSG-07-FIX-C11 |

## 4. Définition de terminé d’un ticket

- Correction appliquée sur la source éditable ou sur le composant.
- Test clavier et lecteur d’écran réalisé.
- Documentation mise à jour (spec, glossaire ou Design System).
- Captures ou preuve de test jointes.
- Aucun nouveau token brut introduit.
- Validation PO/design avant fermeture.
