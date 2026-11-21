# STK-03 — Analyse design des alertes de stock

## Sources réellement disponibles

Le prompt de ticket mentionne `/design` et `/design-1`. Ces dossiers n’existent
pas dans le dépôt. Le seul fichier graphique est :

- `design1/bruny shopping/bruny shopping.png`

Il s’agit d’une planche aplatie. La zone L préfigure A03, A06 et A09, mais elle
ne permet pas d’extraire des mesures fiables ni des états interactifs.

Les structures détaillées proviennent donc de :

- `docs/design/DSG-06/A03-dashboard.md` ;
- `docs/design/DSG-06/A06-gestion-stock.md` ;
- `docs/design/DSG-06/COMPOSANTS-REQUIS.md` ;
- `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md`.

## A03 — dashboard

- Section « Alertes stock » limitée à 5 variantes.
- Produit, pointure, couleur, stock disponible et seuil.
- Actions « Voir le stock » et « Réapprovisionner ».
- Calcul sur `availableStock = stock - reservedStock`.
- La cloche de notifications et le centre in-app restent des placeholders BO-01.

## A06 — gestion du stock

- Liste par variante avec stock, réservé, disponible et seuil.
- Badges « En stock », « Stock faible » et « Rupture ».
- Filtres, recherche et panneau des mouvements.
- `reservedStock` n’est jamais modifiable manuellement.
- Le réapprovisionnement passe par `PUT /admin/products/:id/variants`.

## Microtextes

Le template interne utilise uniquement des libellés validés :

- « Stock bas » ;
- « Stock actuel » ;
- « Seuil d’alerte » ;
- « Plus que {n} en stock » ;
- « Réapprovisionner ».

La phrase « Réapprovisionnez rapidement pour éviter la rupture. » proposée dans
le prompt n’est pas présente dans DSG-07 et n’a donc pas été ajoutée au template.

## Périmètre frontend

Le widget A03 et la page A06 ne sont pas implémentés dans STK-03. Les routes
admin `/dashboard` et `/stock` restent des placeholders. L’API
`GET /api/v1/admin/stock/alerts` fournit les données nécessaires à une
intégration ultérieure.

Conclusion : la conformité visuelle n’est pas revendiquée par ce ticket. La
conformité porte sur la sémantique des données et les contrats API.
