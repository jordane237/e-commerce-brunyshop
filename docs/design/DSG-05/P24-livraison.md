# P24 — Livraison

> DSG-05 · groupe Information · route `/livraison`
> Endpoint à créer : `GET /delivery-zones` ; fallback : zones du seed.

---

## 1. Objectif & rôle

Expliquer où, quand et à quel prix BRUNY SHOPPING livre, sans surprise au checkout. La page doit rendre les frais et délais vérifiables d'un coup d'œil et orienter les villes non desservies vers le contact.

---

## 2. Wireframe textuel par breakpoint

### 360 px

1. Header + fil d'Ariane « Accueil › Livraison ».
2. `h1` « Livraison » + chapô.
3. **Tableau des zones** transformé en cartes : ville, délai, frais.
4. Bloc « Comment ça se passe » en 4 étapes : commande, confirmation, préparation, livraison.
5. Bloc « Paiement à la livraison » : explication, confirmation par appel/WhatsApp.
6. Bloc « Suivre ma commande » : lien P13 + besoin de la référence.
7. Bloc « Ma ville n'est pas listée » : CTA contact/WhatsApp.
8. FAQ courte (3 questions) + lien P23.
9. Footer.

### 768 px

- Tableau à 3 colonnes pour les zones.
- Étapes en 4 colonnes.

### 1280 px

- Conteneur 900 px, tableau pleine largeur, encadré paiement à droite.

