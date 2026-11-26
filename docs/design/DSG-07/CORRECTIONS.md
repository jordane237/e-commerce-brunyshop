# Corrections appliquées — DSG-07

**Date** : 11 novembre 2026
**Nature** : corrections documentaires uniquement. Aucune maquette PNG, aucun composant Angular et aucun code backend n’ont été modifiés.

## 1. Corrections appliquées

| # | Document / écran | Avant | Après | Justification | Preuve |
|---|---|---|---|---|---|
| A01 | `docs/design/DSG-04/PARCOURS.md` | Yaoundé à 2 000 FCFA | Yaoundé à **3 000 FCFA** | Alignement sur `delivery-zones.seed.ts` et DSG-05 | Table des zones |
| A02 | `docs/design/DSG-04/VALIDATION.md` | Point 3.3 à 2 000 FCFA | Point 3.3 à **3 000 FCFA** | Une seule valeur contractuelle | Checklist |
| A03 | `docs/design/DSG-05/P24-livraison.md` | Conflit présenté comme ouvert | Conflit **résolu par DSG-07** | Évite une divergence persistante | Section Écarts |
| A04 | `docs/design/DSG-05/VALIDATION.md` | Point ouvert « aligner sur 3 000 » | **Résolu par DSG-07** | Clôture explicite | Points ouverts |
| A05 | `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` | Absent | **Créé** | Source de vérité des CTA, erreurs, formats et ton | Document complet |
| A06 | Règle de navigation basse | Périmètre indécis | **Bottom-nav sur le storefront hors tunnel**, absente checkout/auth/légal | Supprime l’écart P01/P02 vs P04/P06 | Audit cohérence P07 |
| A07 | Référence de commande | `#BS-2025-8492` encore visible dans la maquette | **`BRN-YYMM-XXXX`** imposé par la spec et le glossaire | Corrige sans retoucher le PNG | DSG-04 P12/P13 |
| A08 | Design System | 3 documents | **9 documents v1.0.0**, dont 6 nouveaux | Rend le DS trouvable en un endroit | `docs/design-system/` |
| A09 | Documentation DSG-07 | Absente | **10 documents** | Traçabilité de l’audit, des corrections, du gel et des parcours | `docs/design/DSG-07/` |
| A10 | DSG-03 | Dossier absent | **Constat et statut documentés** | La validation P01–P07 n’était pas traçable | `docs/design/DSG-03/README.md` |

## 2. Corrections non appliquées et raison

| Sujet | Raison | Destination |
|---|---|---|
| Couleurs de la planche PNG | Image aplatie, non éditable | `TICKETS-POST-GEL.md` |
| Positions et tailles des maquettes | Aucun fichier source Figma/Penpot/SVG | `TICKETS-POST-GEL.md` |
| Composants manquants (`StatusBadge`, `CardList`, `ConfirmDialog`, etc.) | Ticket design, pas de code dans DSG-07 | `TICKETS-POST-GEL.md` |
| Bugs ARIA de Checkbox/Radio/Toggle | Correction de code applicatif interdite dans ce ticket | `TICKETS-POST-GEL.md` |
| Contrastes des bordures de contrôle | Nécessite une modification de tokens SCSS/CSS | `TICKETS-POST-GEL.md` |
| Textes de la planche | Image non éditable | Glossaire + tickets maquette |
| Validation PO des specs | Responsabilité du propriétaire | `DESIGN-FREEZE.md` |

## 3. Vérification des corrections

- Les valeurs de livraison sont identiques dans DSG-04, DSG-05 et le seed.
- Le glossaire remplace les variantes de CTA, d’erreurs et de formats.
- Les documents DSG-04/05/06 pointent vers l’audit et le gel sans suppression d’information.
- Aucun fichier `.ts`, `.scss`, `.html` applicatif ou backend n’est modifié par DSG-07.
- Les corrections visuelles restantes sont toutes associées à un ticket dans `TICKETS-POST-GEL.md`.

## 4. Portée du gel

Le gel fige les **décisions documentaires** : tokens accessibles, glossaire, parcours, règles de position et architecture de composants. Il ne fige pas les maquettes PNG comme conformes : leur mise à jour est ticketée. Voir [`DESIGN-FREEZE.md`](./DESIGN-FREEZE.md).
