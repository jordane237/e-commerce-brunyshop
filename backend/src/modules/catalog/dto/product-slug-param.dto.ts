import { ApiProperty } from '@nestjs/swagger';
import { Matches, MaxLength } from 'class-validator';

// Route param validated by the global ValidationPipe: an invalid slug is a
// 400 VALIDATION_ERROR, not a database lookup.
export class ProductSlugParamDto {
  @ApiProperty({ example: 'sneakers-urbanstep-air' })
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Le slug doit être en kebab-case (minuscules, chiffres et tirets).',
  })
  slug!: string;
}
