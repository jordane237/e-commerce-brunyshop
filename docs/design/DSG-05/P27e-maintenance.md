# P27e — Maintenance

> DSG-05 · groupe Erreur · route `/maintenance` (503)
> Aucun endpoint.

---

## 1. Objectif & rôle

Informer d'une indisponibilité planifiée ou d'une intervention en cours, donner une fenêtre de retour si elle est connue, et laisser un canal de contact pour les commandes en cours. La page doit être servie même quand l'application principale est indisponible.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Logo BRUNY SHOPPING centré, sans header complet.
2. `h1` « Nous revenons très vite. ».
3. Texte « Le site est en maintenance pour améliorer votre expérience. ».
4. Encadré horaire : « Retour prévu : {date/heure} » si configuré, sinon « Nous ne pouvons pas encore donner d'heure de retour. ».
5. CTA « Nous contacter » (mailto support).
6. Lien « Suivre ma commande » si le service de suivi est indépendant et disponible.
7. Footer minimal.

### 768 px

- Carte centrée 520 px, logo au-dessus.

### 1280 px

- Composition centrée, fond sable, aucune navigation marchande.

```text
┌──────────────────────────────────────────────────────────────┐
│                        BRUNY SHOPPING                        │
│                                                              │
│                 Nous revenons très vite.                     │
│      Le site est en maintenance pour améliorer votre         │
│      expérience.                                             │
│           Retour prévu : aujourd'hui à 18 h                  │
│                [ Nous contacter ]                            │
│              Suivre ma commande                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `ErrorPage` | NOUVEAU | maintenance | — |
| `Button` | TEC-10 | primary, ghost | — |
| `Alert` | NOUVEAU | info | — |
| `Icon` | TEC-10 | outils | décoratif |

---

## 4. États obligatoires

- **Chargement** : sans objet, page statique servie par le serveur ou le CDN.
- **Vide** : horaire de retour non configuré → message neutre sans fausse heure.
- **Erreur** : contact indisponible → e-mail affiché en texte.
- **Succès** : fin de maintenance → redirection vers `/boutique` ou rechargement.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Maintenance planifiée | « Le site est en maintenance pour améliorer votre expérience. » |
| Horaire inconnu | « Nous ne pouvons pas encore donner d'heure de retour. » |
| Horaire dépassé | « La maintenance prend plus de temps que prévu. Merci de votre patience. » |
| Commande en cours | « Votre commande reste enregistrée. Nous vous contactons si nécessaire. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Nous revenons très vite. | rassurant | `h1` |
| Corps | Le site est en maintenance pour améliorer votre expérience. Merci de votre patience. | neutre | — |
| Retour connu | Retour prévu : {date} à {heure}. | info | `<time datetime>` |
| Retour inconnu | Nous ne pouvons pas encore donner d'heure de retour. | neutre | — |
| Retard | La maintenance prend plus de temps que prévu. Merci de votre patience. | neutre | — |
| Commande | Votre commande reste enregistrée. Nous vous contactons si nécessaire. | rassurant | — |
| CTA | Nous contacter | action | — |
| Suivi | Suivre ma commande | action | — |

---

## 6. Interactions & comportements

- Page servie en 503 avec `Retry-After` si la fenêtre est connue.
- Aucun formulaire, aucun panier.
- « Suivre ma commande » n'est affiché que si P13 est servie par un service distinct ; sinon masqué.
- « Nous contacter » ouvre le client mail.
- Rechargement automatique interdit ; l'utilisateur décide.
- Le logo ramène à `/boutique` une fois le service rétabli.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, structure simple.
- Aucune navigation complexe, ordre de focus titre → CTA → lien secondaire.
- Horaire dans `<time>` lisible.
- Contraste AA sur fond sable, cibles ≥ 44 px, focus visible.
- Zoom 200 % : contenu centré sans débordement.
- Aucune animation, aucun son.

---

## 8. Données API nécessaires

Aucune. La page doit être autonome (HTML/CSS) pour rester disponible pendant une panne applicative.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucune page maintenance | À créer, servie hors application |
| Horaire de retour | Optionnel, jamais inventé |
| Suivi de commande | Affiché seulement si indépendant |
| Bandeau admin | Hors périmètre |

---

## 10. Wireframe de référence

Aucun fichier dédié ; `ErrorPage` à créer.
