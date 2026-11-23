import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { StockAdjustmentMotif } from '../../../../generated/prisma/client';

export class StockMovementQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrer par variante.' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601, inclus).' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601, inclus).' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: StockAdjustmentMotif, description: 'Filtrer par motif.' })
  @IsOptional()
  @IsEnum(StockAdjustmentMotif)
  motif?: StockAdjustmentMotif;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
