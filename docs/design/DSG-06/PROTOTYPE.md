# Prototype — Générateur de variantes

## 1. Option retenue : C — HTML statique

Trois options étaient possibles :

| Option | Description | Verdict |
| --- | --- | --- |
| A | Maquette Figma | Outil externe, non versionnable dans le dépôt |
| B | Prototype Angular dans l’admin | Contraire au périmètre design de DSG-06 |
| **C** | **Page HTML autonome, sans dépendance** | **Retenue** |

Le prototype couvre uniquement A05b, l’interaction la plus risquée du lot. Les autres écrans sont couverts par les wireframes et les specs.

## 2. Fichier livré

```text
docs/design/DSG-06/prototype/variant-generator.html
```

- HTML, CSS et JavaScript inline.
- Aucune dépendance, aucun build, aucun appel réseau.
- Fonctionne en ouvrant le fichier directement dans un navigateur.
- Responsive : matrice desktop, cartes groupées mobile.

Pour l’ouvrir :

```bash
xdg-open docs/design/DSG-06/prototype/variant-generator.html
```

ou servir le dossier :

```bash
python3 -m http.server 8080 --directory docs/design/DSG-06
# http://localhost:8080/prototype/variant-generator.html
```

## 3. Périmètre fonctionnel du prototype

| Fonction | Implémenté |
| --- | --- |
| Ajout/suppression de couleurs | Oui |
| Ajout/suppression de pointures | Oui |
| Compteur couleurs × pointures | Oui |
| Limite de 30 couleurs / 30 pointures / 300 variantes | Oui |
| Génération de la grille | Oui |
| Conservation des valeurs existantes | Oui |
| Aperçu de SKU | Oui, indicatif |
| Édition prix / stock / seuil | Oui |
| Sélection multiple | Oui |
| Actions groupées prix / stock / seuil | Oui |
| Suppression groupée | Oui, avec confirmation native |
| Vue cartes mobile | Oui |
| Persistance | Non (rechargement = réinitialisation) |
| Appel backend | Non |
| Gestion des variantes liées à une commande | Non (hors prototype) |

## 4. Différences assumées avec la cible

- Le prototype utilise `confirm()` pour la suppression groupée ; la cible utilise `ConfirmDialog`.
- Les SKU sont calculés côté client ; le serveur reste seul garant de l’unicité.
- Aucune sauvegarde : le bouton « Enregistrer » affiche un message de simulation.
- Les messages d’erreur sont simplifiés.
- Les polices système remplacent Plus Jakarta Sans.
- Pas de gestion de focus avancée dans la grille ; la cible doit l’implémenter.

## 5. Dix-huit scénarios à tester

| # | Scénario | Étapes | Résultat attendu |
| --- | --- | --- | --- |
| 1 | Grille vide | Ouvrir la page sans couleur ni pointure | Message d’aide, bouton Générer désactivé |
| 2 | Ajout d’une couleur | Saisir « Noir » + Entrée | Puce ajoutée, compteur mis à jour |
| 3 | Ajout d’une pointure | Saisir « 42 » + Entrée | Puce ajoutée, compteur mis à jour |
| 4 | Doublon de couleur | Ajouter « noir » puis « Noir » | Deuxième ajout refusé avec message |
| 5 | Génération simple | 2 couleurs × 3 pointures, Générer | 6 lignes, SKU visibles, stock 0, seuil 5 |
| 6 | Conservation des valeurs | Modifier un stock puis régénérer | La valeur du couple existant est conservée |
| 7 | Ajout d’une pointure après génération | Ajouter « 44 » puis régénérer | Nouvelles lignes uniquement, anciennes intactes |
| 8 | Suppression d’une couleur | Retirer une puce | Les variantes de cette couleur disparaissent |
| 9 | Limite de 300 | 20 couleurs × 20 pointures | Génération bloquée, message explicite |
| 10 | Aperçu SKU | Générer « Noir » / « 42 » | `BRUNY-MOCASSIN-42-NOIR` |
| 11 | Édition du prix | Saisir 42 500 | Valeur conservée au re-rendu |
| 12 | Édition du stock | Saisir 7 | Valeur conservée, total recalculé |
| 13 | Sélection d’une ligne | Cocher une case | Barre d’actions indique « 1 sélectionnée » |
| 14 | Tout sélectionner | Cocher l’en-tête | Toutes les lignes sélectionnées |
| 15 | Prix groupé | Sélectionner 3 lignes, appliquer 39 000 | Les 3 prix passent à 39 000 |
| 16 | Stock groupé | Appliquer 10 | Les 3 stocks passent à 10 |
| 17 | Suppression groupée | Sélectionner 2 lignes, supprimer | Confirmation, puis 2 lignes retirées |
| 18 | Mobile | Réduire à 360 px | Tableau masqué, cartes groupées par couleur, édition possible |

## 6. Critères d’acceptation du prototype

- [ ] Aucun scroll horizontal à 360 px.
- [ ] Le compteur `couleurs × pointures` est toujours lisible.
- [ ] La limite de 300 est annoncée avant génération.
- [ ] Les valeurs saisies ne sont pas perdues lors d’une régénération.
- [ ] Les actions groupées ne s’appliquent qu’aux lignes sélectionnées.
- [ ] Les SKU sont en lecture seule.
- [ ] Le message de succès est annoncé (`aria-live`).
- [ ] Les cibles mobile sont ≥ 44 px.

## 7. Ce que le prototype ne prouve pas

- La validité métier du payload backend.
- L’unicité réelle des SKU.
- La gestion des variantes liées à des commandes.
- La performance à 300 variantes avec images.
- L’accessibilité complète au clavier (à valider sur l’implémentation).
- Le comportement hors ligne (non applicable à cet écran).

## 8. Réutilisation pour l’implémentation

Le prototype sert de référence d’interaction, pas de code à copier tel quel. L’implémentation Angular devra :

1. Remplacer les données locales par `GET /admin/products/:id`.
2. Envoyer `PUT /admin/products/:id/variants` avec les identifiants existants.
3. Utiliser `ConfirmDialog` et `BottomSheet`.
4. Gérer les erreurs `DUPLICATE_VARIANT`, `VARIANT_HAS_ORDERS`, `SKU_ALREADY_EXISTS`.
5. Respecter les tailles de cible et le focus clavier.
