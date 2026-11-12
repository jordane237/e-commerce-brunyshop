# Microtextes et traductions

## Conventions

- Vouvoiement systématique.
- Phrases courtes, verbes d’action.
- Aucun enum brut à l’écran.
- Les montants sont en **FCFA**, entiers, avec espace insécable comme séparateur de milliers.
- Les dates sont au format `11/11/2026` ; les dates relatives (« il y a 12 min ») ont une valeur exacte en infobulle.
- Les erreurs expliquent comment corriger.
- Les actions destructives annoncent leurs conséquences.
- Les états vides proposent toujours l’action suivante.

## Textes globaux

| Contexte | Texte |
| --- | --- |
| Chargement | Chargement… |
| Erreur générique | Une erreur est survenue. Réessayez. |
| Erreur réseau | Connexion impossible. Vérifiez votre réseau. |
| Réessayer | Réessayer |
| Annuler | Annuler |
| Enregistrer | Enregistrer |
| Fermer | Fermer |
| Retour | Retour |
| Rechercher | Rechercher |
| Réinitialiser | Réinitialiser |
| Appliquer | Appliquer |
| Tout voir | Tout voir |
| Charger plus | Charger plus |
| Aucun résultat | Aucun résultat. |
| Accès refusé | Vous n’avez pas accès à cette page. |
| Session expirée | Votre session a expiré. Reconnectez-vous. |
| Copié | Copié |
| En attente de synchronisation | En attente de synchronisation |
| Hors connexion | Hors connexion |

## Textes par écran

| Écran | Titre | Action principale | État vide | Erreur |
| --- | --- | --- | --- | --- |
| A01 | Connexion | Se connecter | — | Identifiant ou mot de passe incorrect. |
| A02 | Vérification en deux étapes | Vérifier | — | Code incorrect. Réessayez. |
| A03 | Tableau de bord | Actualiser | Votre activité apparaîtra ici. | Impossible de charger le tableau de bord. |
| A04 | Produits | Nouveau produit | Votre catalogue est vide. | Impossible de charger les produits. |
| A05 | Nouveau produit / Modifier le produit | Enregistrer | — | Impossible d’enregistrer le produit. |
| A05b | Variantes | Enregistrer | Ajoutez une couleur et une pointure. | Impossible d’enregistrer les variantes. |
| A06 | Stock | Ajuster | Aucune variante à suivre. | Impossible de charger le stock. |
| A07 | Commandes | Ouvrir | Aucune commande pour le moment. | Impossible de charger les commandes. |
| A08 | Commande {référence} | Confirmer la commande | — | Impossible de charger la commande. |
| A09 | Livraisons | Assigner | Aucune livraison planifiée. | Impossible de charger les livraisons. |
| A09b | Ma tournée | Marquer livrée | Aucune course aujourd’hui. | Impossible de charger votre tournée. |
| A09c | Livraison {référence} | Marquer livrée | — | Cette livraison n’est pas disponible. |
| A10 | Clients | Ouvrir la fiche | Aucun client inscrit. | Impossible de charger les clients. |
| A10b | {prénom} {nom} | Suspendre le compte | Aucune commande pour ce client. | Impossible de charger la fiche client. |
| A11 | Utilisateurs | Inviter un utilisateur | Aucun utilisateur interne. | Impossible de charger les utilisateurs. |
| A12 | Promotions | Nouveau coupon | Aucun code promotionnel. | Impossible de charger les promotions. |
| A12b | Nouveau coupon / Modifier le coupon | Enregistrer le coupon | — | Impossible d’enregistrer le coupon. |
| A13 | Avis clients | Approuver | Aucun avis pour le moment. | Impossible de charger les avis. |
| A14 | Paramètres | Enregistrer les modifications | Aucune zone de livraison. | Impossible de charger les paramètres. |
| A15 | Journal d’audit | Voir le détail | Aucune action enregistrée. | Impossible de charger le journal d’audit. |
| A16 | Mon profil | Enregistrer | Aucune autre session. | Impossible de charger votre profil. |

## Traduction exhaustive des enums

### `OrderStatus` — 13 valeurs

| Enum | Libellé |
| --- | --- |
| `PENDING_CONFIRMATION` | À valider |
| `AWAITING_PAYMENT` | En attente de paiement |
| `CONFIRMED` | Confirmée |
| `PAID` | Payée |
| `PREPARING` | En préparation |
| `SHIPPED` | Expédiée |
| `DELIVERED` | Livrée |
| `DELIVERY_FAILED` | Échec de livraison |
| `CANCELLED` | Annulée |
| `RETURN_REQUESTED` | Retour demandé |
| `RETURNED` | Retournée |
| `REFUNDED` | Remboursée |
| `EXCHANGED` | Échangée |

### `PaymentStatus` — 4 valeurs

| Enum | Libellé |
| --- | --- |
| `PENDING` | En attente |
| `SUCCEEDED` | Payée |
| `FAILED` | Échouée |
| `REFUNDED` | Remboursée |

### `PaymentMethod` — 3 valeurs

| Enum | Libellé |
| --- | --- |
| `COD` | Paiement à la livraison |
| `MOBILE_MONEY` | Mobile Money |
| `CARD` | Carte bancaire |

### `ProductStatus` — 3 valeurs

