import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ALLOWED_IMAGE_MIME_TYPES } from '../../../infrastructure/storage/storage.settings';

const MAX_DECLARED_SIZE = 20 * 1024 * 1024;

export class PresignUploadDto {
  @ApiProperty({ example: 'sneakers-urbanstep-air' })
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Le slug doit être en minuscules, chiffres et tirets.',
  })
  productSlug!: string;

  @ApiPropertyOptional({ example: 'BLEU MARINE' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9À-ÿ][a-zA-Z0-9À-ÿ _-]*$/, {
    message: 'La couleur contient des caractères non autorisés.',
  })
  variantColor?: string;

  @ApiProperty({ enum: ALLOWED_IMAGE_MIME_TYPES, example: 'image/jpeg' })
  @IsIn([...ALLOWED_IMAGE_MIME_TYPES], {
    message: 'Format non autorisé. Formats acceptés : JPEG, PNG, WebP.',
  })
  contentType!: string;

  @ApiProperty({ example: 102400, description: 'Taille annoncée en octets' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_DECLARED_SIZE)
  declaredSize!: number;
}
