import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
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
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Créer une commande et décrémenter le stock atomiquement',
    description:
      "Les prix sont recalculés côté serveur ; aucun montant client n'est accepté. Le stock est décrémenté dans la même transaction que la commande. Paiement MVP : COD uniquement.",
  })
  @ApiCreatedResponse({
    type: OrderResponseDto,
    description: 'Commande créée, stock décrémenté et mouvement de stock enregistré',
  })
  @ApiBadRequestResponse({
    description: 'Body invalide, guest incomplet, coupon ou zone invalides',
  })
  @ApiConflictResponse({ description: 'Stock insuffisant ou clé d’idempotence en conflit' })
  @ApiNotFoundResponse({ description: 'Variante ou produit introuvable' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes (20/min/IP)' })
  @ApiResponse({ status: 503, description: 'CAPTCHA_UNAVAILABLE (service indisponible)' })
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
  ): Promise<OrderResponseDto> {
    return this.orders.createOrder(dto, user ?? null, {
      ...(request.ip !== undefined ? { ipAddress: request.ip } : {}),
      ...(request.headers['user-agent'] !== undefined
        ? { userAgent: request.headers['user-agent'] }
        : {}),
    });
  }
}
