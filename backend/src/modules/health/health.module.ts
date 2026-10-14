import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule, PrismaService } from '../../infrastructure/database/database.module';
import { CacheModule, RedisService } from '../../infrastructure/cache/cache.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule.forRoot(), DatabaseModule, CacheModule],
  controllers: [HealthController],
  providers: [PrismaService, RedisService],
})
export class HealthModule {}
