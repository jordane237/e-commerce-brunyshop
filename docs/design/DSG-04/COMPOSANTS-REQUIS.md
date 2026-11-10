# COMPOSANTS REQUIS — P08 à P13

> DSG-04 · inventaire des composants à réutiliser, étendre ou créer.
> Aucune implémentation dans ce ticket. Les API proposées sont des **contrats de conception**, pas du code.

---

## 1. Synthèse

| Catégorie | Nombre |
| --- | --- |
| Composants `@bruny/ui` réutilisés tels quels | 9 |
| Composants existants à étendre | 3 |
| Composants à créer (spécifiques tunnel/suivi) | 14 |
| Composants de shell à créer | 4 |

---

## 2. Composants existants réutilisés

| Composant | Fichier | Usage | Points à vérifier |
| --- | --- | --- | --- |
| `Button` | `libs/ui/src/lib/button/` | Tous les CTA | `loading`, `block`, `disabled`, variante `whatsapp` |
| `Input` | `lib/input/` | Nom, téléphone, référence | `type="tel"`, `inputMode`, `error`, `hint`, `autocomplete` |
| `Select` | `lib/select/` | Ville, quartier, créneau (non) | Accessibilité clavier, état erreur |
| `Radio` | `lib/radio/` | Base de `RadioCard` | Groupe, `disabled` |
| `Checkbox` | `lib/checkbox/` | Appel avant livraison, CGV | Erreur, `required` |
| `Badge` | `lib/badge/` | Statuts, « Recommandé », « Bientôt disponible » | Variantes sémantiques, contraste |
| `PriceTag` | `lib/price-tag/` | Prix unitaires, totaux | Format XAF, taille |
| `Skeleton` | `lib/skeleton/` | Chargements | Formes ligne / carte |
| `Icon` | `lib/icon/` | Flèches, statuts, WhatsApp | Jeu disponible à confirmer |
| `Spinner` | `lib/spinner/` | Vérification, création | Taille, contraste |
| `Toast` | `lib/toast/` | Copie de référence | Durée, `aria-live` |
| `Modal` | `lib/modal/` | CGV, aide | Focus trap, fermeture Échap |

### 2.1 Extensions demandées

| Composant | Extension |
| --- | --- |
| `Input` | Support `type="tel"` avec préfixe non éditable et normalisation |
| `Badge` | Variantes `success`, `warning`, `danger`, `neutral`, `accent` |
| `Select` | État `loading` et message « Aucune option disponible » |

---

## 3. Composants à créer

### 3.1 `CheckoutHeader`

| Propriété | Type | Défaut | Description |
| --- | --- | --- | --- |
| `backLink` | `string \| null` | `null` | Route de retour ; masque la flèche si `null` |
| `secureLabel` | `string` | « Commande sécurisée » | Badge à droite |
| `onBack` | événement | — | Demande de confirmation si tunnel en cours |

États : normal, retour désactivé pendant la création.
Accessibilité : `header`, lien retour avec `aria-label="Revenir à l'étape précédente"`.

---

### 3.2 `StepIndicator`

| Propriété | Type | Défaut | Description |
| --- | --- | --- | --- |
| `steps` | `{ label: string; route?: string }[]` | 3 étapes | Libellés « Coordonnées », « Livraison », « Paiement » |
| `current` | `number` | `0` | `0` = aucune étape active (P08) |
| `completed` | `number[]` | `[]` | Étapes validées, cliquables |
| `compact` | `boolean` | `false` | Mobile : pastilles + libellé courant |

États : aucune active, étape active, étape complétée, étape future désactivée.
Accessibilité : `nav aria-label="Étapes de la commande"`, `<ol>`, `aria-current="step"`, futurs `aria-disabled="true"`.

---

### 3.3 `OrderLineItem`

| Propriété | Type | Description |
| --- | --- | --- |
| `image` | `string` | Visuel 72 / 96 px selon densité |
| `name` | `string` | Nom complet, 2 lignes max |
| `size` | `string` | Pointure |
| `color` | `string` | Couleur |
| `quantity` | `number` | Quantité |
| `unitPrice` | `number` | Entier XAF |
| `density` | `'compact' \| 'comfortable'` | Tunnel / récapitulatif |
| `href` | `string \| null` | `null` dans le tunnel |

