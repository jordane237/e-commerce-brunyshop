import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProductImageDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 255,
    description: 'Texte alternatif ; null efface la valeur.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 32,
    description:
      'Couleur existante du produit (null pour une image commune). Une couleur retirée des variantes reste conservée tant qu’elle n’est pas modifiée.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9À-ÿ][a-zA-Z0-9À-ÿ _-]*$/, {
    message: 'La couleur contient des caractères non autorisés.',
  })
  variantColor?: string | null;
}
