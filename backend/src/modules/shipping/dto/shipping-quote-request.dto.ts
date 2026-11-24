import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ShippingQuoteRequestDto {
  @ApiProperty({
    example: 'Douala',
    description: 'Ville pour laquelle le client demande un devis.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Zone choisie dans le tunnel ; si présente, elle doit couvrir la ville.',
  })
  @IsOptional()
  @IsUUID()
  deliveryZoneId?: string;
}