Accessibilité : image décorative si le nom est adjacent ; prix lu avec son libellé.

---

### 3.4 `OrderSummaryCard`

| Propriété | Type | Description |
| --- | --- | --- |
| `subtotal` | `number` | Sous-total XAF |
| `shippingFee` | `number \| null` | `null` = « calculée à l'étape suivante » |
| `shippingLabel` | `string` | « Offerte » si 0 |
| `total` | `number` | Total |
| `paymentNote` | `string` | « Payable au coursier, après essayage » |
| `ctaLabel` | `string` | Libellé du CTA |
| `ctaDisabled` | `boolean` | — |
| `loading` | `boolean` | — |
| `sticky` | `boolean` | Desktop |
| `collapsibleItems` | `boolean` | Tablette |

États : normal, chargement, CTA désactivé, total mis à jour (surbrillance 2 s).
Accessibilité : `aside`, totaux en `dl`, annonce du changement de total.

---

### 3.5 `Textarea`

| Propriété | Type | Description |
| --- | --- | --- |
| `label`, `name`, `value` | `string` | — |
| `rows` | `number` | 3 par défaut |
| `maxlength` | `number` | 200 |
| `hint`, `error` | `string` | — |
| `showCounter` | `boolean` | — |

Accessibilité : compteur `aria-live="polite"`, erreur liée, redimensionnement vertical seulement.

---

### 3.6 `RadioCard`

| Propriété | Type | Description |
| --- | --- | --- |
| `title` | `string` | — |
| `description` | `string` | — |
| `badge` | `string \| null` | — |
| `extra` | `string \| null` | Ligne avec coche |
| `checked` | `boolean` | — |
| `disabled` | `boolean` | — |
| `value` | `string` | — |

États : non sélectionnée, sélectionnée, désactivée, focus, erreur de groupe.
Accessibilité : `input[type=radio]` réel, carte cliquable via `label`, désactivée retirée du tab order.

---

### 3.7 `Alert`

| Propriété | Type | Description |
| --- | --- | --- |
| `variant` | `'info' \| 'success' \| 'warning' \| 'danger'` | — |
| `title` | `string` | — |
| `message` | `string` | — |
| `actionLabel`, `actionHref` | `string` | Action optionnelle |
| `dismissible` | `boolean` | — |

Accessibilité : `role="alert"` pour danger, `role="status"` pour info ; icône + texte, jamais la couleur seule.

---

### 3.8 `TrustPanel`

| Propriété | Type | Description |
| --- | --- | --- |
| `items` | `{ icon: string; title: string; description?: string }[]` | 3 maximum |
| `layout` | `'row' \| 'column'` | Desktop / mobile |
| `compact` | `boolean` | Variante une ligne |

---

### 3.9 `StickyActionBar`

| Propriété | Type | Description |
| --- | --- | --- |
| `total` | `number \| null` | Affiché à gauche |
| `totalLabel` | `string` | « Total à régler » |
| `ctaLabel` | `string` | — |
| `ctaDisabled`, `loading` | `boolean` | — |

Comportement : apparaît quand le CTA principal sort du viewport ; `position: sticky; bottom: 0` ; respecte `safe-area-inset-bottom`.
Accessibilité : duplique le CTA principal — éviter deux éléments identiques dans l'ordre de tabulation (le CTA du contenu reste focusable, la barre est un miroir visuel avec `aria-hidden` sur le doublon, ou inversement).

---

### 3.10 `CopyButton`

| Propriété | Type | Description |
| --- | --- | --- |
| `value` | `string` | Texte copié |
| `label` | `string` | « Copier la référence » |
| `successLabel` | `string` | « Référence copiée » |

Accessibilité : `aria-label` incluant la valeur, confirmation via `Toast` et `aria-live`.

---

### 3.11 `Timeline`

| Propriété | Type | Description |
| --- | --- | --- |
| `steps` | `{ label: string; timestamp?: string; status: 'done' \| 'current' \| 'todo'; detail?: string }[]` | 5 étapes |
| `cancelled` | `boolean` | Branche annulation |

Règles : une seule étape `current`, horodatage pour `done`, « À venir » pour `todo`.
Accessibilité : `<ol>`, `aria-current="step"`, texte de statut explicite.

---

### 3.12 `CourierCard`

