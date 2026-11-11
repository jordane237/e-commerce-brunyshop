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
