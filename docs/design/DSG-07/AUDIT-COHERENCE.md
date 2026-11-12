# Audit de cohérence multi-écrans — DSG-07

**Date** : 11 novembre 2026
**Périmètre** : 58 vues (P01–P27 et sous-vues, A01–A16), Design System DSG-02 et composants `@bruny/ui`.
**Méthode** : comparaison des composants, des mots et des positions entre les sources visuelles et les specs DSG-04 à DSG-06.

## 1. Résumé

| Catégorie | Incohérences relevées | Corrigées dans la revue | Ticketées post-gel | Conformes |
|---|---:|---:|---:|---:|
| Composants | 14 | 2 | 12 | 0 |
| Mots et microtextes | 12 | 5 | 7 | 0 |
| Positions | 10 | 2 | 8 | 0 |
| **Total** | **36** | **9** | **27** | **0** |

`Icon` est le seul composant conforme ; il est hors tableau car aucune incohérence ne lui est associée.

Les corrections immédiates portent sur des règles documentaires : tarif Yaoundé, référence au glossaire, règle de navigation basse et alignement de la fiche livraison. Les corrections visuelles et les composants manquants sont ticketés, les maquettes n’étant pas éditables.

---

## 2. Incohérences de composants

| # | Composant | Écrans | Incohérence détectée | Décision / correction | Statut | Ticket |
|---|---|---|---|---|---|---|
| C01 | Button primaire | P01–P27, A01–A16 | Les specs utilisent `primary` navy, mais la planche emploie aussi des CTA verts pour des actions principales et des CTA blancs. | `primary` navy pour toute action principale ; `whatsapp` réservé au contact WhatsApp. | 📋 | DSG-07-FIX-01 |
| C02 | Button WhatsApp | P01, P04, P06, P13, A09b | La planche affiche blanc sur `#25D366` (1,98:1) ; le composant utilise `whatsapp-strong` (5,41:1). | Toujours `whatsapp-strong` avec texte blanc ; ne pas utiliser le vert vif comme fond de texte. | 🔧 règle documentée | DSG-07-FIX-02 |
| C03 | Input / Select | P09, P10, P14–P16b, P19–P20b, A01–A16 | Bordure `#DCE0E7` à 1,32:1 ; la maquette ne montre aucun focus. | Bordure de contrôle ≥3:1 (`#6B7280`) et focus double anneau navy. | 📋 | DSG-07-FIX-03 |
| C04 | Checkbox / Radio / Toggle | P11, P15, P19b, P20b, A11, A14 | `aria-describedby` pointe vers un `id` d’erreur absent dans les trois composants. | Ajouter l’`id` du message, tester le lien et l’annonce. | 📋 | DSG-07-FIX-04 |
| C05 | Badge / StatusBadge | P02, P06, P18b, A03–A13 | `Badge` a 9 variantes, mais aucun `StatusBadge` métier ; les specs utilisent 30+ statuts. | Créer `StatusBadge` avec mapping unique domaine/statut/ton/texte. | 📋 | DSG-07-FIX-05 |
| C06 | ProductCard | P01, P02, P04, P21 | Une seule carte pour deux densités ; CTA « Ajouter », « Commander » ou absent. | Ajouter une propriété `density` et un CTA canonique « Ajouter au panier ». | 📋 | DSG-07-FIX-06 |
| C07 | PriceTag | Tous | Le pipe `fcfa` utilise une espace normale, pas une espace insécable. | Formater « 25 000 FCFA » avec espace insécable ; `XAF` réservé aux payloads. | 📋 | DSG-07-FIX-07 |
| C08 | SizeSelector | P01, P02, P04, P05 | Le stock faible n’est pas exposé dans le composant ; l’état épuisé est seulement désactivé. | Ajouter `stockState` et libellé « indisponible » / « plus que 2 en stock ». | 📋 | DSG-07-FIX-08 |
| C09 | Modal / ConfirmDialog | P07, P19b, A11, A12b | `Modal` existe avec focus trap, mais aucun `ConfirmDialog` `alertdialog`. | Créer `ConfirmDialog` avec focus initial sur « Annuler », Échap et restitution. | 📋 | DSG-07-FIX-09 |
| C10 | DataTable / CardList | A03–A15 | `TableComponent` existe ; aucune `CardList` alors que toutes les specs admin l’exigent. | Créer `CardList` avec le même contrat de données et les priorités mobile. | 📋 | DSG-07-FIX-10 |
| C11 | Tabs / SegmentedControl | P15, P17, A05, A14 | `Tabs` est cité dans les specs mais absent de `@bruny/ui`. | Créer `Tabs` accessible ou remplacer par des liens/radios natifs. | 📋 | DSG-07-FIX-11 |
| C12 | Stepper / Timeline | P08–P13, A03, A08, A09c | Les specs exigent `ol`, `aria-current`, mais aucun composant dédié. | Créer `Stepper` et `Timeline` avec sémantique de liste ordonnée. | 📋 | DSG-07-FIX-12 |
| C13 | Alert / EmptyState | Tous les écrans à états | Les états vides et alertes sont décrits mais non centralisés ; rendus différents selon l’écran. | Créer `Alert` et `EmptyState` avec tons et actions canoniques. | 📋 | DSG-07-FIX-13 |
| C14 | Shell / navigation | Storefront, compte, admin, livreur | Quatre shells différents sans composant commun ; bottom-nav absente de P01/P02. | Documenter quatre shells, bottom-nav sur les écrans storefront hors tunnel, sidebar admin ≥1024. | 🔧 règle documentée | DSG-07-FIX-14 |

