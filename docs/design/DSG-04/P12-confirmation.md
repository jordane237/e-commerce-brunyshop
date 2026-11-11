# P12 — Commande confirmée

> DSG-04 · après création · route proposée `/commande/confirmation/:reference`

---

## 1. Objectif

Rassurer immédiatement : la commande existe, elle est enregistrée, son montant est connu, et le client peut la suivre. L'écran sert aussi de **ticket** : référence, date, articles, adresse, mode de paiement et créneau.

C'est la seule preuve de commande pour un client invité. Elle doit être lisible, copiable et retrouvable, sans dépendre d'un e-mail.

**Indicateur de succès** : ≥ 70 % des clients cliquent sur « Suivre ma commande » ; < 1 % contactent le support pour « ma commande est-elle passée ? ».

---

## 2. Wireframes

### 2.1 Mobile — 360 px

```text
┌──────────────────────────────────────┐
│ ☰   BRUNY SHOPPING            🛒 2    │
├──────────────────────────────────────┤
│                                      │
│            ✓  (or)                   │
│   Commande confirmée                 │
│                                      │
│   Merci Jean-Paul. Votre commande    │
│   est enregistrée à notre atelier    │
│   de Douala.                         │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ EN PRÉPARATION — LIVRAISON 24 H  │ │
│ │ Référence     BRN-2611-7K3F      │ │
│ │ Date          10 nov. 2026, 14:32│ │
│ │ 2 paires sélectionnées           │ │
│ │ [ Copier la référence ]          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Articles commandés                   │
│ Mocassin Cuir Glacé · 41 · 1 24 500  │
│ Richelieu Oxford · 42 · 1    28 000  │
│ ──────────────────────────────────── │
│ Sous-total           52 500 FCFA     │
│ Livraison               Offerte      │
│ Total à régler       52 500 FCFA     │
│ À régler au coursier, après essayage │
│                                      │
│ Livraison                            │
│ Jean-Paul Mbarga · 6 94 28 10 44     │
│ Bonapriso — Immeuble bleu, face à    │
│ la pharmacie du carrefour            │
│ Créneau préféré : après-midi         │
│ Estimation : demain, 24 h            │
│                                      │
│ [      Suivre ma commande         → ] │
│ [   Discuter sur WhatsApp           ] │
│                                      │
│ Engagements                          │
│ ✓ Essayage avant paiement            │
│ ✓ Aucun acompte                      │
│ ✓ Échange gratuit sous 7 jours       │
│                                      │
│ ← Retour à la boutique               │
└──────────────────────────────────────┘
```

### 2.2 Tablette — 768 px

```text
┌─────────────────────────────────────────────┐
│ ☰  BRUNY SHOPPING                   🛒      │
├─────────────────────────────────────────────┤
│   ✓  Commande confirmée                     │
│   Merci Jean-Paul. Votre commande est …     │
│  ┌───────────────────────┬────────────────┐ │
│  │ Ticket + articles     │ Livraison      │ │
│  │ + totaux              │ Adresse        │ │
│  │                       │ Estimation     │ │
│  │                       │ [Suivre]       │ │
│  └───────────────────────┴────────────────┘ │
└─────────────────────────────────────────────┘
```

- Conteneur 960 px, colonnes 7 / 5.

### 2.3 Desktop — 1280 px

