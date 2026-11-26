# ORD-05 — Analyse design (suivi public de commande)

## Fichiers localisés

- `docs/design/DSG-04/P12-confirmation.md` (confirmation, CTA « Suivre ma commande »)
- `docs/design/DSG-04/P13-suivi-public.md` (suivi public, formulaire + timeline)
- `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` (microtextes FR)

## Structure extraite (P13)

- Formulaire : champ « Référence » (placeholder `BRN-2611-7K3F`, format `BRN-XXXX-XXXX`), champ « Téléphone » (`+237XXXXXXXXX`, `inputmode="tel"`), bouton « Voir ma commande ».
- Résultat : statut principal, timeline 5 étapes, articles (nom, pointure, couleur, quantité, prix snapshot), totaux, ville de livraison, estimation, montant à régler.
- États : chargement, vide (« Référence introuvable ou numéro incorrect. »), erreur générique, trop de tentatives.
- Sécurité design : anti-énumération (message identique), limitation 10 tentatives / 10 min / IP + référence, journalisation sans numéro en clair.

## Microtextes validés (DSG-04 / DSG-07)

- « Référence introuvable ou numéro incorrect. »
- « Vérifiez votre numéro de commande et le téléphone associé. »
- « Trop de tentatives. Réessayez dans quelques minutes. »
- Statuts FR : « En attente de confirmation », « Confirmée », « En préparation », « Expédiée », « Livrée », « Annulée ».
- « Le numéro de commande doit être au format BRN-XXXX-XXXX. »
- « Le téléphone doit être au format +237XXXXXXXXX. »

## Décisions de cohérence (P12 → P13)

- La confirmation (P12) affiche la référence copiable et redirige vers P13 via « Suivre ma commande ».
- Le suivi public (P13) exige référence + téléphone (pas de lien signé côté backend dans ce ticket).
- Aucune PII complète n'est exposée : ville uniquement, téléphone masqué dans les audits.

## Composants réutilisables (TEC-10)

- `Input`, `Button`, `Badge`, `Skeleton`, `EmptyState`, `Timeline`, `StatusBadge`.
- Composants manquants côté frontend (hors scope ORD-05 backend) : `TrackingLookupForm`, `StatusBanner`, `CourierCard`, `AddressCard`, `AmountDueCard`.
