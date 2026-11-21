# P11c — Échec de paiement

> DSG-04 · **V2** · paiement Mobile Money · route proposée `/commande/paiement/echec`
> Non implémenté en MVP.

---

## 1. Objectif

Expliquer un échec de paiement sans culpabiliser, sans jargon, et donner une sortie immédiate : réessayer, changer de moyen, ou commander en paiement à la livraison.

L'écran doit distinguer trois familles de causes — refus côté opérateur, expiration, problème technique — car les actions de reprise diffèrent. Il ne doit **jamais** laisser croire que la commande est passée.

**Indicateur de succès (V2)** : ≥ 60 % des échecs récupérés par une nouvelle tentative ou un basculement vers le COD.

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
│              (  !  )                 │
│                                      │
│      Le paiement n'a pas abouti      │
│                                      │
│  Votre commande n'a pas été          │
│  enregistrée et aucun montant n'a    │
│  été débité.                         │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Motif : paiement refusé par    │  │
│  │ l'opérateur.                   │  │
│  │ Tentative PAY-8F2K             │  │
│  └────────────────────────────────┘  │
│                                      │
│  [        Réessayer le paiement   ]  │
│  [   Payer à la livraison         ]  │
│                                      │
│  Discuter sur WhatsApp               │
└──────────────────────────────────────┘
```

### 2.2 Tablette — 768 px

Carte centrée de 520 px, stepper en haut. Le motif est présenté dans un encadré neutre, pas en rouge plein écran.

### 2.3 Desktop — 1280 px

Carte centrée de 560 px, illustration à gauche (240 px), actions alignées verticalement. Aucun récapitulatif complet pour ne pas distraire de la reprise.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `CheckoutHeader` | à créer | — |
| `StepIndicator` | à créer | Étape 3 active |
| `Alert` | à créer | Variante `danger` ou `warning` selon la cause |
| `Button` | existant | Réessayer, basculer COD, WhatsApp |
| `CopyButton` | à créer | Copier la référence de tentative |
| `Icon` | existant | Alerte |

---

## 4. États

### 4.1 Nominal — échec expliqué

| Cause | Titre | Message | Action principale |
| --- | --- | --- | --- |
| Refus opérateur | « Le paiement n'a pas abouti » | « L'opérateur a refusé la demande. Vérifiez votre solde ou votre code, puis réessayez. » | « Réessayer le paiement » |
| Expiration | « La demande a expiré » | « Vous n'avez pas validé à temps. Aucun montant n'a été débité. » | « Renvoyer la demande » |
| Réseau | « Connexion interrompue » | « Nous n'avons pas pu joindre l'opérateur. Votre commande n'est pas enregistrée. » | « Réessayer » |
| Annulation | « Paiement annulé » | « Vous avez annulé la demande. Aucun montant n'a été débité. » | « Réessayer » |
| Indisponible | « Service momentanément indisponible » | « Le paiement mobile est momentanément indisponible. Vous pouvez payer à la livraison. » | « Payer à la livraison » |

### 4.2 Chargement

Nouvelle tentative : bouton `loading`, libellé « Nouvelle demande… », formulaire désactivé, limite 15 s.

### 4.3 Vide

Sans objet. Si aucun échec n'est identifié (accès direct à la route), redirection vers P11.

### 4.4 Erreurs de l'écran

| Cas | Message |
| --- | --- |
| Référence inconnue | « Nous ne retrouvons pas cette tentative. Retournez au paiement. » |
| Nouvelle tentative refusée | « Impossible de relancer le paiement. Choisissez le paiement à la livraison. » |
| Trop de tentatives | « Trop de tentatives. Patientez 5 minutes ou choisissez le paiement à la livraison. » |

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Titre | « Le paiement n'a pas abouti » |
| Corps | « Votre commande n'a pas été enregistrée et aucun montant n'a été débité. » |
| Motif | « Motif : {raison lisible} » |
| Référence | « Tentative {PAY-XXXX} » |
| CTA 1 | « Réessayer le paiement » |
| CTA 2 | « Payer à la livraison » |
| Aide | « Le problème persiste ? Discuter sur WhatsApp » |
| Rassurance | « Votre panier et votre adresse sont conservés. » |
| Sécurité | « Bruny Shopping ne vous demandera jamais votre code Mobile Money. » |

Interdits : « Erreur 500 », « Transaction failed », « Votre paiement a échoué » sans explication.

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Réessayer | Nouvelle intention de paiement, retour P11b |
| Payer à la livraison | Retour P11 avec COD sélectionné, CGV à revalider si nécessaire |
| WhatsApp | Message prérempli avec `PAY-XXXX` et la référence panier |
| Retour navigateur | Vers P11, panier intact |
| Copier la référence | Toast « Référence copiée » |

---

## 7. Accessibilité — WCAG 2.1 AA

- **Annonce** : titre et motif dans une région `role="alert"` à l'arrivée.
- **Couleur** : l'échec n'est pas signalé uniquement par le rouge ; icône + texte explicite.
- **Contraste** : texte sur fond `danger` clair ≥ 4,5:1 ; privilégier un encadré neutre avec bordure `danger`.
- **Focus** : focus initial sur le `h1`, puis sur « Réessayer le paiement » après nouvelle tentative échouée.
- **Cibles** : 44 px minimum, boutons empilés avec 12 px d'espacement.
- **Clavier** : ordre Réessayer → Payer à la livraison → WhatsApp.
- **Zoom 200 %** : aucun contenu tronqué, boutons sur toute la largeur.

---

## 8. Données API

| Donnée | Sens | Détail |
| --- | --- | --- |
| `paymentIntentId` | reçu | `PAY-XXXX` |
| `failureCode` | reçu | Code technique mappé vers un motif lisible |
| `failureReason` | reçu | Message opérateur, jamais affiché brut |
| `canRetry` | reçu | Booléen |
| `attempts` | reçu | Nombre de tentatives |

Mapping des codes (à confirmer avec l'agrégateur) :

| Code | Motif affiché | Reprise |
| --- | --- | --- |
| `INSUFFICIENT_FUNDS` | Solde insuffisant | Réessayer / COD |
| `INVALID_PIN` | Code incorrect | Réessayer |
| `TIMEOUT` | Demande expirée | Renvoyer |
| `USER_CANCELLED` | Paiement annulé | Réessayer |
| `PROVIDER_UNAVAILABLE` | Service indisponible | COD |
| `NETWORK` | Connexion interrompue | Réessayer |

---

## 9. Écarts et décisions

| Constat | Décision |
| --- | --- |
| Aucun écran d'échec dans la maquette | Créé, avec 5 causes distinctes |
| Aucune reprise prévue | Deux reprises : réessai et bascule COD |
| Aucune référence de support | `PAY-XXXX` copiable |
| Risque d'afficher un message technique | Mapping de codes, jamais de message brut |
| P11c hors MVP | Marquée V2, aucun lien actif depuis P11 |

---

## 10. Référence

- `PARCOURS.md` §5.3, §10.
- `P11-paiement.md`, `P11b-attente-paiement.md`.
- Backend : `Payment.status = FAILED`, `Payment.providerRef`.
