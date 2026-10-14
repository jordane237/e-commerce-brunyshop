import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../../generated/prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly client: PrismaClient;

  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    this.client = new PrismaClient({ adapter } satisfies Prisma.PrismaClientOptions);
  }

  get prisma(): PrismaClient {
    return this.client;
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }
}

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
