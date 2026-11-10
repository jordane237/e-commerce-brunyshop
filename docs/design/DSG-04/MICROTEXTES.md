# MICROTEXTES — P08 à P13

> DSG-04 · référence unique des libellés français.
> Toute divergence entre une spec et ce document doit être corrigée ici d'abord.

---

## 1. Règles de rédaction

| Règle | Application |
| --- | --- |
| Langue | Français, vouvoiement systématique |
| Ton | Direct, calme, jamais commercial dans les erreurs |
| Verbes | À l'infinitif dans les boutons (« Confirmer la commande »), à l'impératif dans les aides (« Vérifiez votre connexion ») |
| Casse | Casse de phrase ; majuscules réservées aux badges et micro-titres |
| Devise | `52 500 FCFA` — espace insécable avant `FCFA`, jamais `F CFA` |
| Téléphone | `6 94 28 10 44`, préfixe `+237` séparé |
| Date | `10 nov. 2026, 14:32` ; année complète, mois abrégé |
| Référence | `BRN-2611-7K3F`, `#` seulement à l'affichage contextuel |
| Ponctuation | Pas d'espace avant `:`, une espace avant `?` et `!` (typographie française) |
| Interdits | « checkout », « tracking », « temps réel », « 100 % sécurisé », « garanti » sur un délai |
| Erreurs | Toujours : ce qui s'est passé + comment corriger |

### 1.1 Formulations à éviter

| À éviter | Préférer |
| --- | --- |
| « Erreur » | « Impossible de… » / « Vérifiez… » |
| « Champ invalide » | « Indiquez un numéro mobile commençant par 6. » |
| « Transaction échouée » | « Le paiement n'a pas abouti. » |
| « Votre commande a échoué » | « Votre commande n'a pas été enregistrée. » |
| « Veuillez saisir… » (trop administratif) | « Saisissez… » |
| « Cliquez ici » | Libellé d'action explicite |
| « Bientôt ! » | « Bientôt disponible » |

---

## 2. P08 — Démarrage

| Clé | Texte |
| --- | --- |
| `p08.title` | Votre commande |
| `p08.subtitle` | Vérifiez votre sélection avant de continuer. |
| `p08.editCart` | Modifier mon panier |
| `p08.line.meta` | Pointure {taille} · Quantité {n} |
| `p08.subtotal` | Sous-total |
| `p08.shipping` | Livraison |
| `p08.shipping.free` | Offerte |
| `p08.shipping.pending` | Calculée à l'étape suivante |
| `p08.total` | Total à régler |
| `p08.paymentNote` | Payable au coursier, après essayage |
| `p08.trust.1` | Vous essayez avant de payer |
| `p08.trust.2` | Aucun acompte demandé |
| `p08.trust.3` | Échange gratuit sous 7 jours |
| `p08.cta` | Commencer ma commande |
| `p08.help` | Besoin d'aide ? |
| `p08.whatsapp` | Discuter sur WhatsApp |
| `p08.secure` | Commande sécurisée |
| `p08.empty.title` | Votre panier est vide |
| `p08.empty.body` | Ajoutez une paire pour commencer votre commande. |
| `p08.empty.cta` | Découvrir la boutique |
| `p08.error.title` | Impossible d'afficher votre commande |
| `p08.error.body` | Vérifiez votre connexion puis réessayez. Votre panier est conservé. |
| `p08.error.retry` | Réessayer |
| `p08.stock.warning` | Un article n'est plus disponible. Retirez-le pour continuer. |

---

## 3. P09 — Coordonnées

| Clé | Texte |
| --- | --- |
| `p09.banner` | Commande directe, sans inscription |
| `p09.title` | Vos coordonnées |
| `p09.subtitle` | Nous en avons besoin pour vous appeler et organiser la livraison. |
| `p09.name.label` | Nom et prénom * |
| `p09.name.placeholder` | Ex. Jean-Paul Mbarga |
| `p09.phone.label` | Numéro WhatsApp / appel livreur * |
| `p09.phone.helper` | Nous vous appelons avant la livraison. |
| `p09.call.option` | Merci de m'appeler avant livraison |
| `p09.cta` | Continuer vers la livraison |
| `p09.total` | Total à régler |
| `p09.privacy` | Vos informations restent privées. Aucun paiement en ligne. |
| `p09.required` | Les champs marqués * sont obligatoires. |
| `p09.saved` | Étape validée. Passage à la livraison. |

### Erreurs P09

