# P10 — Livraison

> DSG-04 · étape 2 sur 3 · route proposée `/commande/livraison`

---

## 1. Objectif

Définir **où** et **quand** livrer, et afficher le coût réel avant le paiement. À Douala et Yaoundé, le coursier a besoin d'un quartier et d'un point de repère fiable : ces deux informations sont obligatoires.

L'écran affiche les frais dès la sélection de la ville, applique la livraison offerte dès 2 paires et propose un créneau de préférence, sans jamais le garantir.

**Indicateur de succès** : ≥ 90 % des arrivées valident l'étape ; < 3 % des commandes sans point de repère.

---

## 2. Wireframes

### 2.1 Mobile — 360 px

```text
┌──────────────────────────────────────┐
│ ←   BRUNY SHOPPING      🔒 Sécurisé   │
├──────────────────────────────────────┤
│ ① Coordonnées  ② Livraison  ③ Paiement│
│  ●──────────────●──────────────○      │
├──────────────────────────────────────┤
│ Adresse de livraison                 │
│ Nous livrons à Douala et Yaoundé.    │
│                                      │
│ Ville *                              │
│ ┌──────────────────────────────────┐ │
│ │ Douala — Express 24 h       ▼    │ │
│ └──────────────────────────────────┘ │
│ Livraison offerte (2 paires ou plus) │
│                                      │
│ Quartier *                           │
│ ┌──────────────────────────────────┐ │
│ │ Bonapriso                   ▼    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Point de repère pour le coursier *   │
│ Indispensable pour vous trouver      │
│ ┌──────────────────────────────────┐ │
│ │ Ex. Immeuble bleu, face à la     │ │
│ │ pharmacie du carrefour           │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Créneau préféré                      │
│ ┌──────────────────────────────────┐ │
│ │ ○ Matin        8 h – 12 h        │ │
│ │ ● Après-midi   13 h – 17 h       │ │
│ │ ○ Soir         17 h – 19 h       │ │
│ └──────────────────────────────────┘ │
│                                      │
│      Total à régler  52 500 FCFA     │
│ [   Continuer vers le paiement    → ] │
└──────────────────────────────────────┘
```

### 2.2 Tablette — 768 px

```text
┌─────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING               🔒 Sécurisé  │
├─────────────────────────────────────────────┤
│      ① Coordonnées  ② Livraison  ③ Paiement │
├─────────────────────────────────────────────┤
│  ┌────────────────────────────┬───────────┐ │
│  │ Ville [Douala         ▼]   │ RÉCAP     │ │
│  │ Quartier [Bonapriso   ▼]   │ 52 500    │ │
│  │ Repère [______________]    │ Livraison │ │
│  │ Créneau : 3 cartes en ligne│ 1 500     │ │
│  │                            │ [Continuer]│ │
│  └────────────────────────────┴───────────┘ │
└─────────────────────────────────────────────┘
```

- Formulaire 7 colonnes, récapitulatif 5 colonnes, conteneur 960 px.
- Les trois créneaux passent en ligne horizontale.

### 2.3 Desktop — 1280 px

