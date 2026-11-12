# P11 — Paiement et confirmation de commande

> DSG-04 · étape 3 sur 3 · route proposée `/commande/paiement`

---

## 1. Objectif

Permettre au client de choisir son mode de paiement, de vérifier une dernière fois sa commande et d'accepter les conditions, puis de créer la commande.

En MVP, **un seul mode est actif** : le paiement à la livraison. Mobile Money est affiché, désactivé et daté « Bientôt disponible » pour annoncer la suite sans la promettre. Cet écran ne contient **aucun champ bancaire**.

**Indicateur de succès** : ≥ 85 % des arrivées confirment ; taux d'échec technique < 2 % ; zéro double commande.

---

## 2. Wireframes

### 2.1 Mobile — 360 px

```text
┌──────────────────────────────────────┐
│ ←   BRUNY SHOPPING      🔒 Sécurisé   │
├──────────────────────────────────────┤
│ ① Coordonnées  ② Livraison  ③ Paiement│
│  ●──────────────●──────────────●      │
├──────────────────────────────────────┤
│ Mode de paiement                     │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ● Paiement à la livraison        │ │
│ │   RECOMMANDÉ                     │ │
│ │   Espèces, Orange Money ou MTN   │ │
│ │   MoMo remis au coursier         │ │
│ │   ✓ Vous essayez avant de payer  │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ○ Orange Money & MTN MoMo direct │ │
│ │   Bientôt disponible       (grisé)│ │
│ └──────────────────────────────────┘ │
│                                      │
│ Articles commandés (2)    Modifier   │
│ Mocassin Cuir Glacé · 41 · 1  24 500 │
│ Richelieu Oxford · 42 · 1     28 000 │
│                                      │
│ Sous-total            52 500 FCFA    │
│ Livraison               Offerte      │
│ ──────────────────────────────────── │
│ Total à régler        52 500 FCFA    │
│                                      │
│ ☐ J'accepte les conditions générales │
│   de vente et la politique de retour │
│                                      │
│ [     Confirmer la commande       ]   │
│ 🔒 Aucun paiement en ligne. Vous     │
│    réglez au coursier après essayage.│
└──────────────────────────────────────┘
```

La barre d'action collante reprend le total et le CTA dès que le contenu dépasse l'écran.

### 2.2 Tablette — 768 px

```text
┌─────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING               🔒 Sécurisé  │
├─────────────────────────────────────────────┤
│      ① Coordonnées  ② Livraison  ③ Paiement │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────┬────────────┐ │
│  │ Mode de paiement          │ RÉCAP      │ │
│  │ [COD RadioCard]           │ Sous-total │ │
│  │ [MoMo désactivé]          │ Livraison  │ │
│  │ ☐ CGV                     │ Total      │ │
│  │                           │ [Confirmer]│ │
│  └───────────────────────────┴────────────┘ │
└─────────────────────────────────────────────┘
```

- Formulaire 7 colonnes, récapitulatif 5 colonnes, conteneur 960 px.
- Les articles sont repliés dans le récapitulatif tablette (`<details>`).

### 2.3 Desktop — 1280 px

