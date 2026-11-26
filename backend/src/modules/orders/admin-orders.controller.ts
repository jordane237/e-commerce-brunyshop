import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { OrderStatusChangeResponseDto } from './dto/order-status-history.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderConfirmationService } from './order-confirmation.service';
import { ORDER_STATUS_ACTOR_ROLES } from './order-status';

@ApiTags('admin-orders')
@ApiBearerAuth('access-token')
@Roles(...ORDER_STATUS_ACTOR_ROLES)
@Controller('admin/orders')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminOrdersController {
  constructor(
    private readonly workflow: OrderWorkflowService,
    private readonly confirmation: OrderConfirmationService,
  ) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Changer le statut d’une commande selon la machine à états (ORD-02)',
    description:
      'La transition doit être autorisée par la table centrale. Le livreur ne peut constater que la livraison (SHIPPED → DELIVERED/DELIVERY_FAILED, DELIVERY_FAILED → SHIPPED). Toute transition interdite renvoie 409 ; un rôle non habilité renvoie 403. Le changement, son historique et son audit sont écrits dans une seule transaction, et une annulation restitue le stock.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identifiant UUID de la commande' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiOkResponse({
    type: OrderStatusChangeResponseDto,
    description: 'Transition appliquée ; historique complet renvoyé',
  })
  @ApiBadRequestResponse({ description: 'Statut cible inconnu (VALIDATION_ERROR)' })
  @ApiUnauthorizedResponse({ description: 'UNAUTHORIZED' })
  @ApiForbiddenResponse({ description: 'FORBIDDEN_STATUS_TRANSITION ou rôle hors périmètre' })
  @ApiNotFoundResponse({ description: 'ORDER_NOT_FOUND' })
  @ApiConflictResponse({
    description: 'INVALID_STATUS_TRANSITION, STALE_ORDER_STATUS ou STOCK_RELEASE_FAILED',
  })
  async changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<OrderStatusChangeResponseDto> {
    return this.workflow.changeStatus(
      id,
      dto,
      { userId: user.id, roles: user.roles },
      {
        ...(ip !== undefined ? { ip } : {}),
        ...(userAgent !== undefined ? { userAgent } : {}),
      },
    );
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles('ORDER_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Confirmer une commande COD (appel ou WhatsApp) (PAY-01)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identifiant UUID de la commande' })
  @ApiBody({ type: ConfirmOrderDto })
  @ApiOkResponse({ type: OrderResponseDto, description: 'Commande confirmée' })
  async confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmOrderDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<OrderResponseDto> {
    return this.confirmation.confirmOrder(
      id,
      { method: dto.method, ...(dto.notes !== undefined ? { notes: dto.notes } : {}) },
      user,
      {
        ...(ip !== undefined ? { ipAddress: ip } : {}),
        ...(userAgent !== undefined ? { userAgent } : {}),
      },
    );
  }
}