**Composant conforme** : `Icon` (masquage décoratif par défaut, label optionnel, SVG non focusable).

---

## 3. Incohérences de mots et microtextes

| # | Concept | Écrans / sources | Variantes détectées | Forme retenue | Statut | Ticket |
|---|---|---|---|---|---|---|
| M01 | Ajouter au panier | P01, P02, P04, ProductCard | « Ajouter » / « Commander » / « Ajouter Panier » | **« Ajouter au panier »** | 🔧 glossaire | DSG-07-FIX-15 |
| M02 | Continuer | P08–P11 | « Continuer » / « Suivant » / « Passer à l’étape suivante » | **« Continuer »** | 🔧 glossaire | DSG-07-FIX-16 |
| M03 | Paiement | P01, P04, P06, P12, P13 | « Paiement à la réception » / « Paiement à la livraison » / casse variable | **« Paiement à la livraison »** | 📋 | DSG-07-FIX-17 |
| M04 | Devise | Toute l’interface | `XAF` dans les APIs, `FCFA` dans l’UI, espaces variables | **« 25 000 FCFA »** à l’écran ; `XAF` uniquement dans les payloads | 📋 | DSG-07-FIX-07 |
| M05 | Date | P12, P13, P18, A03, A07 | `15/01/2025`, `15 janvier 2025`, `15 janv. 2025` | **« 15 janv. 2025 »**, `aujourd’hui à 14 h 30` | 📋 | DSG-07-FIX-18 |
| M06 | Erreur e-mail | P14–P16b, P22, A01 | « Email invalide », « Format email incorrect », « Adresse email non valide » | **« Adresse e-mail invalide. »** | 🔧 glossaire | DSG-07-FIX-19 |
| M07 | Erreur téléphone | P09, P15, P20b, A01 | « Numéro invalide », « Format +237 requis » | **« Saisissez un numéro camerounais à 9 chiffres (ex. 6 71 23 45 67). »** | 📋 | DSG-07-FIX-19 |
| M08 | Confirmation destructive | P19b, A04, A12, A14 | « Êtes-vous sûr ? », « Confirmer la suppression ? », « Voulez-vous vraiment supprimer ? » | **« Confirmer la suppression ? »** + conséquences explicites | 📋 | DSG-07-FIX-20 |
| M09 | Pointure / taille | P01–P05, DSG-04/05 | Les deux termes employés pour les chaussures | **« pointure »** pour les chaussures ; « taille » pour les vêtements | 🔧 glossaire | DSG-07-FIX-21 |
| M10 | Casse des titres | P01, P04, P06, A01–A16 | Title Case et MAJUSCULES décoratives | **Majuscule initiale uniquement** ; micro-libellés en capitales autorisés | 📋 | DSG-07-FIX-22 |
| M11 | Yaoundé | P04, P06, zone K/L | « Ydé » | **« Yaoundé »** | 🔧 glossaire | DSG-07-FIX-23 |
| M12 | Stock faible | P04, P06, A06 | « Plus que 2 ! », « Stock Douala Limité » | **« Plus que 2 en stock »**, **« Stock limité à Douala »** | 📋 | DSG-07-FIX-24 |

---

## 4. Incohérences de positions

