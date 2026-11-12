// BRUNY SHOPPING — rôles et permissions (TEC-07 / AUT-05).
//
// Les 6 rôles du cahier des charges, uniques par `Role.name` (upsert).
// Les permissions sont deux niveaux : la clé `Permission.key` (relation
// `Permission`) et la jointure `RolePermission` (clé composite
// roleId+permissionId, idempotente). Le champ `Role.permissions`
// (String[]) de l'ancien schéma est laissé intact, mais ne contient jamais
// de contenu : la vérité métier est la table de jointure.
//
// La source unique est `src/common/rbac/permissions.matrix.ts` : le seed ne
// redéfinit plus la matrice, il la matérialise en base.
// Dépendances : aucune (exécuté en premier dans seed.ts).
import type { PrismaClient } from '../../src/generated/prisma/client';
import type { RoleName } from '../../src/common/decorators/roles.decorator';
import { ROLE_PERMISSIONS } from '../../src/common/rbac/permissions.matrix';

const ROLE_DESCRIPTIONS: Readonly<Record<RoleName, string>> = {
  SUPER_ADMIN: 'Super administrateur — accès total',
  ADMIN: 'Administrateur — gestion boutique',
  ORDER_MANAGER: 'Gestionnaire des commandes',
  STOCK_MANAGER: 'Gestionnaire du stock',
  LIVREUR: 'Livreur — accès aux livraisons',
  CUSTOMER: 'Client — accès boutique',
};

// Ordre stable pour les logs et les revues de seed.
const ROLE_ORDER: readonly RoleName[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'ORDER_MANAGER',
  'STOCK_MANAGER',
  'LIVREUR',
  'CUSTOMER',
];

const ROLES = ROLE_ORDER.map((name) => ({
  name,
  description: ROLE_DESCRIPTIONS[name],
  permissions: ROLE_PERMISSIONS[name],
}));

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
