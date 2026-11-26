import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SizeGuideEntryDto } from './size-guide-entry.dto';

export class SizeGuideTableDto {
  @ApiPropertyOptional({ type: [SizeGuideEntryDto], description: 'Tableau homme' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SizeGuideEntryDto)
  men?: SizeGuideEntryDto[];

  @ApiPropertyOptional({ type: [SizeGuideEntryDto], description: 'Tableau femme' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SizeGuideEntryDto)
  women?: SizeGuideEntryDto[];

  @ApiPropertyOptional({ type: [SizeGuideEntryDto], description: 'Tableau enfant' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SizeGuideEntryDto)
  kids?: SizeGuideEntryDto[];
}
