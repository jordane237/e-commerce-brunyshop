import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MAX_VARIANTS } from './create-product.dto';

// PUT /admin/products/:id/variants remplace l'ensemble des variantes.
// `reservedStock` n'est jamais accepté : il est maintenu par les réservations
// de commande (whitelist du ValidationPipe → 400 si le champ est envoyé).
export class UpdateProductVariantDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Variante existante à mettre à jour' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'NOIR' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  color!: string;

  @ApiProperty({ example: '42' })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  size!: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Prix spécifique XAF (null = prix produit)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @ApiProperty({ minimum: 0, description: 'Stock physique (seule quantité modifiable)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  // Interdit explicitement : maintenu par les réservations (checkout).
  @IsEmpty({ message: 'reservedStock n’est pas modifiable.' })
  reservedStock?: unknown;
}

export class UpdateVariantsDto {
  @ApiProperty({ type: [UpdateProductVariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_VARIANTS)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants!: UpdateProductVariantDto[];
}
