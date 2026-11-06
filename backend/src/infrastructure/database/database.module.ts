import { Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../../generated/prisma/client';

// Wrapper around the generated Prisma client: the @prisma/adapter-pg
// driver adapter is injected through the constructor, and PrismaClient's
// lifecycle hooks (`$connect`/`$disconnect`) are exposed on the service
// for NestJS to call at startup and shutdown.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter } satisfies Prisma.PrismaClientOptions);
  }

  // Terminus health indicator expects the client instance.
  get prisma(): PrismaClient {
    return this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
