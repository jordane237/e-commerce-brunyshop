# Audit d’accessibilité WCAG 2.1 AA — DSG-07

**Date** : 11 novembre 2026
**Périmètre** : 58 vues (P01–P27 et sous-vues, A01–A16) + 16 composants `@bruny/ui`.
**Référentiel** : WCAG 2.1 niveau AA.
**Sources** : planche `design1/bruny shopping/bruny shopping.png`, specs DSG-04 à DSG-06, tokens DSG-02, code des composants.

## 1. Méthode et statuts

L’audit porte sur la **preuve disponible** : maquette quand elle existe, spec textuelle sinon. Un statut ✅ signifie que la source prescrit une solution conforme, pas que l’implémentation runtime est déjà prouvée.

| Statut | Signification |
|---|---|
| ✅ | Conforme dans la source auditée |
| ⚠️ | Partiel, non démontré ou dépendant de l’implémentation |
| ❌ | Non conforme ou source absente |
| 🔧 | Règle corrigée dans cette revue, maquette ou code à aligner |
| 📋 | Correction ticketée post-gel |

Les fiches P01–P07 sans spec sont marquées comme telles. P03, P05 et P07 n’ont ni maquette ni spec : leurs 19 critères sont non auditables et doivent être conçus.

## 2. Design System et composants

Le Design System est audité comme un ensemble de composants, avec une fiche par composant. Les défauts de composant sont **transverses** : ils contaminent plusieurs écrans même lorsque la spec est bonne.


### Button
Source : `frontend/libs/ui/src/lib/button/button.component.ts` — Variantes primary, secondary, ghost, danger, whatsapp ; tailles sm/md/lg ; loading, disabled, iconOnly.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Bordure secondaire or 2,56:1 et bordure ghost 1,32:1 sous 3:1. | Utiliser une bordure de contrôle ≥3:1 ou un fond qui identifie le bouton. | DSG-07-FIX-C01 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ⚠️ | `ariaLabel` est optionnel ; un bouton icône sans label est possible. | Rendre le label obligatoire quand `iconOnly` est vrai. | DSG-07-FIX-C02 |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Input
Source : `frontend/libs/ui/src/lib/input/input.component.ts` — Label, hint, error, prefix, icon, password reveal, loading.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Bordure de champ `#DCE0E7` à 1,32:1. | Passer la bordure de contrôle à `#6B7280` (4,83:1). | DSG-07-FIX-C03 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Select
Source : `frontend/libs/ui/src/lib/select/select.component.ts` — Select natif, placeholder, hint, error, loading.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Même bordure de champ à 1,32:1. | Aligner sur la correction Input. | DSG-07-FIX-C03 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Checkbox
Source : `frontend/libs/ui/src/lib/checkbox/checkbox.component.ts` — Coché, indéterminé, hint, error.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Case 20 px avec bordure 1,32:1. | Épaissir/assombrir la bordure et conserver le focus. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ❌ | `aria-describedby` pointe vers `${id}-error` mais le message n’a pas d’`id`. | Ajouter l’`id` au message et tester le lien. | DSG-07-FIX-C04 |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Le message d’erreur n’est pas exposé par `aria-describedby`. | Corriger le template et ajouter un test a11y. | DSG-07-FIX-C04 |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Radio
Source : `frontend/libs/ui/src/lib/radio/radio.component.ts` — Radio natif, hint, error.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ❌ | Même `aria-describedby` cassé que Checkbox. | Ajouter l’`id` du message. | DSG-07-FIX-C04 |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Erreur non reliée au radio. | Corriger le template. | DSG-07-FIX-C04 |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Toggle
Source : `frontend/libs/ui/src/lib/toggle/toggle.component.ts` — Switch, hint, error, loading.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ⚠️ | Piste `#C3C7D0` sur blanc sous 3:1 à vérifier. | Renforcer la piste et l’état coché. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ❌ | `aria-describedby` cassé comme Checkbox/Radio. | Ajouter l’`id` du message. | DSG-07-FIX-C04 |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Message d’erreur non relié au switch. | Corriger le template. | DSG-07-FIX-C04 |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Badge
Source : `frontend/libs/ui/src/lib/badge/badge.component.ts` — 9 variantes sémantiques ; point décoratif.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ⚠️ | Badge outline avec bordure 1,32:1. | Renforcer la bordure ou le fond. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Le point est `aria-hidden`, le texte porte le statut. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### ProductCard
Source : `frontend/libs/ui/src/lib/product-card/product-card.component.ts` — Image, badges, favori, prix, pointures, ajout.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ⚠️ | Deux liens vers le même produit (image + titre) et un CTA « Ajouter » générique. | Garder un lien principal et nommer l’action avec le produit. | DSG-07-FIX-C06 |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ⚠️ | « Ajouter » ne précise pas le produit. | Utiliser « Ajouter {produit} au panier » ou un nom accessible. | DSG-07-FIX-C06 |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### PriceTag
Source : `frontend/libs/ui/src/lib/price-tag/price-tag.component.ts` — Prix courant et prix barré.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ⚠️ | Le prix barré `<s>` n’a pas de libellé « prix initial ». | Ajouter un libellé SR-only. | DSG-07-FIX-C07 |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Texte principal et secondaire conformes. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### SizeSelector
Source : `frontend/libs/ui/src/lib/size-selector/size-selector.component.ts` — Sélection, rupture, stock faible, voir plus.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ⚠️ | Bordure des tailles 1,32:1. | Renforcer la bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ❌ | Une taille épuisée est nommée « Taille X » sans « indisponible ». | Ajouter l’état au nom accessible. | DSG-07-FIX-C08 |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Bouton libellé « Sélectionner la pointure » sans valeur ni `aria-controls`. | Nommer avec la pointure sélectionnée et relier la liste. | DSG-07-FIX-C08 |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Modal
Source : `frontend/libs/ui/src/lib/modal/modal.component.ts` — sm/md/lg, focus trap, Échap, backdrop.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Focus trap, Échap et restitution implémentés. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | `role=dialog`, `aria-modal`, `aria-labelledby`. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

### Toast
Source : `frontend/libs/ui/src/lib/toast/toast.component.ts` — success/error/warning/info, fermeture, durée.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ⚠️ | Fermeture automatique sans pause ni contrôle utilisateur. | Proposer une durée annulable ou ne pas fermer automatiquement. | DSG-07-FIX-C09 |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | `role=alert/status` et `aria-live` corrects. | Aucune. |  |

