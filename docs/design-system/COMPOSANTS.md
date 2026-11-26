# Composants — Design System BrunyShop

**Version** : 1.0.0
**Périmètre** : `frontend/libs/ui/src/lib/`.
**Framework** : Angular standalone, signals, `OnPush`, sans CDK ni librairie UI externe.

## 1. Catalogue livré

| Composant | Sélecteur | Rôle | Variantes / tailles |
|---|---|---|---|
| Button | `bruny-button` | Action | primary, secondary, ghost, danger, whatsapp ; sm/md/lg |
| Input | `bruny-input` | Champ texte | text, email, tel, password, search, number ; icône, préfixe |
| Select | `bruny-select` | Choix natif | sm/md ; placeholder, hint, erreur |
| Checkbox | `bruny-checkbox` | Choix multiple | coché, indéterminé, désactivé |
| Radio | `bruny-radio` | Choix unique | coché, désactivé |
| Toggle | `bruny-toggle` | Interrupteur | actif, inactif, chargement |
| Badge | `bruny-badge` | Statut/label | 9 variantes, sm/md, dot |
| ProductCard | `bruny-product-card` | Produit en grille | loading, favori, pointures, ajout |
| PriceTag | `bruny-price-tag` | Prix | sm/md/lg, prix barré |
| SizeSelector | `bruny-size-selector` | Pointures | sélection, stock, épuisé, lecture seule |
| Modal | `bruny-modal` | Dialogue | sm/md/lg, focus trap |
| Toast | `bruny-toast` | Notification | error, success, warning, info |
| Skeleton | `bruny-skeleton` | Chargement | rect, text, circle, card |
| Spinner | `bruny-spinner` | Attente | sm/md/lg, inline |
| Table | `bruny-table` | Données admin | tri, pagination, actions, chargement |
| Icon | `bruny-icon` | SVG inline | tailles, décoratif ou nommé |

## 2. Contrats et états

### Button

- **Entrées** : `variant`, `size`, `type`, `disabled`, `loading`, `block`, `iconOnly`, `ariaLabel`.
- **États** : normal, survol, focus, actif, désactivé, chargement.
- **Règles** : une seule action primaire par écran ; `iconOnly` exige `ariaLabel` ; le chargement conserve la largeur ; pas de spinner sans texte alternatif.
- **Défauts** : bordure secondaire/ghost sous 3:1 ; `ariaLabel` non obligatoire.
- **Tickets** : DSG-07-FIX-C01, DSG-07-FIX-C02.

### Input

- **Entrées** : `label`, `name`, `id`, `type`, `value`, `placeholder`, `hint`, `error`, `prefix`, `icon`, `autocomplete`, `inputMode`, `required`, `disabled`, `loading`.
- **États** : vide, rempli, focus, erreur, désactivé, chargement.
- **Règles** : label persistant ; erreur sous le champ ; `aria-invalid` ; `aria-describedby` vers hint/erreur ; `autocomplete` explicite.
- **Défaut** : bordure `#DCE0E7` à 1,32:1.
- **Ticket** : DSG-07-FIX-C03.

### Select

- **Entrées** : `label`, `name`, `id`, `options`, `value`, `placeholder`, `hint`, `error`, `required`, `disabled`, `loading`.
- **Règles** : `<select>` natif ; option vide explicite ; erreur reliée ; pas de menu custom sans besoin.
- **Défaut** : bordure 1,32:1.
- **Ticket** : DSG-07-FIX-C03.

### Checkbox

- **Entrées** : `label`, `name`, `id`, `checked`, `indeterminate`, `hint`, `error`, `disabled`.
- **Règles** : label cliquable ; état indéterminé annoncé ; erreur reliée.
- **Défaut** : `aria-describedby` pointe vers un `id` absent quand `error` est fourni.
- **Tickets** : DSG-07-FIX-C04, DSG-07-FIX-C05.

### Radio

- **Entrées** : `label`, `name`, `value`, `id`, `checked`, `hint`, `error`, `disabled`.
- **Règles** : même `name` pour le groupe ; navigation aux flèches native ; erreur au niveau du groupe.
- **Défaut** : `aria-describedby` vers un `id` absent.
- **Tickets** : DSG-07-FIX-C04, DSG-07-FIX-C05.

### Toggle

- **Entrées** : `label`, `name`, `id`, `checked`, `hint`, `error`, `disabled`, `loading`.
- **Règles** : `role="switch"`, `aria-checked`, label cliquable, état annoncé.
- **Défaut** : `aria-describedby` vers un `id` absent.
- **Tickets** : DSG-07-FIX-C04, DSG-07-FIX-C05.

### Badge

- **Entrées** : `variant`, `size`, `dot`.
- **Variantes** : accent, neutral, success, warning, danger, info, whatsapp, outline, navy.
- **Règles** : texte + couleur + icône si nécessaire ; contraste AA ; jamais la couleur seule.
- **Défaut** : pas de `StatusBadge` métier.
- **Ticket** : DSG-07-FIX-05.

### ProductCard

- **Entrées** : `product`, `loading`, `showSizes`, `showAdd`, `isNew`, `favorite`.
- **Sorties** : `add`, `favoriteChange`.
- **États** : normal, chargement, favori, stock faible, épuisé.
- **Règles** : un seul lien principal vers la fiche ; CTA « Ajouter au panier » contextualisé ; image avec `alt` ; prix lisible.
- **Défauts** : deux liens vers le même produit ; CTA générique ; densité non configurable.
- **Ticket** : DSG-07-FIX-C06.

