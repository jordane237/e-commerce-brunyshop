import { ApiProperty } from '@nestjs/swagger';
import { SizeGuideTableDto } from './size-guide-table.dto';

export class SizeGuideResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Guide des pointures — Homme, Femme, Enfant' })
  name!: string;

  @ApiProperty({ example: 'guide-pointures-brunyshop' })
  slug!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: SizeGuideTableDto })
  table!: SizeGuideTableDto;

  @ApiProperty({ example: 'v1' })
  version!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
