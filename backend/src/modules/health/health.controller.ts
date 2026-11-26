import { Controller, Get, Res, ServiceUnavailableException } from '@nestjs/common';
import type { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
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
//
// @SkipThrottle: probes must answer even when Redis is down (the throttler
// storage itself lives in Redis), and an orchestrator probing every few
// seconds must never trip the global rate limit.
@Public()
@SkipThrottle()
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
  async ready(@Res({ passthrough: true }) res: Response): Promise<unknown> {
    // Readiness: dependencies (database + Redis) must answer.
    try {
      return await this.healthCheckService.check([
        this.prismaHealthIndicator.pingCheck('database', this.prismaService.prisma),
        async (): Promise<HealthIndicatorResult> => this.checkRedis(),
      ]);
    } catch (error) {
      // Terminus v12 signals a failed readiness by throwing
      // ServiceUnavailableException carrying its own result payload
      // (`status: "error"` + failing indicators). Return it as-is so the
      // operator sees which dependency is down, instead of the generic 500
      // body the global filter would otherwise produce.
      if (error instanceof ServiceUnavailableException) {
        const result = error.getResponse();
        res.status(503);
        return typeof result === 'object' && result !== null ? result : { status: 'error' };
      }
      throw error;
    }
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
