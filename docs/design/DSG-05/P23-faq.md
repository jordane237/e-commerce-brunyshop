# P23 — FAQ

> DSG-05 · groupe Information · route `/faq`
> Aucun endpoint : contenu statique versionné dans `CONTENUS.md`.

---

## 1. Objectif & rôle

Répondre aux questions les plus fréquentes avant achat et après commande, réduire les contacts répétitifs, et orienter vers le bon canal quand la réponse n'existe pas. La FAQ est éditoriale, en français, et doit rester à jour.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › FAQ ».
2. `h1` « Questions fréquentes » + chapô.
3. Barre de recherche « Rechercher une question ».
4. Puces de catégories défilantes : Toutes, Commandes, Livraison, Tailles, Retours, Paiement, Compte.
5. Liste d'`Accordion` groupés par catégorie, un seul ouvert à la fois.
6. Résultat vide : « Aucune question ne correspond à “{terme}”. » + CTA contact.
7. Bloc final « Vous ne trouvez pas votre réponse ? » + bouton « Nous contacter ».
8. Footer.

### 768 px

- Recherche + catégories sur une ligne.
- Accordéons en pleine largeur, contenu 680 px.

### 1280 px

- Sommaire latéral sticky des catégories à gauche (220 px), contenu 760 px.
- Recherche en haut du contenu.

```text
┌────────────┬─────────────────────────────────────────────────┐
│ Catégories │ Questions fréquentes                            │
│ Toutes     │ [ Rechercher une question… ]                    │
│ Commandes  │ Commandes                                       │
│ Livraison  │ ▸ Comment suivre ma commande ?                  │
│ Tailles    │ ▸ Puis-je modifier une commande ?               │
│ Retours    │ Livraison                                       │
│ Paiement   │ ▸ Quels sont les délais à Douala ?              │
│ Compte     │ …                                               │
└────────────┴─────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Accordion` | NOUVEAU | une section ouverte | fermé, ouvert |
| `Input` | TEC-10 | recherche | normal, avec effacement |
| `Button` | TEC-10 | ghost, primary | — |
| `EmptyState` | NOUVEAU | recherche | — |
| `Breadcrumb` | NOUVEAU | — | — |

---

## 4. États obligatoires

- **Chargement** : sans objet (contenu statique) ; hydratation immédiate.
- **Vide** : recherche sans résultat → message + terme affiché + CTA contact ; catégorie sans question → masquée.
- **Erreur** : aucune erreur réseau attendue ; si le contenu dynamique échoue, FAQ statique de secours.
- **Succès** : accordéon ouvert, contenu lisible, URL mise à jour avec l'ancre.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Recherche vide | Aucune erreur, liste complète |
| Recherche sans résultat | « Aucune question ne correspond à “{terme}”. » |
| Lien profond invalide | Ouvre la FAQ en haut, sans message d'erreur |
| Contenu indisponible | « La FAQ ne peut pas être affichée pour le moment. Contactez-nous. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Questions fréquentes | neutre | `h1` |
| Chapô | Livraison, tailles, retours, commandes : les réponses aux questions que vous nous posez le plus souvent. | aide | — |
| Recherche label | Rechercher une question | neutre | label sr-only |
| Recherche placeholder | Ex. délai Douala, échange, paiement | aide | — |
| Catégorie toutes | Toutes | neutre | — |
| Catégorie commandes | Commandes | neutre | — |
| Catégorie livraison | Livraison | neutre | — |
| Catégorie tailles | Tailles | neutre | — |
| Catégorie retours | Retours et échanges | neutre | — |
| Catégorie paiement | Paiement | neutre | — |
| Catégorie compte | Mon compte | neutre | — |
| Résultat vide | Aucune question ne correspond à “{terme}”. | neutre | `role="status"` |
| Résultat vide CTA | Nous contacter | action | — |
| Bloc final titre | Vous ne trouvez pas votre réponse ? | chaleureux | `h2` |
| Bloc final corps | Écrivez-nous : nous répondons du lundi au samedi. | aide | — |
| Bloc final CTA | Nous contacter | action | — |

Les 18 questions/réponses complètes sont dans `CONTENUS.md`, section « FAQ ».

---

## 6. Interactions & comportements

- Un seul accordéon ouvert à la fois ; clic sur un autre ferme le précédent.
- Recherche instantanée (debounce 200 ms), insensible aux accents et à la casse, sur la question et la réponse.
- Catégorie active filtre la liste ; « Toutes » réinitialise.
- URL : `?categorie=livraison#delais-douala` pour partage.
- Ouverture par ancre : scroll + focus sur le titre de la question.
- « Nous contacter » → P22 avec sujet présélectionné.
- Contenu versionné ; aucune contribution utilisateur.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, chaque question est un `h2`/`h3` dans un bouton d'accordéon.
- `Accordion` : bouton `aria-expanded`, `aria-controls`, panneau `role="region"` avec `aria-labelledby`.
- Navigation clavier : Entrée/Espace ouvre, Tab suivant, pas de piège de focus.
- Recherche : label explicite, résultats annoncés `aria-live="polite"`.
- Puces de catégorie : `aria-pressed`.
- Liens profonds : focus visible sur la cible.
- Cibles ≥ 44 px, contraste AA, zoom 200 %.
- Aucun contenu uniquement iconographique.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Contenu | statique `CONTENUS.md` | — |
| Recherche | côté client | — |

Aucune donnée personnelle, aucun appel réseau.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune FAQ dans la planche | Conçue, 18 Q/R rédigées |
| Pas de recherche prévue | Ajoutée, côté client |
| Accordéon absent de `libs/ui` | Composant à créer (`COMPOSANTS-REQUIS.md`) |
| Contenus juridiques | Validés par l'exploitation avant mise en ligne |

---

## 10. Wireframe de référence

Aucun fichier dédié ; patterns de contenu éditorial et footer de la planche.
