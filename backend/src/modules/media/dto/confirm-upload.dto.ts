import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty({
    example: 'products/sneakers-urbanstep-air/noir/6f1c...e2.webp',
    description: 'Clé retournée par /admin/media/presign',
  })
  @IsString()
  @MaxLength(512)
  @Matches(/^products\/[a-z0-9-]+\/(?:common|[a-z0-9-]+)\/[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/, {
    message: 'Clé de stockage invalide.',
  })
  key!: string;

  @ApiProperty({ example: 'sneakers-urbanstep-air' })
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  productSlug!: string;

  @ApiPropertyOptional({ example: 'noir' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  variantColor?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  position?: number;

  @ApiPropertyOptional({ maxLength: 255, example: 'Vue de profil' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;
}
