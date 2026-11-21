# A14 — Paramètres

## 1. Objectif et contexte

Centraliser les réglages de la boutique, les zones de livraison et les seuils d’alerte. Les paramètres sensibles restent en lecture seule tant que le backend ne fournit pas de contrôle dédié.

- Route cible : `/admin/parametres`
- Accès : `SUPER_ADMIN` complet ; `ADMIN` limité aux sections Boutique et Livraison.
- Les paramètres sont stockés dans `Setting` sous forme clé/valeur JSON.
- Toute modification est auditée.

## 2. Rôles autorisés

| Rôle | Boutique | Livraison | Alertes | Sécurité |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Modifier | Modifier | Modifier | Lecture |
| `ADMIN` | Modifier | Modifier | Modifier | Lecture |
| `ORDER_MANAGER` | Lecture | Lecture | Non | Non |
| `STOCK_MANAGER` | Non | Non | Lecture | Non |
| `LIVREUR` | Non | Non | Non | Non |

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Paramètres                   │
│ [Boutique] [Livraison]       │
│ [Alertes]  [Sécurité]        │
│                              │
│ Boutique                     │
│ Nom de la boutique *         │
│ [Bruny Shopping           ]  │
│ Devise                       │
│ [FCFA — lecture seule     ]  │
│ Téléphone support *          │
│ [+237 6 99 00 00 00       ]  │
│ E-mail support *             │
│ [contact@bruny.cm         ]  │
│                              │
│ [Enregistrer les modifications]│
│                              │
│ Livraison                    │
│ Zones (3)        [+ Ajouter] │
│ ┌──────────────────────────┐ │
│ │ Douala · 1 500 FCFA      │ │
│ │ 1 jour · 4 villes        │ │
│ │ [Modifier]         [⋯]   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Paramètres                                         │
│ [Boutique] [Livraison] [Alertes] [Sécurité]        │
├────────────────────────────────────────────────────┤
│ Boutique                                           │
│ Nom *                      Téléphone support *     │
│ [Bruny Shopping]           [+237 6 99 00 00 00]    │
│ E-mail support *           Devise                  │
│ [contact@bruny.cm]         [FCFA — lecture seule]  │
│ [Enregistrer]                                      │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Paramètres                                                   │
│          │ [Boutique] [Livraison] [Alertes] [Sécurité]                  │
│          ├──────────────────────────────────┬───────────────────────────┤
│          │ Boutique                         │ Aperçu                    │
│          │ Nom *                            │ Bruny Shopping            │
│          │ [Bruny Shopping______________]   │ contact@bruny.cm          │
│          │ Téléphone *                      │ +237 6 99 00 00 00        │
│          │ [+237 6 99 00 00 00__________]   │ FCFA                      │
│          │ E-mail *                         │                           │
│          │ [contact@bruny.cm____________]   │ Dernière modification     │
│          │ Devise                           │ 11/11/2026 par Awa N.     │
│          │ [FCFA — non modifiable]          │                           │
│          │ [Enregistrer]                    │                           │
│          └──────────────────────────────────┴───────────────────────────┘
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `Tabs` | Boutique, Livraison, Alertes, Sécurité |
| `Input` | Nom, téléphone, e-mail, seuils, frais |
| `Select` | Devise en lecture |
| `DataTable` / `CardList` | Zones de livraison |
| `Modal` / `BottomSheet` | Création et édition d’une zone |
| `Button` | Enregistrer, ajouter, modifier |
| `ConfirmDialog` | Suppression d’une zone |
| `Alert` | Erreurs, zone utilisée |
| `Toast` | Succès |
| `Skeleton` | Chargement |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Aucune zone : « Aucune zone de livraison. Ajoutez-en une pour permettre les commandes. » |
| Chargement | Squelettes de champs et de tableau |
| Erreur | « Impossible de charger les paramètres. » + « Réessayer » ; erreurs de sauvegarde par section |
| Succès | Valeurs à jour, toast « Paramètres enregistrés. », horodatage |

Cas complémentaires :

