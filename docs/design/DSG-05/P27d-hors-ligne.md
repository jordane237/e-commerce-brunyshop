# P27d — Hors ligne

> DSG-05 · groupe Erreur · état global (pas de route dédiée)
> Aucun endpoint.

---

## 1. Objectif & rôle

Informer que la connexion réseau est perdue, distinguer cet état d'une panne serveur, et indiquer ce qui reste possible. Aucune promesse de fonctionnement hors ligne complet : le storefront n'est pas une PWA offline-first.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Bandeau global sous le header : icône, « Vous êtes hors ligne. », texte court.
2. Si la page est déjà chargée : contenu conservé, bandeau non bloquant.
3. Si navigation impossible : bloc plein écran avec `h1` « Pas de connexion. ».
4. Bouton « Réessayer ».
5. Liens : Accueil, FAQ (si contenu en cache), Contact.
6. Footer masqué en mode plein écran.

### 768 px

- Bandeau pleine largeur, texte sur une ligne + action « Réessayer ».

### 1280 px

- Bandeau 48 px, contenu centré ; bloc plein écran 560 px.

```text
┌──────────────────────────────────────────────────────────────┐
│ ⚠ Vous êtes hors ligne. Vérifiez votre connexion. [Réessayer]│
├──────────────────────────────────────────────────────────────┤
│                    Pas de connexion.                         │
│        Certaines pages restent consultables.                 │
│                    [ Réessayer ]                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `OfflineBanner` | NOUVEAU | global | visible / masqué |
| `ErrorPage` | NOUVEAU | offline | — |
| `Button` | TEC-10 | primary, ghost | loading |
| `Icon` | TEC-10 | wifi-off | décoratif |

---

## 4. États obligatoires

- **Chargement** : détection via `navigator.onLine` + échec réseau réel ; pas de faux positif sur une requête lente.
- **Vide** : aucun contenu en cache → bloc plein écran.
- **Erreur** : « Réessayer » échoue → le bandeau reste, message « Toujours hors ligne. ».
- **Succès** : retour de la connexion → bandeau masqué automatiquement, toast « Connexion rétablie. » et rechargement des données si pertinent.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Réseau coupé | « Vous êtes hors ligne. Vérifiez votre connexion. » |
| Nouvelle tentative échouée | « Toujours hors ligne. Nous réessaierons dès que possible. » |
| Requête lente | Ne pas afficher le mode hors ligne ; utiliser le skeleton |
| API indisponible mais réseau OK | Afficher P27c, pas P27d |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Bandeau | Vous êtes hors ligne. Vérifiez votre connexion. | info | `role="status"` |
| Bandeau action | Réessayer | action | — |
| Titre plein écran | Pas de connexion. | neutre | `h1` |
| Corps | Certaines pages déjà ouvertes restent consultables. Le panier sera conservé sur cet appareil. | rassurant | — |
| CTA | Réessayer | action | — |
| Lien accueil | Retour à l'accueil | action | — |
| Échec | Toujours hors ligne. Nous réessaierons dès que possible. | neutre | `role="status"` |
| Retour | Connexion rétablie. | succès | `role="status"` |

---

## 6. Interactions & comportements

- Écoute `online` / `offline` ; le bandeau apparaît après un échec réseau confirmé, pas à la première requête lente.
- « Réessayer » relance la requête en cours ; pas de rechargement complet si évitable.
- Le panier local reste accessible et modifiable hors ligne ; la commande ne peut pas être finalisée.
- Les formulaires ne sont pas soumis hors ligne ; message à la soumission.
- Aucune mise en cache des pages compte (données personnelles).
- Le bandeau ne masque pas le contenu et ne piège pas le focus.
- Au retour en ligne : bandeau masqué, toast, rafraîchissement de la vue courante.

---

## 7. Accessibilité (WCAG 2.1 AA)

- Bandeau : `role="status"`, `aria-live="polite"`, pas de vol de focus.
- Plein écran : `h1` unique, focus sur le titre.
- Icône décorative `aria-hidden="true"`, information en texte.
- Cibles ≥ 44 px, contraste AA (le bandeau ne doit pas être uniquement orange).
- Zoom 200 % : texte sur deux lignes, action accessible.
- Aucun clignotement.

---

## 8. Données API nécessaires

Aucune. Détection côté client + interception des erreurs réseau.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| Aucun mode hors ligne | Bandeau + page de secours, pas de PWA |
| Service worker | Hors périmètre DSG-05 |
| Panier local | Conservé, commande impossible |
| Données compte | Jamais mises en cache |

---

## 10. Wireframe de référence

Aucun fichier dédié ; `OfflineBanner` et `ErrorPage` à créer.
