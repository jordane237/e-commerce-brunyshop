# Inventaire — Revue finale du Sprint 3

- **Date** : 19 novembre 2026
- **Branche de revue** : `review/sprint-3-final-audit`
- **Branche de sauvegarde** : `backup/sprint-3-before-review-20261119-230733` (poussée sur `origin`)
- **Sources de vérité** : `Cahier_des_charges_BRUNY_SHOPPING.docx` et `Tickets_BRUNY_SHOPPING.csv`

## 1. Sources de vérité localisées

| Source | Chemin | Format | Exploitation |
|---|---|---|---|
| Cahier des charges | `Cahier_des_charges_BRUNY_SHOPPING.docx` | DOCX (67 Ko) | Texte extrait via `unzip` + parse XML (65 047 caractères, 16 sections) |
| Fichier des tickets | `Tickets_BRUNY_SHOPPING.csv` | CSV UTF-8 BOM, 140 lignes, 13 colonnes | Filtre `Sprint == 3` |
| Doublon tickets | `Tickets_BRUNY_SHOPPING.docx` | DOCX suivi par Git | Contenu identique au CSV, non utilisé comme source |
| Design | `docs/design/DSG-03` à `DSG-07` | Markdown | Référentiel des écrans |
| Documentation par ticket | `docs/features/*`, `docs/content/CNT-03`, `docs/business/CNT-07` | Markdown | Preuves et analyses existantes |

> Le cahier des charges est volontairement ignoré par Git (`.gitignore`, section « Confidential specs »). Il est présent localement et n'a pas été modifié.

## 2. Périmètre officiel du Sprint 3

Le fichier tickets définit **19 tickets, 105 points**. La liste communiquée dans la demande en contenait 17 (sans CRT-02 ni CRT-03) ; ces deux tickets sont bien dans le Sprint 3 officiel.

| Ticket | Titre | Type | Points | Branche | Commit de référence | Doc. dédiée |
|---|---|---|---|---|---|---|
| TEC-13 | Utilitaires transverses : SEO, prix FCFA, téléphone +237, locale | Frontend | 3 | `feature/TEC-13-cross-cutting-utils` | `f438990` | `docs/features/TEC-13/` |
| AUT-09 | Écrans client : connexion et inscription | Frontend | 5 | `feature/AUT-09-customer-login-register-screens` | `26e7bf6` | `docs/features/AUT-09/` |
| CAT-07 | Page d'accueil de la boutique | Frontend | 5 | `feature/CAT-07-home-page` | `a8f9808` | `docs/features/CAT-07/` |
| CAT-08 | Page catalogue avec filtres synchronisés dans l'URL | Frontend | 8 | `feature/CAT-08-catalog-page` | `63e2fad` | `docs/features/CAT-08/` |
| CAT-10 | Fiche produit : galerie, couleurs, pointures, achat | Frontend | 13 | `feature/CAT-10-product-detail-page` | `d82fe89` | `docs/features/CAT-10/` |
| STK-03 | Alertes de stock bas | Backend | 3 | `feature/STK-03-low-stock-alerts` | `c20a41f` | `docs/features/STK-03/` |
| CRT-02 | Store de panier Angular persistant (compatible SSR) | Frontend | 5 | `feature/CRT-02-cart-store-persistent` | `e69637b` | `docs/features/CRT-02/` |
| CRT-03 | Mini-panier (tiroir) après ajout | Frontend | 3 | `feature/CRT-03-mini-cart-drawer` | `cf5f47b` | `docs/features/CRT-03/` |
| CRT-04 | Page panier | Frontend | 5 | `feature/CRT-04-cart-page` | `45bdd33` | `docs/features/CRT-04/` |
| ORD-01 | API de création de commande (idempotente, transactionnelle, sécurisée) | Backend | 13 | `feature/ORD-01-order-creation-api` | `856c409` | `docs/features/ORD-01/` |
| BO-01 | Structure de l'administration : mise en page, navigation, droits d'affichage | Frontend | 8 | `feature/BO-01-admin-layout-navigation` | `26003b5` | `docs/features/BO-01/` |
| BO-03 | Liste des produits (recherche, filtres, actions groupées) | Frontend | 5 | `feature/BO-03-admin-products-list` | `74471c9` | `docs/features/BO-03/` |
| MKT-01 | Pages statiques et pages légales | Frontend | 5 | `feature/MKT-01-static-legal-pages` | `643e725` | `docs/features/MKT-01/` |
| MKT-02 | Formulaire de contact protégé | Frontend + Backend | 3 | `feature/MKT-02-contact-form` | `a2765a9` | `docs/features/MKT-02/` |
| MKT-04 | Pixel Meta, UTM et bandeau de consentement | Frontend | 5 | `feature/MKT-04-meta-pixel-utm-consent` | `51f8f02` | `docs/features/MKT-04/` |
| MKT-06 | Bouton WhatsApp flottant et liens de contact | Frontend | 3 | `feature/MKT-06-whatsapp-floating-button` | `2a73701` | `docs/features/MKT-06/` |
| OPS-01 | Dockerfiles multi-étapes et configuration Nginx | DevOps | 5 | `feature/OPS-01-dockerfiles-nginx` | `c9c72c2` | `docs/features/OPS-01/` |
| CNT-03 | Politiques de livraison, d'échange et textes du site | PO | 5 | `feature/CNT-03-delivery-exchange-policies` | `0a8b993` | `docs/content/CNT-03/` |
| CNT-07 | Démarches d'accès au paiement Mobile Money | PO | 3 | `feature/CNT-07-mobile-money-onboarding` | `b398873` | `docs/business/CNT-07/` |

