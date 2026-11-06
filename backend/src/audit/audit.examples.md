# Exemples d'utilisation de `logSensitiveChange`

Ce fichier documente trois cas d'usage concrets d'appel de `AuditService.logSensitiveChange()` depuis des services métier. Ces exemples illustrent le pattern "explicite" recommandé pour l'audit des actions sensibles.

## 1. Mise à jour du prix d'un produit

Lorsqu'un administrateur modifie le prix d'un produit, on enregistre l'état avant/après avec sanitisation.

```typescript
// backend/src/products/product.service.ts
import { Injectable } from '@nestjs/common';\nimport { AuditLogService, SensitiveAction } from '../audit';\nimport { PrismaService } from '../infrastructure/database/prisma.service';\n\n@Injectable()\nexport class ProductService {\n  constructor(\n    private readonly prisma: PrismaService,\n    private readonly audit: AuditLogService,\n  ) {}\n\n  async updatePrice(productId: string, newPrice: number, actorUserId: string) {\n    // Récupérer l'état avant modification (before)\n    const product = await this.prisma.product.findUnique({ where: { id: productId } });\n    const before = product ? { basePrice: product.basePrice } : null;\n\n    // Effectuer la mise à jour\n    const updated = await this.prisma.product.update({\n      where: { id: productId },\n      data: { basePrice: newPrice },\n    });\n\n    // Après l'opération, enregistrer l'audit sensible avec sanitisation\n    await this.audit.logSensitiveChange({\n      userId: actorUserId,\n      action: SensitiveAction.PRODUCT_PRICE_UPDATED,\n      entity: 'Product',\n      entityId: productId,\n      before, // sera sanifié avant écriture (password/token masqués)\n      after: { basePrice: updated.basePrice },\n      ipAddress: '192.168.1.10', // optionnel\n      userAgent: 'Mozilla/5.0', // optionnel\n    });\n\n    return updated;\n  }\n}\n```

**Points clés :**
- `before` capture l'état avant la modification (ici seulement `basePrice`, pas tout l'objet product)
- `after` capture l'état après modification
- `ipAddress` et `userAgent` sont optionnels mais recommandés pour le forensic
- Le `sanitizeForAudit` s'exécute automatiquement à l'intérieur de `logSensitiveChange`

---

## 2. Assignment de rôle à un utilisateur

Lorsqu'un SUPER_ADMIN attribue un rôle à un utilisateur, l'audit capture qui a fait la demande et quand.

```typescript
// backend/src/users/user.service.ts
import { Injectable, forwardRef } from '@nestjs/common';\nimport { AuditLogService, SensitiveAction } from '../audit';\nimport { PrismaService } from '../infrastructure/database/prisma.service';\nimport { RolesService } from '../roles/roles.service';\n\n@Injectable()\nexport class UserService {\n  constructor(\n    private readonly prisma: PrismaService,\n    private readonly audit: AuditLogService,\n    private readonly rolesService: RolesService,\n  ) {}\n\n  async assignRole(userId: string, roleName: string, actorUserId: string) {\n    // Vérifier que l'utilisateur existe\n    const user = await this.prisma.user.findUnique({ where: { id: userId } });\n    if (!user) {\n      throw new Error('User not found');\n    }\n\n    // Attribuer le rôle\n    await this.prisma.userRole.create({\n      data: { userId, roleId: roleName },\n    });\n\n    // Après modification, enregistrer l'audit sensible\n    await this.audit.logSensitiveChange({\n      userId: actorUserId,\n      action: SensitiveAction.USER_ROLE_ASSIGNED,\n      entity: 'User',\n      entityId: userId,\n      before: { roles: user.roles.map(r => r.role.name) }, // états avant\n      after: { roles: [...user.roles.map(r => r.role.name), roleName] }, // états après\n      ipAddress: '10.0.0.5',\n      userAgent: 'Mozilla/5.0 (admin panel)',\n    });\n\n    return user;\n  }\n}\n```

**Points clés :**
- `before` capture l'état précédent des rôles de l'utilisateur
- `after` capture l'état nouveau (inclut le rôle ajouté)
- Note: `userId` dans `logSensitiveChange` est l'**admin** qui effectue l'action, pas l'utilisateur cible

---

## 3. Mise à jour du statut d'une commande

Lorsque le statut d'une commande change (ex: `PENDING` → `SHIPPED`), on enregistre le changement pour traçabilité.

```typescript
// backend/src/orders/order.service.ts
import { Injectable, forwardRef } from '@nestjs/common';\nimport { AuditLogService, SensitiveAction } from '../audit';\nimport { PrismaService } from '../infrastructure/database/prisma.service';\n\n@Injectable()\nexport class OrderService {\n  constructor(\n    private readonly prisma: PrismaService,\n    private readonly audit: AuditLogService,\n  ) {}\n\n  async updateStatus(orderId: string, newStatus: string, actorUserId: string) {\n    const order = await this.prisma.order.findUnique({ where: { id: orderId } });\n    if (!order) {\n      throw new Error('Order not found');\n    }\n\n    const before = { status: order.status };\n    const after = { status: newStatus };\n\n    const updated = await this.prisma.order.update({\n      where: { id: orderId },\n      data: { status: newStatus },\n    });\n\n    await this.audit.logSensitiveChange({\n      userId: actorUserId,\n      action: SensitiveAction.ORDER_STATUS_UPDATED,\n      entity: 'Order',\n      entityId: orderId,\n      before,\n      after,\n      ipAddress: '10.20.30.40',\n    });\n\n    return updated;\n  }\n}\n```

**Points clés :**
- Seul le champ `status` est suivi, pas toute l'entité order
- Cela maintient les entrées d'audit légères et ciblées
- Le champ `changes` (tel quel dans le schéma existant) n'est plus la seule source — `before`/`after` sont préférés pour les actions sensibles