| Clé | Texte |
| --- | --- |
| `p09.err.name.required` | Indiquez votre nom et prénom. |
| `p09.err.name.short` | Votre nom doit contenir au moins 2 caractères. |
| `p09.err.name.chars` | Utilisez uniquement des lettres, des espaces, des apostrophes ou des tirets. |
| `p09.err.phone.required` | Indiquez un numéro pour que le coursier vous joigne. |
| `p09.err.phone.length` | Le numéro doit contenir 9 chiffres après +237. Exemple : 6 94 28 10 44. |
| `p09.err.phone.mobile` | Saisissez un numéro mobile commençant par 6. |
| `p09.err.network` | Impossible de vérifier votre panier. Vérifiez votre connexion puis réessayez. |

---

## 4. P10 — Livraison

| Clé | Texte |
| --- | --- |
| `p10.title` | Adresse de livraison |
| `p10.subtitle` | Nous livrons à Douala et Yaoundé. |
| `p10.city.label` | Ville * |
| `p10.city.douala` | Douala — Express 24 h |
| `p10.city.yaounde` | Yaoundé — 24 à 48 h |
| `p10.fee` | Livraison : {montant} FCFA |
| `p10.fee.free` | Livraison offerte (2 paires ou plus) |
| `p10.district.label` | Quartier * |
| `p10.landmark.label` | Point de repère pour le coursier * |
| `p10.landmark.helper` | Indispensable pour vous trouver. Ex. immeuble, rue, commerce connu. |
| `p10.landmark.placeholder` | Ex. Immeuble bleu, face à la pharmacie du carrefour |
| `p10.slot.title` | Créneau préféré |
| `p10.slot.morning` | Matin 8 h – 12 h |
| `p10.slot.afternoon` | Après-midi 13 h – 17 h |
| `p10.slot.evening` | Soir 17 h – 19 h |
| `p10.slot.helper` | Nous faisons notre possible pour respecter ce créneau. |
| `p10.cta` | Continuer vers le paiement |
| `p10.outOfZone` | Votre ville n'est pas encore desservie ? Écrivez-nous sur WhatsApp. |
| `p10.loading` | Chargement des zones de livraison… |

### Erreurs P10

| Clé | Texte |
| --- | --- |
| `p10.err.city.required` | Choisissez votre ville de livraison. |
| `p10.err.city.unsupported` | Nous ne livrons pas encore cette ville. Écrivez-nous sur WhatsApp pour une solution. |
| `p10.err.district.required` | Précisez votre quartier. |
| `p10.err.landmark.required` | Ajoutez un point de repère : un nom d'immeuble, une rue, un commerce connu. |
| `p10.err.landmark.short` | Décrivez le lieu en quelques mots (10 caractères minimum). |
| `p10.err.landmark.long` | Limitez le repère à 200 caractères. |
| `p10.err.slot.required` | Choisissez un créneau préféré. |
| `p10.err.fee` | Impossible de calculer les frais de livraison. Réessayez dans un instant. |
| `p10.err.network` | Connexion interrompue. Vos informations sont conservées. Réessayez. |
| `p10.empty` | Aucune zone de livraison n'est disponible pour le moment. Contactez-nous sur WhatsApp. |

---

## 5. P11 — Paiement

| Clé | Texte |
| --- | --- |
| `p11.title` | Mode de paiement |
| `p11.subtitle` | Choisissez comment vous souhaitez régler votre commande. |
| `p11.cod.title` | Paiement à la livraison |
| `p11.cod.badge` | Recommandé |
| `p11.cod.description` | Espèces, Orange Money ou MTN MoMo remis directement au coursier. |
| `p11.cod.extra` | Vous essayez vos chaussures avant de payer. |
| `p11.momo.title` | Orange Money & MTN MoMo direct |
| `p11.momo.description` | Paiement en ligne avant expédition. |
| `p11.momo.badge` | Bientôt disponible |
| `p11.items` | Articles commandés ({n}) |
| `p11.edit` | Modifier |
| `p11.terms` | J'accepte les conditions générales de vente et la politique de retour. |
| `p11.terms.link` | Lire les conditions générales |
| `p11.cta` | Confirmer la commande |
| `p11.cta.loading` | Création de votre commande… |
| `p11.note` | Aucun paiement en ligne. Vous réglez au coursier après essayage. |
| `p11.note.secondary` | Vous recevrez votre référence de commande immédiatement après confirmation. |

### Erreurs P11

