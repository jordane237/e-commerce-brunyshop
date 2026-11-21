// notifications.e2e-spec.ts
// E2E NTF-01 : parcours réel service → BullMQ → worker → base, puis endpoints
// admin protégés (JwtAuthGuard + RolesGuard).
//
// Aucun producteur n'appelle encore NotificationsService (l'inscription ne
// déclenche pas d'email) : le test pilote donc le pipeline via le service
// exposé, exactement comme le fera le module métier consommateur.

import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { hash } from '@node-rs/argon2';
import cookieParser from 'cookie-parser';
import type Redis from 'ioredis';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { RedisService } from '../src/infrastructure/cache/cache.module';
import { PrismaService } from '../src/infrastructure/database/database.module';
import type { EmailAdapter } from '../src/modules/notifications/adapters/email.adapter';
import type { NotificationsService } from '../src/modules/notifications/notifications.service';
import type { Queue } from 'bullmq';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';

// Mode console déterministe : le worker réussit sans dépendre de Mailpit.
// (process.env prime sur le fichier .env lu par ConfigModule.)
process.env.SMTP_HOST = '';
process.env.SMTP_PORT = '';

// Isolation BullMQ : les workers d'un serveur de dev local consomment la db 0
// et voleraient les jobs du test. La db 1 est réservée à l'e2e.
if (process.env.REDIS_URL) {
  const redisUrl = new URL(process.env.REDIS_URL);
  redisUrl.pathname = '/1';
  process.env.REDIS_URL = redisUrl.toString();
}

const PREFIX = 'e2e-ntf01';
const ADMIN_EMAIL = `${PREFIX}-admin@brunyshop.test`;
const CUSTOMER_EMAIL = `${PREFIX}-customer@brunyshop.test`;
const PASSWORD = 'E2eNotif!2026';
const QUEUE = 'notifications-email';
const JOB_NAME = `${PREFIX}-dead-letter`;

