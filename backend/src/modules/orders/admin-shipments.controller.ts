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
  ApiBearerAuth,
  ApiBody,
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
import { CollectCodDto } from './dto/collect-cod.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { OrderConfirmationService } from './order-confirmation.service';

@ApiTags('admin-shipments')
@ApiBearerAuth('access-token')
@Roles('LIVREUR', 'ORDER_MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('admin/shipments')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminShipmentsController {
  constructor(private readonly confirmation: OrderConfirmationService) {}

  @Patch(':id/collect-cod')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Enregistrer l'encaissement COD à la livraison (PAY-01)" })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Identifiant UUID de la livraison' })
  @ApiBody({ type: CollectCodDto })
  @ApiOkResponse({ type: ShipmentResponseDto, description: 'Encaissement enregistré' })
  @ApiUnauthorizedResponse({ description: 'UNAUTHORIZED' })
  @ApiForbiddenResponse({ description: 'FORBIDDEN' })
  @ApiNotFoundResponse({ description: 'SHIPMENT_NOT_FOUND' })
  async collectCod(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CollectCodDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<ShipmentResponseDto> {
    return this.confirmation.collectCod(
      id,
      {
        amount: dto.amount,
        ...(dto.collectedAt !== undefined ? { collectedAt: dto.collectedAt } : {}),
      },
      user,
      {
        ...(ip !== undefined ? { ipAddress: ip } : {}),
        ...(userAgent !== undefined ? { userAgent } : {}),
      },
    );
  }
}
