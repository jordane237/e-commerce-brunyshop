import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { StockAdjustmentMotif } from '../../../../generated/prisma/client';

export class AdjustStockDto {
  @ApiProperty({ minimum: 0, example: 10, description: 'Nouveau stock cible (>= 0).' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  newStock!: number;

  @ApiProperty({
    enum: StockAdjustmentMotif,
    example: StockAdjustmentMotif.RECEPTION,
    description: 'Motif obligatoire de l’ajustement.',
  })
  @IsEnum(StockAdjustmentMotif)
  motif!: StockAdjustmentMotif;

  @ApiPropertyOptional({ maxLength: 500, description: 'Notes libres (optionnelles).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
