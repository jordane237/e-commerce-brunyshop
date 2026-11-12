# P11b — Attente de confirmation de paiement

> DSG-04 · **V2** · paiement Mobile Money · route proposée `/commande/paiement/attente`
> Non implémenté en MVP. Spécifié pour préparer PAY-02 sans le promettre.

---

## 1. Objectif

Informer le client qu'une demande de paiement Mobile Money a été envoyée et qu'il doit la valider sur son téléphone, tout en surveillant le statut côté serveur.

L'écran doit lever l'ambiguïté la plus fréquente : « Est-ce que ma commande est passée ? ». Il affiche une référence de tentative, un compte à rebours, un bouton de vérification manuelle et une sortie claire en cas d'expiration.

**Indicateur de succès (V2)** : ≥ 95 % des paiements confirmés detectés en moins de 20 s ; < 1 % de commandes créées deux fois.

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
│                                      │
│            (  horloge  )             │
│                                      │
│      Vérifiez votre téléphone        │
│                                      │
│  Une demande de paiement de          │
│  52 500 FCFA a été envoyée au        │
│  +237 6 94 28 10 44.                 │
│                                      │
│  Validez-la avec votre code          │
│  Orange Money ou MTN MoMo.           │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Tentative  PAY-8F2K            │  │
│  │ Expire dans  01:42             │  │
│  └────────────────────────────────┘  │
│                                      │
│  [     J'ai validé le paiement    ]  │
│  [        Annuler et revenir      ]  │
│                                      │
│  Un souci ? Discuter sur WhatsApp    │
└──────────────────────────────────────┘
```

### 2.2 Tablette — 768 px

Carte centrée de 520 px, stepper en haut, même contenu. Aucune colonne supplémentaire : l'écran est volontairement mono-tâche.

### 2.3 Desktop — 1280 px

Carte centrée de 560 px sur fond `canvas`, stepper en haut, illustration discrète à gauche de la carte (240 px). Le reste de l'écran reste vide : pas de récapitulatif concurrent.

---

## 3. Composants

| Composant | Statut | Usage |
| --- | --- | --- |
| `CheckoutHeader` | à créer | — |
| `StepIndicator` | à créer | Étape 3 active |
| `ProgressBar` | à créer | Attente indéterminée / compte à rebours |
| `Timer` | à créer | 2 minutes |
| `Alert` | à créer | Expiration, erreur réseau |
| `Button` | existant | Vérifier, annuler |
| `CopyButton` | à créer | Copier la référence de tentative |
| `Icon` | existant | Horloge, téléphone |

---

## 4. États

### 4.1 Nominal — attente

- Texte principal, numéro masqué (`6 94 ** ** 44`), montant, référence de tentative.
- Compte à rebours de 2 minutes.
- Vérification automatique toutes les 3 s (polling), pause si l'onglet est masqué.
- Bouton « J'ai validé le paiement » actif.

### 4.2 Chargement — vérification

- Bouton en `loading`, libellé « Vérification… ».
- Aucun changement du compte à rebours.
- Si le statut reste `PENDING`, message « Toujours en attente. Validez la demande sur votre téléphone. »

### 4.3 Vide — expiré

```text
La demande a expiré
Vous n'avez pas validé le paiement à temps. Aucun montant n'a été débité.
[ Réessayer le paiement ]   [ Choisir un autre mode ]
```

La commande n'est pas créée. Le panier et l'adresse sont conservés.

### 4.4 Erreurs

| Cas | Message |
| --- | --- |
| Réseau pendant la vérification | « Impossible de vérifier le paiement. Votre commande n'est pas perdue : réessayez. » |
| Paiement refusé | Redirection vers P11c |
| Paiement confirmé | Redirection vers P12 |
| Statut inconnu | « Nous n'arrivons pas à lire le statut. Contactez-nous sur WhatsApp avec la référence PAY-… » |
| Trop de vérifications | « Patientez quelques secondes avant de vérifier à nouveau. » |

---

## 5. Microtextes FR

| Élément | Texte |
| --- | --- |
| Titre | « Vérifiez votre téléphone » |
| Corps | « Une demande de paiement de {montant} FCFA a été envoyée au {numéro masqué}. » |
| Instruction | « Validez-la avec votre code Orange Money ou MTN MoMo. » |
| Référence | « Tentative {PAY-XXXX} » |
| Compte à rebours | « Expire dans {mm:ss} » |
| CTA principal | « J'ai validé le paiement » |
| CTA chargement | « Vérification… » |
| CTA secondaire | « Annuler et revenir » |
| Aide | « Un souci ? Discuter sur WhatsApp » |
| Expiré | « La demande a expiré. Aucun montant n'a été débité. » |
| Relance | « Toujours en attente. Validez la demande sur votre téléphone. » |
| Sécurité | « Ne partagez jamais votre code avec un tiers, même si l'on se présente comme Bruny Shopping. » |

---

## 6. Interactions

| Action | Résultat |
| --- | --- |
| Ouverture | Envoi de la demande déjà effectué, polling démarré |
| « J'ai validé » | Vérification immédiate |
| Polling | Toutes les 3 s, maximum 40 tentatives |
| Onglet masqué | Polling suspendu, reprise au retour |
| Annuler | Retour P11, tentative annulée si possible, aucun débit |
| Expiration | État « expiré », aucun débit |
| Confirmation | Redirection P12 avec la référence de commande |
| Refus | Redirection P11c |

---

## 7. Accessibilité — WCAG 2.1 AA

- **Annonces** : le compte à rebours n'est **pas** annoncé chaque seconde ; annonce à 60 s, 30 s et expiration.
- **Statut** : `role="status"` + `aria-live="polite"` sur le message de vérification.
- **Progression** : `role="progressbar"` avec `aria-valuetext="Expire dans 1 minute 42 secondes"`.
- **Focus** : à l'arrivée, focus sur le `h1` ; après expiration, focus sur « Réessayer le paiement ».
- **Mouvement** : animation d'horloge désactivée si `prefers-reduced-motion`.
- **Contraste** : montant et numéro ≥ 4,5:1 ; état d'attente non signalé uniquement par la couleur.
- **Clavier** : deux boutons atteignables, ordre logique.
- **Zoom 200 %** : carte centrée, aucun défilement horizontal.

---

## 8. Données API

| Donnée | Sens | Détail |
| --- | --- | --- |
| `paymentIntentId` | reçu | Référence `PAY-XXXX` |
| `provider` | envoi | `mtn_momo` ou `orange_money` |
| `amount` | envoi | Entier XAF |
| `phone` | envoi | Numéro normalisé |
| `status` | retour | `PENDING`, `SUCCEEDED`, `FAILED`, `EXPIRED` |
| `expiresAt` | retour | Horodatage serveur |

Endpoints attendus (V2, à créer) :

- `POST /payments/intents`
- `GET /payments/intents/:id`
- `POST /payments/intents/:id/cancel`

Le statut fait foi côté serveur. Aucun statut n'est déduit du seul retour visuel du client.

---

## 9. Écarts et décisions

| Constat | Décision |
| --- | --- |
| Aucun écran d'attente dans la maquette | Créé, mono-tâche, centré |
| Aucune référence de tentative | `PAY-XXXX`, copiable, utile au support |
| Aucune limite de temps | 2 minutes, alignée sur les agrégateurs |
| Aucune sortie | Annulation et retour P11 |
| Aucun avertissement de fraude | Message « Ne partagez jamais votre code » |
| P11b absent du MVP | Marquée V2, non implémentée, aucun lien actif depuis P11 |

---

## 10. Référence

- `PARCOURS.md` §5.3, §10.
- `P11-paiement.md` (point d'entrée V2).
- `P11c-echec-paiement.md` (sortie d'échec).
- Backend : `Payment` (`providerRef`, `status`), `Order.paymentStatus`.
