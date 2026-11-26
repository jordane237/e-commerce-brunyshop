import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingQuoteZoneDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Douala Centre' })
  name!: string;

  @ApiProperty({ description: 'Frais de livraison en XAF entier', example: 1500 })
  fee!: number;

  @ApiProperty({ description: 'Délai estimé en jours ouvrés', example: 1 })
  estimatedDays!: number;

  @ApiProperty({ enum: ['HOME', 'RELAY', 'PICKUP'], isArray: true, example: ['HOME'] })
  modes!: string[];
}

export class ShippingQuoteWhatsAppDto {
  @ApiProperty({ example: '+237679176296' })
  phone!: string;

  @ApiProperty({ example: 'https://wa.me/237679176296?text=...' })
  url!: string;

  @ApiProperty({
    example: 'Bonjour, je souhaite savoir si la livraison est disponible pour Douala.',
  })
  message!: string;
}

export class ShippingQuoteDto {
  @ApiProperty({ description: 'Indique si la livraison est disponible pour la ville.' })
  available!: boolean;

  @ApiProperty({ example: 'Douala' })
  city!: string;

  @ApiPropertyOptional({ type: () => ShippingQuoteZoneDto, nullable: true })
  zone: ShippingQuoteZoneDto | null = null;

  @ApiPropertyOptional({
    description: 'Frais de livraison en XAF entier',
    nullable: true,
    example: 1500,
  })
  fee: number | null = null;

  @ApiPropertyOptional({ description: 'Délai estimé en jours ouvrés', nullable: true, example: 1 })
  estimatedDays: number | null = null;

  @ApiProperty({ enum: ['HOME', 'RELAY', 'PICKUP'], isArray: true, example: ['HOME'] })
  modes: string[] = [];

  @ApiPropertyOptional({ nullable: true })
  message: string | null = null;

  @ApiPropertyOptional({ type: () => ShippingQuoteWhatsAppDto, nullable: true })
  whatsapp: ShippingQuoteWhatsAppDto | null = null;

  @ApiPropertyOptional({ nullable: true })
  whatsappUrl: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  whatsappMessage: string | null = null;

  @ApiPropertyOptional({ nullable: true })
  whatsappPhone: string | null = null;
}
