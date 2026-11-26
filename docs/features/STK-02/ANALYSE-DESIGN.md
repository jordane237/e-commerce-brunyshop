# STK-02 — Analyse design (A06 gestion stock)

## Fichiers localisés
- `docs/design/DSG-06/A06-gestion-stock.md` (spec complète A06)
- `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` (microtextes validés)

## Structure extraite (A06)
- **KPI** : ruptures, stock faible, unités en stock, unités réservées.
- **Liste variantes** : produit/variante, SKU, stock, réservé, disponible, statut (OK/Faible/Rupture), actions `Ajuster` et `Historique`.
- **Filtres** : statut, catégorie, marque, seuil, recherche produit/SKU, réinitialisation.
- **Modale d'ajustement** : stock actuel, type (ajouter/retirer/corriger), quantité, motif (obligatoire), note optionnelle, aperçu nouveau stock, confirmation.
- **Historique** : panneau avec 20 derniers mouvements, pagination « Voir plus », colonnes date, auteur, motif, delta, avant → après, référence commande.
- **Responsive** : 360 (cartes), 768 (table compacte), 1280 (table + panneau latéral).

## Microtextes validés (DSG-06/DSG-07)
- « Ajuster le stock », « Motif », « Réception », « Inventaire », « Casse ou perte », « Retour client », « Autre »
- « Le stock ne peut pas être négatif. », « Sélectionnez un motif. »
- « Stock mis à jour : {avant} → {après}. », « Le stock a changé entre-temps. Rechargez la ligne. »

## Composants TEC-10 réutilisables
- DataTable, CardList, StatusBadge, Modal/BottomSheet, Input, Select, Textarea, Toast, EmptyState, Skeleton, ConfirmDialog.

## Décisions de cohérence
- STK-02 livre uniquement l'API backend + historique + audit. Le formulaire admin (A06) et la vue historique UI sont reportés à BO-06.
- Motifs backend (`StockAdjustmentMotif`) : RECEPTION, INVENTAIRE, CASSE, RETOUR, AUTRE — alignés avec les motifs UI autorisés.
- `RESERVATION`, `RELEASE`, `PURCHASE`, `CANCELLATION` restent générés par les flux métier, jamais à la main.