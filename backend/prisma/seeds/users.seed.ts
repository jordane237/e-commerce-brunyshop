// BRUNY SHOPPING — utilisateurs (TEC-07).
//
// - Super admin de développement : email et mot de passe viennent de
//   `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` (variables
//   d'environnement, jamais en dur, jamais loggées). Le mot de passe doit
//   faire au moins 12 caractères, sinon le seed s'arrête (exit 1).
//   Si l'utilisateur existe, son mot de passe n'est PAS écrasé sauf si
//   `SEED_FORCE_PASSWORD_RESET=true`.
// - Client de démonstration : email customer@brunyshop.local, mot de
//   passe fourni par `SEED_CUSTOMER_PASSWORD` (default documenté).
// Dépendances : roles.seed (role SUPER_ADMIN doit exister).
import { hash } from '@node-rs/argon2';
import type { PrismaClient } from '../../src/generated/prisma/client';
import type { PrismaClient } from '../../src/generated/prisma/client';

const ARGON2_COST = 12;

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  // --- Super admin de développement -----------------------------------
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail) {
    throw new Error("SEED_SUPER_ADMIN_EMAIL est obligatoire (variable d'environnement).");
  }
  if (typeof superAdminPassword !== 'string' || superAdminPassword.length === 0) {
    throw new Error("SEED_SUPER_ADMIN_PASSWORD est obligatoire (variable d'environnement).");
  }
  if (superAdminPassword.length < 12) {
    throw new Error(
      `SEED_SUPER_ADMIN_PASSWORD trop court (au moins 12 caractères, actuellement ${superAdminPassword.length}).`,
    );
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });
  if (!superAdminRole) {
    throw new Error("Le rôle SUPER_ADMIN n'existe pas. Lance d'abord seedRoles (pnpm db:seed).");
  }

  const admin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    create: {
      email: superAdminEmail,
      passwordHash: await hash(superAdminPassword, { cost: ARGON2_COST }),
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+237600000001-' + superAdminEmail.split('@')[0],
      status: 'ACTIVE',
    },
    update: {
      // Ne jamais écraser le mot de passe sans accord explicite.
      ...(process.env.SEED_FORCE_PASSWORD_RESET === 'true'
        ? { passwordHash: await hash(superAdminPassword, { cost: ARGON2_COST }) }
        : {}),
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+237600000001-' + superAdminEmail.split('@')[0],
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    create: { userId: admin.id, roleId: superAdminRole.id },
    update: {},
  });

  // --- Client de démonstration ----------------------------------------
  const customerEmail = 'customer@brunyshop.local';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? 'SEED_CUSTOMER_PASSWORD';
  if (typeof customerPassword !== 'string' || customerPassword.length === 0) {
    throw new Error("SEED_CUSTOMER_PASSWORD est obligatoire (variable d'environnement).");
  }
  if (customerPassword.length < 12) {
    throw new Error(
      `SEED_CUSTOMER_PASSWORD trop court (au moins 12 caractères, actuellement ${customerPassword.length}).`,
    );
  }

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    create: {
      email: customerEmail,
      passwordHash: await hash(customerPassword, { cost: ARGON2_COST }),
      firstName: 'Client',
      lastName: 'Démo',
      phone: '+237600000010',
      status: 'ACTIVE',
    },
    update: {
      ...(process.env.SEED_FORCE_PASSWORD_RESET === 'true'
        ? { passwordHash: await hash(customerPassword, { cost: ARGON2_COST }) }
        : {}),
      firstName: 'Client',
      lastName: 'Démo',
      phone: '+237600000010',
    },
  });

  const customerRole = await prisma.role.findUnique({
    where: { name: 'CUSTOMER' },
  });
  if (customerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: customer.id, roleId: customerRole.id } },
      create: { userId: customer.id, roleId: customerRole.id },
      update: {},
    });
  }

  console.log('✅ Utilisateurs prêts : superAdmin=' + superAdminEmail + ' client=' + customerEmail);
}
