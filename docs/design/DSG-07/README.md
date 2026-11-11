# DSG-07 — Revue finale d’accessibilité et de cohérence

**Date** : 11 novembre 2026
**Branche** : `feature/DSG-07-final-a11y-coherence-review`
**Type** : ticket design uniquement. Aucun composant Angular, aucun endpoint, aucune migration.

## 1. Objectif

Clore la phase de design par :

1. un inventaire exhaustif des sources ;
2. un audit WCAG 2.1 AA des 58 vues et des 16 composants ;
3. un audit de cohérence des composants, des mots et des positions ;
4. un glossaire unique ;
5. six parcours UX ;
6. un gel MVP contractuel, avec réserves et procédure de modification.

## 2. Livrables

| Document | Contenu |
|---|---|
| [`INVENTAIRE-DESIGN.md`](./INVENTAIRE-DESIGN.md) | Sources, arborescence, couverture, risques |
| [`AUDIT-ACCESSIBILITE.md`](./AUDIT-ACCESSIBILITE.md) | 58 fiches × 19 critères, 16 fiches composants, contrastes calculés |
| [`AUDIT-COHERENCE.md`](./AUDIT-COHERENCE.md) | 36 incohérences composants/mots/positions |
| [`CORRECTIONS.md`](./CORRECTIONS.md) | Corrections appliquées et raisons des non-corrections |
| [`TICKETS-POST-GEL.md`](./TICKETS-POST-GEL.md) | Backlog détaillé, priorités et définition de terminé |
| [`GLOSSAIRE-MICROTEXTES.md`](./GLOSSAIRE-MICROTEXTES.md) | Source de vérité des libellés, statuts, erreurs et formats |
| [`ux-flows.md`](./ux-flows.md) | 6 parcours Mermaid : invité, connecté, suivi, compte, support, admin |
| [`DESIGN-FREEZE.md`](./DESIGN-FREEZE.md) | Gel MVP, portée, réserves, procédure, signature PO |
| [`CHANGELOG.md`](./CHANGELOG.md) | Historique de la revue |
| [`README.md`](./README.md) | Ce document |

## 3. Chiffres clés

| Indicateur | Valeur |
|---|---:|
| Vues auditées | 58 |
| Critères WCAG par vue | 19 |
| Critères d’écran | 1 102 |
| Composants audités | 16 |
| Critères composants | 304 |
| Incohérences relevées | 36 |
| Corrections documentaires | 10 |
| Tickets post-gel | 45 + 11 sous-tickets composants |
| Parcours UX | 6 |
| Maquettes dédiées | 6 |
| Maquettes groupées | 12 |
| Specs seules | 37 |
| Sans aucune source | 3 (P03, P05, P07) |

Répartition de l’audit d’écran : **942 conformes**, **43 partiels**, **69 non conformes**, **12 corrigés par règle**, **36 ticketés**.

## 4. Comment lire les documents

1. **Comprendre les sources** : `INVENTAIRE-DESIGN.md`.
2. **Vérifier un écran** : `AUDIT-ACCESSIBILITE.md`, section « Écrans ».
3. **Vérifier un composant** : même document, section « Design System », puis `docs/design-system/COMPOSANTS.md`.
4. **Écrire un libellé** : `GLOSSAIRE-MICROTEXTES.md`.
5. **Concevoir un parcours** : `ux-flows.md`.
6. **Savoir ce qui est décidé** : `DESIGN-FREEZE.md`.
7. **Savoir ce qui reste à faire** : `TICKETS-POST-GEL.md`.

## 5. Statut réel

- Le design est **documenté et audité**, pas certifié.
- Les specs DSG-04/05/06 ne sont **pas signées**.
- P03, P05 et P07 n’ont **aucune source**.
- Aucune vue desktop ou tablette n’existe.
- Aucun test lecteur d’écran réel n’a été exécuté.
- Les composants manquants sont spécifiés, pas livrés.
- Les parcours décrivent la **cible**, pas l’état actuel.

Le produit n’est pas une boutique transactionnelle complète. Aucune intégration non terminée ne doit être présentée comme prête pour la production.

## 6. Périmètre technique

- Aucun fichier `.ts`, `.html`, `.scss`, `.sql` ou backend modifié.
- Seuls des fichiers Markdown dans `docs/design/` et `docs/design-system/` sont modifiés.
- Le seul actif visuel reste `design1/bruny shopping/bruny shopping.png` (PNG 4302 × 5532, SHA-256 `9c29d15669a9af0a4290b4f56b845a1409f8c1ab4c3bff7605b5252b3e77bcbe`).
- Aucun secret, aucun `dist/`, aucun fichier volumineux ajouté.

## 7. Prochaines étapes

1. Signer ou refuser les checklists DSG-04/05/06.
2. Concevoir P03, P05, P07.
3. Produire les vues 768/1280.
4. Fermer les tickets P0.
5. Exécuter les tests clavier et lecteur d’écran.
6. Signer le gel.
7. Implémenter par vagues, sans annoncer l’ensemble comme disponible.

## 8. Commit de référence

```text
docs(design): final a11y and coherence review with MVP design freeze [DSG-07]
```

Le commit ne contient que la documentation. Les corrections de code sont dans les tickets.
