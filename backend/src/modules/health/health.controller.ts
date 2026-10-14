import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HealthIndicatorService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/database/database.module';
import { RedisService } from '../../infrastructure/cache/cache.module';
import { Public } from '../../common/decorators/public.decorator';

// Liveness/readiness answer unauthenticated: Docker healthchecks and probes
// cannot carry a token.
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get('live')
  @HealthCheck()
  async live(): Promise<unknown> {
    // Liveness: the process itself is up and serving requests.
    return this.healthCheckService.check([
      (): HealthIndicatorResult => this.healthIndicatorService.check('app').up(),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  async ready(): Promise<unknown> {
    // Readiness: dependencies (database + Redis) must answer.
    return this.healthCheckService.check([
      this.prismaHealthIndicator.pingCheck('database', this.prismaService.prisma),
      async (): Promise<HealthIndicatorResult> => this.checkRedis(),
    ]);
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redisService.redis.ping();
      return this.healthIndicatorService.check('redis').up();
    } catch {
      return this.healthIndicatorService.check('redis').down({ message: 'redis unreachable' });
    }
  }
}
