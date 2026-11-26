import { ApiProperty } from '@nestjs/swagger';

export class AdminDeliveryZoneDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Douala Centre' })
  name!: string;

  @ApiProperty({ nullable: true, example: 'Zone couvrant le centre-ville de Douala.' })
  description!: string | null;

  @ApiProperty({ type: [String], example: ['Douala', 'Bonabéri'] })
  cities!: string[];

  @ApiProperty({ description: 'Frais de livraison en XAF entier', example: 1500 })
  fee!: number;

  @ApiProperty({ description: 'Délai estimé en jours ouvrés', example: 1 })
  estimatedDays!: number;

  @ApiProperty({ enum: ['HOME', 'RELAY', 'PICKUP'], isArray: true, example: ['HOME', 'RELAY'] })
  modes!: string[];

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
