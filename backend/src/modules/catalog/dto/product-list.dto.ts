import { ApiProperty } from '@nestjs/swagger';

import { ProductSummaryDto } from './product-summary.dto';

// Compact variant used by the catalogue cards and the size badges.
// CA #2: availableStock only, never the raw physical stock.
export class ProductVariantSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'BARF-SNEAKERSUR-42-NOIR' })
  sku!: string;

  @ApiProperty({ example: '42' })
  size!: string;

  @ApiProperty({ example: 'NOIR' })
  color!: string;

  @ApiProperty({ description: 'Stock disponible (stock - reservedStock)' })
  availableStock!: number;

  @ApiProperty({ description: 'true si availableStock > 0' })
  isAvailable!: boolean;
}

// Catalogue card: summary + variants (sizes shown on the card).
export class ProductListItemDto extends ProductSummaryDto {
  @ApiProperty({ type: [ProductVariantSummaryDto] })
  variants!: ProductVariantSummaryDto[];
}

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 12 })
  limit!: number;

  @ApiProperty({ example: 20 })
  total!: number;

  @ApiProperty({ example: 2 })
  pages!: number;
}

export class CategoryFacetDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Sneakers' })
  name!: string;

  @ApiProperty({ example: 'sneakers' })
  slug!: string;

  @ApiProperty({ description: 'Nombre de produits publiés dans cette catégorie' })
  count!: number;
}

export class BrandFacetDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Barrage Foot' })
  name!: string;

  @ApiProperty({ example: 'barrage-foot' })
  slug!: string;

  @ApiProperty({ description: 'Nombre de produits publiés de cette marque' })
  count!: number;
}

export class ValueFacetDto {
  @ApiProperty({ example: '42', description: 'Pointure ou couleur' })
  value!: string;

  @ApiProperty({ description: 'Nombre de produits ayant au moins une variante disponible' })
  count!: number;
}

export class AvailabilityFacetDto {
  @ApiProperty({ description: 'Produits avec au moins une variante disponible' })
  inStock!: number;

  @ApiProperty({ description: 'Produits sans aucune variante disponible' })
  outOfStock!: number;
}

export class PromotionFacetDto {
  @ApiProperty({ description: 'Produits avec une promotion active à cet instant' })
  active!: number;

  @ApiProperty({ description: 'Produits sans promotion active' })
  inactive!: number;
}

export class PriceFacetDto {
  @ApiProperty({ description: 'Prix de base minimal des produits publiés (XAF)' })
  min!: number;

  @ApiProperty({ description: 'Prix de base maximal des produits publiés (XAF)' })
  max!: number;
}

// Facets are computed on the whole published catalogue, independently of the
// active filters, so a selected value never makes its own facet disappear.
export class ProductFacetsDto {
  @ApiProperty({ type: [CategoryFacetDto] })
  categories!: CategoryFacetDto[];

  @ApiProperty({ type: [BrandFacetDto] })
  brands!: BrandFacetDto[];

  @ApiProperty({ type: [ValueFacetDto], description: 'Pointures disponibles, triées' })
  sizes!: ValueFacetDto[];

  @ApiProperty({ type: [ValueFacetDto], description: 'Couleurs disponibles' })
  colors!: ValueFacetDto[];

  @ApiProperty({ type: AvailabilityFacetDto })
  availability!: AvailabilityFacetDto;

  @ApiProperty({ type: PromotionFacetDto })
  promotion!: PromotionFacetDto;

  @ApiProperty({ type: PriceFacetDto })
  price!: PriceFacetDto;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductListItemDto] })
  items!: ProductListItemDto[];

  @ApiProperty({ type: PaginationDto })
  pagination!: PaginationDto;

  @ApiProperty({ type: ProductFacetsDto })
  facets!: ProductFacetsDto;
}
