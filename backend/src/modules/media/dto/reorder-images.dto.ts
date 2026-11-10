import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderImageItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ minimum: 0, example: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderImagesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ type: [ReorderImageItemDto] })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReorderImageItemDto)
  order!: ReorderImageItemDto[];
}
