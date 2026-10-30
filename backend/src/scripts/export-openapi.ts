// TEC-05 CA3 — export the OpenAPI contract to `backend/openapi.json`, the file
// consumed by the Angular client generation (TEC-09) and versioned in Git so
// any contract break shows up in a pull request diff.
//
// The local stack must be running (`pnpm docker:up`): AppModule connects to
// PostgreSQL while initializing.
//
// Usage: pnpm -C backend openapi:export
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { AppModule } from '../app.module';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    // Mirrors main.ts: Swagger documents the routes as they are actually
    // served, i.e. behind the global prefix and URI versioning.
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('BRUNY SHOPPING API')
        .setDescription('BRUNY SHOPPING e-commerce contract (prices in FCFA).')
        .setVersion('1.0')
        .build(),
    );

    // Drift guard: if main.ts ever changes prefix or versioning without this
    // script, fail loudly instead of exporting a contract the API never serves.
    const paths = Object.keys(document.paths ?? {});
    if (paths.length === 0 || paths.some((path) => !path.startsWith('/api/v1/'))) {
      throw new Error(
        `Exported document does not match the served routes (paths must start with /api/v1/): ${paths
          .slice(0, 5)
          .join(', ')}`,
      );
    }

    const target = resolve(__dirname, '../../openapi.json');
    await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    process.stdout.write(`OpenAPI contract written to ${target} (${paths.length} paths)\n`);
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`OpenAPI export failed: ${String(error)}\n`);
  process.exitCode = 1;
});
