# Responsive patterns — Back-office

## Breakpoints de référence

| Nom | Largeur | Usage |
| --- | --- | --- |
| Mobile | 360 px | Base de conception, livreur, gérant en déplacement |
| Tablette | 768 px | Grilles 2 colonnes, tables simplifiées |
| Desktop | 1024 px | Apparition de la sidebar |
| Large | 1280 px | Densité complète, panneaux latéraux |
| Max contenu | 1200 px | Zone de lecture confortable |

Les tests se font à **360, 768, 1024 et 1280 px**, sans zoom horizontal.

## 1. Navigation

| Contexte | Pattern |
| --- | --- |
| ≥ 1024 px | Sidebar fixe 240–260 px, rétractable, item actif en navy |
| 768–1023 px | Sidebar en icônes ou drawer, header avec menu |
| < 768 px | Header hamburger + drawer plein écran ; pas de sidebar persistante |
| Livreur | Barre basse 3 onglets : Tournée, Historique, Profil |

Règles :

- Le menu mobile est un `drawer` avec focus piégé.
- L’item courant utilise `aria-current="page"`.
- Les entrées non autorisées sont **absentes**, pas grisées.
- Le fil d’Ariane est masqué sur mobile si l’espace manque, mais le bouton retour reste.

## 2. Tables → cartes (CA #2)

**Toute table desktop possède une `CardList` mobile.** Aucune table ne défile horizontalement sur mobile.

| Élément de table | Rendu carte |
| --- | --- |
| Colonne principale (nom, référence) | Titre de carte |
| Statut | Badge en haut à droite |
| 2–3 colonnes secondaires | Lignes labellisées |
| Montant | Valeur forte, alignée à droite |
| Actions | Boutons principaux + `ActionMenu` |
| Sélection | Case en haut à gauche si action groupée |

Règles :

- Une carte = une entité, jamais deux.
- Maximum 8 informations visibles ; le reste est dans le détail.
- L’ordre de lecture suit l’importance métier, pas l’ordre des colonnes.
- Les libellés ne sont pas répétés si le contexte est évident (ex. prix sans « Prix : »).
- Le clic sur la carte ouvre le détail, sauf sur les boutons.

## 3. Filtres et recherche

| Contexte | Pattern |
| --- | --- |
| ≥ 1024 px | `FilterBar` inline sous le titre |
| < 1024 px | Bouton « Filtres {n} » ouvrant `FilterDrawer` |
| Recherche | Toujours visible, pleine largeur sur mobile |
| Tri | `Select` compact à droite de la recherche sur mobile |
| Filtres actifs | Puces retirables sous la barre |

- Le drawer a un bouton « Appliquer » et un lien « Réinitialiser ».
- Les filtres sont reflétés dans l’URL sur tous les formats.
- Le nombre de résultats est annoncé après application.
- Aucun filtre ne dépend d’un survol.

## 4. Pagination et chargement

| Contexte | Pattern |
| --- | --- |
| Desktop | Pagination numérotée + nombre de résultats |
| Mobile | « Charger plus » + compteur |
| Tableau | Squelettes de lignes |
| Cartes | Squelettes de 2–3 cartes |
| Fin de liste | « Vous avez tout vu » |

- Pas de scroll infini : le retour en arrière doit rester prévisible.
- La sélection est conservée entre les pages d’une même session.
- Le rechargement d’une page ne réinitialise pas les filtres.

## 5. Actions et densité

| Élément | Mobile | Desktop |
| --- | --- | --- |
| Bouton primaire | Pleine largeur, 48 px si livreur, sinon 44 px | Aligné à droite |
| Actions secondaires | `ActionMenu` ou bottom sheet | Boutons inline |
| Actions destructives | Bottom sheet + confirmation | `ConfirmDialog` |
| Barre d’actions groupées | Sticky au-dessus de la barre basse | Sticky en bas du tableau |
| Cibles | 44 px min, 48 px livreur | 36–40 px acceptables |

- Une seule action primaire par zone.
- Les actions destructives ne sont jamais à côté d’une action primaire sans séparation.
- Les libellés commencent par un verbe.

## 6. Formulaires

| Contexte | Pattern |
| --- | --- |
| Mobile | Une colonne, stepper pour les formulaires longs, barre d’enregistrement sticky |
| Tablette | Deux colonnes pour les champs courts |
| Desktop | Colonne principale + colonne résumé/statut |
| Erreurs | Sous le champ, résumé en haut si plusieurs |
| Aides | Sous le champ, jamais en placeholder seul |

- Les champs numériques utilisent `inputmode` adapté.
- Les prix sont des entiers XAF.
- Les actions d’enregistrement ne sont jamais uniquement dans un menu.
- Les modifications non enregistrées déclenchent un dialogue.

## 7. Modales, drawers et feuilles

| Usage | Mobile | Desktop |
| --- | --- | --- |
| Confirmation courte | Bottom sheet | `Modal` centrée |
| Formulaire long | Plein écran | `Modal` large ou page |
| Détail secondaire | Plein écran | Panneau latéral 400–480 px |
| Filtres | `FilterDrawer` | `FilterBar` |

- Toutes les surfaces modales piègent le focus et le restituent.
- `Échap` ferme sauf si une sauvegarde est en cours.
- La hauteur maximale est `90dvh` avec scroll interne.
- Pas de modale dans une modale.

## 8. Contenus et typographie

| Élément | Mobile | Desktop |
| --- | --- | --- |
| Titre de page | 24–28 px | 30–36 px |
| Titre de section | 18–20 px | 20–24 px |
| Corps | 15–16 px | 14–16 px |
| Micro-texte | 12–13 px | 11–12 px |
| Montant KPI | 28–32 px | 32–38 px |
| Montant livreur | ≥ 18 px | ≥ 20 px |

- Pas de texte essentiel sous 14 px sur mobile.
- Les montants ne sont jamais tronqués.
- Les noms longs passent à la ligne, pas d’ellipsis sur les données critiques.

## 9. Vue livreur (CA #3)

- KPI sticky sous le header, hauteur ≤ 120 px.
- Cartes empilées, une course par carte.
- Actions : Appeler, Itinéraire, Marquer livrée, Échec.
- Cibles 48 px, espacement 12 px.
- Contraste renforcé, texte ≥ 16 px.
- Bandeau hors ligne persistant, jamais une simple icône.
- Aucune table, aucun menu caché pour les actions critiques.
- Le mode paysage ne doit pas casser les actions.

## 10. Grille de variantes (CA #4)

| Contexte | Pattern |
| --- | --- |
| Desktop | Matrice couleurs × pointures, édition en ligne, panneau de détail |
| Tablette | Matrice simplifiée ou tableau classique |
| Mobile | Cartes groupées par couleur, édition en feuille |
| Actions groupées | Barre sticky, sélection par case |

- La limite de 300 variantes est visible avant génération.
- Le compteur `couleurs × pointures` est toujours affiché.
- Les SKU sont en lecture seule.
- Les cellules liées à une commande sont marquées.

## 11. Checklist de recette responsive

- [ ] Aucun scroll horizontal à 360 px.
- [ ] Toutes les tables ont une vue cartes.
- [ ] Tous les filtres sont accessibles en drawer.
- [ ] Les actions principales sont visibles sans menu.
- [ ] Les dialogues piègent et restituent le focus.
- [ ] Les cibles respectent 44/48 px.
- [ ] Les montants restent lisibles sans troncature.
- [ ] Le clavier permet d’atteindre chaque action.
- [ ] Le mode hors ligne du livreur est annoncé.
- [ ] La grille de variantes reste utilisable à 360 px.
