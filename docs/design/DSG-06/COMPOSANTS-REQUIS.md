# Composants requis — Back-office A01–A16

## Principes

1. Réutiliser les **16 composants** de `@bruny/ui` avant d’en créer un nouveau.
2. Un composant manquant est spécifié ici avant d’apparaître dans une spec.
3. Chaque composant doit gérer ses états **vide, chargement, erreur, succès** lorsqu’il dépend de données.
4. Accessibilité WCAG 2.1 AA par défaut : focus visible, libellés, clavier, contraste.
5. Mobile : cibles 44 px, **48 px pour la vue livreur**.
6. Pas de dépendance externe imposée par ce document.

## Priorités

| Priorité | Signification |
| --- | --- |
| **P0** | Bloquant pour la majorité des écrans ; à livrer en premier |
| **P1** | Nécessaire à un écran ou à une expérience complète |
| **P2** | Confort, optionnel en V1 |

## Catalogue

| # | Composant | Priorité | Props principales | États | Accessibilité |
| --- | --- | --- | --- | --- | --- |
| 1 | `DataTable` | P0 | `columns`, `rows`, `rowKey`, `selectable`, `selected`, `sort`, `onSort`, `loading`, `empty`, `page`, `total`, `onPage`, `actions` | chargement, vide, erreur, sélection, tri | `table` native, `th scope`, `aria-sort`, caption, cases labellisées |
| 2 | `CardList` | P0 | `items`, `renderItem`, `empty`, `loading`, `footer` | chargement, vide, erreur | liste `ul`/`li`, ordre de lecture, actions nommées |
| 3 | `FilterBar` | P0 | `filters`, `values`, `onChange`, `onReset`, `activeCount` | initial, actif, désactivé | labels visibles, puces retirables, groupe nommé |
| 4 | `FilterDrawer` | P0 | `open`, `filters`, `values`, `onApply`, `onReset`, `onClose` | fermé, ouvert, application | bottom sheet, focus piégé, `aria-modal`, restitution |
| 5 | `ActionMenu` | P0 | `items[]`, `label`, `align` | fermé, ouvert, item désactivé | `aria-haspopup="menu"`, flèches, Échap, focus restitué |
| 6 | `StatCard` / `KpiCard` | P0 | `label`, `value`, `context`, `trend`, `tone`, `href` | normal, chargement, indisponible | valeur et libellé liés, variation en texte, pas couleur seule |
| 7 | `StatusBadge` | P0 | `domain` (`order`, `payment`, `product`, `shipment`, `review`, `user`, `coupon`), `status` | statique | texte traduit, contraste AA, pas d’info par couleur seule |
| 8 | `ConfirmDialog` | P0 | `open`, `title`, `message`, `confirmLabel`, `tone`, `loading`, `onConfirm`, `onCancel` | fermé, confirmation, chargement, erreur | `role="dialog"`, focus initial sur Annuler, Échap |
| 9 | `Timeline` | P0 | `events[]`, `dense`, `emptyLabel` | vide, chargée | liste ordonnée, dates lisibles, icônes décoratives |
| 10 | `ImageUploader` | P0 | `images`, `max`, `accept`, `onUpload`, `onRemove`, `onReorder`, `onAltChange` | vide, upload, progression, erreur, complet | bouton accessible, progression annoncée, alternative au drag |
| 11 | `VariantGridGenerator` | P0 | `colors`, `sizes`, `variants`, `maxVariants`, `onGenerate`, `onChange`, `onBulk`, `readonly` | vide, prêt, généré, limite, erreur, enregistrement | table avec en-têtes, labels complets, navigation clavier, 48 px mobile |
| 12 | `TwoFactorCodeInput` | P0 | `length=6`, `value`, `onComplete`, `disabled`, `error`, `autofocus` | vide, partiel, complet, erreur, verrouillé | `inputmode=numeric`, `autocomplete=one-time-code`, collage, annonce |
| 13 | `CommandPalette` | P2 | `open`, `commands[]`, `onSelect`, `onClose` | fermé, recherche, vide, sélection | `role="dialog"`, flèches, Entrée, Échap, focus piégé |
| 14 | `AddressCard` | P1 | `label`, `city`, `district`, `line`, `landmark`, `phone`, `compact` | normal, vide | adresse structurée, téléphone copiable, pas de texte tronqué |
| 15 | `BulkActionsBar` | P0 | `count`, `actions[]`, `onClear`, `sticky` | masquée, visible, chargement | `role="status"` sur le compteur, boutons nommés, sticky sans masquer le focus |
| 16 | `ChartPlaceholder` | P1 | `title`, `data`, `summary`, `loading`, `error` | chargement, données, erreur, vide | résumé textuel, bascule tableau, pas de graphique seul |
| 17 | `Breadcrumb` | P0 | `items[]` (`label`, `href`, `current`) | normal | `nav aria-label="Fil d’Ariane"`, `aria-current="page"` |
| 18 | `EmptyState` | P0 | `title`, `description`, `action`, `illustration`, `tone` | statique | titre `h2`/`h3`, action focusable, pas d’image porteuse d’info seule |
| 19 | `Alert` | P0 | `tone` (`info`, `success`, `warning`, `danger`), `title`, `children`, `action`, `dismissible` | statique, fermé | `role=alert` si critique, `status` sinon, contraste AA |
| 20 | `BottomSheet` | P0 | `open`, `title`, `onClose`, `height`, `children` | fermé, ouvert, plein écran | `role="dialog"`, focus piégé, Échap, poignée décorative |
| 21 | `SearchField` | P1 | `value`, `onChange`, `debounce=300`, `placeholder`, `loading`, `onClear` | vide, saisie, chargement, résultat | `type=search`, label, bouton effacer nommé, annonce du nombre |
| 22 | `Tabs` / `SegmentedControl` | P1 | `tabs[]`, `active`, `onChange`, `variant` | normal, désactivé | `tablist`, `tab`, `aria-selected`, flèches, panneaux liés |
| 23 | `CopyButton` | P1 | `value`, `label`, `feedback` | idle, copié, erreur | bouton nommé, confirmation en `aria-live` |
| 24 | `RoleBadge` | P2 | `role`, `size` | statique | rôle traduit, contraste AA |
| 25 | `DeliveryCardMobile` | P0 | `delivery`, `sequence`, `onCall`, `onNavigate`, `onDeliver`, `onFail`, `pending` | normale, en attente, livrée, échec, hors ligne | actions 48 px, montants lisibles, ordre de lecture, statut textuel |
| 26 | `FileDropzone` | P2 | `accept`, `maxSize`, `onFile`, `disabled` | vide, survol, erreur, fichier | équivalent clavier via bouton, erreurs annoncées |
| 27 | `PasswordStrengthIndicator` | P2 | `password`, `minLength=12` | faible, moyen, fort | texte en plus de la couleur, pas de blocage silencieux |
| 28 | `Stepper` | P0 | `steps[]`, `current`, `onNavigate`, `completed` | normal, courant, complété, erreur | liste ordonnée, `aria-current="step"`, navigation clavier |
| 29 | `ActivityFeed` | P2 | `items[]`, `loading`, `empty` | chargement, vide, données | liste, dates relatives avec valeur exacte, pas d’info couleur seule |

