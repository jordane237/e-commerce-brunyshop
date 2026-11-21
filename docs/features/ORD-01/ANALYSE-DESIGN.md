# ORD-01 — Analyse du design (tunnel P08–P13)

> Rapport produit avant toute modification de code, dans le cadre du ticket ORD-01
> (API de création de commande). Sources : `docs/design/DSG-04/`, `docs/design/DSG-07/`,
> `design1/` et `docs/design-1/ANALYSE-MAQUETTES.md`.

---

## 1. Fichiers de design localisés

| Écran | Spec (source de vérité) | Maquette image | Route proposée |
| --- | --- | --- | --- |
| P08 — Début du tunnel | `docs/design/DSG-04/P08-checkout-start.md` | `design1/bruny shopping/bruny shopping.png` (zone tunnel) | `/commande` |
| P09 — Coordonnées | `docs/design/DSG-04/P09-coordonnees.md` | idem | `/commande/coordonnees` |
| P10 — Livraison | `docs/design/DSG-04/P10-livraison.md` | idem | `/commande/livraison` |
| P11 — Paiement | `docs/design/DSG-04/P11-paiement.md` | idem | `/commande/paiement` |
| P11b — Attente paiement | `docs/design/DSG-04/P11b-attente-paiement.md` | — | état de P11 |
| P11c — Échec paiement | `docs/design/DSG-04/P11c-echec-paiement.md` | — | état de P11 |
| P12 — Confirmation | `docs/design/DSG-04/P12-confirmation.md` | idem (carte « Commande Confirmée avec Succès ! ») | `/commande/confirmation/:reference` |
| P13 — Suivi public | `docs/design/DSG-04/P13-suivi-public.md` | idem | `/suivi` et `/suivi/:reference` |

Support : `DSG-04/PARCOURS.md`, `DSG-04/MICROTEXTES.md` (source des libellés),
`DSG-04/COMPOSANTS-REQUIS.md`, `DSG-04/VALIDATION.md`, `DSG-07/GLOSSAIRE-MICROTEXTES.md`.

Aucun export Figma ni PNG par écran : la maquette globale est une image unique dans
`design1/bruny shopping/`. Les specs Markdown sont la référence exploitable (wireframes
360/768/1280, états, microtextes, accessibilité, données API).

---

## 2. Contrat attendu par P11 (création de commande)

Données collectées dans le tunnel et envoyées à `POST /orders` :

| Donnée | Origine | Écran | Remarque |
| --- | --- | --- | --- |
| `guestName`, `guestPhone` | saisie | P09 | guest uniquement ; téléphone normalisé `+237XXXXXXXXX` |
| `addressSnapshot` | saisie + zone | P10 | `city`, `district`, `landmark`, `slot`, `callBeforeDelivery`, `zoneId` |
| `zoneId` | sélection | P10 | frais et délai serveur (`DeliveryZone.fee`, `estimatedDays`) |
| `items[]` (`variantId`, `quantity`) | panier | P08 | la spec P11 mentionne `unitPrice` en envoi, **écarté** : recalcul serveur obligatoire |
| `paymentMethod` | sélection | P11 | `COD` seul actif ; Mobile Money « Bientôt disponible » |
| `idempotencyKey` | généré par tentative | P11 | **header `Idempotency-Key`** (décision ORD-01, voir §6) |
| `turnstileToken` | widget | P11 | CAPTCHA Cloudflare Turnstile |

Réponse attendue : `reference` (`BRN-YYMM-XXXX`), `status` `PENDING_CONFIRMATION`,
`paymentStatus` `PENDING`, `total`, `createdAt`.
Codes : `201` créé, `409` stock/panier/prix modifié, `422`/`400` champ invalide,
`429` trop de tentatives, `5xx` réessayer.

---

## 3. P12 — confirmation

- Affiche la **référence** (`BRN-2611-7K3F`), la date (`10 nov. 2026, 14:32`),
  le nombre de paires, les lignes, `subtotal` / `shippingFee` / `total`.
- Mention obligatoire : « À régler au coursier, après essayage. »
- Interdits : « Paiement confirmé », « Votre commande a bien été prise en compte »
  sans référence. Le statut initial doit donc être présenté comme **en attente de
  confirmation**, jamais comme confirmé/payé.
- Preuve unique pour un invité : la référence. Aucune dépendance à l'e-mail.
- Actions : « Suivre ma commande » (P13), « Discuter sur WhatsApp ».
- Le panier n'est vidé qu'après affichage réussi de P12.

