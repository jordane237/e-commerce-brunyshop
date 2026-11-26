# PAY-02 — Analyse design (A08 / A14)

## Fichiers localisés
- `docs/design/DSG-06/A08-detail-commande.md` (wireframes 360/768/1280, composants, microtextes, interactions)
- `docs/design/DSG-06/A14-parametres.md` (paramètres, onglets, microtextes)

## Structure A08 (détail commande) — affichage paiement
- Section « Paiement » : prestataire (`MTN MoMo`, `Orange Money`, etc.) + statut badge (`Payée` = SUCCEEDED, `En attente` = PENDING, `Échoué` = FAILED), `providerRef` (référence transaction), `paidAt`.
- Statuts commande incluent `AWAITING_PAYMENT` → `PAID` → `PREPARING`.
- Microtextes : « Paiement en attente », « Paiement échoué », « Paiement confirmé » (DSG-07).
- Aucun bouton « Rembourser » en V1 (remboursement hors scope).

## Structure A14 (paramètres)
- A14 V1 : **aucune configuration de passerelle de paiement** (note explicite : « Aucune configuration de passerelle de paiement, de SMTP ou de notifications dans cette version. »).
- Sélection du prestataire actif (`PAYMENT_PROVIDER`) est donc portée par l'environnement (TEC-04), pas par l'admin, en MVP. Migration future possible via `Setting.payment.provider` si le PO le demande (PAY-03).

## Microtextes DSG-07 (paiement)
- « Prestataire de paiement », « Mode de paiement »
- « Paiement en cours », « Paiement confirmé », « Paiement échoué », « Paiement remboursé »
- « Référence transaction », « Date de paiement »
- Erreurs : « Le prestataire de paiement est indisponible. », « Le paiement a échoué. Réessayez. », « La signature du webhook est invalide. », « Transaction introuvable. »

## Tokens DSG-02
- Badge paiement : PENDING=warning, SUCCEEDED=success, FAILED=error, REFUNDED=neutral.
- Breakpoints 360/768/1280.

## Composants TEC-10 réutilisables
StatusBadge, DataTable, ActionMenu, ConfirmDialog, Modal, Select, Input, Alert, Toast, Skeleton.

## Décisions de cohérence PAY-02
- Port hexagonal `PaymentProvider` dans `backend/src/infrastructure/payments/` (pattern NTF-01 adapters).
- Sélection par env `PAYMENT_PROVIDER` (validation class-validator `@IsIn`), défaut `fake`.
- `FakePaymentProvider` in-memory, sans réseau, simulation configurable.
- Aucune dépendance métier vers un prestataire précis : les services futurs passent par un factory/token.
- Pas de changement Prisma (Payment déjà compatible).
- Pas de config admin (A14 V1 l'exclut).
- Non-régression PAY-01 (COD) : `PaymentProvider` n'est pas utilisé par COD (COD = hors provider).
