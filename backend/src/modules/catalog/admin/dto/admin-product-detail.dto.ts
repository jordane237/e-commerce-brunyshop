import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCT_STATUSES, type ProductStatusValue } from './create-product.dto';

// Réponse admin (CAT-04). Contrairement au DTO public (CAT-03) elle expose le
// stock physique, le stock réservé et le statut : le détail public garde la
// garantie « le stock brut ne sort jamais de l'API ».
export class AdminProductVariantDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'BARRAGEF-AIRMAX90-42-NOIR' })
  sku!: string;

  @ApiProperty({ example: 'NOIR' })
  color!: string;

  @ApiProperty({ example: '42' })
  size!: string;

  @ApiProperty({ type: Number, nullable: true, description: 'Prix spécifique XAF (null sinon)' })
  price!: number | null;

  @ApiProperty({ description: 'Stock physique' })
  stock!: number;

  @ApiProperty({ description: 'Stock réservé par des commandes en cours' })
  reservedStock!: number;

  @ApiProperty({ description: 'Seuil d’alerte de stock bas' })
  lowStockThreshold!: number;

  @ApiProperty({ description: 'Version d’optimistic locking' })
  version!: number;
}

export class AdminProductImageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ type: String, nullable: true })
  alt!: string | null;

  @ApiProperty()
  position!: number;

  @ApiProperty({ type: String, nullable: true, description: 'Couleur concernée (null = commune)' })
  variantColor!: string | null;
}

export class AdminProductCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class AdminProductBrandDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: String, nullable: true })
  logo!: string | null;
}

export class AdminProductDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: PRODUCT_STATUSES })
  status!: ProductStatusValue;

  @ApiProperty({ description: 'Prix de base XAF (entier)' })
  basePrice!: number;

  @ApiProperty({ type: Number, nullable: true })
  promoPrice!: number | null;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  promoStart!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  promoEnd!: string | null;

  @ApiProperty({ description: 'Prix appliqué aujourd’hui (promo active ou prix de base)' })
  effectivePrice!: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  seoTitle!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  seoDescription!: string | null;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @ApiProperty({ format: 'uuid' })
  brandId!: string;

  @ApiProperty({ type: AdminProductCategoryDto })
  category!: AdminProductCategoryDto;

  @ApiProperty({ type: AdminProductBrandDto })
  brand!: AdminProductBrandDto;

  @ApiProperty({ type: String, nullable: true, description: 'Suppression logique (null si actif)' })
  deletedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  @ApiProperty({ type: [AdminProductVariantDto] })
  variants!: AdminProductVariantDto[];

  @ApiProperty({ type: [AdminProductImageDto] })
  images!: AdminProductImageDto[];
}
