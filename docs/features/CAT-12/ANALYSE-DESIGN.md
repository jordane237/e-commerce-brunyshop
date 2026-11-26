# CAT-12 — Analyse design

## Fichiers de design consultés

| Maquette | Fichier | Contenu utile |
| --- | --- | --- |
| P02 — Catalogue | `docs/design/DSG-03/README.md` (inventaire), composant `ProductCard` | carte produit : prix effectif, prix barré, badge `−X%` |
| P04 — Fiche produit | `docs/design/DSG-03/README.md`, `product-detail-page.html` | prix barré + prix effectif + badge de pourcentage + économie en FCFA |
| A04 — Liste produits | `docs/design/DSG-06/A04-liste-produits.md` | colonne Prix (prix de base), pas de champ promo dédié |
| A05 — Créer/éditer produit | `docs/design/DSG-06/A05-creation-edition-produit.md` | « Prix promotionnel » + « Du / au », validation inline |

Aucun fichier image (PNG/SVG/PDF) n’est versionné pour P02/P04 : les specs Markdown et les composants Angular font référence.

## Structure extraite

### Affichage client (P02 / P04)

- `bruny-price-tag` : `amount` = prix effectif, `compareAt` = prix de base ; le prix de base est rendu en `<s class="bs-price__compare">` (barré), le prix effectif en `strong`.
- Badge `−X%` : `bruny-badge variant="promo"`, positionné à côté du prix sur P04 et en surimpression de l’image sur P02.
- Sur P04, l’économie est aussi exprimée en FCFA (« Économisez 5 000 FCFA »).
- Aucun compte à rebours n’est prévu au MVP.

### Formulaire admin (A05, futur BO-04)

- Champs : « Prix de base », « Prix promotionnel », « Du / au ».
- Règle design : « Le prix promo active les dates ; les dates sans prix promo sont ignorées. »
- Erreurs inline par champ + résumé d’erreurs en tête de formulaire.

## Microtextes validés

| Emplacement | Texte retenu |
| --- | --- |
| Erreur prix promo | Le prix promotionnel doit être inférieur au prix de base. |
| Erreur dates | La date de début de promotion doit précéder la date de fin. |
| Erreur dates manquantes | Les dates de début et de fin sont requises pour programmer une promotion. |
| Libellé admin | Prix promotionnel |
| Libellé dates | Du / au |
| Badge | −X% |

Les libellés diffèrent légèrement du glossaire DSG-07 fourni dans le ticket (« Le prix promo doit être inférieur au prix normal ») ; la formulation de la maquette A05 a été conservée pour ne pas créer deux textes pour la même erreur.

## Tokens DSG-02

- Prix barré : `--color-text-muted`, `text-decoration: line-through`.
- Badge promo : `--color-error` / variante `promo` du composant `Badge` (contraste AA).
- Espacement prix / badge : `--space-2`.

## Composants réutilisés

- `PriceTagComponent` (`compareAt`)
- `BadgeComponent` (`variant="promo"`)
- `ProductCardComponent`
- `InputComponent` (futur formulaire BO-04)
- `TabsComponent` (A05)

## Décisions de cohérence

1. `discountPercent` est calculé une seule fois côté serveur ; `ProductCard` et la fiche produit ne recalculent plus le pourcentage.
2. Le prix barré n’apparaît que si `effectivePrice < basePrice`, donc uniquement pendant une promotion active.
3. La validation reste côté serveur (message FR), l’UI admin n’aura qu’à relayer `code` + `message`.