- **Section modifiée non enregistrée** : navigation bloquée par un dialogue.
- **Zone utilisée par des livraisons** : suppression refusée ; proposer la désactivation.
- **Champ obligatoire vide** : erreur de champ, pas d’enregistrement partiel.
- **Conflit** : « Les paramètres ont été modifiés ailleurs. Rechargez avant d’enregistrer. »

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Paramètres |
| Onglet boutique | Boutique |
| Onglet livraison | Livraison |
| Onglet alertes | Alertes |
| Onglet sécurité | Sécurité |
| Nom | Nom de la boutique |
| Devise | Devise |
| Devise aide | La devise est fixée à FCFA pour cette version. |
| Téléphone | Téléphone du support |
| E-mail | E-mail du support |
| Bouton enregistrer | Enregistrer les modifications |
| Section zones | Zones de livraison |
| Bouton ajouter zone | Ajouter une zone |
| Colonne zone | Zone |
| Colonne villes | Villes |
| Colonne frais | Frais |
| Colonne délai | Délai estimé |
| Colonne actions | Actions |
| Zone titre | Nouvelle zone de livraison |
| Zone modifier | Modifier la zone |
| Nom zone | Nom de la zone |
| Villes | Villes desservies |
| Villes aide | Séparez les villes par des virgules. |
| Frais | Frais de livraison |
| Délai | Délai estimé (jours) |
| Enregistrer zone | Enregistrer la zone |
| Supprimer zone | Supprimer la zone |
| Dialogue suppression | Supprimer cette zone ? |
| Zone utilisée | Cette zone est utilisée par des livraisons et ne peut pas être supprimée. |
| Section alertes | Alertes de stock |
| Seuil par défaut | Seuil d’alerte par défaut |
| Seuil aide | Appliqué aux nouvelles variantes. Les seuils existants ne changent pas. |
| Section sécurité | Sécurité |
| Sécurité 2FA | La double authentification est obligatoire pour les administrateurs. |
| Sécurité sessions | La durée de session est gérée par le serveur. |
| Enregistré | Paramètres enregistrés. |
| Erreur | Impossible de charger les paramètres. |
| Conflit | Les paramètres ont été modifiés ailleurs. Rechargez avant d’enregistrer. |

## 7. Interactions

1. Chaque onglet possède son propre bouton « Enregistrer » ; aucune sauvegarde globale implicite.
2. Les champs modifiés sont signalés par un point ; quitter l’onglet déclenche un dialogue.
3. La devise est en lecture seule (`XAF`).
4. Les zones se gèrent dans un tableau desktop et des cartes mobile.
5. « Ajouter une zone » ouvre une modale : nom, villes (liste), frais entiers, délai en jours.
6. Une zone utilisée par un `Shipment` ne peut pas être supprimée ; le backend renvoie `409`.
7. Le seuil d’alerte par défaut s’applique aux futures variantes uniquement.
8. La section Sécurité est informative : aucun réglage de session ou de 2FA n’est modifiable ici.
9. Toute sauvegarde est auditée avec `before`/`after`.
10. Aucun test SMTP, aucun envoi d’e-mail de test.

## 8. Accessibilité WCAG 2.1 AA

- Onglets avec `role="tablist"`, navigation flèches, `aria-selected`.
- Chaque section est un `fieldset` avec `legend`.
- Les erreurs sont liées aux champs et annoncées.
- Le tableau des zones a des en-têtes explicites.
- Dialogue de suppression avec focus piégé.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « Paramètres — Bruny Shopping ».

## 9. Données API

**Tous les endpoints sont à créer :**

- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings` avec un objet partiel.
- `GET /api/v1/admin/delivery-zones`
- `POST /api/v1/admin/delivery-zones`
- `PATCH /api/v1/admin/delivery-zones/:id`
- `DELETE /api/v1/admin/delivery-zones/:id`

Clés de paramètres proposées :

```json
{
  "store.name": "Bruny Shopping",
  "store.currency": "XAF",
  "store.supportPhone": "+237699000000",
  "store.supportEmail": "contact@bruny.cm",
  "stock.defaultLowThreshold": 5
}
```

Zone :

```json
{
  "id": "…",
  "name": "Douala",
  "cities": ["Douala", "Bonabéri"],
  "fee": 1500,
  "estimatedDays": 1
}
```

## 10. Écarts et dépendances

- Modèles `Setting` et `DeliveryZone` présents, aucun endpoint.
- La devise est fixée par le modèle économique : ne pas proposer de changement.
- Aucune configuration de passerelle de paiement, de SMTP ou de notifications dans cette version.
- Aucun réglage de sécurité modifiable : la politique est serveur.
- Suppression d’une zone à protéger si des livraisons y sont rattachées.
- Les paramètres sont globaux ; pas de multi-boutique.

## 11. Référence

- `backend/prisma/schema.prisma`, `Setting`, `DeliveryZone`.
- A03, A15, `MICROTEXTES.md`.