```text
┌───────────────────────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING                              🔒 Sécurisé     │
├───────────────────────────────────────────────────────────────┤
│              ① Coordonnées   ② Livraison   ③ Paiement          │
├───────────────────────────────────────────────────────────────┤
│   ┌──────────────────────────────────┐  ┌───────────────────┐ │
│   │ Adresse de livraison             │  │ RÉCAPITULATIF     │ │
│   │ Ville *     [Douala        ▼]    │  │ Sous-total 52 500 │ │
│   │ Quartier *  [Bonapriso     ▼]    │  │ Livraison  Offerte│ │
│   │ Repère *    [______________]     │  │ ────────────────  │ │
│   │             [______________]     │  │ Total     52 500  │ │
│   │ Créneau     ○ Matin ○ AM ● Soir  │  │ [Continuer vers   │ │
│   │                                  │  │  le paiement  →]  │ │
│   └──────────────────────────────────┘  └───────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

- Colonnes 640 / 480 px, conteneur 1 200 px.
- Le récapitulatif affiche les frais **avant** le total, avec la mention « Offerte dès 2 paires » si applicable.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `CheckoutHeader` | à créer | — |
| `StepIndicator` | à créer | Étape 2 active |
| `Select` | existant | Ville, quartier |
| `Textarea` | **à créer** | Point de repère (2 lignes min) |
| `RadioCard` | à créer | Créneaux |
| `Alert` | à créer | Zone non desservie, frais indisponibles |
| `OrderSummaryCard` | à créer | Total avec frais |
| `Button` | existant | CTA |
| `StickyActionBar` | à créer | Mobile |
| `Skeleton` | existant | Chargement des zones |

### 3.1 Champs

| Champ | Type | Obligatoire | Source | Validation |
| --- | --- | --- | --- | --- |
| Ville | `select` | oui | `GET /delivery-zones` | Valeur dans la liste |
| Quartier | `select` | oui | zone sélectionnée | Valeur dans la liste |
| Point de repère | `textarea` | oui | saisie | 10–200 caractères |
| Créneau | `radio` | oui | liste fixe | Une valeur parmi 3 |

### 3.2 Règles d'affichage

- Ville : « Douala — Express 24 h », « Yaoundé — 24 à 48 h ». Le délai vient de `estimatedDays`.
- Sous le select ville : « Livraison : 1 500 FCFA » ou « Livraison offerte (2 paires ou plus) ».
- Quartier : liste issue de la zone. Si la liste est vide, un champ texte est affiché à la place, avec le même label.
- Point de repère : compteur « 0 / 200 » discret, aide « Indispensable pour vous trouver ».
- Créneau : 3 `RadioCard`, après-midi sélectionné par défaut.

---

## 4. États

### 4.1 Nominal

Ville par défaut = Douala, quartier vide, repère vide, créneau « Après-midi ». Frais affichés. CTA actif.

### 4.2 Chargement

- Squelette sur les selects (2 lignes) et le récapitulatif.
- « Chargement des zones de livraison… » via `aria-live`.
- CTA désactivé.
- Limite : 8 s puis état d'erreur.

### 4.3 Vide

Aucune zone disponible :

```text
Aucune zone de livraison n'est disponible pour le moment.
Contactez-nous sur WhatsApp : nous organisons votre livraison manuellement.
[ Discuter sur WhatsApp ]
```

Le CTA de poursuite est masqué. Le panier est conservé.

### 4.4 Erreurs

| Cas | Message |
| --- | --- |
| Ville non choisie | « Choisissez votre ville de livraison. » |
| Zone non desservie | « Nous ne livrons pas encore cette ville. Écrivez-nous sur WhatsApp pour une solution. » |
| Quartier vide | « Précisez votre quartier. » |
| Repère vide | « Ajoutez un point de repère : un nom d'immeuble, une rue, un commerce connu. » |
| Repère trop court | « Décrivez le lieu en quelques mots (10 caractères minimum). » |
| Repère trop long | « Limitez le repère à 200 caractères. » |
| Créneau non choisi | « Choisissez un créneau préféré. » |
| Frais indisponibles | « Impossible de calculer les frais de livraison. Réessayez dans un instant. » |
| Erreur réseau | « Connexion interrompue. Vos informations sont conservées. Réessayez. » |

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Titre | « Adresse de livraison » |
| Sous-titre | « Nous livrons à Douala et Yaoundé. » |
| Label ville | « Ville * » |
| Option Douala | « Douala — Express 24 h » |
| Option Yaoundé | « Yaoundé — 24 à 48 h » |
| Frais | « Livraison : {montant} FCFA » |
| Frais offerts | « Livraison offerte (2 paires ou plus) » |
| Label quartier | « Quartier * » |
| Label repère | « Point de repère pour le coursier * » |
| Aide repère | « Indispensable pour vous trouver. Ex. immeuble, rue, commerce connu. » |
| Placeholder repère | « Ex. Immeuble bleu, face à la pharmacie du carrefour » |
| Titre créneau | « Créneau préféré » |
| Créneaux | « Matin 8 h – 12 h » · « Après-midi 13 h – 17 h » · « Soir 17 h – 19 h » |
| Aide créneau | « Nous faisons notre possible pour respecter ce créneau. » |
| CTA | « Continuer vers le paiement » |
| Hors zone | « Votre ville n'est pas encore desservie ? Écrivez-nous sur WhatsApp. » |

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Changement de ville | Met à jour les quartiers, les frais, le délai et le total ; réinitialise le quartier |
| Changement de quartier | Aucun impact tarifaire en MVP ; enregistré dans le brouillon |
| Saisie du repère | Compteur de caractères ; validation au blur |
| Sélection d'un créneau | Met à jour la sélection, une seule à la fois |
| CTA | Valide puis va vers P11 |
| Retour | Vers P09, saisie conservée |
| Clic sur WhatsApp | Ouvre la discussion avec ville et quartier préremplis si possible |

---

## 7. Accessibilité — WCAG 2.1 AA

- **Formulaire** : `fieldset`/`legend` pour le groupe de créneaux ; labels liés.
- **Selects** : `<select>` natif ou composant avec `role="combobox"` complet ; clavier et lecteur d'écran fonctionnels.
- **Textarea** : `rows="3"`, `maxlength="200"`, compteur annoncé `aria-live="polite"` mais non répétitif.
- **Erreurs** : `aria-invalid`, `aria-describedby`, résumé `role="alert"` au submit.
- **Frais** : le changement de total est annoncé via une zone `aria-live="polite"` : « Total mis à jour : 54 000 FCFA ».
- **Cibles** : 44 px minimum pour les `RadioCard`, hauteur 52 px pour les selects.
- **Contraste** : bordure de sélection ≥ 3:1 ; l'état sélectionné ne repose pas uniquement sur la couleur (coche + bordure).
- **Zoom 200 %** : les créneaux passent en colonne, sans perte.
- **Temps** : aucun compte à rebours bloquant sur cet écran.

---

## 8. Données API

| Donnée | Origine | Détail |
| --- | --- | --- |
| `zones[]` | `GET /delivery-zones` **à créer** | `id`, `name`, `cities[]`, `fee`, `estimatedDays` |
| `zoneId` | sélection | Conservé dans le brouillon et envoyé à la création |
| `city` | sélection | `DeliveryZone.cities` |
| `district` | sélection/saisie | `addressSnapshot.district` |
| `landmark` | saisie | `addressSnapshot.landmark` |
| `slot` | sélection | `addressSnapshot.slot` (`morning`, `afternoon`, `evening`) |
| `shippingFee` | zone ou règle 2 paires | `Order.shippingFee` |

Exemple de `addressSnapshot` à la création :

```json
{
  "city": "Douala",
  "district": "Bonapriso",
  "landmark": "Immeuble bleu, face à la pharmacie du carrefour",
  "slot": "afternoon",
  "callBeforeDelivery": true,
  "zoneId": "uuid"
}
```

**Dépendance manquante** : `GET /delivery-zones`. Aucune table de quartiers n'existe : la liste des quartiers doit être fournie par la zone ou saisie libre.

---

## 9. Écarts et décisions

| Constat maquette | Décision |
| --- | --- |
| Ville dessinée en champ texte avec frais dans le libellé | `Select` alimenté par les zones, frais affichés sous le champ |
| Quartier dessiné en champ texte | `Select` si la zone fournit une liste, sinon texte |
| Repère sans compteur ni limite | 10–200 caractères, compteur et validation |
| Créneau absent de la maquette | Ajouté : 3 préférences, non garanti |
| Frais « GRATUIT (OFFERT) » dans le récap | Conservé, avec la règle « 2 paires » explicitée |
| Aucune gestion hors zone | Blocage + alternative WhatsApp |
| Aucun CTA | CTA « Continuer vers le paiement » |

---

## 10. Référence

- Maquette : zone C, carte 2 « Adresse de Livraison ».
- `PARCOURS.md` §5.2, §6, §9.
- `MICROTEXTES.md` §P10.
- `COMPOSANTS-REQUIS.md` — `Textarea`, `RadioCard`, `Alert`.
- Backend : `DeliveryZone`, `Order.addressSnapshot`.