### Skeleton
Source : `frontend/libs/ui/src/lib/skeleton/skeleton.component.ts` — Rect, text, circle.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Masqué aux lecteurs d’écran. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ⚠️ | Le skeleton seul n’annonce pas le chargement. | Le conteneur doit porter `aria-busy` et un texte de statut. | DSG-07-FIX-C10 |

### Spinner
Source : `frontend/libs/ui/src/lib/spinner/spinner.component.ts` — sm/md/lg, label.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Le cercle est `aria-hidden` et le label est textuel. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | `role=status` et libellé « Chargement en cours ». | Aucune. |  |

### Table
Source : `frontend/libs/ui/src/lib/table/table.component.ts` — Colonnes, tri, actions, pagination, cartes mobiles.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | `table`, `caption` optionnel et `th scope=col`. | Rendre la caption obligatoire pour les tableaux de données. | DSG-07-FIX-C11 |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Bordure du tableau 1,21:1. | Renforcer la bordure ou la séparation. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Boutons d’action sans nom de ligne (« Modifier » répété). | Ajouter le libellé de ligne au nom accessible. | DSG-07-FIX-C11 |
| 4.1.3 Messages de statut (aria-live) | ⚠️ | Chargement non annoncé au niveau du tableau. | Ajouter un statut `aria-live` pendant le chargement. | DSG-07-FIX-C11 |

### Icon
Source : `frontend/libs/ui/src/lib/icon/icon.component.ts` — SVG stroke, label optionnel.

| Critère | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | `aria-hidden` par défaut, `role=img` et label si fourni. | Aucune. |  |
| 1.3.1 Information et relations (structure) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.1 Clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | Nom accessible possible via `label`. | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | Conforme dans le composant ou sans objet. | Aucune. |  |

## 3. Fiches par écran

Chaque fiche suit les 19 critères du ticket. Les points spécifiques sont listés avant le tableau pour conserver la trace de la preuve.


### P01 — Accueil

**Source** : Zone E + analyse DSG-03

**Type de preuve** : maquette mobile

- Aucun état de focus, de chargement, vide ou erreur n’est dessiné.
- Micro-titres dorés à 2,45:1 et CTA WhatsApp blanc à 1,98:1 : échec AA.
- Noms tronqués et CTA « Ajouter » sans contexte accessible.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ⚠️ | Aucune annotation d’alt dans le PNG ; icônes et photos sont aplaties. | Documenter alt/aria-hidden ; ticket maquette. | DSG-07-FIX-37 |
| 1.3.1 Information et relations (structure) | ⚠️ | Structure déductible de la capture, non annotée (landmarks, titres, listes). | Ajouter la structure sémantique dans la spec. | DSG-07-FIX-37 |
| 1.3.2 Ordre logique | ⚠️ | Ordre de lecture visuel seulement, non validé au lecteur d’écran. | Documenter l’ordre DOM. | DSG-07-FIX-37 |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ⚠️ | Certains états (favori, sélection, stock) s’appuient sur la couleur, avec des libellés textuels incomplets. | Doubler chaque couleur par un texte/icône et documenter l’état sélectionné. | DSG-07-FIX-37 |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ❌ | Combinaisons de la planche : or 2,45:1, blanc/WhatsApp 1,98:1, succès 4,14:1, warning 3,27:1. | Remplacer par `accent-text`, `whatsapp-strong`, `success-strong`, `warning-strong`. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ⚠️ | Le zoom 200 % n’est pas démontré dans le PNG. | Tester la composition à 200 % et 320 px. | DSG-07-FIX-37 |
| 1.4.11 Contraste non textuel (3:1) | ⚠️ | Contours et séparateurs non mesurables sur la capture. | Mesurer les états et focus. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ⚠️ | Navigation clavier non démontrée ; seuls les éléments visibles sont connus. | Décrire l’ordre et les touches. | DSG-07-FIX-37 |
| 2.1.2 Pas de piège au clavier | ⚠️ | Présence de tiroirs/overlays sans focus trap documenté. | Spécifier le piège et Échap. | DSG-07-FIX-37 |
| 2.4.3 Ordre de tabulation | ⚠️ | Ordre de tabulation non annoté. | Documenter l’ordre. | DSG-07-FIX-37 |
| 2.4.7 Visibilité du focus | ❌ | Aucun état de focus n’est dessiné dans la planche. | Afficher le double anneau navy et le tester sur tous les fonds. | DSG-07-FIX-37 |
| 2.5.5 Taille de la cible (44 × 44 px) | ⚠️ | Cibles proches de 44 px mais non mesurables avec certitude. | Mesurer les icônes, puces et steppers. | DSG-07-FIX-37 |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ⚠️ | Rôles et noms ARIA non annotés dans le PNG. | Documenter rôles, noms et états. | DSG-07-FIX-37 |
| 4.1.3 Messages de statut (aria-live) | ❌ | Aucune zone de statut ou d’alerte visible ; pas d’`aria-live` documenté. | Ajouter `role=status`/`alert` et annoncer les mises à jour. | DSG-07-FIX-37 |

### P02 — Catalogue

**Source** : Zone F + analyse DSG-03

**Type de preuve** : maquette mobile

- CTA « Commander » incohérent avec « Ajouter au panier ».
- Aucun état 0 résultat, chargement, erreur ou pagination en échec.
- Titres de cartes tronqués, filtres actifs non détaillés.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ⚠️ | Aucune annotation d’alt dans le PNG ; icônes et photos sont aplaties. | Documenter alt/aria-hidden ; ticket maquette. | DSG-07-FIX-37 |
| 1.3.1 Information et relations (structure) | ⚠️ | Structure déductible de la capture, non annotée (landmarks, titres, listes). | Ajouter la structure sémantique dans la spec. | DSG-07-FIX-37 |
| 1.3.2 Ordre logique | ⚠️ | Ordre de lecture visuel seulement, non validé au lecteur d’écran. | Documenter l’ordre DOM. | DSG-07-FIX-37 |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ⚠️ | Certains états (favori, sélection, stock) s’appuient sur la couleur, avec des libellés textuels incomplets. | Doubler chaque couleur par un texte/icône et documenter l’état sélectionné. | DSG-07-FIX-37 |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ❌ | Combinaisons de la planche : or 2,45:1, blanc/WhatsApp 1,98:1, succès 4,14:1, warning 3,27:1. | Remplacer par `accent-text`, `whatsapp-strong`, `success-strong`, `warning-strong`. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ⚠️ | Le zoom 200 % n’est pas démontré dans le PNG. | Tester la composition à 200 % et 320 px. | DSG-07-FIX-37 |
| 1.4.11 Contraste non textuel (3:1) | ⚠️ | Contours et séparateurs non mesurables sur la capture. | Mesurer les états et focus. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ⚠️ | Navigation clavier non démontrée ; seuls les éléments visibles sont connus. | Décrire l’ordre et les touches. | DSG-07-FIX-37 |
| 2.1.2 Pas de piège au clavier | ⚠️ | Présence de tiroirs/overlays sans focus trap documenté. | Spécifier le piège et Échap. | DSG-07-FIX-37 |
| 2.4.3 Ordre de tabulation | ⚠️ | Ordre de tabulation non annoté. | Documenter l’ordre. | DSG-07-FIX-37 |
| 2.4.7 Visibilité du focus | ❌ | Aucun état de focus n’est dessiné dans la planche. | Afficher le double anneau navy et le tester sur tous les fonds. | DSG-07-FIX-37 |
| 2.5.5 Taille de la cible (44 × 44 px) | ⚠️ | Cibles proches de 44 px mais non mesurables avec certitude. | Mesurer les icônes, puces et steppers. | DSG-07-FIX-37 |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ⚠️ | Rôles et noms ARIA non annotés dans le PNG. | Documenter rôles, noms et états. | DSG-07-FIX-37 |
| 4.1.3 Messages de statut (aria-live) | ❌ | Aucune zone de statut ou d’alerte visible ; pas d’`aria-live` documenté. | Ajouter `role=status`/`alert` et annoncer les mises à jour. | DSG-07-FIX-37 |

