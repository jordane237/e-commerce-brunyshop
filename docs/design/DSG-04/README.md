# DSG-04 — Tunnel de commande et suivi (P08 → P13)

> Ticket de **conception uniquement**. Aucun code applicatif n'est produit ici.
> Branche : `feature/DSG-04-checkout-tracking-design`.

---

## 1. Contenu

| Document | Objet |
| --- | --- |
| `ANALYSE-EXISTANT.md` | Analyse des maquettes, du design system, du frontend et du backend |
| `PARCOURS.md` | Flux global, routes, règles de navigation et métier, matrice d'états |
| `P08-checkout-start.md` | Écran d'entrée du tunnel |
| `P09-coordonnees.md` | Étape 1 : nom et téléphone |
| `P10-livraison.md` | Étape 2 : ville, quartier, repère, créneau |
| `P11-paiement.md` | Étape 3 : mode de paiement, CGV, confirmation |
| `P11b-attente-paiement.md` | Attente Mobile Money — **V2** |
| `P11c-echec-paiement.md` | Échec Mobile Money — **V2** |
| `P12-confirmation.md` | Confirmation et ticket de commande |
| `P13-suivi-public.md` | Suivi public, timeline, coursier |
| `COMPOSANTS-REQUIS.md` | Composants à réutiliser, étendre et créer |
| `MICROTEXTES.md` | Tous les libellés français, erreurs comprises |
| `PROTOTYPE.md` | Diagrammes, wireframes consolidés, 10 scénarios |
| `VALIDATION.md` | Checklist signable par le PO — **bloquante** |
| `README.md` | Ce document |

---

## 2. Gabarit des specs P0X

Chaque spec d'écran suit les mêmes 10 sections :

1. Objectif
2. Wireframes 360 / 768 / 1280 px
3. Composants
4. États (nominal, chargement, vide, erreur)
5. Microtextes FR
6. Interactions
7. Accessibilité WCAG 2.1 AA
8. Données API
9. Écarts et décisions
10. Référence

---

## 3. Décisions structurantes

| Sujet | Décision |
| --- | --- |
| Structure | Tunnel linéaire : P08 (entrée) → P09 → P10 → P11 → P12 → P13 |
| P08 | Écran de récapitulatif et de décision, hors décompte des 3 étapes |
| Paiement MVP | Paiement à la livraison uniquement ; Mobile Money désactivé |
| P11b / P11c | Spécifiés en V2, non implémentés |
| Référence | `BRN-YYMM-XXXX` |
| Suivi | Public, protégé par référence + téléphone ou lien signé |
| Prototype | Option B (Mermaid + ASCII + scénarios), faute d'outil de maquettage |
| Vues larges | 768 et 1280 px conçus, absents des maquettes d'origine |

---

## 4. Sources

- Maquettes : `design1/bruny shopping/bruny shopping.png` (les dossiers `/design` et `/design-1` du ticket n'existent pas).
- Design system : `docs/design-system/` (tokens, audit, hypothèses).
- Écrans P01–P07 : `docs/design-1/ANALYSE-MAQUETTES.md` (les specs P01–P07 n'existent pas encore dans le dépôt).
- Existant technique : `frontend/libs/ui`, `frontend/apps/storefront`, `backend/prisma/schema.prisma`.

---

## 5. Ce que ce ticket ne fait pas

- Aucun composant Angular, aucune route, aucun style.
- Aucun endpoint, aucune migration, aucun seed.
- Aucun contrat HTTP définitif : les specs décrivent les **données nécessaires**, pas les URLs finales.
- Aucun prototype cliquable, aucun test utilisateur.

---

## 6. Dépendances d'implémentation

| Dépendance | Type | Ticket suggéré |
| --- | --- | --- |
| `POST /orders` | API | Backend commandes |
| `GET /orders/:reference` | API | Backend commandes |
| `GET /delivery-zones` | API | Backend livraison |
| `GET /tracking/:reference` + jeton signé | API + sécurité | Backend suivi |
| Composants `StepIndicator`, `RadioCard`, `Timeline`… | Frontend | DSG-05 / implémentation tunnel |
| CGV (texte juridique) | Contenu | À fournir par le propriétaire |
| Numéro WhatsApp officiel | Contenu | À fournir par le propriétaire |

---

## 7. Ordre de lecture conseillé

1. `ANALYSE-EXISTANT.md` — contexte et limites.
2. `PARCOURS.md` — flux et règles communes.
3. `P08` → `P13` — écran par écran.
4. `COMPOSANTS-REQUIS.md` et `MICROTEXTES.md` — détails de mise en œuvre.
5. `PROTOTYPE.md` — scénarios.
6. `VALIDATION.md` — validation et signature.

---

## 8. Statut

| Élément | État |
| --- | --- |
| Analyse de l'existant | Terminée |
| Specs P08–P13 | Rédigées, **en attente de validation PO** |
| Prototype | Documenté (Option B) |
| Validation | **Non signée** |
| Implémentation | **Non autorisée avant signature de `VALIDATION.md`** |
