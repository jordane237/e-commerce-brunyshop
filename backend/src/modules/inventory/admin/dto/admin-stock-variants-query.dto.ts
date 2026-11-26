import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AdminStockVariantsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrer par catégorie.' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['all', 'out', 'low', 'in_stock'], description: 'Statut de stock.' })
  @IsOptional()
  @IsEnum(['all', 'out', 'low', 'in_stock'])
  stockStatus?: 'all' | 'out' | 'low' | 'in_stock';

  @ApiPropertyOptional({ description: 'Recherche SKU / produit (insensible à la casse).' })
  @IsOptional()
  @IsString()
  search?: string;

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