Les 19 branches existent bien sur `origin`.

## 3. État réel du dépôt

### Constat principal : `working` ne contient aucun ticket du Sprint 3

| Élément | Valeur constatée |
|---|---|
| Tête de `working` | `45cd3de docs(sprint-2): finalize working merge references [SPRINT-2]` |
| `origin/working` | `45cd3de` — identique à `working` |
| Commits locaux non poussés | 0 (`git log origin/working..working` vide) |
| Tête du Sprint 3 | `feature/MKT-06-whatsapp-floating-button` = `2a73701` |
| Base du Sprint 3 | `working` est ancêtre de `2a73701` (fast-forward possible) |
| Commits du Sprint 3 | 19 commits linéaires, du 12 au 19 novembre 2026 |
| Tickets du Sprint 3 présents sur `working` | **0 / 19** |
| Tags | **aucun** (`git tag -l` vide) |
| Branches distantes non mergées dans `working` | 26, dont les 19 branches du Sprint 3 |

Les branches du Sprint 3 ont été empilées les unes sur les autres (chaque ticket part de la branche du ticket précédent) au lieu d'être mergées dans `working`. La branche `feature/MKT-06-whatsapp-floating-button` contient donc l'intégralité du sprint. Conséquence : `working` est en réalité l'état de fin de Sprint 2.

La branche de revue a été alignée sur `2a73701` (et non sur `45cd3de`) pour auditer le livrable réel. Aucun commit n'a été poussé sur `working` ni sur `main`.

### Branches

- Toutes les branches `feature/*` du Sprint 3 sont présentes sur `origin` et à jour localement.
- Aucune branche `feature/*` du Sprint 3 n'est mergée dans `working`.
- Des branches de travaux antérieurs restent non mergées (`feature/AUT-02`, `AUT-03`, `AUT-04`, `AUT-08`, `CAT-01`, `CAT-03`, `CNT-01`), ce qui est cohérent avec un historique de travail empilé puis squashé, mais non documenté.

### Intégration continue

`gh` n'est pas installé ; l'état a été relevé via l'API GitHub.