## Primitives dérivées

Ces éléments sont des compositions légères de composants existants ou du catalogue. Ils ne comptent pas dans les 29 composants fondateurs, mais doivent être livrés avec eux.

| Primitive | Dérivée de | Priorité | Rôle |
| --- | --- | --- | --- |
| `Avatar` | `Icon` + initiales | P1 | Identité visuelle dans les listes et fiches |
| `ChipInput` | `Input` + `Badge` + `Button` | P0 | Couleurs et pointures de A05b |
| `DatePicker` | `Input type=date` | P1 | Périodes de coupon et filtres |
| `KpiSticky` | `KpiCard` + conteneur sticky | P0 | Bandeau de A09b, hauteur ≤ 120 px |
| `OfflineBanner` | `Alert` | P0 | État hors ligne persistant de A09b |
| `Pagination` | `DataTable` + `Button` | P0 | Pagination desktop et mobile |
| `RatingStars` | `Icon` | P1 | Note des avis, toujours doublée du texte |
| `SidePanel` | `Modal` | P1 | Détail audit, avis, variante |
| `Textarea` | `Input` | P0 | Description produit, notes, motifs (spécifié DSG-04) |

## Détail des composants P0 critiques

### `DataTable` → `CardList`

Le contrat de données est **le même**. Chaque colonne déclare :

```ts
interface DataColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'end';
  priority?: 'primary' | 'secondary' | 'hidden-mobile';
  render?: (row: T) => unknown;
}
```