### P03 — Recherche

**Source** : Aucune

**Type de preuve** : aucune source

- Aucune maquette ni spec : champ, suggestions, historique et états absents.
- Les liens d’entrée existent dans P01/P02/P04 mais la page n’est pas conçue.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 1.3.1 Information et relations (structure) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 1.3.2 Ordre logique | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 1.3.5 Identifier la finalité du champ | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 1.4.1 Utilisation de la couleur | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 1.4.4 Redimensionnement du texte (200 %) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 2.1.1 Clavier | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 2.1.2 Pas de piège au clavier | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 2.4.3 Ordre de tabulation | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 2.4.7 Visibilité du focus | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 2.5.5 Taille de la cible (44 × 44 px) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 3.2.1 Au focus | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 3.3.1 Identification des erreurs | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 3.3.2 Étiquettes et instructions | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 3.3.3 Suggestion après erreur | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |
| 4.1.3 Messages de statut (aria-live) | ❌ | Aucune maquette ni spec pour Recherche. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-34 |

### P04 — Fiche produit

**Source** : Zone G + analyse DSG-03

**Type de preuve** : maquette mobile

- Focus absent, pastilles de pointure proches de 44 px.
- Barre d’achat et bottom-nav superposées : risque d’occultation.
- CTA WhatsApp blanc sur vert vif à 1,98:1.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ⚠️ | Aucune annotation d’alt dans le PNG ; icônes et photos sont aplaties. | Documenter alt/aria-hidden ; ticket maquette. | DSG-07-FIX-37 |
| 1.3.1 Information et relations (structure) | ⚠️ | Structure déductible de la capture, non annotée (landmarks, titres, listes). | Ajouter la structure sémantique dans la spec. | DSG-07-FIX-37 |
| 1.3.2 Ordre logique | ⚠️ | Ordre de lecture visuel seulement, non validé au lecteur d’écran. | Documenter l’ordre DOM. | DSG-07-FIX-37 |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ⚠️ | Certains états (favori, sélection, stock) s’appuient sur la couleur, avec des libellés textuels incomplets. | Doubler chaque couleur par un texte/icône et documenter l’état sélectionné. | DSG-07-FIX-37 |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ❌ | Combinaisons de la planche : or 2,45:1, blanc/WhatsApp 1,98:1, succès 4,14:1, warning 3,27:1. | Remplacer par `accent-text`, `whatsapp-strong`, `success-strong`, `warning-strong`. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ⚠️ | Le zoom 200 % n’est pas démontré dans le PNG. | Tester la composition à 200 % et 320 px. | DSG-07-FIX-37 |
| 1.4.11 Contraste non textuel (3:1) | ⚠️ | Contours et séparateurs non mesurables sur la capture. | Mesurer les états et focus. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ⚠️ | Navigation clavier non démontrée ; seuls les éléments visibles sont connus. | Décrire l’ordre et les touches. | DSG-07-FIX-37 |
| 2.1.2 Pas de piège au clavier | ⚠️ | Présence de tiroirs/overlays sans focus trap documenté. | Spécifier le piège et Échap. | DSG-07-FIX-37 |
| 2.4.3 Ordre de tabulation | ⚠️ | Ordre de tabulation non annoté. | Documenter l’ordre. | DSG-07-FIX-37 |
| 2.4.7 Visibilité du focus | ❌ | Aucun état de focus n’est dessiné dans la planche. | Afficher le double anneau navy et le tester sur tous les fonds. | DSG-07-FIX-37 |
| 2.5.5 Taille de la cible (44 × 44 px) | ⚠️ | Cibles proches de 44 px mais non mesurables avec certitude. | Mesurer les icônes, puces et steppers. | DSG-07-FIX-37 |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ⚠️ | Rôles et noms ARIA non annotés dans le PNG. | Documenter rôles, noms et états. | DSG-07-FIX-37 |
| 4.1.3 Messages de statut (aria-live) | ❌ | Aucune zone de statut ou d’alerte visible ; pas d’`aria-live` documenté. | Ajouter `role=status`/`alert` et annoncer les mises à jour. | DSG-07-FIX-37 |

### P05 — Guide des pointures

**Source** : Aucune

**Type de preuve** : aucune source

- Aucune maquette ni spec ; tableau, demi-pointures et conseils non conçus.
- Le besoin est prouvé par les liens de P04, du footer et de l’espace client.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 1.3.1 Information et relations (structure) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 1.3.2 Ordre logique | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 1.3.5 Identifier la finalité du champ | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 1.4.1 Utilisation de la couleur | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 1.4.4 Redimensionnement du texte (200 %) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 2.1.1 Clavier | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 2.1.2 Pas de piège au clavier | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 2.4.3 Ordre de tabulation | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 2.4.7 Visibilité du focus | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 2.5.5 Taille de la cible (44 × 44 px) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 3.2.1 Au focus | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 3.3.1 Identification des erreurs | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 3.3.2 Étiquettes et instructions | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 3.3.3 Suggestion après erreur | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |
| 4.1.3 Messages de statut (aria-live) | ❌ | Aucune maquette ni spec pour Guide des pointures. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-35 |

### P06 — Panier

**Source** : Zone H + analyse DSG-03

**Type de preuve** : maquette mobile

