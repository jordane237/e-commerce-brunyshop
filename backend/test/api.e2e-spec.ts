import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';

describe('API end-to-end', () => {
  let app: INestApplication;
  let baseUrl: string;

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
    baseUrl = '/api/v1';
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves liveness and a public, paginated product catalogue', async () => {
    await request(app.getHttpServer()).get(`${baseUrl}/health/live`).expect(200);
    const response = await request(app.getHttpServer())
      .get(`${baseUrl}/products?page=1&limit=5&sort=price_asc`)
      .expect(200);
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 5 });
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('refuses a protected route without an access token', async () => {
    await request(app.getHttpServer()).get(`${baseUrl}/me`).expect(401);
  });

  it('registers a client neutrally, then logs it in and refuses its admin access', async () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `e2e-${suffix}@example.cm`;
    const payload = {
      email,
      firstName: 'Test',
      lastName: 'Client',
      password: 'E2e!SecurePassword99',
      termsAccepted: true,
      termsVersion: '1.0',
    };

    const registration = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/register`)
      .send(payload)
      .expect(201);
    expect(registration.body).toMatchObject({
      id: expect.any(String),
      emailMasked: expect.stringContaining('***@example.cm'),
      status: 'PENDING_VERIFICATION',
      message: expect.stringContaining('Compte créé'),
    });
    // AUT-01 : aucun jeton à l'inscription, la connexion est une étape distincte.
    expect(registration.body.accessToken).toBeUndefined();
    expect(registration.headers['set-cookie']).toBeUndefined();

    // Doublon : même statut, même structure, aucune fuite d'existence.
    const duplicate = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/register`)
      .send(payload)
      .expect(201);
    expect(duplicate.body).toMatchObject({
      emailMasked: registration.body.emailMasked,
      status: registration.body.status,
      message: registration.body.message,
    });
    expect(duplicate.body.id).not.toBe(registration.body.id);

    const login = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/login`)
      .send({ identifier: email, password: payload.password })
      .expect(200);
    expect(login.body.accessToken).toEqual(expect.any(String));
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('bruny_refresh=')]),
    );

    await request(app.getHttpServer())
      .post(`${baseUrl}/admin/products`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({})
      .expect(403);
  });
});
