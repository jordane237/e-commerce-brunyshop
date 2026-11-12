# Changelog — DSG-07

Toutes les dates sont au format `AAAA-MM-JJ`. Ce changelog ne couvre que la revue DSG-07.

## [1.0.0] — 2026-11-11

### Ajouté

- `INVENTAIRE-DESIGN.md` : inventaire des sources, 58 vues, couverture réelle, risques.
- `AUDIT-ACCESSIBILITE.md` : 58 fiches × 19 critères, 16 fiches composants, contrastes calculés, synthèse.
- `AUDIT-COHERENCE.md` : 36 incohérences de composants, mots et positions.
- `CORRECTIONS.md` : corrections documentaires A01–A10.
- `TICKETS-POST-GEL.md` : 45 tickets transverses et 11 sous-tickets composants.
- `GLOSSAIRE-MICROTEXTES.md` : actions, statuts, erreurs, formats, ton.
- `ux-flows.md` : 6 parcours Mermaid.
- `DESIGN-FREEZE.md` : gel MVP, réserves, procédure, signature.
- `README.md` et `CHANGELOG.md` : navigation et historique.
- `docs/design-system/README.md`, `ACCESSIBILITY.md`, `TOKENS.md`, `COMPOSANTS.md`, `GLOSSAIRE.md`, `CHANGELOG.md`.
- `docs/design/DSG-03/README.md` : traçabilité du dossier absent.

### Modifié

- DSG-04 : tarif Yaoundé aligné à 3 000 FCFA dans `PARCOURS.md` et `VALIDATION.md`.
- DSG-05 : conflit tarifaire marqué résolu dans `P24-livraison.md` et `VALIDATION.md`.
- DSG-04/05/06 : liens vers l’audit et le gel ajoutés dans les README et checklists, sans suppression.
- DSG-07 `INVENTAIRE-DESIGN.md` : conflit tarifaire passé de « à trancher » à « résolu ».
- Design System porté en version 1.0.0.

### Vérifié

- 120 variables dans `_tokens.scss` et 120 dans `tokens.css`.
- 58 vues et 1 102 critères d’écran générés.
- 6 diagrammes Mermaid.
- Aucun fichier applicatif modifié.
- Aucun secret, aucun `dist/`.

### Réserves

- Validation PO des specs DSG-04/05/06 non signée.
- P03, P05, P07 sans source.
- Aucune vue desktop/tablette.
- Aucun test lecteur d’écran réel.
- Composants `StatusBadge`, `CardList`, `ConfirmDialog`, `Tabs`, `Stepper`, `Timeline`, `Alert`, `EmptyState` absents.
- Bordures de contrôle à 1,32:1.
- `aria-describedby` cassé sur Checkbox/Radio/Toggle.

### Non inclus

- Implémentation Angular ou backend.
- Maquettes desktop.
- Correction des tickets post-gel.
- Signature du Product Owner.