```text
┌──────────────────────────────────────────────────────────────┐
│ Livraison                                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Zone               Délai indicatif       Frais            │ │
│ │ Douala Centre      1 jour ouvré          1 500 FCFA       │ │
│ │ Douala Périphérie  2 jours ouvrés        2 500 FCFA       │ │
│ │ Yaoundé            3 jours ouvrés        3 000 FCFA       │ │
│ │ Bafoussam          4 jours ouvrés        4 000 FCFA       │ │
│ │ Autres régions     5 jours ouvrés        5 000 FCFA       │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Composants utilisés

| Composant | Source | Variante | État |
| --- | --- | --- | --- |
| `Table` | TEC-10 | zones | normal, loading |
| `Badge` | TEC-10 | info | — |
| `Button` | TEC-10 | primary, whatsapp, ghost | — |
| `Accordion` | NOUVEAU | FAQ courte | fermé |
| `Breadcrumb` | NOUVEAU | — | — |
| `Alert` | NOUVEAU | info | — |

---

## 4. États obligatoires

- **Chargement** : skeleton du tableau ; le reste du contenu s'affiche immédiatement.
- **Vide** : aucune zone retournée → message « Les zones de livraison ne sont pas disponibles pour le moment. » + contact.
- **Erreur** : endpoint en échec → tableau de secours avec les 5 zones du seed + mention « Tarifs indicatifs, confirmés à la commande. »
- **Succès** : tableau à jour, tarifs et délais affichés.

### Erreurs détaillées

| Cas | Message |
| --- | --- |
| Zones indisponibles | « Les zones de livraison ne sont pas disponibles pour le moment. Contactez-nous pour confirmer votre livraison. » |
| Ville non desservie | « Nous ne livrons pas encore cette ville. Écrivez-nous : nous étudions les demandes. » |
| Réseau | « Connexion interrompue. Les tarifs affichés peuvent dater de votre dernière visite. » |

---

## 5. Microtextes FR

| Emplacement | Texte | Ton | A11y |
| --- | --- | --- | --- |
| Titre | Livraison | neutre | `h1` |
| Chapô | Nous livrons à Douala, Yaoundé, Bafoussam et dans plusieurs régions du Cameroun. | info | — |
| Tableau titre | Zones, délais et frais | neutre | `h2` |
| Colonne zone | Zone | neutre | `th` |
| Colonne délai | Délai indicatif | neutre | `th` |
| Colonne frais | Frais de livraison | neutre | `th` |
| Douala Centre | Douala Centre | neutre | — |
| Douala Périphérie | Douala Périphérie | neutre | — |
| Yaoundé | Yaoundé | neutre | — |
| Bafoussam | Bafoussam | neutre | — |
| Autres régions | Autres régions | neutre | — |
| Note délais | Les délais sont indicatifs et courent à partir de la confirmation de votre commande. | info | — |
| Étapes titre | Comment se passe la livraison | neutre | `h2` |
| Étape 1 | Vous passez commande et choisissez votre zone. | neutre | — |
| Étape 2 | Nous vous appelons pour confirmer. | neutre | — |
| Étape 3 | Nous préparons votre commande. | neutre | — |
| Étape 4 | Le coursier vous livre et vous payez. | neutre | — |
| Paiement titre | Paiement à la livraison | neutre | `h2` |
| Paiement corps | Vous réglez en espèces ou par Mobile Money au moment de la réception, après vérification de votre commande. | rassurant | — |
| Suivi titre | Suivre ma commande | neutre | `h2` |
| Suivi corps | Munissez-vous de votre référence de commande reçue par SMS ou e-mail. | aide | — |
| Suivi CTA | Suivre ma commande | action | — |
| Hors zone titre | Ma ville n'est pas listée | neutre | `h2` |
| Hors zone corps | Écrivez-nous : nous étudions les demandes de nouvelles zones. | aide | — |
| Hors zone CTA | Nous contacter | action | — |
| FAQ titre | Questions sur la livraison | neutre | `h2` |
| Erreur zones | Les zones de livraison ne sont pas disponibles pour le moment. | neutre | `role="alert"` |
| Secours | Tarifs indicatifs, confirmés à la commande. | info | — |

---

## 6. Interactions & comportements

- Tableau desktop, cartes mobile (une carte par zone).
- Tri par ordre de délai croissant.
- CTA « Suivre ma commande » → P13.
- « Nous contacter » → P22 avec sujet « Une livraison ».
- Les frais affichés sont ceux du seed ; le checkout recalcule selon la zone choisie.
- Aucun simulateur de frais en MVP : le calcul se fait au checkout.
- Si `GET /delivery-zones` échoue, le tableau de secours est clairement signalé comme indicatif.

---

## 7. Accessibilité (WCAG 2.1 AA)

- `h1` unique, sections `h2`.
- Tableau avec `caption`, `th scope="col"`, pas de fusion complexe.
- Cartes mobiles : libellé visible pour chaque valeur, pas de tableau CSS.
- Liens CTA explicites, pas de « cliquez ici ».
- Alertes : `role="alert"` pour l'échec, `role="status"` pour le secours.
- Cibles ≥ 44 px, focus visible, contraste AA.
- Zoom 200 % : tableau remplacé par les cartes, aucun défilement horizontal.

---

## 8. Données API nécessaires

| Donnée | Endpoint | Fallback |
| --- | --- | --- |
| Zones | `GET /delivery-zones` **à créer** | Seed local (5 zones) |

Réponse : `[{ id, name, fee, estimatedDays }]`.

Valeurs de référence du seed : Douala Centre 1 500 / 1 j ; Douala Périphérie 2 500 / 2 j ; Yaoundé 3 000 / 3 j ; Bafoussam 4 000 / 4 j ; Autres régions 5 000 / 5 j.

---

## 9. Écarts / points à valider

| Constat | Décision |
| --- | --- |
| DSG-04 affichait Yaoundé à 2 000 FCFA | **Résolu par DSG-07** : DSG-04 et DSG-05 sont alignés sur le seed à 3 000 FCFA. |
| Aucune page livraison dans la planche | Conçue |
| Délais non modélisés par commune | Délai par zone uniquement |
| Livraison gratuite évoquée ailleurs | Non retenue : aucun seuil défini |
| Paiement Mobile Money | Affiché comme option à la livraison, à confirmer par l'exploitation |

---

## 10. Wireframe de référence

Aucun fichier dédié ; seed `delivery-zones.seed.ts` et récapitulatif de commande DSG-04.
