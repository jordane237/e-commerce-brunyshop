# P27b — Erreur 404

> DSG-05 · groupe Erreur · route wildcard `**`
> Aucun endpoint.

---

## 1. Objectif & rôle

Transformer une URL morte en porte de sortie utile : expliquer simplement que la page n'existe pas, proposer la boutique, la recherche et le contact, sans culpabiliser l'utilisateur.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header storefront.
2. Bloc centré : grand « 404 » décoratif, `h1` « Cette page est introuvable. ».
3. Texte « Le lien est peut-être ancien, ou la page a changé d'adresse. ».
4. Bouton primaire « Retour à la boutique ».
5. Bouton secondaire « Nous contacter ».
6. Liens utiles : Suivre ma commande, FAQ, Livraison.
7. Footer.

### 768 px

- Bloc centré 560 px, illustration discrète à gauche.

### 1280 px

- Composition 2 colonnes : visuel à gauche, texte et actions à droite, contenu 900 px.

```text
┌──────────────────────────────────────────────────────────────┐
│ 404                                                          │
│ Cette page est introuvable.                                  │
│ Le lien est peut-être ancien, ou la page a changé d'adresse. │
│ [ Retour à la boutique ]  [ Nous contacter ]                 │
│ Suivre ma commande · FAQ · Livraison                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `ErrorPage` | NOUVEAU | 404 | — |
| `Button` | TEC-10 | primary, ghost | — |
| `Icon` | TEC-10 | recherche | décoratif |

---

## 4. États obligatoires

- **Chargement** : sans objet.
- **Vide** : état par défaut de la page.
- **Erreur** : si la page demandée est une ancienne route connue, redirection 301 vers la nouvelle route avant affichage.
- **Succès** : navigation vers une page valide.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| URL inconnue | « Cette page est introuvable. » |
| Ancienne route produit | Redirection vers la fiche actuelle si le slug est connu |
| Ancienne route compte | Redirection vers `/compte` si connecté, sinon P14 |
| Lien externe cassé | Même page, aucun détail technique |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Code | 404 | neutre | `aria-hidden="true"` |
| Titre | Cette page est introuvable. | neutre | `h1` |
| Corps | Le lien est peut-être ancien, ou la page a changé d'adresse. | aide | — |
| CTA primaire | Retour à la boutique | action | — |
| CTA secondaire | Nous contacter | action | — |
| Liens | Suivre ma commande · FAQ · Livraison | aide | nav |

---

## 6. Interactions & comportements

- CTA primaire → `/boutique`.
- CTA secondaire → `/contact`.
- « Suivre ma commande » → P13.
- Aucun champ de recherche global en MVP (pas de moteur côté storefront).
- La page conserve le header et le footer ; le panier reste accessible.
- Aucun message technique, aucune stack trace.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, code 404 décoratif masqué aux lecteurs.
- Actions dans l'ordre logique, focus initial sur `h1` ou premier CTA.
- Contraste AA, cibles ≥ 44 px, focus visible.
- Aucune animation automatique.
- Zoom 200 % : composition en colonne.

---

## 8. Données API nécessaires

Aucune.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune 404 dans le storefront | Route wildcard à ajouter |
| Wildcard actuel | Vérifier qu'il n'affiche pas une page vide |
| Recherche globale | Hors périmètre |

---

## 10. Wireframe de référence

Aucun fichier dédié ; `ErrorPage` à créer.
