# A03 — Dashboard opérationnel

## 1. Objectif et contexte

Donner à chaque membre de l’équipe une vue immédiate de l’activité qui le concerne : ventes, commandes à traiter, stock, livraisons. Le dashboard est le point d’atterrissage après connexion et doit permettre d’agir en un clic, sans passer par un menu.

- Route cible : `/admin`
- Accès : tout utilisateur interne authentifié.
- Contenu adapté au rôle : un stock manager ne voit pas les KPI de chiffre d’affaires, un livreur ne voit que sa tournée.
- Référence : zone L, section KPI + alerte stock + commandes récentes.

## 2. Rôles autorisés

| Rôle | Vue | KPI principaux | Actions rapides |
| --- | --- | --- | --- |
| `SUPER_ADMIN` | Complète | CA, commandes, stock, COD, audit récent | Tout |
| `ADMIN` | Complète | CA, commandes, stock, COD | Tout sauf gestion des SUPER_ADMIN |
| `ORDER_MANAGER` | Commandes | Commandes du jour, à valider, expédiées, COD | Commandes, clients, coupons |
| `STOCK_MANAGER` | Stock | Ruptures, seuils, variantes à préparer, mouvements | Produits, stock |
| `LIVREUR` | Tournée | Mes livraisons, COD à encaisser, échecs | A09b uniquement |

Les cartes non autorisées sont absentes, pas grisées.

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰  BRUNY        🔔 2   [AB] │
│ Bonjour Awa                  │
│ Mercredi 11 novembre         │
│                              │
│ CA encaissé aujourd’hui      │
│ 485 000 FCFA     +18 % hier  │
│ ┌────────────┬─────────────┐ │
│ │ 14 commandes│ 6 à expédier│ │
│ ├────────────┼─────────────┤ │
│ │ 4 à préparer│ 98 % COD    │ │
│ └────────────┴─────────────┘ │
│                              │
│ ⚠ Rupture imminente          │
│ Mocassin Glacé — pointure 42 │
│ Plus que 1 exemplaire        │
│ [Voir le stock] [Réappro.]   │
│                              │
│ À traiter                    │
│ ┌──────────────────────────┐ │
│ │ BRN-2511-0842  À valider │ │
│ │ 58 000 FCFA · MTN MoMo   │ │
│ │ Yaoundé · il y a 12 min  │ │
│ │ [Ouvrir]                 │ │
│ └──────────────────────────┘ │
│                              │
│ Mes livraisons               │
│ ┌──────────────────────────┐ │
│ │ 3 courses · 2 en cours   │ │
│ │ [Voir ma tournée]        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ ☰ BRUNY   Tableau de bord   Rechercher…   🔔  [AB] │
├────────────────────────────────────────────────────┤
│ Bonjour Awa · mercredi 11 novembre                 │
│ ┌──────────────┬──────────────┐                    │
│ │ CA du jour   │ Commandes    │                    │
│ │ 485 000      │ 14           │                    │
│ ├──────────────┼──────────────┤                    │
│ │ À préparer   │ COD collecté │                    │
│ │ 4            │ 98 %         │                    │
│ └──────────────┴──────────────┘                    │
│ ┌───────────────────────┬────────────────────────┐ │
│ │ Activité 7 jours      │ Alertes stock (2)      │ │
│ │ [graphique]           │ Mocassin 42 · 1 restant│ │
│ └───────────────────────┴────────────────────────┘ │
│ Commandes à traiter (table simplifiée)             │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────┐
│ SIDEBAR  │ Header : fil d’Ariane · recherche · 🔔 · profil      │
│          ├──────────────────────────────────────────────────────┤
│ Dashboard│ Bonjour Awa · mercredi 11 novembre   [Actualiser]    │
│ Produits │ ┌─────────┬─────────┬─────────┬─────────┐            │
│ Stock    │ │ CA jour │ Cdes    │ À prép. │ COD     │            │
│ Commandes│ │ 485 000 │ 14      │ 4       │ 98 %    │            │
│ Livraisons│ └─────────┴─────────┴─────────┴─────────┘            │
│ Clients  │ ┌──────────────────────────┬───────────────────────┐ │
│ Promos   │ │ CA — 7 derniers jours    │ Alertes stock         │ │
│ Avis     │ │ [courbe / tableau]       │ ⚠ Mocassin 42 · 1     │ │
│ Param.   │ │                          │ ⚠ Sandale 38 · 2      │ │
│ Audit    │ └──────────────────────────┴───────────────────────┘ │
│          │ ┌──────────────────────────────────────────────────┐ │
│          │ │ Commandes à traiter (DataTable, 5 lignes max)    │ │
│          │ └──────────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `StatCard` / `KpiCard` | Quatre indicateurs, variation et contexte |
| `Alert` | Alertes stock actionnables |
| `ChartPlaceholder` | Courbe CA avec alternative tableau |
| `DataTable` | Commandes à traiter desktop |
| `CardList` | Commandes et livraisons mobile |
| `StatusBadge` | Statuts de commande |
| `Button` | Actualiser, voir, réapprovisionner |
| `EmptyState` | Premier lancement sans données |
| `Skeleton` | Chargement |
| `Breadcrumb` | Fil d’Ariane |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Premier lancement : « Votre activité apparaîtra ici. » CTA « Créer un produit » ou « Voir les commandes » selon le rôle |
| Chargement | Squelettes de KPI, blocs gris pour le graphique et les listes ; header stable |
| Erreur | `Alert` globale « Impossible de charger le tableau de bord. » + bouton « Réessayer » ; les blocs indépendants peuvent échouer séparément |
| Succès | Données à jour, horodatage « Mis à jour à 14:32 » |

