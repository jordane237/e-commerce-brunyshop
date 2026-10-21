import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';

if (existsSync('../.env')) process.loadEnvFile('../.env');

describe('API end-to-end', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }
    const { AppModule } = await import('../src/app.module');
    const { AllExceptionsFilter } = await import('../src/common/filters/all-exceptions.filter');
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

  it('registers a client, issues a refresh cookie and refuses its admin access', async () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const registration = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/register`)
      .send({
        email: `e2e-${suffix}@example.cm`,
        firstName: 'Test',
        lastName: 'Client',
        password: 'E2e!SecurePassword99',
      })
      .expect(201);
    expect(registration.body.accessToken).toEqual(expect.any(String));
    expect(registration.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('bruny_refresh=')]),
    );

    await request(app.getHttpServer())
      .post(`${baseUrl}/admin/products`)
      .set('Authorization', `Bearer ${registration.body.accessToken}`)
      .send({})
      .expect(403);
  });
});
