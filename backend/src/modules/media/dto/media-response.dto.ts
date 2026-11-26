import { ApiProperty } from '@nestjs/swagger';

export class PresignResponseDto {
  @ApiProperty({ description: 'URL signée pour PUT direct vers le stockage' })
  uploadUrl!: string;

  @ApiProperty({ description: 'Clé de stockage à confirmer' })
  key!: string;

  @ApiProperty({ description: 'URL publique prévisionnelle' })
  publicUrl!: string;

  @ApiProperty({ example: 300 })
  expiresIn!: number;

  @ApiProperty({ enum: ['PUT'] })
  method!: 'PUT';

  @ApiProperty({ example: { 'Content-Type': 'image/jpeg' } })
  headers!: Record<string, string>;
}

export class MediaImageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'URL publique de la version WebP' })
  url!: string;

  @ApiProperty({ description: 'URL publique de la vignette WebP' })
  thumbnailUrl!: string;

  @ApiProperty({ type: String, nullable: true })
  alt!: string | null;

  @ApiProperty()
  position!: number;

  @ApiProperty({ type: String, nullable: true })
  variantColor!: string | null;
}

export class ReorderResponseDto {
  @ApiProperty({ example: 4 })
  updated!: number;
}

export class MediaConfigDto {
  @ApiProperty({ example: 5242880, description: 'Taille maximale réelle par fichier' })
  maxFileSizeBytes!: number;

  @ApiProperty({ example: 10, description: 'Nombre maximal d’images par produit' })
  maxImagesPerProduct!: number;

  @ApiProperty({ example: 300, description: 'Durée de validité d’une URL signée en secondes' })
  presignExpiresSeconds!: number;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/webp'], isArray: true })
  allowedMimeTypes!: string[];
}
