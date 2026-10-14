// BRUNY SHOPPING API — application bootstrap.
// Security-first setup: helmet, CORS whitelist, global validation, request body
// limits, versioned REST prefix, structured logs and dev-only Swagger.
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

const BODY_SIZE_LIMIT = '32kb'; // No endpoint legitimately receives big payloads at step 3.

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  // Route process logs through the structured logger (pino).
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const appConfig = config.get<{
    isProduction: boolean;
    corsOrigins: string[];
    publicAppUrl: string;
    publicAdminUrl: string;
    port: number;
  }>('app');

  if (!appConfig) {
    throw new Error('Application configuration missing after validation');
  }

  // Security headers (HSTS enforced in production).
  app.use(
    helmet({
      contentSecurityPolicy: appConfig.isProduction ? undefined : false,
      hsts: appConfig.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
  app.use(json({ limit: BODY_SIZE_LIMIT }));
  app.use(cookieParser());

  // CORS whitelist: only configured storefront/admin origins.
  await app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Strict global validation, refusal by default.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(config));

  // REST API versioning: /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Interactive API documentation outside of production only.
  if (!appConfig.isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('BRUNY SHOPPING API')
        .setDescription('BRUNY SHOPPING e-commerce contract (prices in FCFA).')
        .setVersion('1.0')
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }

  // Graceful shutdown hooks (finish in-flight requests before stopping).
  app.enableShutdownHooks();

  await app.listen(appConfig.port);
}

void bootstrap();
