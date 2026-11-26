# VALIDATION — DSG-04

> Checklist à signer par le Product Owner.
> **La signature est bloquante** : aucun développement du tunnel P08–P13 ne démarre avant validation.
> Cocher chaque ligne, ajouter un commentaire si nécessaire, puis signer en fin de document.

> **Après DSG-07** : la checklist reste valable, mais la signature est toujours attendue. Voir [`../DSG-07/DESIGN-FREEZE.md`](../DSG-07/DESIGN-FREEZE.md) et [`../DSG-07/AUDIT-ACCESSIBILITE.md`](../DSG-07/AUDIT-ACCESSIBILITE.md).

---

## 1. Périmètre et méthode

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 1.1 | DSG-04 est un ticket de **conception uniquement** : aucun code Angular ni backend n'est produit | ☐ | |
| 1.2 | Les livrables sont 15 documents Markdown dans `docs/design/DSG-04/` | ☐ | |
| 1.3 | La source visuelle est `design1/bruny shopping/bruny shopping.png` (les dossiers `/design` et `/design-1` n'existent pas) | ☐ | |
| 1.4 | Le prototype est en Option B (Mermaid + wireframes ASCII + 10 scénarios), faute d'outil de maquettage | ☐ | |
| 1.5 | Aucun composant ni route n'est implémenté à ce stade | ☐ | |

---

## 2. Parcours

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 2.1 | Tunnel **linéaire en 3 étapes** : P09 coordonnées → P10 livraison → P11 paiement | ☐ | |
| 2.2 | **P08** est un écran d'entrée hors décompte des étapes (stepper sans étape active) | ☐ | |
| 2.3 | Le panier vide à l'entrée redirige vers `/panier` avec un message | ☐ | |
| 2.4 | Les retours arrière conservent la saisie ; aucune donnée n'est perdue | ☐ | |
| 2.5 | Le brouillon local est purgé après 24 h | ☐ | |
| 2.6 | Un changement de panier détecté affiche un avertissement avant confirmation | ☐ | |
| 2.7 | La protection contre la double commande repose sur une clé d'idempotence | ☐ | |
| 2.8 | Le panier est vidé seulement après affichage réussi de P12 | ☐ | |

---

## 3. Règles métier

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 3.1 | Champs obligatoires : nom, téléphone, ville, quartier, point de repère, créneau | ☐ | |
| 3.2 | Téléphone : 9 chiffres, commence par 6, préfixe `+237` non éditable | ☐ | |
| 3.3 | Zones : Douala (1 500 FCFA, 24 h), Yaoundé (3 000 FCFA, 24–48 h), autres sur devis | ☐ | |
| 3.4 | Livraison offerte dès 2 paires | ☐ | |
| 3.5 | Le créneau est une **préférence**, jamais une garantie | ☐ | |
| 3.6 | Paiement MVP : **COD uniquement** ; Mobile Money affiché désactivé « Bientôt disponible » | ☐ | |
| 3.7 | Aucun paiement en ligne en MVP ; aucune donnée bancaire collectée | ☐ | |
| 3.8 | **Case CGV obligatoire**, non cochée par défaut, avec lien vers les conditions | ☐ | |
| 3.9 | Référence au format `BRN-YYMM-XXXX` | ☐ | |
| 3.10 | Statut initial `PENDING_CONFIRMATION`, `paymentStatus = PENDING` | ☐ | |
| 3.11 | `addressSnapshot` figé à la création | ☐ | |

---

## 4. Écrans

| # | Écran | Attendu | OK | Commentaire |
| --- | --- | --- | --- | --- |
| 4.1 | P08 | Récapitulatif, garanties, CTA « Commencer ma commande » | ☐ | |
| 4.2 | P09 | Nom + téléphone + option d'appel, validation en direct | ☐ | |
| 4.3 | P10 | Ville, quartier, repère, créneau, frais affichés | ☐ | |
| 4.4 | P11 | RadioCards de paiement, CGV, récapitulatif, CTA « Confirmer la commande » | ☐ | |
| 4.5 | P11b | Écran d'attente V2 (non implémenté en MVP) | ☐ | |
| 4.6 | P11c | Écran d'échec V2 (non implémenté en MVP) | ☐ | |
| 4.7 | P12 | Ticket, articles, totaux, livraison, CTA « Suivre ma commande » | ☐ | |
| 4.8 | P13 | Vérification, statut, coursier, timeline à 5 étapes, montant, échange | ☐ | |
| 4.9 | Chaque écran est décliné en **360 / 768 / 1280 px** | ☐ | |
| 4.10 | Chaque écran possède **4 états** : nominal, chargement, vide, erreur | ☐ | |

---

## 5. Contenu et ton

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 5.1 | Tous les microtextes sont en français, au vouvoiement | ☐ | |
| 5.2 | Les boutons utilisent des verbes d'action | ☐ | |
| 5.3 | Chaque message d'erreur explique comment corriger | ☐ | |
| 5.4 | La devise est `FCFA`, format identique à P01–P07 | ☐ | |
| 5.5 | « pointure » est utilisé pour les chaussures | ☐ | |
| 5.6 | Aucune promesse non tenue : pas de « temps réel », « 100 % sécurisé », heure garantie | ☐ | |
| 5.7 | `MICROTEXTES.md` est la référence unique des libellés | ☐ | |

---

## 6. Accessibilité

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 6.1 | Cibles interactives ≥ 44 px | ☐ | |
| 6.2 | Focus visible sur tous les éléments interactifs | ☐ | |
| 6.3 | Erreurs liées aux champs (`aria-describedby`) et annoncées (`role="alert"`) | ☐ | |
| 6.4 | Stepper et timeline accessibles (`aria-current`, listes ordonnées) | ☐ | |
| 6.5 | Contrastes AA respectés (or → `accent-text`, vert → `success-strong`) | ☐ | |
| 6.6 | Aucune information portée par la seule couleur | ☐ | |
| 6.7 | Lisible et utilisable à 200 % de zoom | ☐ | |
| 6.8 | Compte à rebours de P11b annoncé sans saturation (60 s, 30 s, expiration) | ☐ | |

---

## 7. Données et sécurité

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 7.1 | Les modèles Prisma existants (`Order`, `Payment`, `Shipment`, `DeliveryZone`) suffisent : aucune migration DSG-04 | ☐ | |
| 7.2 | Les endpoints manquants sont identifiés : `POST /orders`, `GET /orders/:reference`, `GET /delivery-zones`, `GET /tracking/:reference` | ☐ | |
| 7.3 | Aucun contrat HTTP n'est figé par DSG-04 : les specs décrivent les données nécessaires | ☐ | |
| 7.4 | Le suivi exige une vérification (référence + téléphone) ou un lien signé | ☐ | |
| 7.5 | Les données personnelles sont masquées avant vérification | ☐ | |
| 7.6 | Le message d'erreur de suivi est identique que la référence existe ou non (anti-énumération) | ☐ | |
| 7.7 | Le nombre de tentatives de suivi est limité | ☐ | |
| 7.8 | Aucun secret, aucune donnée de paiement dans les documents | ☐ | |

---

## 8. Composants

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 8.1 | Les 9 composants existants réutilisés sont identifiés | ☐ | |
| 8.2 | Les 14 composants à créer sont listés avec leur API et leurs états | ☐ | |
| 8.3 | Les 4 composants de shell sont identifiés (dont `CheckoutHeader` et `BottomNav`) | ☐ | |
| 8.4 | Aucune dépendance externe nouvelle n'est introduite | ☐ | |
| 8.5 | Le shell diffère entre le tunnel (sans bottom-nav) et P12/P13 (avec bottom-nav) | ☐ | |

---

## 9. Prototype

| # | Point à valider | OK | Commentaire |
| --- | --- | --- | --- |
| 9.1 | Les 10 scénarios de `PROTOTYPE.md` sont couverts par les specs | ☐ | |
| 9.2 | Aucun scénario ne nécessite un écran non spécifié | ☐ | |
| 9.3 | Les cas non couverts sont explicitement listés | ☐ | |
| 9.4 | Le prototype est accepté comme non cliquable | ☐ | |

---

## 10. Décisions ouvertes à trancher

| # | Question | Proposition DSG-04 | Décision PO |
| --- | --- | --- | --- |
| 10.1 | P08 hors des 3 étapes | Oui | |
| 10.2 | Tunnel en 3 écrans plutôt qu'une page | Oui | |
| 10.3 | Format de référence `BRN-YYMM-XXXX` | Oui | |
| 10.4 | P11b/P11c en V2 non implémentés | Oui | |
| 10.5 | Accès au suivi : lien signé + formulaire | Oui | |
| 10.6 | Checkbox CGV obligatoire | Oui | |
| 10.7 | Quartier en liste fermée ou champ libre | Liste si disponible, sinon libre | |
| 10.8 | Créneau proposé (absent de la maquette) | Oui, 3 plages | |
| 10.9 | Bottom-nav sur P12/P13 | Oui | |
| 10.10 | Bloc carte statique, sans service de cartographie | Oui | |

---

## 11. Signature

| Rôle | Nom | Date | Décision |
| --- | --- | --- | --- |
| Product Owner | | | ☐ Validé ☐ Validé avec réserves ☐ Refusé |
| Référent design | | | ☐ Validé ☐ Validé avec réserves ☐ Refusé |
| Référent technique | | | ☐ Validé ☐ Validé avec réserves ☐ Refusé |

**Réserves / commentaires :**

```text

```

---

## 12. Condition de levée

L'implémentation de P08–P13 est autorisée lorsque :

1. les trois signatures ci-dessus sont apportées ;
2. les 10 décisions du §10 sont tranchées ;
3. les écarts signalés en revue sont intégrés dans les specs concernées.

Tant que ce document n'est pas signé, les specs sont considérées comme **proposées**, pas validées.
