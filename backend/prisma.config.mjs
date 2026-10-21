// Prisma 7 configuration for the CLI (migrate, generate, validate).
// ESM JavaScript so the CLI parses it without any TypeScript loader.
import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env itself (see pris.ly/d/config-url):
// load it here so DATABASE_URL is available to the CLI.
if (existsSync('.env')) process.loadEnvFile('.env');
else if (existsSync('../.env')) process.loadEnvFile('../.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
