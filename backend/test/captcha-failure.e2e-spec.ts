import { existsSync } from 'node:fs';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'true';
process.env['TURNSTILE_SITE_KEY'] = '2x00000000000000000000BB';
process.env['TURNSTILE_SECRET_KEY'] = '2x0000000000000000000000000000000AA';

import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startFakeTurnstile, type FakeTurnstile } from './support/fake-turnstile';

const BASE_URL = '/api/v1';

describe('CAPTCHA Turnstile — clé always fails (AUT-11)', () => {
  let app: INestApplication;
  let fakeTurnstile: FakeTurnstile;
  const suffix = `${Date.now()}`;

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }
    fakeTurnstile = await startFakeTurnstile('invalid');
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
  });

  afterAll(async () => {
    if (app !== undefined) await app.close();
    if (fakeTurnstile !== undefined) await fakeTurnstile.close();
  });

  it('refuse un jeton avec CAPTCHA_INVALID', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/auth/register`)
      .set('X-Forwarded-For', '10.10.0.1')
      .send({
        email: `e2e-aut11-fail-${suffix}@aut11.test`,
        password: 'E2eAut11!Secure99',
        firstName: 'Aut11',
        lastName: 'Fail',
        termsAccepted: true,
        termsVersion: '1.0',
        turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('CAPTCHA_INVALID');
  });
});
