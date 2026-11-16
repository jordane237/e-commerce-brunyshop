// stock-low-alerts.e2e-spec.ts
// E2E STK-03 : franchissement du seuil, anti-spam, réapprovisionnement,
// notifications internes, audit système et endpoint admin.

import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import { hash } from '@node-rs/argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../src/infrastructure/database/database.module';
import { STOCK_LOW_DEFAULT_THRESHOLD_KEY } from '../src/modules/settings/settings.service';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';
process.env['STOCK_LOW_ALERT_ENABLED'] = 'true';
// Mode console déterministe : le worker email ne dépend pas de Mailpit.
process.env['SMTP_HOST'] = '';
process.env['SMTP_PORT'] = '';
if (process.env['REDIS_URL']) {
  const redisUrl = new URL(process.env['REDIS_URL']);
  redisUrl.pathname = '/1';
  process.env['REDIS_URL'] = redisUrl.toString();
}

const PREFIX = 'e2e-stk03';
const PASSWORD = 'E2eStk03!2026';
const ADMIN_EMAIL = `${PREFIX}-admin@brunyshop.test`;
const CUSTOMER_EMAIL = `${PREFIX}-customer@brunyshop.test`;
const GUEST_PHONE = '+237699300001';
const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;

describe('STK-03 alertes de stock bas', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let customerToken: string;
  let adminUserId: string;
  let customerUserId: string;
  let categoryId: string;
  let brandId: string;
  let productId: string;
  let variantId: string;
  let city: string;
  const fixtureVariantIds: string[] = [];

  async function cleanupDatabase(): Promise<void> {
    const productWhere = {
      OR: [{ slug: { startsWith: PREFIX } }, { name: { startsWith: 'STK03 ' } }],
    };
    await prisma.notification
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => undefined);
    await prisma.auditLog
      .deleteMany({
        where: {
          OR: [
            { user: { email: { startsWith: PREFIX } } },
            {
              action: 'STOCK_LOW_ALERT_SENT',
              entityId: { in: fixtureVariantIds },
            },
          ],
        },
      })
      .catch(() => undefined);
    await prisma.stockMovement
      .deleteMany({ where: { variant: { product: productWhere } } })
      .catch(() => undefined);
    await prisma.order
      .deleteMany({
        where: {
          OR: [{ reference: { startsWith: PREFIX } }, { guestPhone: { startsWith: '+23769930' } }],
        },
      })
      .catch(() => undefined);
    await prisma.product.deleteMany({ where: productWhere }).catch(() => undefined);
    await prisma.deliveryZone
      .deleteMany({ where: { name: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.category
      .deleteMany({ where: { slug: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.brand
      .deleteMany({ where: { slug: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.userRole
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({ where: { email: { startsWith: PREFIX } } })
      .catch(() => undefined);
  }

  async function createUser(email: string, roleName: string): Promise<string> {
    const role = await prisma.role.findFirst({ where: { name: roleName }, select: { id: true } });
    if (!role) throw new Error(`Rôle ${roleName} introuvable : exécutez le seed.`);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(PASSWORD),
        firstName: 'E2E',
        lastName: 'STK03',
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user.id;
  }

  function createOrder(quantity: number) {
    return request(app.getHttpServer())
      .post(`${BASE_URL}/orders`)
      .send({
        items: [{ variantId, quantity }],
        guestName: 'Alerte Stock E2E',
        guestPhone: GUEST_PHONE,
        address: {
          recipientName: 'Alerte Stock E2E',
          phone: GUEST_PHONE,
          city,
          district: 'Bonapriso',
          line: 'Rue 12',
        },
        paymentMethod: 'COD',
      });
  }

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }

    const { AppModule } = await import('../src/app.module');
    const { AllExceptionsFilter } = await import('../src/common/filters/all-exceptions.filter');
    const { validationExceptionFactory } = await import(
      '../src/common/pipes/validation-exception.factory'
    );

    const instance = await NestFactory.create(AppModule, { logger: false });
    instance.setGlobalPrefix('api');
    instance.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    instance.use(cookieParser());
    instance.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: validationExceptionFactory,
      }),
    );
    instance.useGlobalFilters(new AllExceptionsFilter(instance.get(ConfigService)));
    await instance.init();

    app = instance;
    prisma = app.get(PrismaService);

    await cleanupDatabase().catch(() => undefined);
    adminUserId = await createUser(ADMIN_EMAIL, 'ADMIN');
    customerUserId = await createUser(CUSTOMER_EMAIL, 'CUSTOMER');

    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync({ sub: adminUserId, roles: ['ADMIN'], typ: 'access' });
    customerToken = await jwt.signAsync({
      sub: customerUserId,
      roles: ['CUSTOMER'],
      typ: 'access',
    });

    const category = await prisma.category.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    brandId = brand.id;
    city = `${PREFIX}-${suffix}-ville`;
    await prisma.deliveryZone.create({
      data: { name: `${PREFIX}-${suffix}`, cities: [city], fee: 1500, estimatedDays: 2 },
    });

    const product = await prisma.product.create({
      data: {
        name: 'STK03 Baskets alerte',
        slug: `${PREFIX}-${suffix}-alertes`,
        description: 'Produit e2e STK-03 pour les alertes de stock bas.',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
        variants: {
          create: [
            {
              sku: `${PREFIX}-${suffix}-alertes-42`,
              color: 'NOIR',
              size: '42',
              stock: 6,
              lowStockThreshold: 5,
            },
          ],
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0].id;
    fixtureVariantIds.push(variantId);
  });

  afterAll(async () => {
    try {
      if (prisma !== undefined) {
        // Laisse le worker email terminer avant de supprimer les notifications,
        // sinon son update final entre en course avec le nettoyage.
        const deadline = Date.now() + 5_000;
        while (Date.now() < deadline) {
          const pending = await prisma.notification.count({
            where: { userId: adminUserId, channel: 'EMAIL', status: 'PENDING' },
          });
          if (pending === 0) break;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await cleanupDatabase();
      }
    } finally {
      await app?.close();
    }
  });

  it('déclenche une alerte au franchissement puis n’en renvoie pas avant réappro', async () => {
    await createOrder(1).expect(201);

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variantId },
    });
    expect(variant.stock).toBe(5);
    expect(variant.lowStockAlertSentAt).toBeInstanceOf(Date);

    const notifications = await prisma.notification.findMany({
      where: { userId: adminUserId, templateKey: 'stock.low' },
    });
    expect(notifications.map((notification) => notification.channel).sort()).toEqual([
      'EMAIL',
      'IN_APP',
    ]);
    const inApp = notifications.find((notification) => notification.channel === 'IN_APP');
    expect(inApp).toMatchObject({ status: 'SENT', recipient: adminUserId });
    expect(inApp?.metadata).toMatchObject({
      title: expect.stringContaining('Stock bas'),
      metadata: { variantId },
    });

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'STOCK_LOW_ALERT_SENT', entityId: variantId },
    });
    expect(audit).toMatchObject({ userId: null });
    expect(audit?.after).toMatchObject({ availableStock: 5, threshold: 5 });

    await createOrder(1).expect(201);
    expect(
      await prisma.notification.count({
        where: { userId: adminUserId, templateKey: 'stock.low' },
      }),
    ).toBe(2);
    expect(
      await prisma.auditLog.count({
        where: { action: 'STOCK_LOW_ALERT_SENT', entityId: variantId },
      }),
    ).toBe(1);
  });

  it('réarme l’alerte après un réapprovisionnement au-dessus du seuil', async () => {
    await request(app.getHttpServer())
      .put(`${BASE_URL}/admin/products/${productId}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ variants: [{ id: variantId, color: 'NOIR', size: '42', stock: 6 }] })
      .expect(200);

    const restocked = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(restocked.lowStockAlertSentAt).toBeNull();

    await createOrder(1).expect(201);

    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(after.lowStockAlertSentAt).toBeInstanceOf(Date);
    expect(
      await prisma.notification.count({
        where: { userId: adminUserId, templateKey: 'stock.low' },
      }),
    ).toBe(4);
    expect(
      await prisma.auditLog.count({
        where: { action: 'STOCK_LOW_ALERT_SENT', entityId: variantId },
      }),
    ).toBe(2);
  });

  it('expose la variante dans l’endpoint admin filtré', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/alerts`)
      .query({ productId, threshold: 5, page: 1, limit: 10 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      lowCount: 1,
      outCount: 0,
    });
    expect(response.body.data[0]).toMatchObject({
      variantId,
      productId,
      productName: 'STK03 Baskets alerte',
      stock: 5,
      reservedStock: 0,
      availableStock: 5,
      threshold: 5,
      status: 'LOW',
    });
    expect(response.body.data[0].lowStockAlertSentAt).toEqual(expect.any(String));

    await prisma.productVariant.update({ where: { id: variantId }, data: { stock: 0 } });
    const out = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/alerts`)
      .query({ productId, page: 1, limit: 10 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(out.body.meta).toMatchObject({ total: 1, lowCount: 0, outCount: 1 });
    expect(out.body.data[0]).toMatchObject({
      variantId,
      availableStock: 0,
      status: 'OUT',
    });
  });

  it('protège l’endpoint par authentification et rôle', async () => {
    await request(app.getHttpServer()).get(`${BASE_URL}/admin/stock/alerts`).expect(401);
    await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/alerts`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('utilise le seuil global du Setting pour une variante sans seuil', async () => {
    const previous = await prisma.setting.findUnique({
      where: { key: STOCK_LOW_DEFAULT_THRESHOLD_KEY },
      select: { value: true },
    });
    await prisma.setting.upsert({
      where: { key: STOCK_LOW_DEFAULT_THRESHOLD_KEY },
      create: { key: STOCK_LOW_DEFAULT_THRESHOLD_KEY, value: 7 },
      update: { value: 7 },
    });
    try {
      const response = await request(app.getHttpServer())
        .post(`${BASE_URL}/admin/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `STK03 seuil global ${suffix}`,
          slug: `${PREFIX}-${suffix}-seuil-global`,
          description: 'Produit e2e STK-03 avec seuil global.',
          categoryId,
          brandId,
          basePrice: 20000,
          variants: [{ color: 'BLEU', size: '41', stock: 2 }],
        });
      if (response.status !== 201) {
        throw new Error(`Création seuil global échouée : ${JSON.stringify(response.body)}`);
      }
      expect(response.body.variants[0].lowStockThreshold).toBe(7);
      fixtureVariantIds.push(response.body.variants[0].id);
    } finally {
      if (previous === null) {
        await prisma.setting.delete({ where: { key: STOCK_LOW_DEFAULT_THRESHOLD_KEY } });
      } else {
        await prisma.setting.update({
          where: { key: STOCK_LOW_DEFAULT_THRESHOLD_KEY },
          data: { value: previous.value },
        });
      }
    }
  });
});