Erreurs partielles :

- KPI indisponibles : cartes avec tiret et « Donnée indisponible ».
- Alertes indisponibles : encart discret, pas de faux « aucune alerte ».
- Graphique indisponible : basculer automatiquement sur le tableau.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Tableau de bord |
| Salutation | Bonjour {prénom} |
| Date | {jour de la semaine} {date} |
| KPI CA | CA encaissé aujourd’hui |
| KPI commandes | Commandes du jour |
| KPI préparation | Colis à préparer |
| KPI COD | Taux de COD collecté |
| Contexte CA | Hier : {montant} |
| Contexte commandes | {n} à valider |
| Contexte préparation | {n} urgente(s) |
| Contexte COD | Encaissé sur attendu |
| Bouton actualiser | Actualiser |
| Dernière mise à jour | Mis à jour à {heure} |
| Section graphique | Activité des 7 derniers jours |
| Section alertes | Alertes stock |
| Alerte stock | {produit} — pointure {taille} : plus que {n} exemplaire(s) |
| Action alerte | Réapprovisionner |
| Section commandes | Commandes à traiter |
| Section livraisons | Mes livraisons |
| Lien tout voir | Tout voir |
| État vide | Votre activité apparaîtra ici dès la première commande. |
| Erreur | Impossible de charger le tableau de bord. |
| Bouton erreur | Réessayer |

## 7. Interactions

1. « Actualiser » recharge toutes les sources et affiche un spinner local ; pas de rechargement de page.
2. Un clic sur un KPI ouvre la liste correspondante avec le filtre préappliqué (A04, A06, A07, A09).
3. Une alerte stock ouvre A06 filtré sur la variante concernée.
4. Une commande ouvre A08 dans un nouvel onglet au clavier (`Ctrl`/`Cmd` + clic).
5. Le graphique propose un bouton « Afficher le tableau » ; le choix est mémorisé localement.
6. La période du graphique est fixe à 7 jours en V1 ; aucun sélecteur factice.
7. Le dashboard se rafraîchit au retour sur l’onglet, pas en temps réel.
8. Les actions rapides sont filtrées par rôle ; un livreur ne voit que « Voir ma tournée ».

## 8. Accessibilité WCAG 2.1 AA

- Un seul `h1` « Tableau de bord », sections en `h2`.
- Les KPI sont une liste de définitions (`dl`) ou des cartes avec intitulé et valeur liés.
- Les variations sont annoncées en texte (« en hausse de 18 % »), pas seulement en couleur.
- Le graphique possède un résumé textuel et un tableau accessible.
- `aria-live="polite"` sur l’horodatage de mise à jour.
- Les alertes critiques utilisent `role="status"`, pas `alert`, pour éviter une interruption.
- Cibles ≥ 44 px ; tableaux avec `aria-sort` ; focus visible.
- Le menu mobile est un bouton avec `aria-expanded`.

## 9. Données API

**Endpoint cible, absent aujourd’hui :** `GET /api/v1/admin/dashboard?range=today`.

Réponse attendue :

```json
{
  "revenue": { "value": 485000, "currency": "XAF", "previous": 411000 },
  "orders": { "total": 14, "toValidate": 3, "toShip": 6 },
  "preparation": { "count": 4, "urgent": 2 },
  "cod": { "collected": 382000, "expected": 390000, "rate": 0.98 },
  "stockAlerts": [
    { "variantId": "…", "product": "Mocassin Glacé", "size": 42, "available": 1 }
  ],
  "recentOrders": [
    { "reference": "BRN-2511-0842", "status": "PENDING_CONFIRMATION", "total": 58000 }
  ],
  "updatedAt": "2026-11-11T14:32:00Z"
}
```

Règles de calcul proposées :

- CA : commandes dont le paiement est `SUCCEEDED`, sur `paidAt`.
- Commandes du jour : `createdAt` dans la journée, fuseau `Africa/Douala`.
- Colis à préparer : commandes `PAID` ou `PROCESSING` non expédiées.
- COD : montant collecté / montant attendu sur les livraisons clôturées.
- Alertes : variantes dont `availableStock <= lowStockThreshold`.

Aucun endpoint de ce type n’existe ; le dashboard est bloqué tant qu’il n’est pas créé.

## 10. Écarts et dépendances

- Pas de modèle de hub, de véhicule, de flotte ni de casier : aucune carte « moto » ou « hub ».
- Pas de SLA : retirer « urgent 16 h » ; « urgent » ne peut venir que d’une règle de zone documentée.
- Pas de graphique ni de série temporelle : `ChartPlaceholder` uniquement.
- Les modules commandes, stock et livraisons n’ont pas d’API : dépendances backend majeures.
- Les rôles doivent filtrer les blocs côté API **et** côté UI.
- Le dashboard ne remplace pas les listes : il plafonne à 5 éléments par section.

## 11. Référence

- Zone L : KPI, alerte stock, commandes récentes.
- `docs/design/DSG-06/ANALYSE-EXISTANT.md`, sections 5, 9 et 10.
- Tokens DSG-02 ; `StatCard`, `Alert`, `DataTable`, `CardList`.
