import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// Statuts alignés sur l'enum Prisma ProductStatus.
export const PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export const MAX_VARIANTS = 300;

export class CreateProductVariantDto {
  @ApiProperty({ example: 'NOIR', description: 'Couleur (normalisée en majuscules)' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  color!: string;

  @ApiProperty({ example: '42', description: 'Pointure ou taille (normalisée en majuscules)' })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  size!: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Prix spécifique XAF (sinon prix produit)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @ApiProperty({ minimum: 0, example: 10, description: 'Stock physique initial' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ minimum: 0, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://cdn.brunyshop.cm/products/air-max-noir.jpg' })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: 'Couleur concernée (null = image commune)' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  variantColor?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Air Max 90 Noir' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({
    example: 'air-max-90-noir',
    description: 'Généré depuis le nom s’il est absent (unicité garantie : -2, -3…)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Le slug doit être en minuscules, chiffres et tirets.',
  })
  @MaxLength(180)
  slug?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  description!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  brandId!: string;

  @ApiPropertyOptional({ enum: PRODUCT_STATUSES, default: 'DRAFT' })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatusValue;

  @ApiProperty({ minimum: 0, example: 45000, description: 'Prix de base XAF (entier)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ minimum: 1, description: 'Doit être strictement inférieur à basePrice' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  promoPrice?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  promoStart?: string;

  @ApiPropertyOptional({ format: 'date-time' })
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

  @ApiPropertyOptional({ type: [CreateProductImageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];

  @ApiPropertyOptional({
    type: [CreateProductVariantDto],
    description: 'Format explicite (contrôle fin du stock et du prix par variante)',
  })
  @ValidateIf((dto: CreateProductDto) => dto.colors === undefined && dto.sizes === undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_VARIANTS)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];

  @ApiPropertyOptional({
    type: [String],
    example: ['noir', 'blanc'],
    description: 'Couleurs pour la génération automatique du produit cartésien',
  })
  @ValidateIf((dto: CreateProductDto) => dto.variants === undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['40', '41', '42'],
    description: 'Pointures pour la génération automatique du produit cartésien',
  })
  @ValidateIf((dto: CreateProductDto) => dto.variants === undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  sizes?: string[];
}
