import { ApiProperty } from '@nestjs/swagger';

import { ProductImageDto } from './product-image.dto';

export class ProductCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Sneakers' })
  name!: string;

  @ApiProperty({ example: 'sneakers' })
  slug!: string;
}

export class ProductBrandDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Barrage Foot' })
  name!: string;

  @ApiProperty({ example: 'barrage-foot' })
  slug!: string;

  @ApiProperty({ type: String, nullable: true, description: 'URL du logo de la marque' })
  logo!: string | null;
}

// Compact product card shape, reused by the similar-products section (CAT-03)
// and available to the upcoming catalogue list filters (CAT-02).
export class ProductSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ description: 'Prix de base en XAF (entier)' })
  basePrice!: number;

  @ApiProperty({ description: 'Prix effectif en XAF : promo active, sinon prix de base' })
  effectivePrice!: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Prix promo en XAF si la promotion est active, sinon null',
  })
  promoPrice!: number | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Début de la fenêtre promo (ISO 8601)',
  })
  promoStart!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Fin de la fenêtre promo (ISO 8601)',
  })
  promoEnd!: string | null;

  @ApiProperty({ description: 'true si promoPrice est appliqué à cet instant' })
  isPromoActive!: boolean;

  @ApiProperty({ description: 'true si au moins une variante a du stock disponible' })
  inStock!: boolean;

  @ApiProperty({ type: ProductCategoryDto })
  category!: ProductCategoryDto;

  @ApiProperty({ type: ProductBrandDto })
  brand!: ProductBrandDto;

  @ApiProperty({
    type: [ProductImageDto],
    description: 'Images du produit (la principale au minimum ; toutes sur la fiche détail)',
  })
  images!: ProductImageDto[];
}