- Stepper de quantité, suppression et code promo sans preuve de cible 44 px.
- Aucun panier vide, code invalide, échec de quantité ou livraison indisponible.
- Bandeau de succès et CTA WhatsApp à contrôler en contraste.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ⚠️ | Aucune annotation d’alt dans le PNG ; icônes et photos sont aplaties. | Documenter alt/aria-hidden ; ticket maquette. | DSG-07-FIX-37 |
| 1.3.1 Information et relations (structure) | ⚠️ | Structure déductible de la capture, non annotée (landmarks, titres, listes). | Ajouter la structure sémantique dans la spec. | DSG-07-FIX-37 |
| 1.3.2 Ordre logique | ⚠️ | Ordre de lecture visuel seulement, non validé au lecteur d’écran. | Documenter l’ordre DOM. | DSG-07-FIX-37 |
| 1.3.5 Identifier la finalité du champ | ✅ | La planche mobile prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ⚠️ | Certains états (favori, sélection, stock) s’appuient sur la couleur, avec des libellés textuels incomplets. | Doubler chaque couleur par un texte/icône et documenter l’état sélectionné. | DSG-07-FIX-37 |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ❌ | Combinaisons de la planche : or 2,45:1, blanc/WhatsApp 1,98:1, succès 4,14:1, warning 3,27:1. | Remplacer par `accent-text`, `whatsapp-strong`, `success-strong`, `warning-strong`. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ⚠️ | Le zoom 200 % n’est pas démontré dans le PNG. | Tester la composition à 200 % et 320 px. | DSG-07-FIX-37 |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ⚠️ | Navigation clavier non démontrée ; seuls les éléments visibles sont connus. | Décrire l’ordre et les touches. | DSG-07-FIX-37 |
| 2.1.2 Pas de piège au clavier | ⚠️ | Présence de tiroirs/overlays sans focus trap documenté. | Spécifier le piège et Échap. | DSG-07-FIX-37 |
| 2.4.3 Ordre de tabulation | ⚠️ | Ordre de tabulation non annoté. | Documenter l’ordre. | DSG-07-FIX-37 |
| 2.4.7 Visibilité du focus | ❌ | Aucun état de focus n’est dessiné dans la planche. | Afficher le double anneau navy et le tester sur tous les fonds. | DSG-07-FIX-37 |
| 2.5.5 Taille de la cible (44 × 44 px) | ⚠️ | Cibles proches de 44 px mais non mesurables avec certitude. | Mesurer les icônes, puces et steppers. | DSG-07-FIX-37 |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La planche mobile prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La planche mobile prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La planche mobile impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ⚠️ | Rôles et noms ARIA non annotés dans le PNG. | Documenter rôles, noms et états. | DSG-07-FIX-37 |
| 4.1.3 Messages de statut (aria-live) | ❌ | Aucune zone de statut ou d’alerte visible ; pas d’`aria-live` documenté. | Ajouter `role=status`/`alert` et annoncer les mises à jour. | DSG-07-FIX-37 |

### P07 — Mini-panier

**Source** : Aucune

**Type de preuve** : aucune source

- Aucune maquette ni spec : tiroir, focus trap, état vide et retour d’ajout absents.
- Aucun feedback d’ajout au panier n’est dessiné dans la planche.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 1.3.1 Information et relations (structure) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 1.3.2 Ordre logique | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 1.3.5 Identifier la finalité du champ | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 1.4.1 Utilisation de la couleur | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 1.4.4 Redimensionnement du texte (200 %) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 1.4.11 Contraste non textuel (3:1) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 2.1.1 Clavier | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 2.1.2 Pas de piège au clavier | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 2.4.3 Ordre de tabulation | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 2.4.7 Visibilité du focus | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 2.5.5 Taille de la cible (44 × 44 px) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 3.2.1 Au focus | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 3.3.1 Identification des erreurs | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 3.3.2 Étiquettes et instructions | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 3.3.3 Suggestion après erreur | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 4.1.2 Nom, rôle, valeur (ARIA) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |
| 4.1.3 Messages de statut (aria-live) | ❌ | Aucune maquette ni spec pour Mini-panier. | Concevoir l’écran et reprendre l’audit avant implémentation. | DSG-07-FIX-36 |

### P08 — Démarrage du checkout

**Source** : Zone C + spec P08

**Type de preuve** : maquette groupée + spec

- Spec robuste : h1, aside récapitulatif, stepper sans étape active.
- La zone C n’isole pas P08 ; aucun focus n’est dessiné.
- Le CTA et les montants doivent rester lisibles à 200 %.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : stepper → formulaire → aide/erreur → récapitulatif → CTA sticky. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P09 — Coordonnées

**Source** : Zone C + spec P09

**Type de preuve** : maquette groupée + spec

- Spec : labels liés, `aria-required`, erreurs `role=alert`, autofill.
- Focus non dessiné ; l’étape est incluse dans un composite non isolable.
- Ordre nom → téléphone → case → CTA explicitement documenté.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : stepper → formulaire → aide/erreur → récapitulatif → CTA sticky. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec (maquette groupée) prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec (maquette groupée) prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec (maquette groupée) prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec (maquette groupée) impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P10 — Livraison

**Source** : Zone C + spec P10

**Type de preuve** : maquette groupée + spec

- Spec : fieldsets, selects natifs, total annoncé en `aria-live`.
- Conflit Yaoundé 2 000/3 000 FCFA corrigé dans cette revue.
- Créneaux en RadioCard 52 px, sélection non chromatique.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : stepper → formulaire → aide/erreur → récapitulatif → CTA sticky. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec (maquette groupée) prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec (maquette groupée) prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec (maquette groupée) prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec (maquette groupée) impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P11 — Paiement

**Source** : Zone C + spec P11

**Type de preuve** : maquette groupée + spec

- Spec : RadioCard, CGV obligatoire, Mobile Money désactivé et annoncé.
- Le `tabindex=-1` de la carte désactivée doit être vérifié à l’implémentation.
- Focus et ordre de tabulation documentés, non démontrés visuellement.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : stepper → formulaire → aide/erreur → récapitulatif → CTA sticky. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec (maquette groupée) prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec (maquette groupée) prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec (maquette groupée) prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec (maquette groupée) impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P11b — Attente de paiement (V2)

**Source** : Spec P11b (V2)

**Type de preuve** : spec textuelle

- V2 : compte à rebours annoncé à 60 s, 30 s et expiration.
- Aucune maquette ; focus initial et reprise documentés.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | La spec prescrit les variantes accessibles (`accent-text`, `success-strong`, `whatsapp-strong`). | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P11c — Échec de paiement (V2)

