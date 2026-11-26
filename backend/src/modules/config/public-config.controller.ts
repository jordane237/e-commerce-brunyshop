import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import type { ApplicationConfig } from '../../config/configuration';
import { PublicConfigDto } from './dto/public-config.dto';

@ApiTags('config')
@Controller('config')
export class PublicConfigController {
  constructor(private readonly config: ConfigService) {}

  // Only the public site key leaves the backend. The Turnstile secret stays in
  // ConfigService and is never serialized by this endpoint.
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Configuration publique (clés publiques uniquement)' })
  @ApiOkResponse({ type: PublicConfigDto })
  @ApiResponse({ status: 429, description: 'Trop de requêtes (60/min/IP)' })
  getPublicConfig(): PublicConfigDto {
    const application = this.config.get<ApplicationConfig>('app');
    if (application === undefined) {
      throw new Error('Application configuration missing.');
    }
    return {
      turnstileEnabled: application.turnstile.enabled,
      turnstileSiteKey: application.turnstile.siteKey,
    };
  }
}
