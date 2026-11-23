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
import { OrderStatusChangeResponseDto } from './dto/order-status-history.dto';
import { OrderWorkflowService } from './order-workflow.service';
import { ORDER_STATUS_ACTOR_ROLES } from './order-status';

@ApiTags('admin-orders')
@ApiBearerAuth('access-token')
@Roles(...ORDER_STATUS_ACTOR_ROLES)
@Controller('admin/orders')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminOrdersController {
  constructor(private readonly workflow: OrderWorkflowService) {}

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
  changeStatus(
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
}
