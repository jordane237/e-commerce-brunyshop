# DSG-03 — Boutique P01 à P07

**Statut** : dossier de traçabilité créé par DSG-07. Les specs d’écran **n’existent pas** dans ce dossier.
**Source** : [`../../design-1/ANALYSE-MAQUETTES.md`](../../design-1/ANALYSE-MAQUETTES.md) et planche `design1/bruny shopping/bruny shopping.png`.
**Revue** : [`../DSG-07/AUDIT-ACCESSIBILITE.md`](../DSG-07/AUDIT-ACCESSIBILITE.md).

## 1. Pourquoi ce dossier existe

Le dossier `docs/design/DSG-03/` était absent, alors que l’analyse déclarait P01–P07 « validées ». Cette affirmation n’était pas traçable. Ce README comble le vide de documentation sans inventer de specs.

## 2. Couverture réelle

| Écran | Nom | Maquette | Spec | Statut |
|---|---|---|---|---|
| P01 | Accueil | Zone E, mobile | Analyse seulement | Partiel |
| P02 | Catalogue | Zone F, mobile | Analyse seulement | Partiel |
| P03 | Recherche | Aucune | Aucune | **Absent** |
| P04 | Fiche produit | Zone G, mobile | Analyse seulement | Partiel |
| P05 | Guide des pointures | Aucune | Aucune | **Absent** |
| P06 | Panier | Zone H, mobile | Analyse seulement | Partiel |
| P07 | Mini-panier | Aucune | Aucune | **Absent** |

- 4 écrans sur 7 ont une maquette mobile partielle.
- 3 écrans n’ont aucune source.
- Aucune vue 768 px ou 1280 px.
- Aucun état de chargement, vide, erreur ou focus n’est dessiné.

## 3. Décisions applicables

- La bottom-nav est présente sur le storefront hors tunnel, y compris P01 et P02 ; elle est absente du checkout, de l’authentification et des pages légales.
- P03, P05 et P07 sont **non auditables visuellement** : ils doivent être conçus avant implémentation (tickets DSG-07-FIX-34, 35, 36).
- Les microtextes suivent le glossaire DSG-07.
- Les contrastes suivent `docs/design-system/ACCESSIBILITY.md`.
- Le tarif Yaoundé est de **3 000 FCFA**, comme DSG-04/05 et le seed.

## 4. Ce qui n’est pas validé

- La conformité WCAG des écrans P01–P07.
- Les vues desktop et tablette.
- Les états de stock, panier vide, erreur réseau et focus.
- Les specs P03, P05, P07.
- La signature PO.

## 5. Suite

1. Concevoir P03, P05, P07 avec les mêmes gabarits que DSG-04/05.
2. Produire les wireframes 768/1280.
3. Ajouter les états manquants.
4. Faire relire par DSG-07 avant toute implémentation.
