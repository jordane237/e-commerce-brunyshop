import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PRODUCT_STATUSES, type ProductStatusValue } from './create-product.dto';

export class DuplicateProductDto {
  @ApiPropertyOptional({ example: 'Air Max 90 (copie)' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({
    example: 'air-max-90-copie',
    description: 'Généré depuis le nom s’il est absent (unicité garantie)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Le slug doit être en minuscules, chiffres et tirets.',
  })
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional({
    enum: PRODUCT_STATUSES,
    default: 'DRAFT',
    description: 'Seul DRAFT est accepté : une copie ne peut pas être publiée directement',
  })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatusValue;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  copyImages?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  copyVariants?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Remet le stock des variantes copiées à zéro',
  })
  @IsOptional()
  @IsBoolean()
  resetStock?: boolean;
}
