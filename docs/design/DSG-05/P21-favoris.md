# P21 — Mes favoris

> DSG-05 · groupe Compte · route `/compte/favoris`
> Endpoints à créer : `GET /wishlist`, `DELETE /wishlist/:productId` (ou `POST /wishlist/toggle`).

---

## 1. Objectif & rôle

Retrouver les produits enregistrés et faciliter le retour vers la fiche produit ou l'ajout au panier. L'écran doit rester attrayant quand il est vide et ne jamais casser la navigation en cas de produit indisponible.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Mon compte › Favoris ».
2. `h1` « Mes favoris », compteur « 4 produits ».
3. Grille 2 colonnes de `ProductCard` avec bouton cœur actif.
4. Chaque carte : image, badge, nom, prix, bouton « Retirer des favoris ».
5. Produit épuisé : carte conservée, badge « Épuisé », CTA désactivé.
6. État vide : illustration légère, titre, texte, CTA « Découvrir la boutique ».
7. Bottom nav.

### 768 px

- Grille 3 colonnes, cartes 220 px minimum.

### 1280 px

- Sidebar compte + grille 3 ou 4 colonnes (max 900 px).
- Filtre facultatif « Disponibles » / « Tous ».

```text
┌──────────────┬───────────────────────────────────────────────┐
│ MON COMPTE   │ Mes favoris (4)                               │
│ Favoris ●    │ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│              │ │ ♥ card  │ │ ♥ card  │ │ ♥ card  │           │
│              │ └─────────┘ └─────────┘ └─────────┘           │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `AccountNav` | NOUVEAU | sidebar | actif |
| `ProductCard` | TEC-10 | grille | normal, épuisé |
| `Button` | TEC-10 | ghost, primary | — |
| `EmptyState` | NOUVEAU | — | — |
| `Toast` | TEC-10 | success, error | — |
| `Skeleton` | TEC-10 | carte | — |
| `Pagination` | NOUVEAU | si > 12 | — |

---

## 4. États obligatoires

- **Chargement** : 4 squelettes de cartes.
- **Vide** : `EmptyState` « Votre liste de favoris est vide » + « Explorez le catalogue et enregistrez vos coups de cœur. » + CTA.
- **Erreur** : liste indisponible, retrait échoué, 401.
- **Succès** : retrait immédiat avec animation discrète + toast + possibilité d'annuler.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Chargement impossible | « Impossible de charger vos favoris. Réessayez. » |
| Retrait échoué | « Le produit n'a pas pu être retiré. Réessayez. » |
| Produit supprimé | Carte retirée silencieusement au chargement |
| Session expirée | Redirection P14 |
| Réseau | « Connexion interrompue. Réessayez. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Mes favoris | neutre | `h1` |
| Compteur | {n} produit(s) | info | — |
| Action retirer | Retirer {produit} des favoris | action | `aria-label` |
| Toast retrait | Produit retiré de vos favoris. | succès | `role="status"` |
| Annuler | Annuler | action | — |
| Épuisé | Épuisé | neutre | badge |
| Vide titre | Votre liste de favoris est vide | neutre | `h2` |
| Vide corps | Explorez le catalogue et enregistrez vos coups de cœur. | encourageant | — |
| Vide CTA | Découvrir la boutique | action | — |
| Filtre tous | Tous | neutre | — |
| Filtre dispo | Disponibles | neutre | — |

---

## 6. Interactions & comportements

- Le cœur d'une carte retire le produit ; l'action est optimiste avec rollback en cas d'échec.
- Toast avec action « Annuler » pendant 5 s.
- Clic sur la carte → fiche produit.
- Produit épuisé : carte affichée, CTA panier désactivé, pas de suppression automatique.
- Pagination si plus de 12 produits ; filtre disponibilité côté client.
- Le compteur est mis à jour immédiatement.
- Aucun « Ajouter tout au panier » en MVP (risque de stock et de tailles).

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1`, grille en `<ul>`/`<li>`.
- Chaque carte a un lien principal et un bouton secondaire distincts, sans imbrication interactive.
- Bouton cœur : `aria-pressed="true"`, `aria-label` complet.
- Toast : `role="status"`, action accessible au clavier.
- Badge « Épuisé » textuel, pas seulement grisé.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : 2 colonnes maximum.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Liste | `GET /wishlist` **à créer** | Erreur |
| Retrait | `DELETE /wishlist/:productId` **à créer** | Rollback + toast |
| Produits | `GET /products?...` **existant** | Données de la wishlist |

Réponse attendue : `{ items: [{ productId, slug, name, image, price, compareAtPrice, inStock }], total }`.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucun écran favoris dans la planche | Conçu avec `ProductCard` |
| `Wishlist` existe sans API | Dépendance backend |
| Pas de compte requis pour aimer ? | Les favoris exigent une session ; un visiteur est redirigé vers P14 |
| « Ajouter tout au panier » | Non retenu en MVP |

---

## 10. Wireframe de référence

Aucun fichier dédié ; `ProductCard` de P01/P02 et zone K.
