import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CollectCodDto {
  @ApiProperty({ description: 'Montant encaissé (XAF)', minimum: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ description: "Date/heure d'encaissement (ISO). Par défaut : maintenant." })
  @IsOptional()
  @IsDateString()
  collectedAt?: string;
}