- Desktop : `DataTable` affiche toutes les colonnes.
- Mobile : `CardList` affiche `primary` en titre, `secondary` en dessous, `hidden-mobile` uniquement dans le détail.
- La colonne d’actions n’est jamais rendue comme une colonne de données : elle devient un `ActionMenu` ou des boutons.
- La sélection est désactivée sur mobile pour les listes sans action groupée.

### `StatusBadge`

Mapping obligatoire, jamais d’enum brut :

| Domaine | Statut | Libellé | Ton |
| --- | --- | --- | --- |
| Commande | `PENDING_CONFIRMATION` | À valider | warning |
| Commande | `AWAITING_PAYMENT` | En attente de paiement | warning |
| Commande | `CONFIRMED` | Confirmée | info |
| Commande | `PAID` | Payée | success |
| Commande | `PREPARING` | En préparation | info |
| Commande | `SHIPPED` | Expédiée | info |
| Commande | `DELIVERED` | Livrée | success |
| Commande | `DELIVERY_FAILED` | Échec de livraison | danger |
| Commande | `CANCELLED` | Annulée | neutral |
| Commande | `RETURN_REQUESTED` | Retour demandé | warning |
| Commande | `RETURNED` | Retournée | neutral |
| Commande | `REFUNDED` | Remboursée | neutral |
| Commande | `EXCHANGED` | Échangée | success |
| Paiement | `PENDING` | En attente | warning |
| Paiement | `SUCCEEDED` | Payée | success |
| Paiement | `FAILED` | Échouée | danger |
| Paiement | `REFUNDED` | Remboursée | neutral |
| Produit | `DRAFT` | Brouillon | neutral |
| Produit | `PUBLISHED` | Publié | success |
| Produit | `ARCHIVED` | Archivé | neutral |
| Livraison | `PENDING` | À assigner | warning |
| Livraison | `ASSIGNED` | Assignée | info |
| Livraison | `IN_TRANSIT` | En cours | info |
| Livraison | `DELIVERED` | Livrée | success |
| Livraison | `FAILED` | Échec | danger |
| Livraison | `RETURNED` | Retournée | neutral |
| Avis | `PENDING` | En attente | warning |
| Avis | `APPROVED` | Approuvé | success |
| Avis | `REJECTED` | Rejeté | danger |
| Utilisateur | `ACTIVE` | Actif | success |
| Utilisateur | `SUSPENDED` | Suspendu | danger |
| Utilisateur | `DISABLED` | Désactivé | neutral |
| Utilisateur | `PENDING_VERIFICATION` | Invitation envoyée | warning |

### `VariantGridGenerator`

Contrat minimal :

```ts
interface VariantDraft {
  id?: string;
  color: string;
  size: string;
  sku?: string; // lecture seule
  price: number | null;
  stock: number;
  lowStockThreshold: number;
  linkedToOrder?: boolean;
}
```

- `maxVariants = 300`, `maxColors = 30`, `maxSizes = 30`.
- Le composant ne calcule pas le SKU final ; il affiche un aperçu et un avertissement.
- Toute cellule liée à une commande est non supprimable.
- Les actions groupées sont annulées si le nombre sélectionné est 0.

### `DeliveryCardMobile`

- Hauteur de cible ≥ 48 px pour chaque action.
- Ordre : séquence, référence, client, adresse, articles, montant, statut, actions.
- `pending` affiche « En attente de synchronisation » et désactive les actions.
- Aucune information critique uniquement par couleur.

## Ce qui n’est pas un nouveau composant

- Le shell admin (sidebar, header) est un **layout**, pas un composant de la bibliothèque.
- Les cartes de section (hero, résumé) sont des compositions de `Card`, `Badge`, `Button`.
- Les pages ne doivent pas réimplémenter `Table`, `Modal`, `Badge` ou `Button`.

## Ordre de livraison recommandé

1. `DataTable` + `CardList` + `BulkActionsBar`.
2. `FilterBar` + `FilterDrawer` + `SearchField`.
3. `StatusBadge` + `EmptyState` + `Alert` + `ConfirmDialog`.
4. `BottomSheet` + `ActionMenu` + `Breadcrumb`.
5. `VariantGridGenerator` + `ImageUploader`.
6. `TwoFactorCodeInput` + `DeliveryCardMobile`.
7. `StatCard`, `Timeline`, `Tabs`, `Stepper`, `ChartPlaceholder`.
8. Le reste en P1/P2.