**Source** : Spec P11c (V2)

**Type de preuve** : spec textuelle

- V2 : échec annoncé en `role=alert`, pas seulement par le rouge.
- Aucune maquette ; ordre des actions documenté.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | La spec prescrit les variantes accessibles (`accent-text`, `success-strong`, `whatsapp-strong`). | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P12 — Commande confirmée

**Source** : Zone I + spec P12

**Type de preuve** : maquette groupée + spec

- Spec : ticket en `dl`, copie avec libellé complet, date `<time>`.
- La maquette affiche encore référence `#BS` et « Orange Money actif » ; la spec corrige.
- Contraste du badge de succès à ramener à `success-strong`.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P13 — Suivi public

**Source** : Zone J + spec P13

**Type de preuve** : maquette groupée + spec

- Spec : timeline `ol`, `aria-current`, anti-énumération, données masquées.
- Vert de statut `#1E8E5A` à 3,96:1 sur canvas : texte normal non conforme.
- Boutons coursier et bottom-nav à vérifier à 44 px.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec (maquette groupée) prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec (maquette groupée) prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec (maquette groupée) prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec (maquette groupée) impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P14 — Connexion

**Source** : Spec P14

**Type de preuve** : spec textuelle

- Spec : focus initial identifiant, erreurs liées, statut `aria-live`.
- Aucune maquette : la preuve reste textuelle.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P15 — Inscription

**Source** : Spec P15

**Type de preuve** : spec textuelle

- Spec : tablist, force du mot de passe en texte + couleur, CGV liée.
- Aucune maquette ; ordre et focus documentés.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P16 — Mot de passe oublié

**Source** : Spec P16

**Type de preuve** : spec textuelle

- Spec : e-mail seul, succès neutre, compte à rebours `aria-live=off`.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P16b — Réinitialisation

**Source** : Spec P16b

**Type de preuve** : spec textuelle

- Spec : code 6 chiffres, `one-time-code`, focus sur le titre après succès.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P17 — Tableau de bord compte

**Source** : Zone K + spec P17

**Type de preuve** : maquette groupée + spec

- Spec : navigation compte, tuiles liens, skeleton `aria-busy`.
- La zone K affiche « 2 commandes » avec un historique incomplet ; la spec impose le total API.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P18 — Mes commandes

**Source** : Zone K + spec P18

**Type de preuve** : maquette groupée + spec

- Spec : tableau caption/th, cartes mobiles, filtres `aria-pressed`.
- La maquette ne montre ni vide, ni chargement, ni erreur.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P18b — Détail commande

**Source** : Spec P18b

**Type de preuve** : spec textuelle

- Spec : timeline `ol`, montants `dl`, bouton désactivé expliqué.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | La spec prescrit les variantes accessibles (`accent-text`, `success-strong`, `whatsapp-strong`). | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P19 — Mon profil

**Source** : Zone K + spec P19

**Type de preuve** : maquette groupée + spec

- Spec : autocomplete, section mot de passe `aria-expanded`, toast.
- La zone K ne montre pas les états d’édition ou d’erreur.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec (maquette groupée) prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec (maquette groupée) prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec (maquette groupée) prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec (maquette groupée) impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P19b — Suppression de compte

**Source** : Spec P19b

**Type de preuve** : spec textuelle

- Spec : `alertdialog`, focus initial « Annuler », saisie `SUPPRIMER`.
- Point fort du dispositif ; à ne pas dégrader à l’implémentation.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | La spec prescrit les variantes accessibles (`accent-text`, `success-strong`, `whatsapp-strong`). | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P20 — Mes adresses

**Source** : Zone K + spec P20

**Type de preuve** : maquette groupée + spec

- Spec : liste, badge « Par défaut » textuel, actions nommées.
- La zone K ne montre pas la liste complète ni les dialogues.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P20b — Édition d’adresse

**Source** : Spec P20b

**Type de preuve** : spec textuelle

- Spec : fieldset type d’adresse, autocomplete, toggle `role=switch`.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P21 — Mes favoris

**Source** : Spec P21

**Type de preuve** : spec textuelle

- Spec : liens et boutons non imbriqués, cœur `aria-pressed`.
- Aucune maquette ; état vide à produire.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | La spec prescrit les variantes accessibles (`accent-text`, `success-strong`, `whatsapp-strong`). | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P22 — Contact

**Source** : Spec P22

**Type de preuve** : spec textuelle

- Spec : labels, select sujet, focus sur le premier champ en erreur.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P23 — FAQ

**Source** : Spec P23

**Type de preuve** : spec textuelle

- Spec : accordéon `aria-expanded`/`controls`, recherche annoncée.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P24 — Livraison

**Source** : Spec P24

**Type de preuve** : spec textuelle

- Spec : tableau caption/th, cartes mobiles, tarif Yaoundé 3 000.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P25 — Retours et échanges

**Source** : Spec P25

**Type de preuve** : spec textuelle

- Spec : listes textuelles, icônes décoratives masquées.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P26 — À propos

**Source** : Spec P26

**Type de preuve** : spec textuelle

- Spec : alt des images, contraste du texte sur image, zoom 200 %.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P27 — Pages légales

**Source** : Spec P27

**Type de preuve** : spec textuelle

- Spec : sommaire `nav`, hiérarchie stricte, tableaux captionés.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P27b — Erreur 404

**Source** : Spec P27b

**Type de preuve** : spec textuelle

- Spec : code 404 décoratif masqué, focus sur le titre ou le CTA.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P27c — Erreur 500

**Source** : Spec P27c

**Type de preuve** : spec textuelle

- Spec : focus titre, `role=alert` sur l’échec de nouvelle tentative.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P27d — Hors ligne

**Source** : Spec P27d

**Type de preuve** : spec textuelle

- Spec : bandeau `role=status` sans vol de focus.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### P27e — Maintenance

**Source** : Spec P27e

**Type de preuve** : spec textuelle

- Spec : structure simple, horaire `<time>`, focus titre → CTA.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : navigation compte → titre → contenu principal → actions → aide. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A01 — Connexion admin

**Source** : Spec A01

**Type de preuve** : spec textuelle

- Spec : ordre identifiant → mot de passe → œil → CTA → lien.
- Erreur globale `role=alert` assertive, champ lié. Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A02 — Vérification 2FA

**Source** : Spec A02

**Type de preuve** : spec textuelle

- Spec : groupe de cellules, collage, QR alternatif, codes de secours.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A03 — Dashboard

