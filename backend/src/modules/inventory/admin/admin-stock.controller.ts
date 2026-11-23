import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import {
  AdjustStockResponseDto,
  PaginatedStockMovementsDto,
} from './dto/stock-movement-response.dto';
import { AdminStockService } from './admin-stock.service';

@ApiTags('admin-stock')
@ApiBearerAuth('access-token')
@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('admin')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminStockController {
  constructor(private readonly stock: AdminStockService) {}

  @Post('variants/:id/stock-adjust')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Ajuster manuellement le stock d’une variante (motif requis)',
  })
  @ApiParam({ name: 'id', description: 'UUID de la variante', example: 'uuid-variant' })
  @ApiBody({ type: AdjustStockDto })
  @ApiOkResponse({ description: 'Stock ajusté.', type: AdjustStockResponseDto })
  @ApiBadRequestResponse({ description: 'Validation échouée (motif manquant, stock < 0, etc.).' })
  @ApiNotFoundResponse({ description: 'Variante introuvable (VARIANT_NOT_FOUND).' })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant.' })
  @ApiUnauthorizedResponse({ description: 'Jeton absent ou invalide.' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit dépassé.' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AdjustStockResponseDto> {
    return this.stock.adjustStock(id, dto, {
      userId: user.id,
      ip,
      userAgent,
    });
  }

  @Get('stock-movements')
  @ApiOperation({
    summary: 'Historique des mouvements de stock (filtrable par variante et période)',
  })
  @ApiQuery({ name: 'variantId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({
    name: 'motif',
    required: false,
    enum: ['RECEPTION', 'INVENTAIRE', 'CASSE', 'RETOUR', 'AUTRE'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Mouvements paginés.', type: PaginatedStockMovementsDto })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant.' })
  @ApiUnauthorizedResponse({ description: 'Jeton absent ou invalide.' })
  async listMovements(@Query() query: StockMovementQueryDto): Promise<PaginatedStockMovementsDto> {
    return this.stock.listMovements(query);
  }
}