| Workflow | Dernier run | Résultat | Cause |
|---|---|---|---|
| `CI` (`ci.yml`) sur `working` | [44625573704](https://github.com/jordane237/e-commerce-brunyshop/actions/runs/44625573704) | ❌ échec | Run créé mais **0 job** : le workflow est invalidé avant exécution |
| `CI` sur `2a73701` | [44618796763](https://github.com/jordane237/e-commerce-brunyshop/actions/runs/44618796763) | ❌ échec | Idem, **0 job** |
| `Docker Image Scan` sur `2a73701` | [44624589037](https://github.com/jordane237/e-commerce-brunyshop/actions/runs/44624589037) | ❌ échec | `Unable to resolve action aquasecurity/trivy-action@0.36.0` |

Cause probable du workflow `CI` à 0 job : l'expression dynamique `${{ needs.$job.result }}` dans le job `ci-success` n'est pas valide pour GitHub Actions (accès dynamique à une propriété non supporté). Le workflow ne peut donc pas être exécuté, et aucune vérification de qualité n'a réellement tourné en CI sur le Sprint 3. Ce point doit être corrigé avant de considérer le sprint comme validé.

Le déclencheur de `ci.yml` est limité à `main`, alors que des runs sont malgré tout créés sur les pushes de branches : le comportement observé confirme que le workflow n'est pas sain et doit être revu.

## 4. Fichiers et configurations suspects

Recherche effectuée sur les fichiers suivis (`git ls-files`) et non suivis.

| # | Fichier | Constat | Action proposée |
|---|---|---|---|
| 1 | `.~lock.Tickets_BRUNY_SHOPPING.docx#` | Verrou LibreOffice non suivi, présent à la racine | Supprimer (sans impact projet) + ajouter `~$*`/`.~lock.*` au `.gitignore` |
| 2 | `Tickets_BRUNY_SHOPPING.docx` | Suivi par Git alors que `.gitignore` déclare les specs confidentielles « local only » ; doublon du CSV | Décider : conserver (traçabilité) ou retirer du suivi. Le CSV reste la source exploitable |
| 3 | `docker-compose.production.yml` et `docker-compose.prod.yml` | Deux fichiers de production ; `production.yml` est un overlay, `prod.yml` une stack complète | Documenter lequel fait foi, ou fusionner/renommer |
| 4 | `.env` racine | Présent localement, non suivi (ignoré), aucun secret dans Git | Conserver localement |
| 5 | `docs/features/CRT-04` | Pas de `ANALYSE-DESIGN.md`, seulement `VERIFICATION.md` | Vérifier au audit ; compléter si le gabarit l'exige |
| 6 | Artifacts de build | Aucun `dist/`, `coverage/`, `.angular/`, `node_modules/` suivi | Conforme |
| 7 | Secrets | Aucun `.env` réel, `.pem`, `.key` ou log suivi | Conforme à ce stade |

Aucune suppression ne sera appliquée avant validation du `CLEANUP-PLAN.md`.

## 5. Écarts entre la demande de revue et la réalité

1. **`working` ne contient pas le Sprint 3.** La revue porte sur `2a73701`, tête de la pile Sprint 3, poussée sur `origin`. Un fast-forward de `working` vers `2a73701` est possible après validation.
2. **Le Sprint 3 compte 19 tickets, pas 17.** CRT-02 et CRT-03 sont absents de la liste fournie dans la demande mais présents dans le fichier officiel.
3. **Le CI est rouge et n'a exécuté aucun job.** La CI ne peut pas servir de preuve pour l'instant.
4. **Aucun tag de sprint** n'existe.

## 6. Décisions demandées avant l'audit

1. Confirmer le périmètre de **19 tickets / 105 points** (ajout de CRT-02 et CRT-03).
2. Confirmer que l'audit se fait sur `feature/MKT-06-whatsapp-floating-button` (`2a73701`), puis que `working` sera fast-forwardé vers ce commit après validation (aucun merge commit nécessaire).
3. Autoriser, dans la phase de corrections, la réparation du workflow `CI` (expression `needs.$job.result`) et de `docker-scan.yml` (`trivy-action@0.36.0` inexistant), afin d'obtenir une CI réellement verte.
4. Confirmer le traitement du `Tickets_BRUNY_SHOPPING.docx` suivi (conserver ou retirer du suivi).

## 7. Suite prévue

1. Audit ticket par ticket et matrice frontend ↔ backend (lecture seule).
2. Plan de nettoyage soumis à validation.
3. Corrections TDD, commit par correction.
4. Vérification finale (23 checks) et rapport de sprint.
