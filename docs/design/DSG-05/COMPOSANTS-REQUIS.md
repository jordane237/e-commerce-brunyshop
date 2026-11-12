# Composants requis — DSG-05

> `libs/ui` expose 16 composants (Badge, Button, Checkbox, Icon, Input, Modal, PriceTag, ProductCard, Radio, Select, SizeSelector, Skeleton, Spinner, Table, Toast, Toggle). **Aucun `Tabs`**, aucun composant de compte.
> Les 17 composants ci-dessous sont à créer ou à étendre. Aucun ne doit dupliquer un composant existant.

---

## 1. Synthèse

| # | Composant | Type | Écrans | Priorité |
| --- | --- | --- | --- | --- |
| 1 | `AccountNav` | nouveau | P17–P21 | P0 |
| 2 | `AddressCard` | nouveau | P17, P20, P18b | P0 |
| 3 | `Alert` | nouveau | tous | P0 |
| 4 | `Breadcrumb` | nouveau | tous | P0 |
| 5 | `ConfirmDialog` | nouveau | P19b, P20, P17 | P0 |
| 6 | `EmptyState` | nouveau | P18, P20, P21, P23 | P0 |
| 7 | `ErrorPage` | nouveau | P27b–P27e | P0 |
| 8 | `OfflineBanner` | nouveau | global | P1 |
| 9 | `OrderLineItem` | nouveau | P18b, P11 | P0 |
| 10 | `Pagination` | nouveau | P18, P21 | P0 |
| 11 | `PasswordStrengthIndicator` | nouveau | P15, P19 | P1 |
| 12 | `StatutBadge` | nouveau | P17, P18, P18b | P0 |
| 13 | `Stepper` | nouveau | P19b, P11 | P0 |
| 14 | `Textarea` | nouveau | P20b, P22 | P0 |
| 15 | `Timeline` | nouveau | P18b, P13 | P0 |
| 16 | `Accordion` | nouveau | P23, P24, P25, P27 | P0 |
| 17 | `Avatar` | nouveau | P17, P19 | P1 |

---

## 2. Spécifications

### 2.1 `AccountNav`

- **Entrées** : `items: { label, route, icon?, badge? }[]`, `activeRoute`, `user?: { firstName }`.
- **Variantes** : `sidebar` (≥ 1024 px), `tabs` (768–1023 px), `list` (< 768 px).
- **États** : actif, survol, focus, déconnecté (masqué).
- **A11y** : `<nav aria-label="Navigation du compte">`, actif `aria-current="page"`, cibles 44 px.
- **Comportement** : sidebar sticky ; tabs scrollables horizontalement ; liste verticale en mobile.

### 2.2 `AddressCard`

- **Entrées** : `address: { label, city, district, line, landmark, phone, isDefault }`, `mode: 'compact' | 'full'`, `editable`, `deletable`.
- **Événements** : `edit`, `delete`, `select`.
- **États** : normale, par défaut, sélectionnée, chargement.
- **A11y** : titre `h3` ou texte fort, badge « Par défaut » textuel, actions avec `aria-label` contextualisé.

### 2.3 `Alert`

- **Entrées** : `variant: 'info' | 'success' | 'warning' | 'danger'`, `title?`, `dismissible?`, `role?`.
- **États** : visible, fermé.
- **A11y** : `role="alert"` pour danger, `role="status"` pour info/success ; icône `aria-hidden`.

### 2.4 `Breadcrumb`

- **Entrées** : `items: { label, route? }[]`.
- **A11y** : `<nav aria-label="Fil d'Ariane">`, dernier élément `aria-current="page"`, séparateurs masqués.
- **Mobile** : troncature du milieu, jamais du dernier élément.

### 2.5 `ConfirmDialog`