```text
┌───────────────────────────────────────────────────────────────┐
│ ←  BRUNY SHOPPING                              🔒 Sécurisé     │
├───────────────────────────────────────────────────────────────┤
│              ① Coordonnées   ② Livraison   ③ Paiement          │
├───────────────────────────────────────────────────────────────┤
│   ┌──────────────────────────────────┐  ┌───────────────────┐ │
│   │ Mode de paiement                 │  │ VOTRE COMMANDE    │ │
│   │ ┌──────────────────────────────┐ │  │ 2 articles        │ │
│   │ │ ● Paiement à la livraison    │ │  │ Sous-total 52 500 │ │
│   │ │   Recommandé · essayage      │ │  │ Livraison  Offerte│ │
│   │ └──────────────────────────────┘ │  │ ────────────────  │ │
│   │ ┌──────────────────────────────┐ │  │ Total     52 500  │ │
│   │ │ ○ Mobile Money (bientôt)     │ │  │ ☐ CGV             │ │
│   │ └──────────────────────────────┘ │  │ [Confirmer la     │ │
│   │                                  │  │  commande      →] │ │
│   └──────────────────────────────────┘  └───────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

- Colonnes 640 / 480 px, conteneur 1 200 px.
- Le récapitulatif est `sticky` et contient la case CGV et le CTA.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `CheckoutHeader` | à créer | — |
| `StepIndicator` | à créer | Étape 3 active |
| `RadioCard` | à créer | COD (sélectionnée), Mobile Money (désactivée) |
| `Checkbox` | existant | Acceptation CGV |
| `OrderSummaryCard` | à créer | Articles + totaux + CTA |
| `OrderLineItem` | à créer | Lignes compactes |
| `Button` | existant | Confirmer, loading |
| `Alert` | à créer | Stock, prix, réseau, doublon |
| `StickyActionBar` | à créer | Mobile |
| `Modal` | existant | Détail des CGV (ou lien) |

### 3.1 `RadioCard` — spécification

| Propriété | Valeur |
| --- | --- |
| `title` | « Paiement à la livraison » |
| `description` | « Espèces, Orange Money ou MTN MoMo remis au coursier » |
| `badge` | « Recommandé » (or, texte navy) |
| `checked` | oui par défaut, non décochable |
| `disabled` | non |
| `extra` | « Vous essayez avant de payer » avec coche verte |

Deuxième carte :

| Propriété | Valeur |
| --- | --- |
| `title` | « Orange Money & MTN MoMo direct » |
| `description` | « Paiement en ligne avant expédition » |
| `badge` | « Bientôt disponible » (neutre) |
| `disabled` | oui |
| `aria-disabled` | `true`, retirée de l'ordre de tabulation |

---

## 4. États

### 4.1 Nominal

COD sélectionné, CGV non cochées, CTA actif mais bloqué tant que les CGV ne sont pas acceptées. Total à jour.

### 4.2 Chargement

- Après clic sur « Confirmer la commande » : bouton `loading`, libellé « Création de votre commande… », tous les champs désactivés.
- Blocage des clics répétés dès le premier clic.
- Limite : 15 s, puis erreur avec « Réessayer ». La clé d'idempotence garantit l'absence de doublon.

### 4.3 Vide

Sans objet : un panier vide redirige vers `/panier` (voir P08). Si le panier devient vide pendant l'écran, bandeau « Votre panier est vide. Retournez à la boutique. » et CTA désactivé.

### 4.4 Erreurs

| Cas | Message | Action |
| --- | --- | --- |
| CGV non cochées | « Acceptez les conditions générales pour confirmer votre commande. » | Focus sur la case |
| Panier modifié | « Votre panier a changé. Vérifiez les articles et le total avant de confirmer. » | Recalcul, bandeau |
| Prix modifié | « Le prix d'un article a changé. Nouveau total : {montant} FCFA. » | Validation explicite |
| Stock épuisé | « {Produit} n'est plus disponible en pointure {taille}. Retirez-le pour continuer. » | Lien panier |
| Zone supprimée | « Cette zone de livraison n'est plus desservie. Choisissez une autre adresse. » | Retour P10 |
| Erreur réseau | « Votre commande n'a pas été enregistrée. Vérifiez votre connexion et réessayez. » | Réessayer |
| Délai dépassé | « La confirmation prend plus de temps que prévu. Vérifiez votre connexion. » | Réessayer |
| Doublon détecté | Redirection silencieuse vers P12 de la commande existante | — |

Règle : en cas d'erreur, **le panier n'est jamais vidé** et la saisie précédente reste intacte.

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Titre | « Mode de paiement » |
| Sous-titre | « Choisissez comment vous souhaitez régler votre commande. » |
| COD titre | « Paiement à la livraison » |
| COD badge | « Recommandé » |
| COD description | « Espèces, Orange Money ou MTN MoMo remis directement au coursier. » |
| COD avantage | « Vous essayez vos chaussures avant de payer. » |
| MoMo titre | « Orange Money & MTN MoMo direct » |
| MoMo description | « Paiement en ligne avant expédition. » |
| MoMo badge | « Bientôt disponible » |
| Section articles | « Articles commandés ({n}) » |
| Lien | « Modifier » |
| CGV | « J'accepte les conditions générales de vente et la politique de retour. » |
| Lien CGV | « Lire les conditions générales » |
| CTA | « Confirmer la commande » |
| CTA chargement | « Création de votre commande… » |
| Mention | « Aucun paiement en ligne. Vous réglez au coursier après essayage. » |
| Mention secondaire | « Vous recevrez votre référence de commande immédiatement après confirmation. » |

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Clic sur la carte Mobile Money | Rien ; annonce « Bientôt disponible » via `aria-live` si clic forcé |
| Clic sur « Modifier » | `/panier`, brouillon conservé |
| Coche CGV | Active le CTA |
| Clic sur le lien CGV | Ouvre les conditions (nouvel onglet ou modale) sans perdre la saisie |
| Clic sur Confirmer | Désactive, crée la commande, redirige vers P12 |
| Retour | Vers P10, saisie conservée |
| Rafraîchissement après création | Redirection vers P12 si la commande est identifiée |

---

## 7. Accessibilité — WCAG 2.1 AA

- **Groupe de paiement** : `fieldset` + `legend` « Mode de paiement » ; `RadioCard` avec `role="radio"` ou `input[type=radio]` réel.
- **Carte désactivée** : `aria-disabled="true"`, `tabindex="-1"`, badge lu « Bientôt disponible ».
- **CGV** : case liée à un texte cliquable, cible 44 px, `aria-describedby` vers le lien.
- **Erreurs** : résumé `role="alert"`, focus sur la case CGV si nécessaire.
- **Chargement** : `aria-busy="true"` sur le formulaire, `aria-live="polite"` sur le statut.
- **Contraste** : badge or avec texte navy (`#131B2E` sur `#C89B3C`) ; jamais de blanc sur or.
- **Focus** : anneau visible sur les cartes et la case.
- **Zoom 200 %** : les cartes passent en colonne, le CTA reste atteignable.
- **Ordre de tabulation** : COD → CGV → lien CGV → CTA.
- **Aucune limite de temps** sur la saisie.

