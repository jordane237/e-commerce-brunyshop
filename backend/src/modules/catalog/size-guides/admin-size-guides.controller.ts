import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SizeGuideResponseDto } from './dto/size-guide-response.dto';
import { UpdateSizeGuideDto } from './dto/update-size-guide.dto';
import { SizeGuidesService, type SizeGuideActor } from './size-guides.service';

@ApiTags('admin-size-guides')
@ApiBearerAuth('access-token')
@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('admin/size-guides')
export class AdminSizeGuidesController {
  constructor(private readonly sizeGuides: SizeGuidesService) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Mettre à jour un guide des tailles',
    description:
      'Met à jour le nom, la description et/ou les tableaux EU/US/UK/cm. Les tableaux sont triés par EU croissant, les doublons EU sont refusés. Une modification de `table` incrémente la version (v1 → v2) ; un changement de nom seul ne l’incrémente pas. Un audit SIZE_GUIDE_UPDATED (résumé) est écrit et le cache public est invalidé.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Guide mis à jour.', type: SizeGuideResponseDto })
  @ApiBadRequestResponse({
    description: 'Body vide, tableau vide, doublon EU ou entrée invalide (VALIDATION_ERROR).',
  })
  @ApiNotFoundResponse({ description: 'Guide introuvable (SIZE_GUIDE_NOT_FOUND).' })
  @ApiUnauthorizedResponse({
    description: 'Jeton absent, invalide ou expiré (UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED).',
  })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant (FORBIDDEN).' })
  @ApiTooManyRequestsResponse({ description: 'Plus de 30 mises à jour par minute.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSizeGuideDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<SizeGuideResponseDto> {
    return this.sizeGuides.update(id, dto, this.actor(user, ip, userAgent));
  }

  private actor(user: AuthenticatedUser, ip?: string, userAgent?: string): SizeGuideActor {
    return { userId: user.id, ip, userAgent };
  }
}