```text
┌───────────────────────────────────────────────────────────────┐
│  BRUNY SHOPPING                    Boutique  Panier  WhatsApp  │
├───────────────────────────────────────────────────────────────┤
│   ✓  Commande confirmée                                        │
│   Merci Jean-Paul. Votre commande est enregistrée.             │
│                                                               │
│   ┌────────────────────────────────────┐  ┌─────────────────┐ │
│   │ TICKET                             │  │ LIVRAISON       │ │
│   │ BRN-2611-7K3F · 10 nov. 2026 14:32 │  │ Destinataire    │ │
│   │ 2 paires                           │  │ Téléphone       │ │
│   │ articles + totaux                  │  │ Adresse         │ │
│   │                                    │  │ Créneau         │ │
│   │                                    │  │ [Suivre →]      │ │
│   └────────────────────────────────────┘  └─────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

- Conteneur 1 200 px, colonnes 720 / 400 px, gouttière 48 px.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `StorefrontHeader` | à créer | Header public avec panier |
| `SuccessHero` | à créer | Coche, titre, message nominatif |
| `OrderTicket` | à créer | Référence, date, nombre d'articles |
| `CopyButton` | à créer | Copier la référence |
| `OrderLineItem` | à créer | Articles |
| `OrderSummaryCard` | à créer | Totaux + mention COD |
| `ShippingDetails` | à créer | Destinataire, adresse, créneau, estimation |
| `TrustPanel` | à créer | Engagements |
| `Button` | existant | Suivre, WhatsApp |
| `Badge` | existant | Statut « En préparation » |
| `Skeleton` | existant | Chargement |

---

## 4. États

### 4.1 Nominal — confirmée

Toutes les données présentes. Coche dorée, titre, message, ticket, articles, totaux, livraison, actions.

### 4.2 Chargement

Accès direct ou rafraîchissement : squelette du ticket et des blocs, titre « Récupération de votre commande… », actions masquées. Limite 8 s.

### 4.3 Vide — commande non trouvée

```text
Commande introuvable
Cette référence ne correspond à aucune commande.
Vérifiez le lien reçu après votre commande ou contactez-nous.
[ Retour à la boutique ]   [ Discuter sur WhatsApp ]
```

Message neutre, sans indiquer si la référence existe ailleurs (anti-énumération).

### 4.4 Erreurs

| Cas | Message |
| --- | --- |
| Lien invalide / expiré | « Ce lien de commande n'est plus valable. Retrouvez votre commande avec votre référence et votre numéro. » + lien P13 |
| Erreur serveur | « Impossible d'afficher votre commande pour le moment. Réessayez dans un instant. » |
| Commande annulée | Bandeau « Cette commande a été annulée. » + motif + WhatsApp |
| Paiement en échec (V2) | Bandeau « Le paiement n'a pas abouti. Votre commande n'est pas confirmée. » + reprise |
| Réseau | « Connexion interrompue. Votre commande reste enregistrée. » |

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Titre | « Commande confirmée » |
| Message | « Merci {prénom}. Votre commande est enregistrée à notre atelier de Douala. » |
| Bandeau statut | « En préparation — livraison sous 24 h » (ou délai de la zone) |
| Référence | « Référence » |
| Date | « Date » |
| Articles | « {n} paires sélectionnées » |
| Copier | « Copier la référence » / toast « Référence copiée » |
| Totaux | « Sous-total », « Livraison », « Total à régler » |
| Mention | « À régler au coursier, après essayage. » |
| Livraison | « Livraison » |
| Destinataire | « Destinataire » |
| Adresse | « Adresse » |
| Créneau | « Créneau préféré » |
| Estimation | « Estimation : demain, sous 24 h » |
| CTA | « Suivre ma commande » |
| WhatsApp | « Discuter sur WhatsApp » |
| Engagements | « Essayage avant paiement » · « Aucun acompte » · « Échange gratuit sous 7 jours » |
| Retour | « Retour à la boutique » |

Interdits : « Votre commande a bien été prise en compte » seul (sans référence), « Paiement confirmé » pour une commande COD.

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Arrivée depuis P11 | Aucun retour arrière vers P11 (remplacé dans l'historique) |
| Copier la référence | Copie `BRN-2611-7K3F` sans `#` + toast |
| Suivre ma commande | P13 avec lien signé |
| WhatsApp | Message prérempli avec référence |
| Retour boutique | `/boutique`, panier vidé |
| Rafraîchissement | Recharge la commande, pas de nouvelle création |
| Bouton retour navigateur | Vers le panier vide, jamais vers P11 |

Le panier est vidé **uniquement** après affichage réussi de P12.

---

## 7. Accessibilité — WCAG 2.1 AA

- **Succès** : titre `h1` « Commande confirmée », coche décorative `aria-hidden`.
- **Annonce** : `role="status"` sur le message de confirmation à l'arrivée.
- **Ticket** : liste de définitions (`dl`) référence / date / articles.
- **Copie** : bouton avec `aria-label="Copier la référence BRN-2611-7K3F"`, confirmation annoncée.
- **Contraste** : or décoratif sans texte blanc ; badge de statut ≥ 4,5:1.
- **Zoom 200 %** : ticket et livraison empilés, aucune troncature de référence.
- **Clavier** : ordre ticket → suivi → WhatsApp → boutique.
- **Liens** : « Suivre ma commande » est un lien, pas un bouton factice.
- **Date** : format lisible par lecteur d'écran (`<time datetime="2026-11-10T14:32">`).

---

## 8. Données API

| Donnée | Origine | Détail |
| --- | --- | --- |
| `reference` | `Order` | `BRN-YYMM-XXXX` |
| `createdAt` | `Order` | Date + heure locale |
| `status` | `Order` | Affiché via un libellé public |
| `items[]` | `OrderItem` | Nom, pointure, quantité, prix |
| `subtotal`, `shippingFee`, `total` | `Order` | Entiers XAF |
| `paymentMethod` | `Order` | `COD` |
| `paymentStatus` | `Order` | `PENDING` |
| `addressSnapshot` | `Order` | Ville, quartier, repère, créneau |
| `guestName`, `guestPhone` | `Order` | Affichés |
| `shipment.estimatedDelivery` | `Shipment` | Estimation, jamais garantie |
| `trackingToken` | émis à la création | Lien signé vers P13 |

**Dépendances manquantes** : `GET /orders/:reference` et génération du jeton de suivi.

---

## 9. Écarts et décisions

| Constat maquette | Décision |
| --- | --- |
| Référence `#BS-2025-8492` | Format `BRN-YYMM-XXXX`, sans `#` à la copie |
| « Orange Money actif » sur commande COD | Remplacé par « À régler au coursier, après essayage » |
| Message très long et marketing | Raccourci, nominatif, factuel |
| Ticket sans action de copie | `CopyButton` ajouté |
| « Suivre mon colis en temps réel » | « Suivre ma commande » : pas de GPS temps réel |
| CTA WhatsApp avant le suivi | Suivi promu en action principale |
| Aucun état d'erreur | 5 cas spécifiés |
| Date « 24 Mai 2025 à 14:32 » | Format français abrégé : « 10 nov. 2026, 14:32 » |

---

## 10. Référence

- Maquette : zone I, « Commande Confirmée avec Succès ! ».
- `PARCOURS.md` §6, §8.
- `P13-suivi-public.md`.
- `MICROTEXTES.md` §P12.
- Backend : `Order`, `OrderItem`, `Shipment`.