| Clé | Texte |
| --- | --- |
| `p11.err.terms` | Acceptez les conditions générales pour confirmer votre commande. |
| `p11.err.cart.changed` | Votre panier a changé. Vérifiez les articles et le total avant de confirmer. |
| `p11.err.price.changed` | Le prix d'un article a changé. Nouveau total : {montant} FCFA. |
| `p11.err.stock` | {Produit} n'est plus disponible en pointure {taille}. Retirez-le pour continuer. |
| `p11.err.zone` | Cette zone de livraison n'est plus desservie. Choisissez une autre adresse. |
| `p11.err.network` | Votre commande n'a pas été enregistrée. Vérifiez votre connexion et réessayez. |
| `p11.err.timeout` | La confirmation prend plus de temps que prévu. Vérifiez votre connexion. |
| `p11.err.rate` | Trop de tentatives. Patientez un instant avant de réessayer. |

---

## 6. P11b — Attente (V2)

| Clé | Texte |
| --- | --- |
| `p11b.title` | Vérifiez votre téléphone |
| `p11b.body` | Une demande de paiement de {montant} FCFA a été envoyée au {numéro masqué}. |
| `p11b.instruction` | Validez-la avec votre code Orange Money ou MTN MoMo. |
| `p11b.reference` | Tentative {PAY-XXXX} |
| `p11b.countdown` | Expire dans {mm:ss} |
| `p11b.cta` | J'ai validé le paiement |
| `p11b.cta.loading` | Vérification… |
| `p11b.cancel` | Annuler et revenir |
| `p11b.help` | Un souci ? Discuter sur WhatsApp |
| `p11b.expired.title` | La demande a expiré |
| `p11b.expired.body` | Vous n'avez pas validé le paiement à temps. Aucun montant n'a été débité. |
| `p11b.expired.retry` | Réessayer le paiement |
| `p11b.expired.other` | Choisir un autre mode |
| `p11b.pending` | Toujours en attente. Validez la demande sur votre téléphone. |
| `p11b.security` | Ne partagez jamais votre code avec un tiers, même si l'on se présente comme Bruny Shopping. |

---

## 7. P11c — Échec (V2)

| Clé | Texte |
| --- | --- |
| `p11c.title` | Le paiement n'a pas abouti |
| `p11c.body` | Votre commande n'a pas été enregistrée et aucun montant n'a été débité. |
| `p11c.reason` | Motif : {raison} |
| `p11c.reference` | Tentative {PAY-XXXX} |
| `p11c.retry` | Réessayer le paiement |
| `p11c.cod` | Payer à la livraison |
| `p11c.help` | Le problème persiste ? Discuter sur WhatsApp |
| `p11c.keep` | Votre panier et votre adresse sont conservés. |
| `p11c.security` | Bruny Shopping ne vous demandera jamais votre code Mobile Money. |

### Raisons P11c

| Clé | Texte |
| --- | --- |
| `p11c.reason.funds` | Solde insuffisant. |
| `p11c.reason.pin` | Code incorrect. |
| `p11c.reason.timeout` | Demande expirée. |
| `p11c.reason.cancelled` | Paiement annulé. |
| `p11c.reason.unavailable` | Service momentanément indisponible. |
| `p11c.reason.network` | Connexion interrompue. |

---

## 8. P12 — Confirmation

| Clé | Texte |
| --- | --- |
| `p12.title` | Commande confirmée |
| `p12.body` | Merci {prénom}. Votre commande est enregistrée à notre atelier de Douala. |
| `p12.status.preparing` | En préparation — livraison sous 24 h |
| `p12.reference` | Référence |
| `p12.date` | Date |
| `p12.pairs` | {n} paires sélectionnées |
| `p12.copy` | Copier la référence |
| `p12.copy.success` | Référence copiée |
| `p12.items` | Articles commandés |
| `p12.subtotal` | Sous-total |
| `p12.shipping` | Livraison |
| `p12.total` | Total à régler |
| `p12.paymentNote` | À régler au coursier, après essayage. |
| `p12.delivery` | Livraison |
| `p12.recipient` | Destinataire |
| `p12.address` | Adresse |
| `p12.slot` | Créneau préféré |
| `p12.estimate` | Estimation : demain, sous 24 h |
| `p12.cta` | Suivre ma commande |
| `p12.whatsapp` | Discuter sur WhatsApp |
| `p12.trust.1` | Essayage avant paiement |
| `p12.trust.2` | Aucun acompte |
| `p12.trust.3` | Échange gratuit sous 7 jours |
| `p12.back` | Retour à la boutique |
| `p12.loading` | Récupération de votre commande… |