- **Entrées** : `title`, `description`, `confirmLabel`, `cancelLabel`, `variant`, `loading`.
- **Événements** : `confirmed`, `cancelled`.
- **A11y** : `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, focus initial sur « Annuler », focus trap, Échap/backdrop = annuler, focus restitué.
- **Règle** : jamais de suppression directe sans ce composant.

### 2.6 `EmptyState`

- **Entrées** : `title`, `description`, `icon?`, `illustration?`, `primaryAction?`, `secondaryAction?`.
- **A11y** : titre `h2`/`h3` selon contexte, actions réelles (pas de faux bouton).

### 2.7 `ErrorPage`

- **Entrées** : `code: '404' | '500' | 'offline' | 'maintenance'`, `title`, `description`, `primaryAction`, `secondaryAction?`, `links?`.
- **États** : standard, chargement de la nouvelle tentative, échec répété.
- **A11y** : `h1` unique, code décoratif masqué, focus sur le titre.

### 2.8 `OfflineBanner`

- **Entrées** : `visible`, `retrying`.
- **Événements** : `retry`.
- **A11y** : `role="status"`, `aria-live="polite"`, ne vole pas le focus, texte + icône.

### 2.9 `OrderLineItem`

- **Entrées** : `item: { name, image, size, color, quantity, unitPrice, lineTotal, slug? }`, `compact`.
- **A11y** : image avec `alt` produit, montants lisibles, lien fiche si `slug`.

### 2.10 `Pagination`

- **Entrées** : `page`, `pageCount`, `total?`, `siblingCount?`.
- **Événements** : `pageChange`.
- **A11y** : `<nav aria-label="Pagination">`, page courante `aria-current="page"`, boutons précédent/suivant nommés, ellipse non focusable.
- **Mobile** : version compacte « Page 2 sur 5 » + précédent/suivant.

### 2.11 `PasswordStrengthIndicator`

- **Entrées** : `password`, `minLength = 10`.
- **Sortie** : niveau 0–4, libellé, critères (longueur, diversité, mots courants).
- **A11y** : `aria-live="polite"`, ne pas annoncer à chaque frappe (debounce), texte + couleur.
- **Règle backend** : 10–128 caractères, liste noire ; aucune obligation de majuscule/chiffre.

### 2.12 `StatutBadge`

- **Entrées** : `status: OrderStatus`, `size?`.
- **Mapping** :

| Statut | Libellé | Variante |
| --- | --- | --- |
| `PENDING_CONFIRMATION` | En attente de confirmation | warning |
| `AWAITING_PAYMENT` | En attente de paiement | warning |
| `CONFIRMED` | Confirmée | info |
| `PAID` | Payée | success |
| `PREPARING` | En préparation | info |
| `SHIPPED` | Expédiée | info |
| `DELIVERED` | Livrée | success |
| `DELIVERY_FAILED` | Livraison échouée | danger |
| `CANCELLED` | Annulée | neutral |
| `RETURN_REQUESTED` | Retour demandé | warning |
| `RETURNED` | Retournée | neutral |
| `REFUNDED` | Remboursée | neutral |
| `EXCHANGED` | Échangée | success |

- **A11y** : texte complet, jamais la couleur seule.

### 2.13 `Stepper`

- **Entrées** : `steps: { label }[]`, `current`, `orientation`.
- **États** : à venir, actif, terminé.
- **A11y** : `<ol>`, `aria-current="step"`, étape terminée annoncée « terminée ».

### 2.14 `Textarea`

- **Entrées** : identiques à `Input` + `rows`, `maxlength`, `showCount`.
- **États** : normal, focus, erreur, désactivé, lecture seule.
- **A11y** : label lié, `aria-describedby` pour aide/compteur/erreur, redimensionnement vertical uniquement.

### 2.15 `Timeline`

- **Entrées** : `steps: { label, date?, description?, state: 'done' | 'current' | 'todo' }[]`.
- **A11y** : `<ol>`, `aria-current="step"`, dates dans `<time>`, état textuel.
- **Mobile** : verticale ; desktop : verticale également (pas d'horizontale).

### 2.16 `Accordion`

- **Entrées** : `items: { id, question, answer, category? }[]`, `singleOpen = true`, `openId?`.
- **Événements** : `opened`, `closed`.
- **A11y** : bouton `aria-expanded`, `aria-controls`, panneau `role="region"` + `aria-labelledby`, animations respectant `prefers-reduced-motion`.

### 2.17 `Avatar`

- **Entrées** : `firstName`, `lastName`, `src?`, `size`.
- **Fallback** : initiales, fond token `--bs-color-navy`, texte contrasté.
- **A11y** : `alt` vide si décoratif à côté du nom, sinon « Photo de {nom} ».

---

## 3. Règles transverses

- Aucun composant ne code une couleur en dur : uniquement les tokens `--bs-*`.
- Tous les composants acceptent `class` et exposent un `data-testid`.
- Tous les états `loading` utilisent `Spinner` ou `Skeleton`, jamais un texte seul.
- Tous les boutons désactivés restent lisibles et expliquent pourquoi via `aria-describedby`.
- Les composants ne contiennent aucun texte métier : les libellés viennent des specs.
- Tests unitaires obligatoires pour `ConfirmDialog`, `Accordion`, `Stepper`, `Pagination`, `StatutBadge`.