---

## 8. Données API

| Donnée | Sens | Détail |
| --- | --- | --- |
| `paymentMethod` | envoi | `COD` |
| `guestName`, `guestPhone` | envoi | Depuis P09 |
| `addressSnapshot` | envoi | Depuis P10 |
| `items[]` (`variantId`, `quantity`, `unitPrice`) | envoi | Depuis le panier |
| `subtotal`, `shippingFee`, `total` | envoi | Recalculés serveur |
| `idempotencyKey` | envoi | UUID généré par tentative |
| `reference` | retour | `BRN-YYMM-XXXX` |
| `status` | retour | `PENDING_CONFIRMATION` |
| `paymentStatus` | retour | `PENDING` |

### 8.1 Contrat attendu (à créer)

```http
POST /orders
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "guestName": "Jean-Paul Mbarga",
  "guestPhone": "694281044",
  "paymentMethod": "COD",
  "addressSnapshot": { "...": "..." },
  "items": [{ "variantId": "uuid", "quantity": 1 }],
  "idempotencyKey": "uuid"
}
```

Réponses :

| Code | Sens | Écran |
| --- | --- | --- |
| `201` | Commande créée | P12 |
| `409` | Panier ou prix modifié | Bandeau P11 |
| `422` | Champ invalide / stock | Erreur ciblée |
| `429` | Trop de tentatives | Message d'attente |
| `5xx` | Erreur serveur | Réessayer |

**Dépendance manquante majeure** : `POST /orders` n'existe pas. La spec décrit le besoin, pas un contrat définitif.

---

## 9. Écarts et décisions

| Constat maquette | Décision |
| --- | --- |
| Deux options de paiement, la seconde désactivée | Conservé ; `disabled` + badge « Bientôt disponible » |
| Aucune case CGV | Ajoutée, obligatoire, non cochée par défaut |
| Aucun CTA final visible | Ajouté, avec barre collante mobile |
| « Vous essayez vos chaussures avant de payer » | Conservé comme avantage principal du COD |
| Articles et récapitulatif dupliqués | `OrderSummaryCard` unique, variante complète |
| Aucune erreur de stock ou de prix | 8 cas d'erreur spécifiés |
| Badge « 100 % sécurisé » | Remplacé par « Aucun paiement en ligne » |

---

## 10. Référence

- Maquette : zone C, carte 3 « Mode de Paiement » et récapitulatif.
- `PARCOURS.md` §5.3, §5.4, §6, §9.
- `MICROTEXTES.md` §P11.
- `COMPOSANTS-REQUIS.md` — `RadioCard`, `OrderSummaryCard`, `Alert`.
- Backend : `Order`, `OrderItem`, `Payment` (`provider: cod`).
