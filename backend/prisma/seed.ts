// Seed script (step 4 fills it: roles, categories, brands, products, zones).
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient as GeneratedPrismaClient,
  type PrismaClientOptions,
} from '../src/generated/prisma/client';

async function main(): Promise<void> {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? '',
  });
  const prisma = new GeneratedPrismaClient({
    adapter,
  } as PrismaClientOptions);
  await prisma.healthProbe.count();
  console.log('seed: schema connected, full seed comes with step 4');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
