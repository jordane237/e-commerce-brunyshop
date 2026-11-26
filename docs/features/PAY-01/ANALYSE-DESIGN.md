# PAY-01 — Analyse design (A07 / A08 / A09)

## Fichiers localisés
- `docs/design/DSG-06/A07-liste-commandes.md`
- `docs/design/DSG-06/A08-detail-commande.md`
- `docs/design/DSG-06/A09-liste-livraisons.md`, `A09b-my-deliveries.md`, `A09c-detail-livraison.md`
- Maquettes `/design`, `/design-1` (A07/A08/A09)

## Structure A08 (détail commande) retenue
- Section statut : badge (PENDING_CONFIRMATION → « En attente de confirmation »), transitions autorisées.
- Section confirmation : « Confirmer par appel » (CALL) et « Confirmer par WhatsApp » (WHATSAPP), notes optionnelles.
- Section paiement : `paymentMethod` (COD), `paymentStatus` (PENDING), total, seuil configuré, indicateur « Confirmation obligatoire au-delà de X XAF » si montant ≥ seuil.
- Section encaissement COD : `codCollected`, bouton « Enregistrer l’encaissement » uniquement si `shipment.status = DELIVERED`, montant prérempli avec `total`, `collectedAt`, `collectedBy`.
- Alertes : « Confirmation requise avant préparation » si tentative PREPARING sans confirmation.

## Microtextes DSG-06 / DSG-07
« Confirmer la commande », « Confirmation par appel », « Confirmation WhatsApp », « Commande confirmée », « En attente de confirmation », « Passer en préparation », « Confirmation requise avant préparation », « Montant au-delà du seuil : confirmation obligatoire », « Encaissement à la livraison enregistré », « COD collecté », « Montant à encaisser », « Confirmer l’encaissement », « Notes de confirmation (optionnel) », « La commande doit être confirmée avant de passer en préparation. », « La commande doit être livrée pour enregistrer l’encaissement. », « Le montant encaissé doit être compris entre 0 et X XAF. »

## Tokens DSG-02
Badges : PENDING_CONFIRMATION=warning, CONFIRMED=info, PREPARING=info, SHIPPED=info, DELIVERED=success, CANCELLED=error. Breakpoints 360/768/1280.

## Composants TEC-10 réutilisables
StatusBadge, Timeline, ActionMenu, ConfirmDialog, Modal, Input, Textarea, Button, Toast, Skeleton, Alert.

## Décisions de cohérence
- Confirmation → statut `CONFIRMED` (puis PREPARING possible).
- CA #2 strict : PREPARING bloqué sans `confirmedAt`, même sous le seuil (documenté).
- Seuil lu depuis `Setting.order.codConfirmationThreshold` (défaut 100 000 XAF).
- `codCollected` complété avec date/collecteur/montant.
- Réutiliser `NotificationsService` (NTF-01) pour SMS client.
- Audit via `ORDER_AUDIT_ACTIONS` (AUT-08).
- Aucun changement de statut enum.
- Non-régression ORD-01/ORD-02/STK-01.
