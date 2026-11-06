# SEED — TEC-07 (données de démonstration)

## Procédure

```bash
# 1. Configuration (si ce n'est pas déjà fait)
cp .env.example .env   # puis adapter DATABASE_URL, JWT_ACCESS_SECRET, ...

# 2. Reset + seed (drop → migrate → seed)
pnpm db:reset:seed

# 3. (Optionnel) seed pur
pnpm db:seed

# 4. (Optionnel) reset pur
pnpm db:reset
```

## Garde-fous (cahier des charges §2)

- `db:seed` refuse de s'exécuter si `NODE_ENV === 'production'` (exit 1).
- Si `DATABASE_URL` contient `"prod"` (case-insensitive) ET
  `ALLOW_SEED_IN_PRODUCTION` n'est pas `'true'` → refus + exit 1.
- Le super admin de développement est créé uniquement si
  `SEED_SUPER_ADMIN_EMAIL` et `SEED_SUPER_ADMIN_PASSWORD` sont définis,
  le mot de passe faisant au moins 12 caractères (exit 1 sinon).
- Aucun mot de passe n'est loggé. Le hash bcrypt/argon2 est stocké dans
  `passwordHash`, jamais en clair.

## Scripts (package.json)

- `db:seed` = `tsx prisma/seed.ts`
- `db:reset` = `prisma migrate reset --force`
- `db:reset:seed` = `prisma migrate reset --force && pnpm db:seed`
- `prisma.seed` = `tsx prisma/seed.ts` (utilisé par Prisma CLI si besoin)

## Ordre d'exécution des seeds

`roles` → `users` → `categories` → `brands` → `products` →
`delivery-zones` → `misc` (coupons, panier, commandes, reviews, settings).

## Idempotence

Toutes les entités sont upsertées sur leur clé naturelle
(`Role.name`, `User.email`, `Category.slug`, `Brand.slug`,
`Product.slug`, `ProductVariant.sku`, `DeliveryZone.name`,
`Coupon.code`, `Setting.key`) ; les jointures `UserRole`/`RolePermission`
sont upsertées. Une 2e exécution ne crée ni doublon ni erreur.

## Structure du projet

- `prisma/seed.ts` — orchestreur (garde-fou, ordre, logs, disconnect)
- `prisma/seeds/*.ts` — un fichier par domaine, export `seedXxx(prisma)`

## Variables d'environnement du seed

| Variable | Obligatoire | Par défaut | Description |
| --- | --- | --- | --- |
| `SEED_SUPER_ADMIN_EMAIL` | oui | — | Email du super admin de dev |
| `SEED_SUPER_ADMIN_PASSWORD` | oui | — | Mot de passe (>= 12 chars) |
| `SEED_CUSTOMER_PASSWORD` | oui | `SEED_CUSTOMER_PASSWORD` | Mot de passe du client démo |
| `SEED_FORCE_PASSWORD_RESET` | non | `false` | `true` pour forcer le reset du mot de passe |
| `ALLOW_SEED_IN_PRODUCTION` | non | `false` | Autorise le seed en prod (danger) |