| Propriété | Type | Description |
| --- | --- | --- |
| `name`, `rating`, `vehicleLabel` | `string` | — |
| `phone` | `string \| null` | Masqué si non assigné |
| `whatsappHref`, `callHref` | `string \| null` | — |

États : assigné, non assigné (bloc masqué), livré (remplacé par un message).
Accessibilité : boutons avec libellés complets, numéro non exposé dans le DOM si masqué.

---

### 3.13 `AddressCard`

| Propriété | Type | Description |
| --- | --- | --- |
| `city`, `district`, `landmark` | `string` | — |
| `phoneMasked` | `string` | `6 94 ** ** 44` |
| `mapImage` | `string \| null` | Image statique décorative |

---

### 3.14 `AmountDueCard`

| Propriété | Type | Description |
| --- | --- | --- |
| `amount` | `number` | XAF |
| `paid` | `boolean` | Si vrai : « Réglée » |
| `note` | `string` | « Payable au coursier, après essayage » |

---

## 4. Composants de shell

| Composant | Écrans | Description |
| --- | --- | --- |
| `StorefrontHeader` | P12, P13 | Logo, panier ou liens, WhatsApp |
| `CheckoutHeader` | P08–P11c | Retour, logo, badge sécurité |
| `BottomNav` | P12, P13 | Boutique, Recherche, Commandes, WhatsApp |
| `CheckoutLayout` | P08–P11c | Header + stepper + contenu + récapitulatif |

---

## 5. Matrice écrans × composants

| Composant | P08 | P09 | P10 | P11 | P11b | P11c | P12 | P13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CheckoutHeader` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| `StorefrontHeader` | — | — | — | — | — | — | ✓ | ✓ |
| `StepIndicator` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| `OrderLineItem` | ✓ | — | — | ✓ | — | — | ✓ | — |
| `OrderSummaryCard` | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| `Textarea` | — | — | ✓ | — | — | — | — | — |
| `RadioCard` | — | — | ✓ | ✓ | — | — | — | — |
| `Alert` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `TrustPanel` | ✓ | ✓ | — | — | — | — | ✓ | ✓ |
| `StickyActionBar` | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| `CopyButton` | — | — | — | — | ✓ | ✓ | ✓ | — |
| `Timeline` | — | — | — | — | — | — | — | ✓ |
| `CourierCard` | — | — | — | — | — | — | — | ✓ |
| `AddressCard` | — | — | — | — | — | — | ✓ | ✓ |
| `AmountDueCard` | — | — | — | — | — | — | — | ✓ |
| `BottomNav` | — | — | — | — | — | — | ✓ | ✓ |

---

## 6. Règles transverses

1. **Tous les composants sont standalone**, cohérents avec `@bruny/ui`.
2. **Signaux** pour l'état local, `input()` / `output()` pour l'API, pas de `@Input` décorateur.
3. **Aucun composant ne formate un montant lui-même** : utiliser le pipe `fcfa`.
4. **Aucun composant ne connaît l'API** : les données arrivent par `input`.
5. **Aucun composant ne définit de couleur brute** : uniquement les tokens `--bs-*`.
6. **États obligatoires** : normal, hover, focus, active, disabled, loading, error.
7. **Aucun texte en dur dans un composant réutilisable** : libellés passés en entrée, valeurs par défaut dans `MICROTEXTES.md`.
8. **Aucune dépendance nouvelle** n'est justifiée par DSG-04.

---

## 7. Priorisation

| Priorité | Composants | Justification |
| --- | --- | --- |
| **P0** | `CheckoutHeader`, `StepIndicator`, `OrderSummaryCard`, `RadioCard`, `Alert`, `Timeline` | Bloquants pour tout écran |
| **P1** | `Textarea`, `OrderLineItem`, `TrustPanel`, `StickyActionBar`, `CourierCard` | Nécessaires au MVP |
| **P2** | `CopyButton`, `AddressCard`, `AmountDueCard`, `ProgressBar` | Confort et V2 |
| **P3** | `BottomNav`, `StorefrontHeader`, `CheckoutLayout` | Shell, à coordonner avec les autres tickets |

---

## 8. Références

- `frontend/libs/ui/src/index.ts`
- `docs/design-system/tokens-reference.md`
- Specs `P08` à `P13`.