| Enum | Libellé |
| --- | --- |
| `DRAFT` | Brouillon |
| `PUBLISHED` | Publié |
| `ARCHIVED` | Archivé |

### `UserStatus` — 4 valeurs

| Enum | Libellé |
| --- | --- |
| `ACTIVE` | Actif |
| `SUSPENDED` | Suspendu |
| `DISABLED` | Désactivé |
| `PENDING_VERIFICATION` | Invitation envoyée |

### `ShipmentStatus` — 6 valeurs

| Enum | Libellé |
| --- | --- |
| `PENDING` | À assigner |
| `ASSIGNED` | Assignée |
| `IN_TRANSIT` | En cours |
| `DELIVERED` | Livrée |
| `FAILED` | Échec |
| `RETURNED` | Retournée |

### `ReviewStatus` — 3 valeurs

| Enum | Libellé |
| --- | --- |
| `PENDING` | En attente |
| `APPROVED` | Approuvé |
| `REJECTED` | Rejeté |

### `CouponType` — 2 valeurs

| Enum | Libellé |
| --- | --- |
| `PERCENTAGE` | Pourcentage |
| `FIXED_AMOUNT` | Montant fixe |

### `StockMovementReason` — 7 valeurs

| Enum | Libellé |
| --- | --- |
| `RESTOCK` | Réapprovisionnement |
| `RESERVATION` | Réservation |
| `RELEASE` | Libération |
| `PURCHASE` | Achat |
| `CANCELLATION` | Annulation |
| `ADJUSTMENT` | Ajustement |
| `RETURN` | Retour |

### Rôles — 6 valeurs

| Enum | Libellé |
| --- | --- |
| `SUPER_ADMIN` | Super administrateur |
| `ADMIN` | Administrateur |
| `ORDER_MANAGER` | Gestionnaire de commandes |
| `STOCK_MANAGER` | Gestionnaire de stock |
| `LIVREUR` | Livreur |
| `CUSTOMER` | Client |

### Statuts calculés des coupons

| Situation | Libellé |
| --- | --- |
| `endsAt` passé | Expiré |
| `usedCount >= maxUses` | Épuisé |
| `startsAt` futur | Programmé |
| Sinon | Actif |

## Codes d’erreur backend traduits

| Code | Message |
| --- | --- |
| `VALIDATION_ERROR` | Certains champs sont invalides. Vérifiez votre saisie. |
| `PROMO_PRICE_INVALID` | Le prix promotionnel doit être inférieur au prix de base. |
| `PROMO_WINDOW_INVALID` | La période de promotion est invalide. |
| `PUBLISHED_REQUIRES_STOCK` | Ajoutez du stock à au moins une variante avant de publier. |
| `DUPLICATE_VARIANT` | Cette combinaison couleur/pointure existe déjà. |
| `SKU_ALREADY_EXISTS` | Ce SKU est déjà utilisé. |
| `SLUG_ALREADY_EXISTS` | Cette adresse produit est déjà utilisée. |
| `CATEGORY_NOT_FOUND` | La catégorie sélectionnée n’existe pas. |
| `BRAND_NOT_FOUND` | La marque sélectionnée n’existe pas. |
| `VARIANT_NOT_OWNED` | Cette variante n’appartient pas au produit. |
| `RESERVED_STOCK_FORBIDDEN` | Le stock réservé ne peut pas être modifié manuellement. |
| `VARIANT_HAS_ORDERS` | Cette variante est liée à une commande et ne peut pas être supprimée. |
| `SKU_GENERATION_FAILED` | Impossible de générer un SKU pour cette variante. |
| `UNAUTHORIZED` | Vous devez vous reconnecter. |
| `FORBIDDEN` | Vous n’avez pas les droits pour cette action. |
| `NOT_FOUND` | Cet élément n’existe pas ou a été supprimé. |
| `CONFLICT` | Cet élément a été modifié entre-temps. Rechargez la page. |
| `TOO_MANY_REQUESTS` | Trop de tentatives. Réessayez dans quelques minutes. |
| `INTERNAL_ERROR` | Une erreur interne est survenue. Réessayez plus tard. |

## Formats

| Donnée | Format |
| --- | --- |
| Montant | `58 000 FCFA` |
| Montant compact KPI | `485 000 FCFA` |
| Pourcentage | `98 %` |
| Date | `11/11/2026` |
| Date et heure | `11/11/2026 à 14:32` |
| Date relative | `il y a 12 min`, `hier`, `il y a 2 j` |
| Téléphone | `+237 6 71 •• •• 89` (masqué), `+237 6 71 23 45 89` (complet) |
| Référence commande | `BRN-2511-0843` |
| SKU | `BARRAGEF-MOCASSIN-42-NOIR` |
| Slug | `mocassin-glace` |

## Pluriels

- `1 produit` / `2 produits`
- `1 variante` / `2 variantes`
- `1 commande` / `2 commandes`
- `1 course` / `2 courses`
- `1 avis` / `2 avis` (invariable)
- `1 utilisateur` / `2 utilisateurs`
- `1 zone` / `2 zones`

## Interdits

- « Valider » seul pour une action destructive.
- « OK » comme libellé de confirmation.
- « Erreur 500 », « null », « undefined », un enum brut.
- « Cliquez ici ».
- Les points de suspension dans un libellé de bouton, sauf chargement.
- Les promesses non implémentées (« bientôt disponible » dans une action active).