**Source** : Zone L + spec A03

**Type de preuve** : maquette groupée + spec

- Spec : KPI en `dl`, variations en texte, résumé du graphique.
- La zone L contient des chiffres, hubs et flottes non modélisés.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A04 — Liste des produits

**Source** : Spec A04

**Type de preuve** : spec textuelle

- Spec : table native, select all indéterminé, CardList mobile.
- Actions de ligne sans contexte de ligne dans le composant Table.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A05 — Créer / modifier un produit

**Source** : Spec A05

**Type de preuve** : spec textuelle

- Spec : tabs, fieldsets, upload clavier, dialogue d’abandon.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A05b — Générateur de variantes

**Source** : Spec A05b + prototype HTML

**Type de preuve** : spec textuelle

- Spec : table `th scope=row`, labels couleur+pointure, 48 px mobile.
- Le prototype HTML n’est pas une maquette validée et ne prouve pas le rendu final.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A06 — Gestion du stock

**Source** : Zone L + spec A06

**Type de preuve** : maquette groupée + spec

- Spec : modale focus trap, nouveau stock annoncé, historique nommé.
- La zone L ne montre pas la table ni l’ajustement.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec (maquette groupée) prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec (maquette groupée) prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec (maquette groupée) prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec (maquette groupée) impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A07 — Liste des commandes

**Source** : Spec A07

**Type de preuve** : spec textuelle

- Spec : table, statuts textuels, dialogue d’annulation.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A08 — Détail commande

**Source** : Spec A08

**Type de preuve** : spec textuelle

- Spec : h1 référence, timeline `ol`, motif obligatoire, annonces live.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A09 — Liste des livraisons

**Source** : Zone L + spec A09

**Type de preuve** : maquette groupée + spec

- Spec : table, assignation avec focus piégé, charge des livreurs.
- La zone L ne montre pas la table desktop.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A09b — Mes livraisons du jour

**Source** : Zone L + spec A09b

**Type de preuve** : maquette groupée + spec

- Spec : 48 px, contraste extérieur, hors ligne, ordre de tournée.
- La zone L ne montre pas l’état hors ligne ni la file d’attente.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec (maquette groupée) impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec (maquette groupée) fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec (maquette groupée) impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | 🔧 | La spec corrige les tokens, mais la zone visuelle groupée conserve les anciennes couleurs. | Appliquer `accent-text`, `whatsapp-strong`, `success-strong` ; ticket maquette. | DSG-07-FIX-02 |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec (maquette groupée) exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | ✅ | Pas de composant de contrôle dont la bordure porte l’information. | Aucune. |  |
| 2.1.1 Clavier | ✅ | La spec (maquette groupée) décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec (maquette groupée) décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec (maquette groupée) impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 48 × 48 px et 12 px d’espacement pour la vue livreur. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec (maquette groupée) nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec (maquette groupée) prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A09c — Détail livraison

**Source** : Spec A09c

**Type de preuve** : spec textuelle

- Spec : timeline, 48 px livreur, erreurs de synchronisation `role=alert`.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A10 — Liste des clients

**Source** : Spec A10

**Type de preuve** : spec textuelle

- Spec : table, avatar `aria-hidden`, statuts textuels.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | Aucun overlay bloquant ; pas de piège clavier identifié. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A10b — Fiche client

**Source** : Spec A10b

**Type de preuve** : spec textuelle

- Spec : h1 nom, statistiques `dl`, suspension avec focus Annuler.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A11 — Utilisateurs internes

**Source** : Spec A11

**Type de preuve** : spec textuelle

- Spec : modale, rôles en cases avec permissions, invitation.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A12 — Promotions

**Source** : Spec A12

**Type de preuve** : spec textuelle

- Spec : table, codes monospace, usage annoncé, clôture avec focus.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A12b — Édition coupon

**Source** : Spec A12b

**Type de preuve** : spec textuelle

- Spec : radio fieldset, aperçu `aria-live`, abandon avec focus.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A13 — Avis clients

**Source** : Spec A13

**Type de preuve** : spec textuelle

- Spec : étoiles + note texte, panneau latéral focus trap.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A14 — Paramètres

**Source** : Spec A14

**Type de preuve** : spec textuelle

- Spec : tabs, fieldsets, tableau des zones, suppression avec focus.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A15 — Journal d’audit

**Source** : Spec A15

**Type de preuve** : spec textuelle

- Spec : table caption, dialogue détail, avant/après en `dl`.
- Aucune maquette ; lecture seule.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | Sans objet : aucun champ de saisie sur cet écran. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | Sans objet : aucun formulaire. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | Sans objet : aucun champ. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | Sans objet : aucune erreur de saisie. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

### A16 — Profil admin

**Source** : Spec A16

**Type de preuve** : spec textuelle

- Spec : sessions nommées, révélation mot de passe, exigences liées.
- Aucune maquette.

| Critère WCAG 2.1 AA | Statut | Constat | Correction | Ticket |
|---|---|---|---|---|
| 1.1.1 Contenu non textuel (alt) | ✅ | La spec impose les alternatives textuelles et masque les icônes décoratives. | Vérifier à l’implémentation. |  |
| 1.3.1 Information et relations (structure) | ✅ | La spec fixe un `h1`, des sections `h2` et des listes/tableaux natifs. | Aucune. |  |
| 1.3.2 Ordre logique | ✅ | Ordre documenté : header → navigation → titre → filtres → contenu → actions → pagination. | Aucune. |  |
| 1.3.5 Identifier la finalité du champ | ✅ | La spec prescrit des labels explicites, `autocomplete` et `inputmode` adaptés. | Aucune. |  |
| 1.4.1 Utilisation de la couleur | ✅ | La spec impose un texte ou un état non chromatique en complément de la couleur. | Aucune. |  |
| 1.4.3 Contraste minimum (4,5:1 texte, 3:1 UI) | ✅ | Aucune combinaison de marque à risque identifiée dans la spec. | Aucune. |  |
| 1.4.4 Redimensionnement du texte (200 %) | ✅ | La spec exige une composition sans perte à 200 % et le passage en colonne. | Aucune. |  |
| 1.4.11 Contraste non textuel (3:1) | 📋 | Bordures de contrôle `#DCE0E7` 1,32:1 et cartes `#ECE9E2` 1,21:1 sous le seuil 3:1. | Ticket composant : bordure de contrôle ≥3:1, sans dépendre de la seule bordure. | DSG-07-FIX-C05 |
| 2.1.1 Clavier | ✅ | La spec décrit les interactions clavier et les composants natifs. | Aucune. |  |
| 2.1.2 Pas de piège au clavier | ✅ | La spec impose un focus trap, Échap et la restitution du focus. | Aucune. |  |
| 2.4.3 Ordre de tabulation | ✅ | La spec décrit l’ordre de tabulation attendu. | Aucune. |  |
| 2.4.7 Visibilité du focus | ✅ | La spec impose un focus visible (`bs-focus-ring`), non encore démontré à l’exécution. | Aucune. |  |
| 2.5.5 Taille de la cible (44 × 44 px) | ✅ | La spec impose 44 × 44 px minimum pour toutes les cibles. | Aucune. |  |
| 3.2.1 Au focus | ✅ | Aucun changement de contexte automatique au focus n’est prévu. | Aucune. |  |
| 3.3.1 Identification des erreurs | ✅ | La spec prescrit `aria-invalid`, `aria-describedby` et un résumé `role=alert`. | Aucune. |  |
| 3.3.2 Étiquettes et instructions | ✅ | La spec prescrit labels visibles, astérisque expliquée et instructions liées. | Aucune. |  |
| 3.3.3 Suggestion après erreur | ✅ | La spec impose un message expliquant comment corriger. | Aucune. |  |
| 4.1.2 Nom, rôle, valeur (ARIA) | ✅ | La spec nomme les contrôles, les états et les dialogues (`aria-*`). | Aucune. |  |
| 4.1.3 Messages de statut (aria-live) | ✅ | La spec prévoit `role=status`, `role=alert` ou `aria-live` selon le cas. | Aucune. |  |

