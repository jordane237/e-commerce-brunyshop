import { ApiProperty } from '@nestjs/swagger';

// Flat variant, kept as the add-to-cart fallback: the frontend can pick a
// variant by id without cross-referencing the colour and size groups.
//
// CA #2 — availableStock = stock - reservedStock (never the raw physical
// `stock`). The raw column is internal and must not appear in any payload.
export class ProductVariantDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'BARF-SNEAKERSUR-42-NOIR' })
  sku!: string;

  @ApiProperty({ example: '42' })
  size!: string;

  @ApiProperty({ example: 'NOIR' })
  color!: string;

  @ApiProperty({
    description:
      'Prix effectif en XAF : override de la variante, sinon promo produit active, sinon prix de base',
  })
  effectivePrice!: number;

  @ApiProperty({
    description: 'Stock disponible (stock - reservedStock), jamais le stock brut interne',
  })
  availableStock!: number;

  @ApiProperty({ description: 'true si availableStock > 0' })
  isAvailable!: boolean;
}
