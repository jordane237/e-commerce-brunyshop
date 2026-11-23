# ORD-02 — Contrat API du changement de statut

> `PATCH /api/v1/admin/orders/:id/status`
> Contrat OpenAPI : `backend/openapi.json`
> Machine à états : `backend/src/modules/orders/order-status.ts`

---

## 1. Authentification et rôles

`Authorization: Bearer <access token>` obligatoire.

| Rôle | Accès |
| --- | --- |
| `SUPER_ADMIN`, `ADMIN` | Toutes les transitions valides |
| `ORDER_MANAGER` | Toutes sauf `→ REFUNDED` |
| `LIVREUR` | `SHIPPED → DELIVERED`, `SHIPPED → DELIVERY_FAILED`, `DELIVERY_FAILED → SHIPPED` |
| `STOCK_MANAGER`, `CUSTOMER` | `403 FORBIDDEN` |

Un livreur qui vise une transition valide mais hors de son périmètre reçoit
`403 FORBIDDEN_STATUS_TRANSITION`.

---

## 2. Paramètres

| Nom | Emplacement | Validation |
| --- | --- | --- |
| `id` | path | UUID (`ParseUUIDPipe`, sinon `400`) |

## 3. Corps

```jsonc
{
  "status": "CONFIRMED",       // requis, membre de OrderStatus
  "reason": "Client confirmé par téléphone", // optionnel, ≤ 200
  "note": "Créneau matin"                     // optionnel, ≤ 1000
}
```

`whitelist` + `forbidNonWhitelisted` : tout champ inconnu produit
`400 VALIDATION_ERROR`.

---

## 4. Réponse 200

```json
{
  "id": "0b3f…",
  "reference": "BRN-2611-7K3F",
  "previousStatus": "PENDING_CONFIRMATION",
  "status": "CONFIRMED",
  "changedAt": "2026-11-23T15:00:00.000Z",
  "history": [
    {
      "id": "…",
      "fromStatus": "PENDING_CONFIRMATION",
      "toStatus": "CONFIRMED",
      "reason": "Client confirmé par téléphone",
      "note": null,
      "userId": "…",
      "userName": "Ada Admin",
      "createdAt": "2026-11-23T15:00:00.000Z"
    }
  ]
}
```

`history` est trié du plus récent au plus ancien (50 entrées max) et contient
l'entrée de création (`fromStatus: null`) lorsqu'elle existe.

---

## 5. Erreurs

| HTTP | `code` | Cause |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Statut inconnu, champ en trop, note/motif trop long |
| 400 | `BAD_REQUEST` | `id` non UUID |
| 401 | `UNAUTHORIZED` | Jeton absent/invalide |
| 403 | `FORBIDDEN` | Rôle hors périmètre commande |
| 403 | `FORBIDDEN_STATUS_TRANSITION` | Transition valide mais interdite à ce rôle |
| 404 | `ORDER_NOT_FOUND` | Commande absente ou supprimée logiquement |
| 409 | `INVALID_STATUS_TRANSITION` | Transition absente de la table |
| 409 | `STALE_ORDER_STATUS` | Statut modifié entre la lecture et l'écriture |
| 409 | `STOCK_RELEASE_FAILED` | Restitution de stock impossible (incohérence) |

`409 INVALID_STATUS_TRANSITION` renvoie dans `errors[0]` :
`currentStatus`, `targetStatus`, `allowedStatuses`.

---

## 6. Transactions et effets

Une transaction PostgreSQL contient :

1. passage du statut (`UPDATE` conditionné au statut lu) ;
2. restitution du stock si `CANCELLED` (incrément atomique + `StockMovement`
   `CANCELLATION`, `before`/`after` exacts) ;
3. insertion `OrderStatusHistory` ;
4. `AuditLog` `ORDER_STATUS_CHANGED` (`before.status`, `after.status`,
   `reference`, `reason`, `note`, IP, user-agent).

Un échec annule l'ensemble. Aucune notification n'est émise par ce ticket.

---

## 7. Migration

`20261123150000_ord02_order_status_history` : création de
`OrderStatusHistory` (+ index `orderId, createdAt` et `userId`, clés étrangères
`Order` en cascade, `User` en `SET NULL`). Additive, sans réécriture de données.
