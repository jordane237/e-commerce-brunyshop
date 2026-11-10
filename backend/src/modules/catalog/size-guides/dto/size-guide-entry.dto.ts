import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SizeGuideEntryDto {
  @ApiProperty({ example: 42, description: 'Pointure européenne' })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  eu!: number;

  @ApiProperty({ example: 8.5, description: 'Pointure américaine (US)' })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  us!: number;

  @ApiProperty({ example: 8, description: 'Pointure britannique (UK)' })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  uk!: number;

  @ApiProperty({ example: 26.5, description: 'Longueur du pied en centimètres' })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  cm!: number;
}
