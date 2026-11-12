import { ApiProperty } from '@nestjs/swagger';

import { ColorVariantDto } from './color-variant.dto';
import { ProductSummaryDto } from './product-summary.dto';
import { ProductVariantDto } from './product-variant.dto';
import { SizeVariantDto } from './size-variant.dto';

// GET /api/v1/products/:slug payload (CAT-03).
//
// Stock rule (CA #2): only `availableStock` (= stock - reservedStock) is
// exposed, at every level. The raw physical `stock` column never leaves the
// API — an e2e test asserts the serialized response contains no `stock` key.
export class ProductDetailDto extends ProductSummaryDto {
  @ApiProperty({ description: 'Description complète affichée sur la fiche produit' })
  description!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Titre SEO (null si absent)' })
  seoTitle!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Description SEO (null si absente)' })
  seoDescription!: string | null;

  @ApiProperty({
    type: [ColorVariantDto],
    description: 'Variantes groupées par couleur, avec images et pointures disponibles',
  })
  colors!: ColorVariantDto[];

  @ApiProperty({
    type: [SizeVariantDto],
    description: 'Pointures agrégées toutes couleurs confondues',
  })
  sizes!: SizeVariantDto[];

  @ApiProperty({ type: [ProductVariantDto], description: 'Toutes les variantes à plat' })
  variants!: ProductVariantDto[];

  @ApiProperty({
    type: [ProductSummaryDto],
    description:
      'Produits similaires : même catégorie, prix effectif à ±50 %, 6 par défaut (fallback même catégorie sans contrainte de prix)',
  })
  similarProducts!: ProductSummaryDto[];
}
