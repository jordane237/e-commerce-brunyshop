import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Booleans stay strings on purpose: the global ValidationPipe enables implicit
// conversion, and `enableImplicitConversion` turns "false" into `true`
// (Boolean("false") === true). An explicit enum keeps `inStock=false` correct
// and still rejects anything else with 400 VALIDATION_ERROR.
export type BooleanQuery = 'true' | 'false';

export class ListProductsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 48, default: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  limit = 12;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['newest', 'price_asc', 'price_desc', 'name'] })
  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc', 'name'])
  sort: 'newest' | 'price_asc' | 'price_desc' | 'name' = 'newest';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Slug de marque' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description: 'true = au moins une variante disponible, false = aucune',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  inStock?: BooleanQuery;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description: 'true = promotion produit active à cet instant',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  promo?: BooleanQuery;
}
