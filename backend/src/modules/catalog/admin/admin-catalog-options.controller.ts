import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminCatalogOptionsService } from './admin-catalog-options.service';
import { AdminCatalogOptionsDto } from './dto/admin-catalog-options.dto';

@ApiTags('admin-catalog')
@ApiBearerAuth('access-token')
@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('admin/catalog')
export class AdminCatalogOptionsController {
  constructor(private readonly options: AdminCatalogOptionsService) {}

  @Get('options')
  @ApiOperation({ summary: 'Catégories et marques disponibles pour le formulaire produit' })
  @ApiOkResponse({ description: 'Options de saisie.', type: AdminCatalogOptionsDto })
  @ApiUnauthorizedResponse({ description: 'Jeton absent, invalide ou expiré.' })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant (FORBIDDEN).' })
  getOptions(): Promise<AdminCatalogOptionsDto> {
    return this.options.getOptions();
  }
}
