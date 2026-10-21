import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  sku!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(40)
  color!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  size!: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock = 0;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10000)
  description!: string;

  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiProperty()
  @IsString()
  brandId!: string;

  @ApiProperty({ minimum: 0, description: 'Montant entier en FCFA' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ type: [CreateProductVariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants!: CreateProductVariantDto[];
}