## 4. P13 — suivi public

- Vérification par `reference` + `guestPhone` (jamais la référence seule),
  ou lien signé (30 jours). Anti-énumération : message identique si la commande n'existe pas.
- Timeline 5 étapes : « Commande enregistrée » → « Préparation & contrôle qualité » →
  « Prise en charge » → « En cours de livraison » → « Livrée et réglée ».
- Mapping statuts : `PENDING_CONFIRMATION` → « En attente de confirmation » (étape 1 en cours).
- Limitation : 10 tentatives / 10 min / IP + référence.
- Dépendance : `GET /orders/:reference` (ou `/tracking/:reference`) **hors périmètre ORD-01**.

---

## 5. Microtextes et formats validés

| Élément | Format / libellé validé | Source |
| --- | --- | --- |
| Référence | `BRN-YYMM-XXXX`, sans `#` à la copie | DSG-04 MICROTEXTES, DSG-07 |
| Statut initial | « En attente de confirmation » | P13 §5 |
| Statut « confirmée » (titre P12) | « Commande confirmée » (écran post-création) | P12 §5 |
| Montant | `25 000 FCFA` (espace insécable) | DSG-07 §246 |
| Date | `15 janv. 2025` / `10 nov. 2026, 14:32` | DSG-07, P12 |
| Téléphone | `+237 6 XX XX XX XX` / masqué `6 94 ** ** 44` | DSG-07, P13 |
| Créneau | `morning` / `afternoon` / `evening` → « matin », « après-midi », « soirée » | P10 §8 |
| Erreur stock | « {Produit} n'est plus disponible en pointure {taille}. » | P11 §4.4 |
| Erreur zone | « Cette zone de livraison n'est plus desservie. » | P11 §4.4 |
| Erreur réseau | « Votre commande n'a pas été enregistrée. Vérifiez votre connexion et réessayez. » | P11 §4.4 |
| Doublon | Redirection silencieuse vers P12 de la commande existante | P11 §4.4 |

Écart de glossaire à noter : DSG-04 utilise `BRN-2611-7K3F` (alphanumérique),
DSG-07 donne `BRN-2511-0042` (suffixe numérique). ORD-01 retient le format DSG-04
(alphanumérique sans caractères ambigus), aligné sur l'implémentation existante.

---

## 6. Décisions de cohérence design ↔ API

1. **`Idempotency-Key` en header obligatoire** (et non dans le body comme le montre
   P11 §8.1). Le body refuse `idempotencyKey` (`forbidNonWhitelisted`). P11 devra donc
   envoyer l'en-tête ; la spec DSG-04 §8.1 est à corriger dans un ticket design.
2. **`unitPrice` jamais envoyé** malgré P11 §8 : `forbidNonWhitelisted` rejette tout
   montant client (CA #2). Écart documenté dans P11 §8 (« Recalculés serveur »).
3. **`zoneId`** accepté en plus de la résolution par ville (`address.city`), pour
   respecter P10. Si les deux sont fournis, ils doivent être cohérents.
4. **`addressSnapshot`** : la réponse et le stockage conservent la forme du schéma
   (`recipientName`, `phone`, `city`, `district`, `line`, `landmark`, `slot`,
   `callBeforeDelivery`) ; l'alias `address` de P11 est conservé.
5. **Notification de création** : le statut étant `PENDING_CONFIRMATION`, le message
   client ne doit pas dire « payée ». Un template dédié `order.created` est ajouté
   (le template existant `order.confirmed` reste réservé au passage `CONFIRMED`).
6. **Statut et paiement** : `PENDING_CONFIRMATION` + `COD` + `PENDING` exposés tels quels
   à P12, qui les traduit en « En attente de confirmation ».

---

## 7. Consommateurs frontend (hors périmètre ORD-01)

| Composant | Écran | Usage de l'API |
| --- | --- | --- |
| `CheckoutComponent` (à créer) | P11 | `POST /orders` + header `Idempotency-Key` |
| `ConfirmationComponent` (à créer) | P12 | lecture du retour de création |
| `TrackingLookupComponent` (à créer) | P13 | endpoint de suivi dédié (ticket séparé) |
| `CartStore` (CRT-02, existant) | P08–P11 | fournit `variantId` + `quantity` uniquement |

Aucun de ces composants n'existe encore : ORD-01 livre l'API et son contrat OpenAPI,
le câblage Angular relève d'un ticket frontend.
