# A12b — Créer ou modifier un coupon

## 1. Objectif et contexte

Créer un code promotionnel ou ajuster un code existant, avec une prévisualisation immédiate de la remise. Le formulaire reste court : un coupon ne gère ni portée produit, ni cumul, ni parrainage.

- Routes cibles : `/admin/promotions/nouvelle`, `/admin/promotions/:id/modifier`.
- Accès : `SUPER_ADMIN`, `ADMIN`, `ORDER_MANAGER`.
- Le code est unique, normalisé en majuscules.
- La consommation (`usedCount`) est en lecture seule.

## 2. Rôles autorisés

| Rôle | Créer | Modifier | Modifier la valeur après usage | Clôturer |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Oui | Oui | Non | Oui |
| `STOCK_MANAGER` | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non |

Règle proposée : dès qu’un coupon a été utilisé, seuls `maxUses`, `endsAt` et `minAmount` restent modifiables par un `ADMIN`. Un `SUPER_ADMIN` peut tout modifier. Cette règle doit être confirmée côté backend.

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ← Promotions      Enregistrer│
│ Nouveau coupon               │
│                              │
│ Code *                       │
│ [BRUNY10                  ]  │
│ Aide : lettres, chiffres, -  │
│                              │
│ Type de remise *             │
│ (•) Pourcentage  ( ) Montant │
│                              │
│ Valeur *                     │
│ [10                       ] %│
│                              │
│ Montant minimum              │
│ [25 000                ] FCFA│
│                              │
│ Valide du       Valide au    │
│ [01/11/2026]    [30/11/2026] │
│                              │
│ Limite d’utilisation         │
│ [100                      ]  │
│ Laisser vide = illimité      │
│                              │
│ Aperçu                       │
│ Panier 50 000 → 45 000 FCFA  │
│ Économie 5 000 FCFA          │
│                              │
│ [Enregistrer le coupon]      │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ ← Promotions          Nouveau coupon   [Annuler]  │
│                                                    │
│ Code *                 │ Type *                   │
│ [BRUNY10]              │ (•) Pourcentage          │
│                        │ ( ) Montant fixe         │
│ Valeur *               │ Minimum                  │
│ [10] %                 │ [25 000] FCFA            │
│ Du                     │ Au                       │
│ [01/11/2026]           │ [30/11/2026]             │
│ Limite                 │ Utilisations             │
│ [100]                  │ 42                       │
│                                                    │
│ Aperçu : 50 000 → 45 000 FCFA                      │
│ [Enregistrer]                                      │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ ← Promotions / Nouveau coupon        [Annuler] [Enregistrer]│
│          ├──────────────────────────────────┬───────────────────────────┤
│          │ Code *                           │ Aperçu                    │
│          │ [BRUNY10____________________]    │ Code : BRUNY10            │
│          │ Type *                           │ -10 %                     │
│          │ (•) Pourcentage ( ) Montant fixe │ Panier 50 000             │
│          │ Valeur *                         │ Remise -5 000             │
│          │ [10] %                           │ Total 45 000 FCFA         │
│          │ Montant minimum                  │                           │
│          │ [25 000] FCFA                    │ Statut calculé            │
│          │ Du               Au              │ ● Programmé               │
│          │ [01/11] [30/11]                  │                           │
│          │ Limite d’utilisation             │ Utilisations              │
│          │ [100]                            │ 42 / 100                  │
│          └──────────────────────────────────┴───────────────────────────┘
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `Input` | Code, valeur, minimum, limite |
| `Radio` | Type de remise |
| `DatePicker` / `Input type=date` | Début et fin |
| `Button` | Enregistrer, annuler |
| `Alert` | Erreurs, avertissement après usage |
| `StatusBadge` | Statut calculé |
| `CopyButton` | Code |
| `Toast` | Succès |
| `ConfirmDialog` | Abandon de modifications |
| `Skeleton` | Chargement en édition |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Formulaire vide, type « Pourcentage » par défaut, aperçu neutre |
| Chargement | Squelette en édition, champs désactivés |
| Erreur | Erreurs de champ + résumé, conflit d’unicité |
| Succès | Toast « Coupon enregistré. », retour A12 avec le code visible |

Cas complémentaires :

