import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { DELIVERY_MODES } from '../delivery-modes';

export class UpdateDeliveryZoneDto {
  @ApiPropertyOptional({ example: 'Douala Centre' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Zone couvrant le centre-ville de Douala.', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['Douala', 'Bonabéri'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(80, { each: true })
  cities?: string[];

  @ApiPropertyOptional({
    description: 'Frais de livraison en XAF entier',
    example: 1500,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  fee?: number;

  @ApiPropertyOptional({ description: 'Délai estimé en jours ouvrés', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  estimatedDays?: number;

  @ApiPropertyOptional({ enum: DELIVERY_MODES, isArray: true, example: ['HOME'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(DELIVERY_MODES, { each: true })
  modes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
