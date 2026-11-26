import { ApiProperty } from '@nestjs/swagger';

// One catalogue image. `variantColor` null means the image is shared by every
// colour of the product; otherwise it only belongs to that colour.
export class ProductImageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'URL absolue de l’image' })
  url!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Texte alternatif accessible (null si absent)',
  })
  alt!: string | null;

  @ApiProperty({ description: 'Ordre d’affichage dans la galerie' })
  position!: number;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Couleur de la variante concernée ; null = image commune à toutes les couleurs',
  })
  variantColor!: string | null;
}
