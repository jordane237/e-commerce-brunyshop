import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { TrackOrderDto } from './dto/track-order.dto';
import { TrackOrderResponseDto } from './dto/track-order-response.dto';
import { OrderTrackingService } from './order-tracking.service';

@ApiTags('orders')
@Controller('orders')
export class OrderTrackingController {
  constructor(private readonly tracking: OrderTrackingService) {}

  @Public()
  @Post('track')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Suivre une commande avec référence + téléphone' })
  @ApiBody({ type: TrackOrderDto })
  @ApiResponse({
    status: 200,
    type: TrackOrderResponseDto,
    description: 'Commande trouvée ou combinaison incorrecte (réponse uniforme)',
  })
  @ApiBadRequestResponse({ description: 'Format invalide (référence ou téléphone)' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives' })
  async track(
    @Body() dto: TrackOrderDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<TrackOrderResponseDto> {
    return this.tracking.track(dto, {
      ...(ip !== undefined ? { ipAddress: ip } : {}),
      ...(userAgent !== undefined ? { userAgent } : {}),
    });
  }
}
