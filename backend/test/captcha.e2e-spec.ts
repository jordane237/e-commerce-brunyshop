import { existsSync } from 'node:fs';
import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'true';
process.env['TURNSTILE_SITE_KEY'] = '1x00000000000000000000BB';
process.env['TURNSTILE_SECRET_KEY'] = '1x0000000000000000000000000000000AA';
// Mode console déterministe : le worker email réussit sans dépendre de Mailpit.
process.env['SMTP_HOST'] = '';
process.env['SMTP_PORT'] = '';

import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Queue } from 'bullmq';

import { startFakeTurnstile, type FakeTurnstile } from './support/fake-turnstile';

const PREFIX = 'e2e-aut11-pass';
const BASE_URL = '/api/v1';
const PASSWORD = 'E2eAut11!Secure99';
const TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
const TEST_STARTED_AT = new Date();

describe('CAPTCHA Turnstile — clés always passes (AUT-11)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fakeTurnstile: FakeTurnstile;
  let emailQueue: Queue<unknown> | undefined;
  let ipCounter = 0;

  function nextIp(): string {
    ipCounter += 1;
    return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${(ipCounter & 255) + 1}`;
  }

  function post(path: string, body: unknown, token?: string) {
    const builder = request(app.getHttpServer())
      .post(`${BASE_URL}${path}`)
      .set('X-Forwarded-For', nextIp());
    if (token !== undefined) builder.set('cf-turnstile-response', token);
    return builder.send(body as object);
  }

  function postFrom(path: string, body: unknown, ip: string, token?: string) {
    const builder = request(app.getHttpServer())
      .post(`${BASE_URL}${path}`)
      .set('X-Forwarded-For', ip);
    if (token !== undefined) builder.set('cf-turnstile-response', token);
    return builder.send(body as object);
  }

  function registration(email: string) {
    return {
      email,
      password: PASSWORD,
      firstName: 'Aut11',
      lastName: 'Captcha',
      termsAccepted: true,
      termsVersion: '1.0',
    };
  }

  function contact(email: string) {
    return {
      name: 'Awa Aut11',
      email,
      phone: '+237699300001',
      subject: 'order',
      orderReference: 'BRN-2611-7K3F',
      message: 'Bonjour, je souhaite avoir des informations sur ma commande.',
      consent: true,
    };
  }

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }
    fakeTurnstile = await startFakeTurnstile('success');
    process.env['TURNSTILE_VERIFY_URL'] = fakeTurnstile.url;
    if (process.env['REDIS_URL']) {
      const redisUrl = new URL(process.env['REDIS_URL']);
      redisUrl.pathname = '/1';
      process.env['REDIS_URL'] = redisUrl.toString();
    }

    const { AppModule } = await import('../src/app.module');
    const { AllExceptionsFilter } = await import('../src/common/filters/all-exceptions.filter');
    const { validationExceptionFactory } = await import(
      '../src/common/pipes/validation-exception.factory'
    );

    const instance = await NestFactory.create(AppModule, { logger: false });
    instance.getHttpAdapter().getInstance().set('trust proxy', 1);
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
    const { getQueueToken } = await import('@nestjs/bullmq');
    const { NOTIFICATIONS_EMAIL_QUEUE } = await import(
      '../src/modules/notifications/queue.constants'
    );
    emailQueue = app.get<Queue<unknown>>(getQueueToken(NOTIFICATIONS_EMAIL_QUEUE));
    await emailQueue.obliterate({ force: true });
    await prisma.contactMessage.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  });

  async function waitForContactNotifications(): Promise<void> {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      const pending = await prisma.notification.count({
        where: {
          templateKey: { in: ['contact.message', 'contact.confirmation'] },
          createdAt: { gte: TEST_STARTED_AT },
          status: 'PENDING',
        },
      });
      if (pending === 0) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Les notifications de contact ne sont pas terminées.');
  }

  afterAll(async () => {
    if (prisma !== undefined) {
      await waitForContactNotifications();
      if (emailQueue !== undefined) await emailQueue.obliterate({ force: true });
      await prisma.contactMessage.deleteMany({ where: { email: { startsWith: PREFIX } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
      await prisma.notification.deleteMany({
        where: {
          templateKey: { in: ['contact.message', 'contact.confirmation'] },
          createdAt: { gte: TEST_STARTED_AT },
        },
      });
    }
    if (app !== undefined) await app.close();
    if (fakeTurnstile !== undefined) await fakeTurnstile.close();
  });

  it('GET /config expose la clé publique mais jamais le secret', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/config`)
      .set('X-Forwarded-For', nextIp())
      .expect(200);

    expect(response.body).toEqual({
      turnstileEnabled: true,
      turnstileSiteKey: '1x00000000000000000000BB',
    });
    expect(JSON.stringify(response.body)).not.toContain('1x0000000000000000000000000000000AA');
    expect(response.body).not.toHaveProperty('turnstileSecretKey');
  });

  it('POST /auth/register sans jeton répond CAPTCHA_REQUIRED', async () => {
    const response = await post('/auth/register', registration(`${PREFIX}-missing@aut11.test`));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('CAPTCHA_REQUIRED');
  });

  it('POST /auth/register avec jeton valide crée le compte', async () => {
    const response = await post(
      '/auth/register',
      registration(`${PREFIX}-register@aut11.test`),
      TOKEN,
    );

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('Compte créé');
  });

  it('POST /auth/login sans jeton répond CAPTCHA_REQUIRED puis accepte avec jeton', async () => {
    const email = `${PREFIX}-login@aut11.test`;
    await post('/auth/register', registration(email), TOKEN).expect(201);

    const missing = await post('/auth/login', { identifier: email, password: PASSWORD });
    expect(missing.status).toBe(400);
    expect(missing.body.code).toBe('CAPTCHA_REQUIRED');

    const success = await post('/auth/login', { identifier: email, password: PASSWORD }, TOKEN);
    expect(success.status).toBe(200);
    expect(success.body.accessToken).toEqual(expect.any(String));
  });

  it('POST /contact sans jeton répond CAPTCHA_REQUIRED', async () => {
    const response = await post('/contact', contact(`${PREFIX}-contact-missing@aut11.test`));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('CAPTCHA_REQUIRED');
  });

  it('POST /contact avec jeton crée un message et le persiste', async () => {
    const email = `${PREFIX}-contact@aut11.test`;
    const response = await post('/contact', contact(email), TOKEN);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      receivedAt: expect.any(String),
    });
    const stored = await prisma.contactMessage.findUniqueOrThrow({
      where: { id: response.body.id },
    });
    expect(stored.email).toBe(email);
    expect(stored.subject).toBe('order');
    expect(stored.status).toBe('NEW');

    const audited = await prisma.auditLog.findFirst({
      where: { entity: 'ContactMessage', entityId: response.body.id },
    });
    expect(audited?.action).toBe('CONTACT_SUBMITTED');
    expect(JSON.stringify(audited?.after)).not.toContain(email);

    const notifications = await prisma.notification.findMany({
      where: {
        templateKey: { in: ['contact.message', 'contact.confirmation'] },
        metadata: { path: ['metadata', 'contactId'], equals: response.body.id },
      },
      orderBy: { templateKey: 'asc' },
    });
    expect(notifications.map((item) => item.templateKey)).toEqual([
      'contact.confirmation',
      'contact.message',
    ]);
    expect(notifications.every((item) => item.channel === 'EMAIL')).toBe(true);
  });

  it('accepte le jeton dans le header cf-turnstile-response', async () => {
    const response = await post('/contact', contact(`${PREFIX}-contact-header@aut11.test`), TOKEN);

    expect(response.status).toBe(201);
  });

  it('POST /orders sans jeton est bloqué avant le traitement métier', async () => {
    const response = await post('/orders', {});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('CAPTCHA_REQUIRED');
  });

  it('ignore silencieusement une soumission honeypot sans la persister', async () => {
    const email = `${PREFIX}-honey@aut11.test`;
    const response = await post(
      '/contact',
      { ...contact(email), _honey: 'https://spam.example' },
      TOKEN,
    );

    expect(response.status).toBe(201);
    expect(response.body.id).toEqual(expect.any(String));
    expect(await prisma.contactMessage.count({ where: { email } })).toBe(0);
  });

  it('limite à 5 envois par minute et par IP', async () => {
    const ip = `10.251.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`;
    for (let index = 0; index < 5; index += 1) {
      await postFrom('/contact', contact(`${PREFIX}-rate-${index}@aut11.test`), ip, TOKEN).expect(
        201,
      );
    }

    const blocked = await postFrom(
      '/contact',
      contact(`${PREFIX}-rate-blocked@aut11.test`),
      ip,
      TOKEN,
    );
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });

  it('répond 503 CAPTCHA_UNAVAILABLE quand siteverify est indisponible', async () => {
    fakeTurnstile.setMode('unavailable');
    try {
      const response = await post('/contact', contact(`${PREFIX}-unavailable@aut11.test`), TOKEN);

      expect(response.status).toBe(503);
      expect(response.body.code).toBe('CAPTCHA_UNAVAILABLE');
    } finally {
      fakeTurnstile.setMode('success');
    }
  });

  it('refuse un ContactDto invalide après validation du CAPTCHA', async () => {
    const response = await post(
      '/contact',
      { ...contact(`${PREFIX}-invalid@aut11.test`), message: 'court' },
      TOKEN,
    );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
