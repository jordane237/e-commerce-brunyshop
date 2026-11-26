# Inventaire Sprint 2 — BRUNY SHOPPING

Date : 11 novembre 2026  
Branche de revue : `review/sprint-2-final-audit`  
Branche de base : `working` (mergée sur `cd1acf9`, à jour avec `origin/working`)  
Backup : `origin/backup/sprint-2-before-review-20261111-144049` (`2c87b1d`)

## 1. État du dépôt

| Élément | Résultat |
| --- | --- |
| Branche courante | `review/sprint-2-final-audit` |
| `git status` | Propre |
| Commits de revue non poussés | Aucun (`origin/review/sprint-2-final-audit` à jour) |
| Backup distant | Créé et poussé sur `origin` |
| Branche `working` | À jour avec `origin/working` et avec la branche de revue |
| Contenu de `working` | Contient désormais les tickets Sprint 2 et les documents de revue (`cd1acf9`) |
| Contenu de la branche de revue | Les 25 commits Sprint 2 + les documents de revue |
| Fichiers suspects trackés (`dist/`, `node_modules/`, `.env` réel, logs, backups) | Aucun (seuls `.env.example` sont trackés) |
| Fichiers vides | Aucun fichier source vide |

## 2. Tickets du Sprint 2 (officiel : `Tickets_BRUNY_SHOPPING.csv`)

18 tickets sont officiellement rattachés au Sprint 2.

| Ticket | Titre | Branche feature | Présente (remote) | Intégrée dans `working` |
| --- | --- | --- | --- | --- |
| DSG-04 | Tunnel de commande et suivi P08 à P13 | `feature/DSG-04-checkout-tracking-design` | Oui | Oui (`117b252`) |
| DSG-05 | Compte client et pages d'information P14 à P27 | `feature/DSG-05-account-info-pages-design` | Oui | Oui (`7b91e7f`) |
| DSG-06 | Back-office A01 à A16 | `feature/DSG-06-admin-backoffice-design` | Oui | Oui (`385c63a`) |
| DSG-07 | Revue finale accessibilité et cohérence | `feature/DSG-07-final-a11y-coherence-review` | Oui | Oui (`8eaac22`) |
| TEC-08 | Initialisation applications Angular | `feature/TEC-08-init-angular-apps` | Oui | Oui |
| TEC-09 | Client API Angular depuis OpenAPI | `feature/TEC-09-generate-angular-api-client` | Oui | Oui (`b710df0`) |
| TEC-10 | Design tokens et composants UI de base | `feature/TEC-10-design-tokens-ui-components` | Oui | Oui |
| TEC-12 | Noyau Angular | `feature/TEC-12-angular-core-auth-session` | Oui | Oui (`9ee4ef5`, `e738f05`) |
| AUT-05 | RBAC et refus par défaut | `feature/AUT-05-rbac-default-deny` | Oui | Oui (`374dcbd`) |
| AUT-11 | CAPTCHA formulaires sensibles | `feature/AUT-11-captcha-sensitive-forms` | Oui | Oui (`8384529`) |
| CAT-02 | API liste produits | `feature/CAT-02-products-list-api` | Oui | Oui (`3f42ca6`) |
| CAT-03 | API fiche produit | `feature/CAT-03-product-detail-api` | Oui | Oui (`87ad552`) |
| CAT-04 | API admin produits/variantes | `feature/CAT-04-admin-products-variants-api` | Oui | Oui (`5a3b753`, `cc29668`) |
| CAT-05 | Téléversement sécurisé images | `feature/CAT-05-secure-media-upload` | Oui | Oui (`2e7aa55`) |
| CAT-06 | Guides des tailles | `feature/CAT-06-size-guides-api` | Oui | Oui (`8c77a68`) |
| STK-01 | Décrément stock atomique | `feature/STK-01-atomic-stock-decrement` | Oui | Oui (`f86fbab`) |
| CRT-01 | Validation panier | `feature/CRT-01-cart-validation-api` | Oui | Oui (`ac9121b`) |
| NTF-01 | Notifications et BullMQ | `feature/NTF-01-notifications-bullmq` | Oui | Oui (`0be783f`, `3568d2d`) |

Observation : les 18 tickets sont désormais intégrés dans `working` via le merge de `review/sprint-2-final-audit` (`cd1acf9`).

## 3. Fichiers suspects / nettoyage préliminaire

- Aucun artefact de build, `node_modules`, `.env` réel ou fichier backup tracké.
- Aucun fichier source vide.
- Aucun `TODO`/`FIXME` détecté dans le code TypeScript.
- Les fichiers `.env.example` sont bien les seuls fichiers d'environnement trackés.

## 4. Prochaines étapes

Audit détaillé ticket par ticket et matrice frontend ↔ backend produits après validation de cet inventaire.