## 4. Synthèse quantitative

| Statut | Nombre de critères |
|---|---:|
| ✅ Conformes | 942 |
| ⚠️ À corriger / à démontrer | 43 |
| ❌ Non conformes | 69 |
| 🔧 Corrigés par règle documentaire | 12 |
| 📋 Ticketés post-gel | 36 |
| **Total** | **1102** |

Les 58 fiches totalisent **1102 critères** (19 × 58), dont 51 fiches adossées à une spec et 7 fiches sans spec dédiée.

## 5. Contrastes calculés

Formule WCAG 2.1 : `(L1 + 0,05) / (L2 + 0,05)`, avec luminance relative sRGB. Les valeurs sont calculées sur les tokens réellement définis.

| Combinaison | Texte | Fond | Ratio | AA texte | AA non textuel | AAA |
|---|---|---|---:|---|---|---|
| Texte principal sur canvas | `#131B2E` | `#FAFAF7` | 16,41:1 | ✅ | ✅ | ✅ |
| Texte principal sur blanc | `#131B2E` | `#FFFFFF` | 17,16:1 | ✅ | ✅ | ✅ |
| Blanc sur primaire | `#FFFFFF` | `#131B2E` | 17,16:1 | ✅ | ✅ | ✅ |
| Or sur canvas | `#C89B3C` | `#FAFAF7` | 2,45:1 | ❌ | ❌ | ❌ |
| Or sur blanc | `#C89B3C` | `#FFFFFF` | 2,56:1 | ❌ | ❌ | ❌ |
| Navy sur or | `#131B2E` | `#C89B3C` | 6,71:1 | ✅ | ✅ | ❌ |
| Or texte sur canvas | `#8A6A1F` | `#FAFAF7` | 4,83:1 | ✅ | ✅ | ❌ |
| Blanc sur WhatsApp vif | `#FFFFFF` | `#25D366` | 1,98:1 | ❌ | ❌ | ❌ |
| Navy sur WhatsApp vif | `#131B2E` | `#25D366` | 8,65:1 | ✅ | ✅ | ✅ |
| Blanc sur WhatsApp fort | `#FFFFFF` | `#0F7A40` | 5,41:1 | ✅ | ✅ | ❌ |
| Blanc sur succès | `#FFFFFF` | `#1E8E5A` | 4,14:1 | ⚠️ grand texte | ✅ | ❌ |
| Succès sur canvas | `#1E8E5A` | `#FAFAF7` | 3,96:1 | ⚠️ grand texte | ✅ | ❌ |
| Succès fort sur blanc | `#0F7A40` | `#FFFFFF` | 5,41:1 | ✅ | ✅ | ❌ |
| Blanc sur danger | `#FFFFFF` | `#D62839` | 4,97:1 | ✅ | ✅ | ❌ |
| Danger sur blanc | `#D62839` | `#FFFFFF` | 4,97:1 | ✅ | ✅ | ❌ |
| Danger fort sur blanc | `#A31727` | `#FFFFFF` | 7,75:1 | ✅ | ✅ | ✅ |
| Blanc sur warning | `#FFFFFF` | `#B98500` | 3,27:1 | ⚠️ grand texte | ✅ | ❌ |
| Warning fort sur blanc | `#7A5B12` | `#FFFFFF` | 6,30:1 | ✅ | ✅ | ❌ |
| Warning fort sur soft | `#7A5B12` | `#FFF3D6` | 5,71:1 | ✅ | ✅ | ❌ |
| Succès fort sur soft | `#0F7A40` | `#EAF6EF` | 4,88:1 | ✅ | ✅ | ❌ |
| Danger fort sur soft | `#A31727` | `#FDE7E9` | 6,56:1 | ✅ | ✅ | ❌ |
| Info fort sur soft | `#244A6E` | `#E8EDF9` | 7,86:1 | ✅ | ✅ | ✅ |
| Blanc sur info | `#FFFFFF` | `#2F5D8A` | 6,88:1 | ✅ | ✅ | ❌ |
| Texte muted sur canvas | `#687087` | `#FAFAF7` | 4,72:1 | ✅ | ✅ | ❌ |
| Texte muted sur blanc | `#687087` | `#FFFFFF` | 4,93:1 | ✅ | ✅ | ❌ |
| Placeholder / subtle sur blanc | `#6B7280` | `#FFFFFF` | 4,83:1 | ✅ | ✅ | ❌ |
| Placeholder historique | `#8990A0` | `#FFFFFF` | 3,20:1 | ❌ | ✅ | ❌ |
| Bordure de contrôle | `#DCE0E7` | `#FFFFFF` | 1,32:1 | ❌ | ❌ | ❌ |
| Bordure de carte | `#ECE9E2` | `#FFFFFF` | 1,21:1 | ❌ | ❌ | ❌ |
| Focus navy sur canvas | `#131B2E` | `#FAFAF7` | 16,41:1 | ✅ | ✅ | ✅ |
| Navy sur accent soft | `#131B2E` | `#FBF7ED` | 16,04:1 | ✅ | ✅ | ✅ |

