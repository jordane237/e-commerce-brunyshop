import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { TurnstileGuard } from '../../security/turnstile/turnstile.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Guest checkout stays public; OptionalJwtAuthGuard attaches the customer
  // when a valid token is present, so connected orders get userId + movement.
  @Public()
  @UseGuards(OptionalJwtAuthGuard, TurnstileGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Créer une commande et décrémenter le stock atomiquement',
    description:
      "Aucun prix fourni par le client n'est utilisé : tous les montants sont recalculés côté serveur (catalogue, coupon, zone de livraison). L'en-tête Idempotency-Key est obligatoire : un renvoi avec la même clé et le même corps retourne la même commande. CAPTCHA Turnstile obligatoire. Limites : 5 requêtes/min/IP et 10 commandes/heure/téléphone. Paiement MVP : COD uniquement.",
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID v4 unique par tentative de commande',
    schema: { format: 'uuid', example: '6f1c2b9e-3d4a-4c5b-9e8f-0a1b2c3d4e5f' },
  })
  @ApiCreatedResponse({
    type: OrderResponseDto,
    description: 'Commande créée, stock décrémenté et mouvement de stock enregistré',
  })
  @ApiBadRequestResponse({
    description:
      'Body invalide, Idempotency-Key absente ou mal formée, guest incomplet, coupon ou zone invalides, CAPTCHA invalide',
  })
  @ApiConflictResponse({
    description:
      'INSUFFICIENT_STOCK, OUT_OF_STOCK, IDEMPOTENCY_CONFLICT ou ORDER_REFERENCE_CONFLICT',
  })
  @ApiNotFoundResponse({ description: 'Variante ou produit introuvable' })
  @ApiResponse({
    status: 429,
    description: 'RATE_LIMIT_EXCEEDED (5/min/IP) ou ORDER_RATE_LIMIT_EXCEEDED (10/h/téléphone)',
  })
  @ApiResponse({ status: 503, description: 'CAPTCHA_UNAVAILABLE (service indisponible)' })
  create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
  ): Promise<OrderResponseDto> {
    return this.orders.createOrder(dto, parseIdempotencyKey(idempotencyKey), user ?? null, {
      ...(request.ip !== undefined ? { ipAddress: request.ip } : {}),
      ...(request.headers['user-agent'] !== undefined
        ? { userAgent: request.headers['user-agent'] }
        : {}),
    });
  }
}

// The header is the only accepted transport: replaying the same key with a
// different payload is a conflict, so a body field would be ambiguous.
export function parseIdempotencyKey(value: string | undefined): string {
  const key = value?.trim() ?? '';
  if (key === '') {
    throw new BadRequestException({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      message: 'En-tête Idempotency-Key requis (UUID v4).',
    });
  }
  if (!UUID_V4.test(key)) {
    throw new BadRequestException({
      code: 'INVALID_IDEMPOTENCY_KEY',
      message: 'Idempotency-Key doit être un UUID v4.',
    });
  }
  return key;
}
