import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PRODUCT_STATUSES, type ProductStatusValue } from './create-product.dto';

// PATCH ne touche ni aux variantes (PUT /:id/variants) ni aux images : la mise
// à jour est volontairement partielle et n'altère jamais le stock.
export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Le slug doit être en minuscules, chiffres et tirets.',
  })
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ enum: PRODUCT_STATUSES })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatusValue;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  promoPrice?: number;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  promoStart?: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  promoEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;
}