### Erreurs P12

| Clé | Texte |
| --- | --- |
| `p12.err.notFound.title` | Commande introuvable |
| `p12.err.notFound.body` | Cette référence ne correspond à aucune commande. Vérifiez le lien reçu après votre commande ou contactez-nous. |
| `p12.err.link` | Ce lien de commande n'est plus valable. Retrouvez votre commande avec votre référence et votre numéro. |
| `p12.err.server` | Impossible d'afficher votre commande pour le moment. Réessayez dans un instant. |
| `p12.err.network` | Connexion interrompue. Votre commande reste enregistrée. |
| `p12.cancelled` | Cette commande a été annulée. |
| `p12.paymentFailed` | Le paiement n'a pas abouti. Votre commande n'est pas confirmée. |

---

## 9. P13 — Suivi

| Clé | Texte |
| --- | --- |
| `p13.title` | Suivi de commande |
| `p13.subtitle` | Saisissez la référence reçue à la confirmation et le numéro utilisé. |
| `p13.reference.label` | Référence * |
| `p13.reference.placeholder` | BRN-2611-7K3F |
| `p13.phone.label` | Téléphone * |
| `p13.cta` | Voir ma commande |
| `p13.link.help` | Vous avez reçu un lien à la confirmation ? Ouvrez-le directement. |
| `p13.status.pending` | En attente de confirmation |
| `p13.status.preparing` | En préparation |
| `p13.status.transit` | En cours d'acheminement |
| `p13.status.delivering` | En cours de livraison |
| `p13.status.delivered` | Livrée |
| `p13.status.cancelled` | Annulée |
| `p13.estimate` | Arrivée estimée : {jour}, entre {début} et {fin} |
| `p13.estimate.pending` | Estimation en cours de mise à jour |
| `p13.courier` | Votre coursier |
| `p13.call` | Appeler |
| `p13.whatsapp` | WhatsApp |
| `p13.timeline` | Étapes de la livraison |
| `p13.todo` | À venir |
| `p13.current` | En cours |
| `p13.address` | Adresse de livraison |
| `p13.amount` | Total à régler |
| `p13.amount.note` | Payable au coursier, après essayage. |
| `p13.exchange` | Échange gratuit sous 7 jours |
| `p13.exchange.cta` | Demander un échange |
| `p13.privacy` | Vos informations restent masquées jusqu'à la livraison. |

### Erreurs P13

| Clé | Texte |
| --- | --- |
| `p13.err.reference.required` | Saisissez votre référence de commande. |
| `p13.err.reference.format` | La référence ressemble à BRN-2611-7K3F. |
| `p13.err.phone.required` | Saisissez le numéro utilisé pour la commande. |
| `p13.err.notFound` | Nous ne trouvons aucune commande avec ces informations. |
| `p13.err.rate` | Trop de tentatives. Réessayez dans 10 minutes. |
| `p13.err.link` | Ce lien a expiré. Saisissez votre référence et votre numéro. |
| `p13.err.network` | Connexion interrompue. Réessayez. |
| `p13.err.cancelled` | Cette commande a été annulée. |
| `p13.err.failed` | La livraison n'a pas pu être effectuée. Nous vous rappelons pour la reprogrammer. |

---

## 10. Libellés partagés

| Clé | Texte |
| --- | --- |
| `common.back` | Revenir à l'étape précédente |
| `common.retry` | Réessayer |
| `common.cancel` | Annuler |
| `common.close` | Fermer |
| `common.required` | Obligatoire |
| `common.optional` | Facultatif |
| `common.whatsapp` | Discuter sur WhatsApp |
| `common.loading` | Chargement… |
| `common.total` | Total à régler |
| `common.free` | Offerte |
| `common.reference` | Référence |
| `common.copy` | Copier |

---

## 11. Cohérence avec les écrans existants

| Point | Décision DSG-04 | Impact |
| --- | --- | --- |
| « pointure » vs « taille » | « pointure » partout | Aligner P09–P13 |
| CTA panier | « Ajouter au panier » | Hors DSG-04, rappel |
| CTA passage en caisse | « Commencer ma commande » | Remplace « Continuer la commande » |
| Devise | `FCFA` | Identique à P01–P07 |
| WhatsApp | « Discuter sur WhatsApp » | Identique au reste du site |
| Référence | `BRN-YYMM-XXXX` | Remplace `#BS-2025-8492` |
