# P13 — Suivi de commande public

> DSG-04 · route proposée `/suivi` (vérification) et `/suivi/:reference` (lien signé)

---

## 1. Objectif

Permettre au client — connecté ou non — de savoir **où en est sa commande**, **qui la livre**, **combien il doit régler** et **comment demander un échange**.

L'accès est protégé par une preuve simple : lien signé reçu à la confirmation, ou saisie de la référence + numéro de téléphone. Les données personnelles sont masquées avant vérification.

Le suivi est **informatif** : aucune annulation, aucune modification d'adresse, aucune promesse d'heure exacte.

**Indicateur de succès** : ≥ 60 % des clients consultent le suivi au moins une fois ; < 5 % d'appels « où est ma commande ? ».

---

## 2. Wireframes

### 2.1 Mobile — 360 px, avant vérification

```text
┌──────────────────────────────────────┐
│ ←  Suivi de commande      WhatsApp   │
├──────────────────────────────────────┤
│                                      │
│   Suivez votre commande              │
│   Saisissez la référence reçue à la  │
│   confirmation et le numéro utilisé. │
│                                      │
│   Référence *                        │
│   ┌────────────────────────────────┐ │
│   │ BRN-2611-7K3F                  │ │
│   └────────────────────────────────┘ │
│                                      │
│   Téléphone *                        │
│   ┌───────┬────────────────────────┐ │
│   │+237   │ 6 94 28 10 44          │ │
│   └───────┴────────────────────────┘ │
│                                      │
│   [     Voir ma commande          ]  │
│                                      │
│   Vous avez reçu un lien par WhatsApp│
│   à la confirmation : ouvrez-le      │
│   directement.                       │
└──────────────────────────────────────┘
```

### 2.2 Mobile — 360 px, après vérification

```text
┌──────────────────────────────────────┐
│ ←  Suivi de commande      WhatsApp   │
├──────────────────────────────────────┤
│ BRN-2611-7K3F        Expédition 24 h │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ● COURSE ACTIVE                  │ │
│ │ En cours de livraison            │ │
│ │ Arrivée estimée : aujourd'hui,   │ │
│ │ entre 13 h et 17 h               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Votre coursier                       │
│ Ibrahim ★ 4,9                        │
│ Coursier express Douala              │
│ [ Appeler ]   [ WhatsApp ]           │
│                                      │
│ Étapes de la livraison               │
│ ● Commande enregistrée               │
│ │ 10 nov., 14:32                     │
│ ● Préparation & contrôle qualité     │
│ │ 10 nov., 16:15                     │
│ ● Prise en charge par Ibrahim        │
│ │ 11 nov., 09:30                     │
│ ● En cours de livraison              │
│ │ Bonapriso · EN COURS               │
│ ○ Livrée et réglée        À venir    │
│                                      │
│ Adresse                              │
│ Bonapriso                            │
│ Immeuble bleu, face à la pharmacie   │
│ Téléphone : 6 94 ** ** 44            │
│                                      │
│ Total à régler      52 500 FCFA      │
│ Payable au coursier, après essayage  │
│                                      │
│ ✓ Échange gratuit sous 7 jours       │
│ [ Demander un échange ]              │
│                                      │
│ Boutique  Recherche  Commandes  WhatsApp│
└──────────────────────────────────────┘
```

### 2.3 Tablette — 768 px

```text
┌─────────────────────────────────────────────┐
│ ←  Suivi de commande             WhatsApp   │
├─────────────────────────────────────────────┤
│ BRN-2611-7K3F                 Expédition 24h│
│  ┌────────────────────────┬───────────────┐ │
│  │ Statut + timeline      │ Coursier      │ │
│  │                        │ Adresse       │ │
│  │                        │ Total         │ │
│  │                        │ Échange       │ │
│  └────────────────────────┴───────────────┘ │
└─────────────────────────────────────────────┘
```

- Conteneur 960 px, colonnes 7 / 5.

### 2.4 Desktop — 1280 px

