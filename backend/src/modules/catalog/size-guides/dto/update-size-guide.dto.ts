import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SizeGuideTableDto } from './size-guide-table.dto';

export class UpdateSizeGuideDto {
  @ApiPropertyOptional({ maxLength: 100, example: 'Guide des pointures 2027' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: SizeGuideTableDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SizeGuideTableDto)
  table?: SizeGuideTableDto;
}