describe('Notifications NTF-01 (pipeline + admin)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let notifications: NotificationsService;
  let emailAdapter: EmailAdapter;
  let redis: Redis | undefined;
  let baseUrl: string;
  let adminToken: string;
  let customerToken: string;
  let emailQueue: Queue<unknown>;

  const sendSpy = vi.fn();

  async function clearThrottleCounters(): Promise<void> {
    if (!redis) return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', '*:default}:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  }

  // Le job échoué du test dead-letter garde son jobName BullMQ ('send-email') :
  // on le cible par son message d'erreur, propre à ce test.
  async function cleanupDatabase(): Promise<void> {
    await prisma.deadLetterJob.deleteMany({
      where: {
        OR: [
          { jobName: { startsWith: PREFIX } },
          { error: { contains: 'SMTP 550 mailbox unavailable' } },
        ],
      },
    });
    await prisma.notification.deleteMany({ where: { recipient: { startsWith: PREFIX } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  }

  async function createUser(email: string, roleName: 'ADMIN' | 'CUSTOMER'): Promise<string> {
    const role = await prisma.role.findFirst({ where: { name: roleName }, select: { id: true } });
    if (!role) throw new Error(`Rôle ${roleName} introuvable : exécutez le seed.`);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(PASSWORD),
        firstName: 'E2E',
        lastName: roleName,
        status: 'ACTIVE',
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user.id;
  }

  async function login(identifier: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/login`)
      .send({ identifier, password: PASSWORD })
      .expect(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    return response.body.accessToken as string;
  }

  async function waitFor<T>(
    read: () => Promise<T | null>,
    predicate: (value: T) => boolean,
    timeoutMs = 10_000,
  ): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    let last: T | null = null;
    while (Date.now() < deadline) {
      last = await read();
      if (last !== null && predicate(last)) return last;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(
      `Condition non satisfaite après ${timeoutMs} ms (dernier: ${JSON.stringify(last)})`,
    );
  }

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module');
    const { AllExceptionsFilter } = await import('../src/common/filters/all-exceptions.filter');
    const { validationExceptionFactory } = await import(
      '../src/common/pipes/validation-exception.factory'
    );
    const { NotificationsService } = await import(
      '../src/modules/notifications/notifications.service'
    );
    const { EmailAdapter } = await import('../src/modules/notifications/adapters/email.adapter');

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
    baseUrl = '/api/v1';

    prisma = app.get(PrismaService);
    notifications = app.get(NotificationsService);
    emailAdapter = app.get(EmailAdapter);
    redis = app.get(RedisService).redis;

    // db 1 dédiée au test : on repart d'une base Redis propre.
    await redis.flushdb();

    const { getQueueToken } = await import('@nestjs/bullmq');
    emailQueue = app.get<Queue<unknown>>(getQueueToken(QUEUE));

    // Observe l'adaptateur réellement utilisé par le worker (même singleton DI).
    vi.spyOn(emailAdapter, 'send').mockImplementation(async (payload) => {
      sendSpy(payload);
      return { success: true };
    });

    await cleanupDatabase();

    await clearThrottleCounters();
    const adminId = await createUser(ADMIN_EMAIL, 'ADMIN');
    await createUser(CUSTOMER_EMAIL, 'CUSTOMER');

    // Le login ADMIN est bloqué par le 2FA obligatoire (BOA-02) : on émet un
    // access token avec le JwtService réel. Le guard recharge les rôles en base.
    const { JwtService } = await import('@nestjs/jwt');
    adminToken = await app
      .get(JwtService)
      .signAsync({ sub: adminId, roles: ['ADMIN'], typ: 'access' });
    customerToken = await login(CUSTOMER_EMAIL);
  });

  afterAll(async () => {
    try {
      if (prisma) await cleanupDatabase();
      await clearThrottleCounters();
      vi.restoreAllMocks();
    } finally {
      await app?.close();
    }
  });

  it("enfile un email, le worker l'envoie et la notification passe à SENT", async () => {
    const recipient = `${PREFIX}-awa@brunyshop.test`;
    const data = {
      firstName: 'Awa',
      lastName: 'Nkeng',
      catalogUrl: 'https://brunyshop.cm/catalogue',
      supportUrl: 'https://brunyshop.cm/support',
    };

    // Queue en pause : l'état PENDING est observable sans course avec le worker.
    await emailQueue.pause();
    let notificationId: string;
    try {
      notificationId = await notifications.enqueueEmail(
        null,
        recipient,
        'auth.register.welcome',
        'v1',
        data,
      );

      const created = await prisma.notification.findUniqueOrThrow({
        where: { id: notificationId },
      });
      expect(created).toMatchObject({
        channel: 'EMAIL',
        templateKey: 'auth.register.welcome',
        templateVersion: 'v1',
        recipient,
        userId: null,
        status: 'PENDING',
        attempts: 0,
      });
      expect(created.metadata).toMatchObject({
        templateKey: 'auth.register.welcome',
        templateVersion: 'v1',
      });
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await emailQueue.resume();
    }

    const sent = await waitFor(
      () => prisma.notification.findUnique({ where: { id: notificationId } }),
      (row) => row.status === 'SENT',
    );
    expect(sent.attempts).toBe(1);
    expect(sent.sentAt).toBeInstanceOf(Date);
    expect(sent.lastError).toBeNull();

    const delivered = sendSpy.mock.calls
      .map(([payload]) => payload as { to: string; subject: string; html: string })
      .find((payload) => payload.to === recipient);
    expect(delivered).toBeDefined();
    expect(delivered?.subject).toBe('Bienvenue chez BrunyShop, Awa !');
    expect(delivered?.html).toContain('Awa Nkeng');
    expect(delivered?.html).toContain(data.catalogUrl);
  });

  it('passe la notification en dead-letter quand le provider échoue', async () => {
    const recipient = `${PREFIX}-fail@brunyshop.test`;
    vi.mocked(emailAdapter.send).mockImplementationOnce(async () => ({
      success: false,
      error: 'SMTP 550 mailbox unavailable',
    }));

    const notificationId = await notifications.enqueueEmail(
      null,
      recipient,
      'auth.register.welcome',
      'v1',
      { firstName: 'Echec', lastName: 'Test', catalogUrl: 'x', supportUrl: 'y' },
    );

    const failed = await waitFor(
      () => prisma.notification.findUnique({ where: { id: notificationId } }),
      (row) => row.status === 'DEAD_LETTER',
    );
    expect(failed.attempts).toBe(1);
    expect(failed.sentAt).toBeNull();
    expect(failed.lastError).toContain('SMTP 550');

    // Constat : NotificationsService n'enfile pas d'options de retry, donc
    // BullMQ applique attempts = 1 et le job part en dead-letter dès le
    // premier échec (les 5 tentatives du worker ne sont jamais atteintes).
    const deadLetter = await prisma.deadLetterJob.findFirstOrThrow({
      where: { queueName: QUEUE, error: { contains: 'SMTP 550 mailbox unavailable' } },
    });
    expect(deadLetter).toMatchObject({ jobName: 'send-email', attempts: 1, payload: {} });
  });

  it('expose le détail d’une notification aux admins uniquement', async () => {
    const recipient = `${PREFIX}-detail@brunyshop.test`;
    const notificationId = await notifications.enqueueEmail(
      null,
      recipient,
      'auth.register.welcome',
      'v1',
      { firstName: 'Detail', lastName: 'Test', catalogUrl: 'x', supportUrl: 'y' },
    );

    const anonymous = await request(app.getHttpServer())
      .get(`${baseUrl}/admin/notifications/${notificationId}`)
      .expect(401);
    expect(anonymous.body.code).toBe('UNAUTHORIZED');

    const forbidden = await request(app.getHttpServer())
      .get(`${baseUrl}/admin/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
    expect(forbidden.body.code).toBe('FORBIDDEN');

    const detail = await request(app.getHttpServer())
      .get(`${baseUrl}/admin/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: notificationId,
      channel: 'EMAIL',
      recipient,
      templateKey: 'auth.register.welcome',
    });

    const missing = await request(app.getHttpServer())
      .get(`${baseUrl}/admin/notifications/11111111-1111-4111-8111-111111111111`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
    expect(missing.body.code).toBe('NOTIFICATION_NOT_FOUND');

    const invalidId = await request(app.getHttpServer())
      .get(`${baseUrl}/admin/notifications/pas-un-uuid`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    expect(invalidId.body.code).toBe('BAD_REQUEST');
  });

  it('déplace un job en dead-letter et le liste côté admin', async () => {
    const recipient = `${PREFIX}-dlq@brunyshop.test`;
    const notificationId = await notifications.enqueueEmail(
      null,
      recipient,
      'auth.register.welcome',
      'v1',
      { firstName: 'Dlq', lastName: 'Test', catalogUrl: 'x', supportUrl: 'y' },
    );
    const jobId = `${PREFIX}-job-1`;

    // Laisse le worker terminer avant de simuler la dead-letter (pas de course).
    await waitFor(
      () => prisma.notification.findUnique({ where: { id: notificationId } }),
      (row) => row.status === 'SENT',
    );

    await notifications.moveToDeadLetter(
      notificationId,
      new Error('SMTP timeout après 5 tentatives'),
      QUEUE,
      JOB_NAME,
      jobId,
      5,
    );

    const row = await prisma.notification.findUniqueOrThrow({ where: { id: notificationId } });
    expect(row.status).toBe('DEAD_LETTER');

    const job = await prisma.deadLetterJob.findFirstOrThrow({
      where: { jobId },
    });
    expect(job).toMatchObject({ queueName: QUEUE, jobName: JOB_NAME, attempts: 5 });
    expect(job.error).toContain('SMTP timeout');
    // Aucune donnée personnelle persistée avec le payload échoué.
    expect(job.payload).toEqual({});

    const list = await request(app.getHttpServer())
      .get(`${baseUrl}/admin/notifications/dead-letters`)
      .query({ queueName: QUEUE, jobName: JOB_NAME, limit: 10 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(list.body.meta).toMatchObject({ total: 1, page: 1, limit: 10, totalPages: 1 });
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ jobId, queueName: QUEUE, attempts: 5 });
    expect(JSON.stringify(list.body.data)).not.toContain(recipient);

    const forbidden = await request(app.getHttpServer())
      .get(`${baseUrl}/admin/notifications/dead-letters`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
    expect(forbidden.body.code).toBe('FORBIDDEN');
  });
});
