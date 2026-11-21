import { existsSync } from 'node:fs';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';

import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../src/infrastructure/database/database.module';

const BASE_URL = '/api/v1';
const PREFIX = 'e2e-aut11-disabled';

describe('CAPTCHA désactivé (AUT-11)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }
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
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  });

  afterAll(async () => {
    if (prisma !== undefined) {
      await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
    }
    if (app !== undefined) await app.close();
  });

  it('autorise register sans jeton quand TURNSTILE_ENABLED=false', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/auth/register`)
      .set('X-Forwarded-For', '10.11.0.1')
      .send({
        email: `${PREFIX}-${Date.now()}@aut11.test`,
        password: 'E2eAut11!Secure99',
        firstName: 'Aut11',
        lastName: 'Disabled',
        termsAccepted: true,
        termsVersion: '1.0',
      });

    expect(response.status).toBe(201);
  });

  it('GET /config indique que le CAPTCHA est désactivé', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/config`)
      .set('X-Forwarded-For', '10.11.0.2')
      .expect(200);

    expect(response.body.turnstileEnabled).toBe(false);
  });
});
