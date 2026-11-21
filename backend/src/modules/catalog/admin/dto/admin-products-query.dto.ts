import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AdminProductsQueryDto {
  @ApiPropertyOptional({ description: 'Recherche (nom, slug, SKU), insensible a la casse.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtre par categorie.' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ['in', 'low', 'out'],
    description: 'in: en stock, low: stock faible, out: rupture.',
  })
  @IsOptional()
  @IsEnum(['in', 'low', 'out'])
  stock?: 'in' | 'low' | 'out';

  @ApiPropertyOptional({ enum: ['updatedAt', 'name', 'price', 'stock'], default: 'updatedAt' })
  @IsOptional()
  @IsEnum(['updatedAt', 'name', 'price', 'stock'])
  sort?: 'updatedAt' | 'name' | 'price' | 'stock';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
