import { ApiProperty } from '@nestjs/swagger';

import { ProductImageDto } from './product-image.dto';

// One colour of the product: its images (specific first, then the shared ones)
// and the sizes still purchasable in that colour. Grouped server-side so the
// product page (P04) renders the colour selector without recomputing anything.
export class ColorVariantDto {
  @ApiProperty({ example: 'NOIR', description: 'Libellé de la couleur tel que stocké' })
  color!: string;

  @ApiProperty({ example: 'noir', description: 'Slug kebab-case de la couleur' })
  slug!: string;

  @ApiProperty({
    type: [ProductImageDto],
    description: 'Images spécifiques à la couleur, puis les images communes (variantColor null)',
  })
  images!: ProductImageDto[];

  @ApiProperty({
    type: [String],
    example: ['40', '41'],
    description: 'Pointures avec du stock disponible pour cette couleur',
  })
  availableSizes!: string[];

  @ApiProperty({ description: 'true si au moins une pointure est disponible dans cette couleur' })
  hasStock!: boolean;
}