| # | Élément | Écrans | Positions détectées | Position retenue | Statut | Ticket |
|---|---|---|---|---|---|---|
| P01 | CTA principal mobile | P04, P08–P11, A09b | Sticky bottom / inline / top | **Sticky bottom** dans les tunnels et la fiche produit ; barre unique | 🔧 règle documentée | DSG-07-FIX-25 |
| P02 | Breadcrumb | P02, P04, P18, A04–A15 | Sous header / dans header / absent | **Sous le header**, au-dessus du titre, sur toutes les sous-pages | 📋 | DSG-07-FIX-26 |
| P03 | Message d’erreur | P09–P11, P14–P16b, P19–P22, A01–A16 | Sous champ / au-dessus / global | **Sous le champ**, icône + texte, résumé `role=alert` en tête de formulaire | 📋 | DSG-07-FIX-27 |
| P04 | Pagination | P02, P18, A04, A07, A10, A12, A15 | Bas centré / bas droite / top | **Bas centré desktop** ; « Voir plus » mobile | 📋 | DSG-07-FIX-28 |
| P05 | Actions destructives | P19b, A04, A12, A14 | Bouton rouge / texte rouge / icône | **Bouton danger + confirmation** ; icône seule interdite | 📋 | DSG-07-FIX-29 |
| P06 | Filtres | P02, P18, A04, A07 | Sidebar / top bar / drawer | **Top bar desktop**, **drawer mobile**, puces actives retirables | 📋 | DSG-07-FIX-30 |
| P07 | Bottom-nav | P01–P07, P13, P17–P21 | Présente P04/P06/P13, absente P01/P02 | **Présente sur le storefront hors tunnel**, absente checkout/auth/légal | 🔧 règle documentée | DSG-07-FIX-14 |
| P08 | Récapitulatif | P08–P12, P06 | Latéral / empilé / dupliqué | **Latéral ≥1024**, sticky ; **empilé mobile** ; composant unique `OrderSummaryCard` | 📋 | DSG-07-FIX-31 |
| P09 | Aide pointure | P04, P05 | Sous sélecteur / footer | **Sous le sélecteur de pointure**, lien vers P05 | 📋 | DSG-07-FIX-32 |
| P10 | Navigation compte | P17–P21 | Sidebar / tabs / liste | **Sidebar ≥1024**, tabs 768, liste verticale 360 | 📋 | DSG-07-FIX-33 |

---

## 5. Corrections appliquées dans cette revue

| # | Écran / document | Avant | Après | Justification |
|---|---|---|---|---|
| AC01 | DSG-04 `P10` / `PARCOURS` / `VALIDATION` | Yaoundé 2 000 FCFA | Yaoundé **3 000 FCFA** | Alignement sur `delivery-zones.seed.ts` et DSG-05 |
| AC02 | DSG-05 `P24` | Conflit signalé comme ouvert | Conflit marqué **résolu par DSG-07** | Une seule valeur contractuelle |
| AC03 | Glossaire DSG-07 | Absent | **Créé** | Source de vérité des microtextes |
| AC04 | Règles de navigation basse | Périmètre indécis | **Bottom-nav sur storefront hors tunnel** | Supprime l’écart P01/P02 vs P04/P06 |
| AC05 | DSG-04 `P12` / `P13` | Ancienne référence `#BS` encore visible dans la maquette | **Spec et glossaire imposent `BRN-YYMM-XXXX`** | Corrige la référence sans retoucher le PNG |
| AC06 | Design System | 3 documents | **9 documents v1.0.0**, dont 6 nouveaux | Ajout README, ACCESSIBILITY, TOKENS, COMPOSANTS, GLOSSAIRE, CHANGELOG |

Les corrections visuelles non éditables sont dans [`TICKETS-POST-GEL.md`](./TICKETS-POST-GEL.md).

---

## 6. Synthèse et priorités

### Top 10 des incohérences les plus visibles

1. Trois libellés pour ajouter au panier.
2. Or et vert WhatsApp utilisés avec des contrastes non conformes.
3. Bottom-nav présente ou absente sans règle claire.
4. Trois formulations du paiement à la livraison.
5. Devise `XAF`/`FCFA` et espaces variables.
6. Statuts de commande/libellés marketing non alignés sur les enums.
7. CTA sticky et barres inférieures qui se superposent.
8. Actions de table sans contexte de ligne.
9. Messages d’erreur e-mail/téléphone différents selon l’écran.
10. Dates et casses de titres non uniformes.

### Recommandations globales

1. **Un seul glossaire** : `GLOSSAIRE-MICROTEXTES.md` est la source de vérité ; toute nouvelle chaîne y est ajoutée avant la maquette.
2. **Un seul token par intention** : aucune couleur brute dans une spec ou un composant.
3. **Un seul shell par contexte** : storefront, checkout, compte, admin, livreur.
4. **Un composant par pattern** : StatusBadge, CardList, ConfirmDialog, Stepper, Timeline, Tabs, EmptyState, Alert.
5. **Parité desktop/mobile** : toute colonne de table possède une priorité CardList documentée.
6. **Tests de cohérence** : rechercher les variantes interdites dans les specs et les maquettes avant chaque revue.
7. **Aucune promesse non tenue** : le design ne doit pas afficher une fonctionnalité absente du backend.

---

## 7. Limites

- La planche PNG n’est pas éditable : les corrections de couleur, position et composant ne peuvent pas y être appliquées dans cette branche.
- Les specs ne sont pas toutes signées : la cohérence est mesurée sur les intentions, pas sur une validation PO.
- P03, P05 et P07 n’ont pas de source : leurs incohérences ne peuvent pas être comparées.
- Les composants non implémentés sont jugés sur leur spec, pas sur un rendu réel.
