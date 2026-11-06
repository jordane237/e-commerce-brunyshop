// BRUNY SHOPPING — rôles et permissions (TEC-07).
//
// Les 6 rôles du cahier des charges, uniques par `Role.name` (upsert).
// Les permissions sont deux niveaux : la clé `Permission.key` (relation
// `Permission`) et la jointure `RolePermission` (clé composite
// roleId+permissionId, idempotente). Le champ `Role.permissions`
// (String[]) de l'ancien schéma est laissé intact, mais ne contient jamais
// de contenu : la vérité métier est la table de jointure.
// Dépendances : aucune (exécuté en premier dans seed.ts).
import type { PrismaClient } from '../../src/generated/prisma/client';

// Matrice d'accès du cahier des charges §2 :
//   SUPER_ADMIN=toutes, ADMIN=tout sauf user:delete
//   ORDER_MANAGER=order:*, product:read, stock:read
//   STOCK_MANAGER=stock:*, product:read
//   LIVREUR=shipment:read/write
//   CUSTOMER=product:read, order:read/write (alias)
const ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super administrateur — accès total',
    permissions: [
      'dashboard:read',
      'product:read',
      'product:write',
      'product:delete',
      'order:read',
      'order:write',
      'order:cancel',
      'user:read',
      'user:write',
      'user:delete',
      'stock:read',
      'stock:write',
      'shipment:read',
      'shipment:write',
      'coupon:read',
      'coupon:write',
      'setting:read',
      'setting:write',
    ],
  },
  {
    name: 'ADMIN',
    description: 'Administrateur — gestion boutique',
    permissions: [
      'dashboard:read',
      'product:read',
      'product:write',
      'product:delete',
      'order:read',
      'order:write',
      'order:cancel',
      'stock:read',
      'stock:write',
      'shipment:read',
      'shipment:write',
      'coupon:read',
      'coupon:write',
      'setting:read',
      'setting:write',
      // ADMIN ne peut pas supprimer un utilisateur.
    ],
  },
  {
    name: 'ORDER_MANAGER',
    description: 'Gestionnaire des commandes',
    permissions: ['order:read', 'order:write', 'order:cancel', 'product:read', 'stock:read'],
  },
  {
    name: 'STOCK_MANAGER',
    description: 'Gestionnaire du stock',
    permissions: ['stock:read', 'stock:write', 'product:read', 'order:read'],
  },
  {
    name: 'LIVREUR',
    description: 'Livreur — accès aux livraisons',
    permissions: ['shipment:read', 'shipment:write'],
  },
  {
    name: 'CUSTOMER',
    description: 'Client — accès boutique',
    permissions: ['product:read', 'order:read', 'order:write'],
  },
] as const;

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  for (const role of ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { name: role.name },
      create: {
        name: role.name,
      },
      update: {},
    });

    await Promise.all(
      role.permissions.map(async (key) => {
        const permission = await prisma.permission.upsert({
          where: { key },
          create: { key, description: key.replace(/(^|:)/g, '').replace(/:/g, ' ') },
          update: { description: key.replace(/(^|:)/g, '').replace(/:/g, ' ') },
        });
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleRecord.id, permissionId: permission.id } },
          create: { roleId: roleRecord.id, permissionId: permission.id },
          update: {},
        });
      }),
    );
  }
}
