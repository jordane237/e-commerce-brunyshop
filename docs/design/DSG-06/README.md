# DSG-06 — Back-office A01–A16

## Statut

**Spécifications de design terminées, non implémentées.** Ce dossier ne contient aucun composant Angular, aucun contrôleur backend et aucune migration. Les écrans dont l’API manque sont spécifiés comme cibles, avec leurs dépendances explicites.

- Branche : `feature/DSG-06-admin-backoffice-design`
- Périmètre : **21 vues** (16 écrans numérotés + 5 sous-vues)
- Source visuelle : `design1/bruny shopping/bruny shopping.png`, zone L
- Référence de conception : mobile 360 px d’abord, desktop 1280 px ensuite
- Validation : `VALIDATION.md`, **non signé**
- Revue DSG-07 : audit WCAG, cohérence et gel dans [`../DSG-07/`](../DSG-07/README.md)

## Les 21 specs

### Authentification

| Écran | Fichier |
| --- | --- |
| A01 Connexion | [A01-connexion-admin.md](A01-connexion-admin.md) |
| A02 Vérification 2FA | [A02-2fa.md](A02-2fa.md) |

### Dashboard

| Écran | Fichier |
| --- | --- |
| A03 Tableau de bord | [A03-dashboard.md](A03-dashboard.md) |

### Catalogue

| Écran | Fichier |
| --- | --- |
| A04 Liste des produits | [A04-liste-produits.md](A04-liste-produits.md) |
| A05 Créer / modifier un produit | [A05-creation-edition-produit.md](A05-creation-edition-produit.md) |
| A05b Générateur de variantes | [A05b-variant-generator.md](A05b-variant-generator.md) |
| A06 Gestion du stock | [A06-gestion-stock.md](A06-gestion-stock.md) |

### Commandes et livraisons

| Écran | Fichier |
| --- | --- |
| A07 Liste des commandes | [A07-liste-commandes.md](A07-liste-commandes.md) |
| A08 Détail d’une commande | [A08-detail-commande.md](A08-detail-commande.md) |
| A09 Liste des livraisons | [A09-liste-livraisons.md](A09-liste-livraisons.md) |
| A09b Mes livraisons du jour | [A09b-my-deliveries.md](A09b-my-deliveries.md) |
| A09c Détail d’une livraison | [A09c-detail-livraison.md](A09c-detail-livraison.md) |

### Clients et utilisateurs

| Écran | Fichier |
| --- | --- |
| A10 Liste des clients | [A10-liste-clients.md](A10-liste-clients.md) |
| A10b Fiche client | [A10b-detail-client.md](A10b-detail-client.md) |
| A11 Utilisateurs internes | [A11-utilisateurs-internes.md](A11-utilisateurs-internes.md) |

### Promotions et avis

| Écran | Fichier |
| --- | --- |
| A12 Promotions | [A12-promotions.md](A12-promotions.md) |
| A12b Créer / modifier un coupon | [A12b-edition-coupon.md](A12b-edition-coupon.md) |
| A13 Avis clients | [A13-avis-clients.md](A13-avis-clients.md) |

### Paramètres, audit et profil

| Écran | Fichier |
| --- | --- |
| A14 Paramètres | [A14-parametres.md](A14-parametres.md) |
| A15 Journal d’audit | [A15-audit-log.md](A15-audit-log.md) |
| A16 Mon profil | [A16-profil-admin.md](A16-profil-admin.md) |

## Documents transverses

| Document | Contenu |
| --- | --- |
| [ANALYSE-EXISTANT.md](ANALYSE-EXISTANT.md) | Audit du dépôt, de la maquette, des APIs, RBAC et incohérences |
| [CARTOGRAPHIE.md](CARTOGRAPHIE.md) | Diagramme, routes, guards, navigation par rôle |
| [RESPONSIVE-PATTERNS.md](RESPONSIVE-PATTERNS.md) | Règles 360/768/1024/1280, tables → cartes, livreur, variantes |
| [COMPOSANTS-REQUIS.md](COMPOSANTS-REQUIS.md) | 29 composants, props, états, a11y, priorités |
| [MICROTEXTES.md](MICROTEXTES.md) | Chaînes FR, 9 enums traduits, formats, erreurs |
| [PROTOTYPE.md](PROTOTYPE.md) | Option C, 18 scénarios du prototype |
| [prototype/variant-generator.html](prototype/variant-generator.html) | Démo autonome du générateur couleurs × pointures |
| [VALIDATION.md](VALIDATION.md) | Checklist signable, CA #2/#3/#4, décisions |

## Gabarit d’une spec

Chaque écran contient 11 sections :

1. Objectif et contexte
2. Rôles autorisés
3. Wireframes 360 / 768 / 1280
4. Composants
5. Quatre états : vide, chargement, erreur, succès
6. Microtextes FR
7. Interactions
8. Accessibilité WCAG 2.1 AA
9. Données API
10. Écarts et dépendances
11. Référence

## Conventions

- Français pour tout texte utilisateur et toute documentation.
- Montants en entiers XAF.
- Aucun enum brut à l’écran.
- Actions non autorisées masquées, pas grisées.
- Chaque table a sa `CardList` mobile.
- Cibles 44 px, 48 px pour le livreur.
- Quatre états obligatoires dès qu’un écran dépend de données.
- Aucune donnée inventée : véhicules, hubs, casiers et SLA sont exclus.

## Dépendances backend

Seuls existent aujourd’hui :

- `POST/PATCH/DELETE /admin/products`, `PUT /variants`, `POST /duplicate` ;
- `PUT /admin/size-guides/:id` ;
- médias `presign`, `confirm`, `delete`, `reorder` ;
- notifications dead-letters ;
- authentification, 2FA setup/verify, `GET /me`.

Sont absents et bloquent l’implémentation : liste/détail produits admin, marques, dashboard, stock, commandes, livraisons, clients, utilisateurs, coupons, avis, paramètres, audit, profil en écriture, sessions.

## Vérifier localement

```bash
npx prettier --check "docs/design/DSG-06/**/*.{md,html}"
```

Ouvrir le prototype :

```bash
xdg-open docs/design/DSG-06/prototype/variant-generator.html
```

## Hors périmètre

- Composants Angular et styles applicatifs.
- Endpoints, schémas Prisma, migrations.
- Paiement, remboursement, facture, bordereau.
- Suivi GPS, preuve photo, signature.
- Notifications temps réel, export CSV.
- Multi-boutique, portée produit des coupons, parrainage.

## Prochaine étape

1. Faire signer `VALIDATION.md` par le gérant et un livreur test.
2. Trancher les 8 décisions listées.
3. Créer les tickets backend des dépendances.
4. Implémenter d’abord `DataTable` / `CardList`, puis A04/A05/A05b.
5. Ne pas présenter un écran comme terminé tant que son API n’existe pas.
