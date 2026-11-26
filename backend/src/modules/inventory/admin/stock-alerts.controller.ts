import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../../../common/decorators/roles.decorator';
import { StockAlertsQueryDto } from './dto/stock-alerts-query.dto';
import { StockAlertsService } from './stock-alerts.service';

@ApiTags('admin-stock')
@ApiBearerAuth('access-token')
@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'ORDER_MANAGER')
@Controller('admin/stock')
export class StockAlertsController {
  constructor(private readonly alerts: StockAlertsService) {}

  @Get('alerts')
  @ApiOperation({
    summary: 'Lister les variantes en stock bas ou en rupture',
    description:
      'Liste paginée des variantes publiées dont le stock disponible (stock - réservé) est inférieur ou égal au seuil. Le seuil de la variante est utilisé par défaut ; le paramètre `threshold` permet de forcer un seuil global pour la consultation.',
  })
  @ApiOkResponse({ description: 'Alertes paginées avec compteurs LOW/OUT.' })
  @ApiUnauthorizedResponse({ description: 'Jeton absent ou invalide.' })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant.' })
  list(@Query() query: StockAlertsQueryDto) {
    return this.alerts.list(query);
  }
}