```text
┌───────────────────────────────────────────────────────────────┐
│  BRUNY SHOPPING              Boutique  Suivi  WhatsApp         │
├───────────────────────────────────────────────────────────────┤
│  BRN-2611-7K3F                                  Expédition 24h │
│  ┌───────────────────────────────┐  ┌───────────────────────┐ │
│  │ Statut                        │  │ Coursier              │ │
│  │ Timeline verticale            │  │ Adresse               │ │
│  │                               │  │ Total à régler        │ │
│  │                               │  │ Échange               │ │
│  └───────────────────────────────┘  └───────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

- Conteneur 1 200 px, colonnes 680 / 440 px.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `StorefrontHeader` | à créer | Header public |
| `TrackingLookupForm` | à créer | Référence + téléphone |
| `StatusBanner` | à créer | Statut principal, couleur sémantique |
| `Timeline` | à créer | 5 étapes, états fait / courant / à venir |
| `CourierCard` | à créer | Nom, note, actions |
| `AddressCard` | à créer | Adresse + repère, sans carte interactive |
| `AmountDueCard` | à créer | Montant à régler |
| `Alert` | à créer | Erreurs, limitation |
| `Button` | existant | Vérifier, appeler, WhatsApp |
| `Badge` | existant | « En cours », « Expédition 24 h » |
| `Skeleton` | existant | Chargement |
| `BottomNav` | à créer | Mobile uniquement |

---

## 4. États

### 4.1 Nominal — vérifié

Statut, coursier si assigné, timeline, adresse masquée partiellement, montant, échange.

### 4.2 Chargement

- Vérification : bouton « Vérification… », formulaire désactivé.
- Chargement du suivi : squelettes du statut et de la timeline.
- Limite : 8 s.

### 4.3 Vide

- Aucune commande pour ce couple référence/téléphone :
  « Nous ne trouvons aucune commande avec ces informations. Vérifiez la référence et le numéro utilisés lors de la commande. »
- Commande sans coursier assigné : bloc coursier masqué, timeline arrêtée à « Préparation ».
- Commande sans estimation : « Estimation en cours de mise à jour » au lieu d'une heure.

### 4.4 Erreurs

| Cas | Message |
| --- | --- |
| Référence vide | « Saisissez votre référence de commande. » |
| Format invalide | « La référence ressemble à BRN-2611-7K3F. » |
| Téléphone vide | « Saisissez le numéro utilisé pour la commande. » |
| Introuvable | « Nous ne trouvons aucune commande avec ces informations. » |
| Trop de tentatives | « Trop de tentatives. Réessayez dans 10 minutes. » |
| Lien expiré | « Ce lien a expiré. Saisissez votre référence et votre numéro. » |
| Réseau | « Connexion interrompue. Réessayez. » |
| Commande annulée | « Cette commande a été annulée. » + motif + WhatsApp |
| Livraison échouée | « La livraison n'a pas pu être effectuée. Nous vous rappelons pour la reprogrammer. » |

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Titre | « Suivi de commande » |
| Sous-titre | « Saisissez la référence reçue à la confirmation et le numéro utilisé. » |
| Label référence | « Référence * » |
| Placeholder | « BRN-2611-7K3F » |
| Label téléphone | « Téléphone * » |
| CTA | « Voir ma commande » |
| Aide lien | « Vous avez reçu un lien à la confirmation ? Ouvrez-le directement. » |
| Statuts | « En attente de confirmation » · « En préparation » · « En cours d'acheminement » · « En cours de livraison » · « Livrée » · « Annulée » |
| Estimation | « Arrivée estimée : {jour}, entre {début} et {fin} » |
| Sans estimation | « Estimation en cours de mise à jour » |
| Coursier | « Votre coursier » |
| Actions coursier | « Appeler » · « WhatsApp » |
| Timeline | « Étapes de la livraison » |
| À venir | « À venir » |
| En cours | « En cours » |
| Adresse | « Adresse de livraison » |
| Montant | « Total à régler » |
| Mention | « Payable au coursier, après essayage. » |
| Échange | « Échange gratuit sous 7 jours » · « Demander un échange » |
| Confidentialité | « Vos informations restent masquées jusqu'à la livraison. » |

Interdits : « Colis en transit », « Tracking », « Temps réel », « GPS », heure de livraison garantie.

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Soumission du formulaire | Vérification, chargement, affichage du suivi |
| Lien signé | Vérification automatique, pas de formulaire |
| Appeler | `tel:` vers le coursier, si assigné |
| WhatsApp coursier | `wa.me` avec message prérempli |
| Demander un échange | WhatsApp avec référence, si livrée depuis ≤ 7 jours |
| Actualiser | Rechargement du statut (bouton ou tirer pour rafraîchir) |
| Bottom nav | Boutique, Recherche, Commandes (actif), WhatsApp |
| Retour | Historique précédent, sinon `/boutique` |

### 6.1 Règles d'affichage

- **Une seule étape « en cours »** ; les précédentes sont cochées, les suivantes grisées.
- L'étape « Livrée et réglée » affiche la date et l'heure de livraison.
- Si `DELIVERED`, le bloc coursier est remplacé par « Commande livrée » et le CTA d'échange devient actif.
- Le montant reste affiché tant que `paymentStatus !== SUCCEEDED`.
- Aucune carte interactive : le bloc adresse peut contenir une image statique décorative.

---

## 7. Accessibilité — WCAG 2.1 AA

- **Formulaire** : labels liés, `autocomplete="tel-national"`, `inputmode="tel"`, erreurs `aria-describedby`.
- **Timeline** : liste ordonnée `<ol>`, chaque étape avec un texte de statut, pas seulement une couleur ; `aria-current="step"` sur l'étape courante.
- **Statut** : `role="status"` + `aria-live="polite"` pour les mises à jour.
- **Coursier** : nom et note lisibles, boutons avec `aria-label` complet (« Appeler Ibrahim, coursier »).
- **Contraste** : vert de statut sur fond clair ≥ 4,5:1 (`success-strong #0F7A40`) ; badge « En cours » avec texte navy sur fond clair.
- **Cibles** : 44 px minimum pour les boutons du coursier et la bottom nav.
- **Masquage** : les données masquées sont annoncées comme telles (« numéro partiellement masqué »).
- **Zoom 200 %** : la timeline reste verticale, aucun défilement horizontal.
- **Focus** : après vérification, focus sur le titre du statut.
- **Anti-énumération** : le message d'erreur est identique que la référence existe ou non.

