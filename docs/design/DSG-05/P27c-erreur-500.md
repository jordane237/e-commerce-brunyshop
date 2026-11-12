# P27c — Erreur 500

> DSG-05 · groupe Erreur · route `/erreur` (error boundary)
> Aucun endpoint.

---

## 1. Objectif & rôle

Reconnaître une panne côté serveur sans exposer de détail technique, rassurer sur l'intégrité de la commande et proposer une action concrète : réessayer, revenir à l'accueil ou contacter le support.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header storefront.
2. Bloc centré : pictogramme neutre, `h1` « Un problème est survenu. ».
3. Texte « Nous n'avons pas pu afficher cette page. Votre commande n'est pas affectée. ».
4. Bouton primaire « Réessayer ».
5. Bouton secondaire « Retour à l'accueil ».
6. Lien « Nous contacter » + e-mail support.
7. Footer.

### 768 px

- Carte centrée 560 px, illustration discrète.

### 1280 px

- Deux colonnes : visuel / texte, contenu 900 px.

```text
┌──────────────────────────────────────────────────────────────┐
│ Un problème est survenu.                                     │
│ Nous n'avons pas pu afficher cette page.                     │
│ Votre commande n'est pas affectée.                           │
│ [ Réessayer ]   [ Retour à l'accueil ]                       │
│ Besoin d'aide ? support@brunyshop.cm                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `ErrorPage` | NOUVEAU | 500 | — |
| `Button` | TEC-10 | primary, ghost | loading |
| `Alert` | NOUVEAU | info | — |

---

## 4. États obligatoires

- **Chargement** : bouton « Réessayer » en `loading` pendant la nouvelle tentative.
- **Vide** : état par défaut.
- **Erreur** : nouvelle tentative échouée → message « Toujours indisponible. Réessayez dans quelques minutes. » sans boucle automatique.
- **Succès** : la page demandée se recharge.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Erreur serveur | « Un problème est survenu. » |
| Nouvelle tentative échouée | « Le service est toujours indisponible. Réessayez dans quelques minutes. » |
| Erreur sur le paiement | Ne pas afficher cette page : conserver le parcours P11 avec message ciblé |
| Session expirée | Redirection P14, pas 500 |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Un problème est survenu. | neutre | `h1` |
| Corps | Nous n'avons pas pu afficher cette page. Votre commande n'est pas affectée. | rassurant | — |
| CTA primaire | Réessayer | action | — |
| CTA chargement | Nouvelle tentative… | statut | — |
| CTA secondaire | Retour à l'accueil | action | — |
| Aide | Besoin d'aide ? Écrivez à support@brunyshop.cm. | aide | — |
| Échec répété | Le service est toujours indisponible. Réessayez dans quelques minutes. | neutre | `role="alert"` |

---

## 6. Interactions & comportements

- « Réessayer » recharge la route demandée ; une seule tentative par clic.
- Pas de rechargement automatique ni de compte à rebours.
- « Retour à l'accueil » → `/boutique`.
- Aucun identifiant d'incident affiché (pas de corrélation backend disponible).
- La page ne doit jamais révéler de message serveur, de code de stack ni d'URL interne.
- Le panier local est conservé.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, focus initial sur le titre.
- Erreur de nouvelle tentative : `role="alert"`.
- Boutons avec libellés explicites, cibles ≥ 44 px.
- Contraste AA, focus visible, zoom 200 %.
- Aucune animation clignotante.

---

## 8. Données API nécessaires

Aucune. La page est déclenchée par l'error boundary ou une réponse 5xx non récupérable.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune page 500 | À créer |
| Error boundary Angular | À ajouter au niveau du shell |
| Identifiant d'incident | Non disponible, non affiché |
| Erreurs de paiement | Traitées dans le parcours, pas ici |

---

## 10. Wireframe de référence

Aucun fichier dédié ; `ErrorPage` à créer.