### PriceTag

- **Entrées** : `amount`, `compareAt`, `size`.
- **Règles** : « 25 000 FCFA » avec espace insécable ; prix barré accompagné de « Prix initial » en SR-only.
- **Défaut** : prix barré sans libellé accessible.
- **Tickets** : DSG-07-FIX-C07, DSG-07-FIX-07.

### SizeSelector

- **Entrées** : `items`, `selected`, `readonly`, `maxItems`, `loading`.
- **Sortie** : `select`.
- **États** : sélectionné, disponible, stock faible, épuisé, chargement, lecture seule.
- **Règles** : nom accessible complet ; état épuisé nommé ; cible 44 px ; pas de couleur seule.
- **Défaut** : l’état indisponible n’est pas nommé « indisponible » ; le stock faible n’est pas exposé.
- **Ticket** : DSG-07-FIX-C08.

### Modal

- **Entrées** : `open`, `title`, `id`, `size`, `closeOnBackdrop`.
- **Sorties** : `openChange`, `closed`.
- **Règles** : `role="dialog"`, `aria-modal="true"`, titre relié, focus trap, Échap, restitution du focus, scroll bloqué.
- **État** : conforme pour le dialogue standard ; `ConfirmDialog` métier absent.
- **Ticket** : DSG-07-FIX-09.

### Toast

- **Entrées** : `variant`, `title`, `closable`, `duration`, contenu projeté.
- **Règles** : `aria-live` adapté, pause au survol/focus, fermeture manuelle, pas d’information critique exclusive.
- **Défaut** : fermeture automatique sans pause.
- **Ticket** : DSG-07-FIX-C09.

### Skeleton

- **Entrées** : `variant`, `width`, `height`, `radius`, `lines`.
- **Règles** : `aria-hidden="true"` sur le squelette, `aria-busy="true"` et texte sur le conteneur.
- **Défaut** : chargement non annoncé seul.
- **Ticket** : DSG-07-FIX-C10.

### Spinner

- **Entrées** : `size`, `label`, `inline`.
- **Règles** : `role="status"`, label lisible, pas de clignotement.
- **État** : conforme.

### Table

- **Entrées** : `columns`, `rows`, `loading`, `emptyMessage`, `caption`, `page`, `pageSize`, `total`, `sortKey`, `sortDirection`, `actions`.
- **Sorties** : `sortChange`, `pageChange`, `action`.
- **Règles** : caption, `scope`, tri annoncé, pagination nommée, chargement `aria-busy`, actions contextualisées.
- **Défauts** : caption optionnelle ; actions répétées sans nom de ligne ; chargement non annoncé.
- **Ticket** : DSG-07-FIX-C11.

### Icon

- **Entrées** : `name`, `size`, `label`.
- **Règles** : `aria-hidden="true"` par défaut ; `role="img"` + `aria-label` si informatif ; jamais focusable.
- **État** : conforme.

## 3. Composants manquants

Ces composants sont nécessaires aux specs mais ne sont pas livrés. Ils sont ticketés, pas inventés dans le code par DSG-07.

| Composant | Besoin | Priorité | Ticket |
|---|---|---|---|
| `StatusBadge` | 30+ statuts métier | P0 | DSG-07-FIX-05 |
| `CardList` | Tables admin en cartes mobiles | P0 | DSG-07-FIX-10 |
| `ConfirmDialog` | Suppressions, `alertdialog` | P0 | DSG-07-FIX-09 |
| `Tabs` | Compte, admin, filtres | P1 | DSG-07-FIX-11 |
| `Stepper` | Tunnel de commande | P1 | DSG-07-FIX-12 |
| `Timeline` | Suivi de commande | P1 | DSG-07-FIX-12 |
| `Alert` | Erreurs et informations | P1 | DSG-07-FIX-13 |
| `EmptyState` | Panier, favoris, listes | P1 | DSG-07-FIX-13 |
| `OrderSummaryCard` | Récapitulatif unique | P1 | DSG-07-FIX-31 |
| `FilterBar` | Filtres desktop/mobile | P1 | DSG-07-FIX-30 |
| `ImageUploader` | Admin produits | P1 | DSG-07-FIX-10 |
| `Pagination` | Listes | P2 | DSG-07-FIX-28 |

## 4. Règles de composition

- **Un seul primaire** par écran.
- **Une action destructrice** est toujours `danger` + confirmation.
- **Un formulaire** a un label par champ, une aide si nécessaire, une erreur localisée.
- **Une liste** a un état vide, un état chargement et un état erreur.
- **Une table** a une version carte en dessous de 768 px.
- **Une modale** a un titre, une action de fermeture, un focus initial et une restitution.
- **Un toast** ne remplace pas un message inline.
- **Un badge** ne porte jamais seul une information critique.
- **Une carte produit** n’a qu’un lien principal.
- **Un composant** ne contient aucune couleur brute.

## 5. Tests composants

Chaque composant doit avoir :

- un test de rendu par variante ;
- un test d’état (chargement, erreur, désactivé, vide) ;
- un test clavier (Entrée/Espace, Échap, flèches si groupe) ;
- un test ARIA (nom, rôle, état, `aria-describedby`) ;
- un test de contraste sur les tokens critiques.

Les tests existent pour les composants livrés ; ils ne couvrent pas encore les défauts listés ci-dessus. Voir `ACCESSIBILITY.md` pour les tests manuels à exécuter.
