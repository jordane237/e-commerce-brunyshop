# P26 — À propos

> DSG-05 · groupe Information · route `/a-propos`
> Aucun endpoint : contenu éditorial statique.

---

## 1. Objectif & rôle

Présenter BRUNY SHOPPING, sa sélection, sa manière de servir ses clients et ses engagements concrets, sans histoire inventée ni chiffre non vérifiable. La page installe la confiance et renvoie vers le catalogue et le contact.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › À propos ».
2. **Hero éditorial** : visuel chaussures, `h1` « La bonne paire, au bon moment. », chapô.
3. **Notre histoire** : 2 paragraphes courts, sans date inventée.
4. **Ce que nous choisissons** : 3 cartes (sélection, tailles, service).
5. **Comment nous travaillons** : 3 étapes (choisir, confirmer, livrer).
6. **Nos engagements** : 4 puces concrètes (prix affichés, stock réel, confirmation avant expédition, service client).
7. **Citation / signature** de la fondatrice (sans nom si non fourni).
8. CTA « Découvrir la boutique » + « Nous contacter ».
9. Footer.

### 768 px

- Hero 16:9, texte en dessous.
- Cartes en 3 colonnes.

### 1280 px

- Hero 2 colonnes (texte / image), contenu 900 px.
- Alternance de blocs texte et cartes.

```text
┌──────────────────────────────────────────────────────────────┐
│ À propos                                                     │
│ ┌───────────────────────┬──────────────────────────────────┐ │
│ │ La bonne paire,       │                                  │ │
│ │ au bon moment.        │        [visuel chaussures]       │ │
│ │ Chapô…                │                                  │ │
│ └───────────────────────┴──────────────────────────────────┘ │
│ Notre histoire          Ce que nous choisissons              │
│ …                       [Sélection] [Tailles] [Service]      │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Button` | TEC-10 | primary, ghost | — |
| `Breadcrumb` | NOUVEAU | — | — |
| `Icon` | TEC-10 | décoratif | — |
| `Image` | natif | lazy, ratio | — |

---

## 4. États obligatoires

- **Chargement** : sans objet ; image hero avec `width`/`height` pour éviter le décalage.
- **Vide** : contenu éditorial complet, aucun état vide.
- **Erreur** : image indisponible → fond sable + texte alternatif ; page reste lisible.
- **Succès** : rendu statique.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Image hero absente | Aucun message ; bloc coloré de remplacement |
| Contenu introuvable | Page 404 (P27b) |
| Lien contact indisponible | Lien mailto de secours |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | La bonne paire, au bon moment. | inspirant | `h1` |
| Chapô | BRUNY SHOPPING sélectionne des chaussures pour le quotidien, à Douala et partout au Cameroun, avec un service simple : de vraies tailles, des prix clairs et un humain au bout du fil. | chaleureux | — |
| Histoire titre | Notre histoire | neutre | `h2` |
| Histoire p1 | BRUNY SHOPPING est né d'un constat simple : trouver la bonne pointure, au bon prix, sans mauvaise surprise, reste compliqué. Nous avons construit une sélection resserrée, vérifiée article par article. | chaleureux | — |
| Histoire p2 | Nous privilégions les modèles que l'on porte vraiment : des basiques solides, des pièces qui durent, des tailles disponibles. Pas de catalogue infini, pas de promesse intenable. | clair | — |
| Sélection titre | Ce que nous choisissons | neutre | `h2` |
| Sélection 1 | Une sélection courte | neutre | — |
| Sélection 1 corps | Chaque modèle est choisi pour sa qualité, son confort et sa durée de vie. | clair | — |
| Sélection 2 | Des tailles réelles | neutre | — |
| Sélection 2 corps | Les pointures affichées correspondent au stock disponible, mis à jour à chaque commande. | clair | — |
| Sélection 3 | Un service joignable | neutre | — |
| Sélection 3 corps | Une question avant ou après l'achat ? Nous répondons par e-mail et WhatsApp. | rassurant | — |
| Travail titre | Comment nous travaillons | neutre | `h2` |
| Travail 1 | Nous choisissons | neutre | — |
| Travail 1 corps | Une sélection resserrée, testée et vérifiée. | clair | — |
| Travail 2 | Nous confirmons | neutre | — |
| Travail 2 corps | Chaque commande est confirmée avec vous avant expédition. | clair | — |
| Travail 3 | Nous livrons | neutre | — |
| Travail 3 corps | Vous payez à la réception, après vérification de votre colis. | clair | — |
| Engagements titre | Nos engagements | neutre | `h2` |
| Engagement 1 | Des prix affichés en FCFA, sans frais cachés. | clair | — |
| Engagement 2 | Un stock réel, jamais survendu. | clair | — |
| Engagement 3 | Une confirmation avant chaque expédition. | clair | — |
| Engagement 4 | Un retour possible sous 7 jours. | clair | lien P25 |
| Signature | « Nous préférons une paire bien choisie à dix paires oubliées. » | inspirant | — |
| Signature auteur | L'équipe BRUNY SHOPPING | neutre | — |
| CTA boutique | Découvrir la boutique | action | — |
| CTA contact | Nous contacter | action | — |

---

## 6. Interactions & comportements

- Liens CTA vers `/boutique` et `/contact`.
- Aucun carrousel automatique.
- Images en `loading="lazy"` sauf hero.
- Aucune newsletter intégrée à cette page.
- Aucun chiffre d'années d'existence, de clients ou de paires vendues sans donnée vérifiée.
- Signature sans nom propre tant que la fondatrice n'est pas nommée publiquement.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, hiérarchie `h2`/`h3` cohérente.
- Texte sur image : contraste vérifié, sinon bloc texte séparé.
- Images : `alt` descriptif, décoratives `alt=""`.
- Aucune information portée par la seule couleur.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : hero en colonne, pas de texte tronqué.
- Texte justifié interdit, interlignage ≥ 1,5.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Contenu | statique | — |
| Image | fichier local | Bloc coloré |

Aucun appel réseau.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune page à propos dans la planche | Conçue |
| Histoire de la marque non fournie | Rédigée sans date ni fait inventé |
| Nom de la fondatrice absent | Signature d'équipe |
| Chiffres de confiance | Aucun chiffre non vérifié |
| Image dédiée | À fournir par la marque |

---

## 10. Wireframe de référence

Aucun fichier dédié ; ton et visuels de la planche.
