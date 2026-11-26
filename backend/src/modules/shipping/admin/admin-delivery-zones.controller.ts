import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminDeliveryZoneDto } from './dto/admin-delivery-zone.dto';
import { AdminDeliveryZonesQueryDto } from './dto/admin-delivery-zones-query.dto';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { AdminDeliveryZonesService, type DeliveryZoneActor } from './admin-delivery-zones.service';

@ApiTags('admin-delivery-zones')
@ApiBearerAuth('access-token')
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/delivery-zones')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminDeliveryZonesController {
  constructor(private readonly service: AdminDeliveryZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les zones de livraison (administration)' })
  @ApiOkResponse({ type: [AdminDeliveryZoneDto] })
  list(@Query() query: AdminDeliveryZonesQueryDto): Promise<AdminDeliveryZoneDto[]> {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une zone de livraison' })
  @ApiOkResponse({ type: AdminDeliveryZoneDto })
  @ApiNotFoundResponse({ description: 'Zone introuvable (DELIVERY_ZONE_NOT_FOUND).' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminDeliveryZoneDto> {
    return this.service.get(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une zone de livraison' })
  @ApiCreatedResponse({ type: AdminDeliveryZoneDto })
  async create(
    @Body() dto: CreateDeliveryZoneDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AdminDeliveryZoneDto> {
    return this.service.create(dto, this.actor(user, ip, userAgent));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une zone de livraison' })
  @ApiOkResponse({ type: AdminDeliveryZoneDto })
  @ApiNotFoundResponse({ description: 'Zone introuvable (DELIVERY_ZONE_NOT_FOUND).' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryZoneDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AdminDeliveryZoneDto> {
    return this.service.update(id, dto, this.actor(user, ip, userAgent));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une zone de livraison non utilisée' })
  @ApiNoContentResponse({ description: 'Zone supprimée.' })
  @ApiNotFoundResponse({ description: 'Zone introuvable (DELIVERY_ZONE_NOT_FOUND).' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<void> {
    await this.service.remove(id, this.actor(user, ip, userAgent));
  }

  private actor(user: AuthenticatedUser, ip?: string, userAgent?: string): DeliveryZoneActor {
    return { userId: user.id, ip, userAgent };
  }
}
