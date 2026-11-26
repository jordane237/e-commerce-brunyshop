import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

import { DELIVERY_MODES } from '../delivery-modes';

export class AdminDeliveryZonesQueryDto {
  @ApiPropertyOptional({ description: 'Recherche sur le nom ou les villes' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: DELIVERY_MODES })
  @IsOptional()
  @IsIn(DELIVERY_MODES)
  mode?: string;

  @ApiPropertyOptional({ description: 'Filtre par ville desservie' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}