- **Code déjà utilisé** : « Ce code existe déjà. Choisissez un autre code. » (`409`).
- **Valeur invalide** : pourcentage hors 1–100, montant ≤ 0.
- **Dates incohérentes** : fin avant début.
- **Limite inférieure aux usages** : « La limite ne peut pas être inférieure aux 42 utilisations déjà enregistrées. »
- **Coupon déjà utilisé** : avertissement si la valeur est modifiée.
- **Modifications non enregistrées** : dialogue à la sortie.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre création | Nouveau coupon |
| Titre édition | Modifier le coupon |
| Code | Code |
| Aide code | Lettres, chiffres et tirets. Il sera affiché en majuscules. |
| Type | Type de remise |
| Type pourcentage | Pourcentage |
| Type montant | Montant fixe |
| Valeur | Valeur |
| Minimum | Montant minimum du panier |
| Sans minimum | Laisser vide pour aucun minimum. |
| Début | Valide à partir du |
| Fin | Valide jusqu’au |
| Sans fin | Laisser vide pour aucune date de fin. |
| Limite | Limite d’utilisation |
| Limite aide | Laisser vide pour un nombre illimité. |
| Utilisations | Utilisations |
| Aperçu | Aperçu |
| Panier exemple | Panier de 50 000 FCFA |
| Remise | Remise |
| Total | Total après remise |
| Bouton enregistrer | Enregistrer le coupon |
| Bouton annuler | Annuler |
| Erreur code | Ce code existe déjà. Choisissez un autre code. |
| Erreur pourcentage | Le pourcentage doit être compris entre 1 et 100. |
| Erreur montant | Le montant doit être supérieur à 0. |
| Erreur dates | La date de fin doit suivre la date de début. |
| Erreur limite | La limite ne peut pas être inférieure aux utilisations déjà enregistrées. |
| Avertissement usage | Ce coupon a déjà été utilisé. La modification de sa valeur affectera les prochaines commandes. |
| Succès | Coupon enregistré. |
| Abandon | Quitter sans enregistrer ? |

## 7. Interactions

1. Le code est saisi en majuscules automatiquement ; les espaces sont refusés.
2. Le type bascule le suffixe de valeur entre `%` et `FCFA`.
3. L’aperçu se recalcule à chaque frappe sur la base d’un panier de 50 000 FCFA.
4. Pour un pourcentage, la remise est arrondie à l’entier XAF inférieur ; le total ne peut pas être négatif.
5. Les dates sont optionnelles ; si `startsAt` est vide, le coupon est actif immédiatement.
6. `maxUses` vide signifie illimité ; `0` est refusé.
7. En édition, `usedCount` est affiché mais jamais éditable.
8. « Enregistrer » valide puis crée (`POST`) ou met à jour (`PATCH`).
9. Après création, retour à A12 avec un toast et le code copiable.
10. Aucune suppression depuis ce formulaire.
11. Aucune duplication de coupon.

## 8. Accessibilité WCAG 2.1 AA

- Champs avec labels visibles et `aria-describedby` pour les aides.
- Groupe radio avec `fieldset`/`legend`.
- Erreurs liées au champ et annoncées.
- L’aperçu est une région `aria-live="polite"` pour les changements de valeur.
- Les montants sont formatés et lisibles.
- Dialogue d’abandon avec focus piégé.
- Cibles ≥ 44 px ; contraste AA ; focus visible.
- Titre de page : « Nouveau coupon — Bruny Shopping » ou « Modifier {code} — Bruny Shopping ».

## 9. Données API

**Endpoints cibles absents :**

- `POST /api/v1/admin/coupons`
- `PATCH /api/v1/admin/coupons/:id`
- `GET /api/v1/admin/coupons/:id`

```json
{
  "code": "BRUNY10",
  "type": "PERCENTAGE",
  "value": 10,
  "minAmount": 25000,
  "startsAt": "2026-11-01T00:00:00Z",
  "endsAt": "2026-11-30T23:59:59Z",
  "maxUses": 100
}
```

Réponse : coupon créé avec `id`, `usedCount` à 0 et statut calculé.

## 10. Écarts et dépendances

- Modèle `Coupon` présent, aucun endpoint.
- Pas de portée produit, de cumul, de parrainage ni de remise maximale : non modélisés.
- Pas de statut persistant : le statut est calculé.
- La règle de modification après usage est une proposition, à valider backend.
- Le code est unique en base ; la validation UI ne remplace pas la contrainte.
- Les dates sont stockées en UTC ; l’affichage est en `Africa/Douala`.

## 11. Référence

- `backend/prisma/schema.prisma`, `Coupon`, `CouponType`.
- A12, `MICROTEXTES.md`.