### Corrections de contraste retenues

- Or décoratif conservé pour les fonds navy ; texte sur fond clair → `#8A6A1F`.
- CTA WhatsApp → fond `#0F7A40` avec texte blanc, ou texte navy sur `#25D366`.
- Succès en texte → `#0F7A40` ; le vert `#1E8E5A` reste réservé aux grandes surfaces et icônes.
- Warning en texte → `#7A5B12` ; ne jamais utiliser blanc sur `#B98500` en texte normal.
- Bordures de contrôle → `#6B7280` (4,83:1) ; les cartes peuvent garder une bordure décorative si elles ne sont pas le seul repère.
- Placeholder historique `#8990A0` abandonné au profit de `#6B7280`.

## 6. Zones tactiles

| Groupe | Constat | Verdict |
|---|---|---|
| Boutons | `min-height: 44px` et `min-width` 44 px pour icon-only | ✅ composant |
| Champs | hauteur 48 px | ✅ |
| Checkbox / Radio / Toggle | ligne 44 px, contrôle visuel 20–24 px | ⚠️ la cible est la ligne, pas le carré ; à documenter |
| ProductCard favorite | 44 × 44 px | ✅ |
| SizeSelector | 44 × 44 px | ✅ |
| Bottom nav / barre d’achat | non mesurable dans le PNG | ⚠️ |
| A09b livreur | 48 px prescrit | ✅ spec |
| Table actions | 44 px | ✅ |
| Modal / Toast close | 44 px | ✅ |
| P01/P02/P04/P06 icônes et puces | proches de 44 px sans cote | ⚠️ à mesurer |

## 7. Clavier, focus et overlays

| Sujet | Constat | Statut |
|---|---|---|
| Ordre de tabulation | Documenté dans les specs DSG-04/05/06 | ✅ spec |
| Focus visible | Double anneau navy défini ; absent de la planche | ❌ maquette / ✅ token |
| Focus trap Modal | Implémenté (`Tab`, `Shift+Tab`, Échap, restitution) | ✅ composant |
| ConfirmDialog / BottomSheet | Spécifiés, non implémentés dans `@bruny/ui` | 📋 tickets |
| Menu / ActionMenu | Spécifié, absent du code | 📋 ticket |
| Accordéon FAQ | Spécifié, non implémenté | 📋 ticket |
| Timeline / Stepper | Sémantique spécifiée, pas de composant dédié | 📋 ticket |
| Toasts | Annoncés, mais fermeture automatique sans pause | ⚠️ |
| Barres sticky | Risque d’occulter le focus sur P04, P08–P13, A09b | ⚠️ à tester |

## 8. Top 10 des défauts critiques

1. **Contraste de l’or sur fond clair** : 2,45:1, échec sur les micro-titres et badges dorés.
2. **Blanc sur WhatsApp vif** : 1,98:1, échec sur les CTA WhatsApp de P01, P04, P06, P13.
3. **Blanc sur succès** : 4,14:1, insuffisant pour les badges et statuts en texte normal.
4. **Bordure de contrôle** : 1,32:1, les champs ne sont pas identifiables à 3:1 sans le focus.
5. **Absence de focus dans la planche** : aucun état visible, risque de navigation clavier non perceptible.
6. **P03, P05, P07 sans maquette ni spec** : trois parcours ne sont pas auditables et ne peuvent pas être implémentés.
7. **`aria-describedby` cassé dans Checkbox, Radio et Toggle** : l’erreur n’est pas reliée au contrôle.
8. **Actions de table sans contexte de ligne** : « Modifier » répété sans nom de ligne.
9. **Promesses non supportées** : GPS temps réel, facture PDF, Cercle Prestige, 2FA client.
10. **Aucune preuve desktop/tablette** : les compositions 768/1280 ne sont pas auditables visuellement.

## 9. Top 10 des défauts fréquents

1. CTA d’ajout au panier formulés différemment (« Ajouter », « Commander », « Ajouter Panier »).
2. Montants en FCFA avec espaces variables, parfois `XAF` en interface.
3. Dates aux formats multiples.
4. Badges de statut sans mapping sémantique unique.
5. Erreurs de formulaire parfois globales, sans lien au champ.
6. Zones tactiles non mesurées dans les maquettes.
7. États de chargement, vide, erreur et succès absents des écrans visuels.
8. Texte tronqué sans alternative accessible.
9. Focus non dessiné et barres sticky susceptibles de le masquer.
10. Tableaux desktop et cartes mobiles sans parité d’information.

## 10. Écrans les plus problématiques

| Priorité | Écrans | Raison |
|---|---|---|
| P0 | P03, P05, P07 | Aucune source, aucun design |
| P0 | P01, P02, P04, P06 | Contraste, focus, cibles et états non prouvés |
| P1 | P08–P13 | Spec solide mais preuve visuelle partielle ; barres sticky |
| P1 | A03, A09b | Données non modélisées, contraste extérieur, hors ligne |
| P1 | A04, A11, A15 | Tables/actions/dialogues à valider à l’implémentation |
| P2 | P14–P27e | Specs robustes, aucune maquette dédiée |

## 11. Recommandations globales

1. Appliquer les tokens corrigés (`accent-text`, `success-strong`, `whatsapp-strong`, `warning-strong`) à toutes les maquettes.
2. Rendre obligatoire un `aria-label` contextualisé pour chaque action de ligne et chaque bouton icône.
3. Corriger les composants Checkbox/Radio/Toggle avant tout développement de formulaire.
4. Ajouter un focus visible et documenter son test sur fond clair, navy et photographie.
5. Mesurer toutes les cibles à 360 px ; 48 px pour A09b.
6. Ajouter les états chargement/vide/erreur/succès aux maquettes existantes.
7. Remplacer les textes tronqués par deux lignes ou une alternative accessible.
8. Garantir la parité table desktop / cartes mobile.
9. Mettre en place un test a11y automatisé en CI (axe) et une revue clavier manuelle.
10. Ne pas déclarer un écran implémentable tant que son API ou son composant n’existe pas.

## 12. Limites

- 37 vues n’ont que des specs : la conformité visuelle ne peut pas être prouvée.
- Aucune vue desktop/tablette n’est dessinée.
- P03/P05/P07 n’ont aucune source.
- Les tailles de texte et cibles ne sont pas mesurables avec précision dans un PNG aplati.
- Le contraste des photographies et des images de produit n’est pas calculable.
- Les composants non implémentés (ConfirmDialog, BottomSheet, Tabs, Stepper, Timeline, ActionMenu) sont audités sur leur spec, pas sur un rendu.