---

## 8. Données API

| Donnée | Origine | Détail |
| --- | --- | --- |
| `reference` | `Order` | `BRN-YYMM-XXXX` |
| `status` | `Order.status` | Mappé vers un libellé public |
| `createdAt` | `Order` | Étape 1 |
| `preparedAt` | `Order.updatedAt` au passage `PREPARING` | Étape 2 (à exposer) |
| `shipment.status` | `Shipment` | Étapes 3 et 4 |
| `driver.name`, `driver.rating` | `User` (rôle coursier) | Bloc coursier |
| `driver.phone` | `User` | Masqué tant que non assigné |
| `shipment.estimatedDelivery` | calculé | Estimation |
| `addressSnapshot` | `Order` | Quartier, repère |
| `total`, `paymentStatus` | `Order` | Montant dû |
| `deliveredAt` | `Shipment` | Étape 5 |

### 8.1 Mapping des statuts

| `Order.status` / `Shipment.status` | Étape affichée | Badge |
| --- | --- | --- |
| `PENDING_CONFIRMATION`, `AWAITING_PAYMENT` | 1 en cours | « En attente de confirmation » |
| `CONFIRMED` | 2 en cours | « En préparation » |
| `PREPARING` | 2 en cours | « En préparation » |
| `SHIPPED` + `Shipment.ASSIGNED` | 3 en cours | « Prise en charge » |
| `SHIPPED` + `Shipment.IN_TRANSIT` | 4 en cours | « En cours de livraison » |
| `DELIVERED` | 5 terminée | « Livrée » |
| `CANCELLED` | branche annulation | « Annulée » |
| `DELIVERY_FAILED` | branche report | « Livraison reportée » |
| `RETURN_REQUESTED`, `RETURNED`, `REFUNDED`, `EXCHANGED` | branche retour | Libellé dédié |

**Dépendances manquantes** : `GET /tracking/:reference` (ou `/orders/:reference/tracking`), jeton signé, endpoint de vérification avec limitation de débit.

### 8.2 Sécurité

- Vérification par `reference` + `guestPhone` normalisé, jamais par la seule référence.
- Jeton de suivi : signé, durée 30 jours, révocable.
- Limitation : 10 tentatives / 10 minutes / IP + référence.
- Journalisation des accès sans stocker le numéro en clair.
- Aucune donnée de paiement exposée.

---

## 9. Écarts et décisions

| Constat maquette | Décision |
| --- | --- |
| Suivi accessible sans vérification | Formulaire référence + téléphone, ou lien signé |
| « Suivre mon colis en temps réel » | Retiré : suivi par étapes, pas de GPS |
| Mini-carte Bonapriso | Bloc adresse statique, aucune carte interactive en MVP |
| Timeline à 5 étapes sans dates complètes | Dates + heures pour le passé, estimation pour le présent |
| Statuts non alignés sur les enums | Table de correspondance unique (§8.1) |
| Coursier avec note et numéro | Conservé, masqué si non assigné |
| « Total à régler » + « paiement sécurisé » | Conservé, mention « payable au coursier » |
| CTA échange | Actif seulement si livrée depuis ≤ 7 jours |
| Barre inférieure présente ici, absente du tunnel | Conservée sur P12/P13, absente sur P08–P11 |

---

## 10. Référence

- Maquette : zone J, « Suivi de Commande ».
- `PARCOURS.md` §5.5, §7, §10.
- `P12-confirmation.md`.
- `MICROTEXTES.md` §P13.
- Backend : `Order`, `Shipment`, `DeliveryZone`, `User` (coursier).
