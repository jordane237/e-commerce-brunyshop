# Inventaire Sprint 2 — BRUNY SHOPPING

Date : 11 novembre 2026  
Branche de revue : `review/sprint-2-final-audit`  
Branche de base : `working` (à jour avec `origin/working`)  
Backup : `origin/backup/sprint-2-before-review-20261111-144049`

## 1. État du dépôt

| Élément | Résultat |
| --- | --- |
| Branche courante | `review/sprint-2-final-audit` |
| `git status` | Propre (aucune modification ni fichier non tracké suspect) |
| Backup distant | Créé et poussé sur `origin` |
| Branche `working` | À jour avec `origin/working` |
| Fichiers suspects trackés (`dist/`, `node_modules/`, `.env` réel, logs, backups) | Aucun (seuls `.env.example` sont trackés) |
| Fichiers vides | Aucun fichier source vide (uniquement locks Nx) |

## 2. Tickets du Sprint 2 (officiel : `Tickets_BRUNY_SHOPPING.csv`)

18 tickets sont officiellement rattachés au Sprint 2 :

| Ticket | Titre | Branche feature | Présente (remote) | Intégrée sur `working` (sens strict) |
| --- | --- | --- | --- | --- |
| DSG-04 | Tunnel de commande et suivi P08 à P13 | `feature/DSG-04-checkout-tracking-design` | Oui | Non (merge squash probable) |
| DSG-05 | Compte client et pages d'information P14 à P27 | `feature/DSG-05-account-info-pages-design` | Oui | Non (merge squash probable) |
| DSG-06 | Back-office A01 à A16 | `feature/DSG-06-admin-backoffice-design` | Oui | Non (merge squash probable) |
| DSG-07 | Revue finale accessibilité et cohérence | `feature/DSG-07-final-a11y-coherence-review` | Oui | Non (merge squash probable) |
| TEC-08 | Initialisation applications Angular | `feature/TEC-08-init-angular-apps` | Oui | Non (merge squash probable) |
| TEC-09 | Client API Angular depuis OpenAPI | `feature/TEC-09-generate-angular-api-client` | Oui | Non (merge squash probable) |
| TEC-10 | Design tokens et composants UI de base | `feature/TEC-10-design-tokens-ui-components` | Oui | Non (merge squash probable) |
| TEC-12 | Noyau Angular | `feature/TEC-12-angular-core-auth-session` | Oui | Intégrée dans la branche de revue (merge non-ff) pour audit |
| AUT-05 | RBAC et refus par défaut | `feature/AUT-05-rbac-default-deny` | Oui | Non (merge squash probable) |
| AUT-11 | CAPTCHA formulaires sensibles | `feature/AUT-11-captcha-sensitive-forms` | Oui | Non (merge squash probable) |
| CAT-02 | API liste produits | `feature/CAT-02-products-list-api` | Oui | Non (merge squash probable) |
| CAT-03 | API fiche produit | `feature/CAT-03-product-detail-api` | Oui | Non (merge squash probable) |
| CAT-04 | API admin produits/variantes | `feature/CAT-04-admin-products-variants-api` | Oui | Non (merge squash probable) |
| CAT-05 | Téléversement sécurisé images | `feature/CAT-05-secure-media-upload` | Oui | Non (merge squash probable) |
| CAT-06 | Guides des tailles | `feature/CAT-06-size-guides-api` | Oui | Non (merge squash probable) |
| STK-01 | Décrément stock atomique | `feature/STK-01-atomic-stock-decrement` | Oui | Non (merge squash probable) |
| CRT-01 | Validation panier | `feature/CRT-01-cart-validation-api` | Oui | Non (merge squash probable) |
| NTF-01 | Notifications et BullMQ | `feature/NTF-01-notifications-bullmq` | Oui | Non (merge squash probable) |

Observation : `git branch -r --merged working` ne liste aucune branche Sprint 2 (7 branches fusionnées seulement, dont Sprint 1). Les modules correspondants sont néanmoins présents dans l'arbre `working` (catalogue, panier, commandes, notifications, stock, frontend apps), ce qui indique des fusions squash/merge non détectées par `--merged`. TEC-12 a été intégré explicitement dans la branche de revue pour pouvoir être audité.

## 3. Fichiers suspects / nettoyage préliminaire

- Aucun artefact de build, `node_modules`, `.env` réel ou fichier backup tracké.
- Aucun fichier source vide (hors locks Nx).
- Aucun `TODO`/`FIXME` détecté dans le code TypeScript.
- Les fichiers `.env.example` sont bien les seuls fichiers d'environnement trackés.

## 4. Prochaines étapes

Audit détaillé ticket par ticket et matrice frontend ↔ backend à produire après validation de cet inventaire.
