import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackOrderTimelineEntryDto {
  @ApiProperty({ enum: ['PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] })
  status!: string;

  @ApiProperty({ example: 'En préparation' })
  label!: string;

  @ApiProperty({ nullable: true, example: '2026-11-10T14:32:00.000Z' })
  date!: string | null;

  @ApiProperty()
  isCurrent!: boolean;

  @ApiProperty()
  isCompleted!: boolean;
}

export class TrackOrderItemDto {
  @ApiProperty({ example: 'Mocassin Cuir Glacé' })
  name!: string;

  @ApiProperty({ example: '41' })
  size!: string;

  @ApiProperty({ example: 'Noir' })
  color!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ description: 'Prix unitaire (XAF)', example: 24500 })
  unitPrice!: number;

  @ApiProperty({ description: 'Total de la ligne (XAF)', example: 24500 })
  lineTotal!: number;
}

export class TrackOrderOrderDto {
  @ApiProperty({ example: 'BRN-2611-7K3F' })
  reference!: string;

  @ApiProperty({ example: 'PENDING_CONFIRMATION' })
  status!: string;

  @ApiProperty({ example: 'En attente de confirmation' })
  statusLabel!: string;

  @ApiProperty({ type: [TrackOrderItemDto] })
  items!: TrackOrderItemDto[];

  @ApiProperty({ description: 'Sous-total (XAF)', example: 52500 })
  subtotal!: number;

  @ApiProperty({ description: 'Remise (XAF)', example: 0 })
  discount!: number;

  @ApiProperty({ description: 'Frais de livraison (XAF)', example: 0 })
  shippingFee!: number;

  @ApiProperty({ description: 'Total à régler (XAF)', example: 52500 })
  total!: number;

  @ApiProperty({ example: '2026-11-10T14:32:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: [TrackOrderTimelineEntryDto] })
  timeline!: TrackOrderTimelineEntryDto[];

  @ApiPropertyOptional({
    description: 'Ville de livraison uniquement (pas l’adresse complète)',
    example: 'Douala',
  })
  shippingCity?: string;

  @ApiPropertyOptional({
    description: 'Date estimée de livraison (ISO 8601)',
    example: '2026-11-11T14:32:00.000Z',
  })
  estimatedDelivery?: string;
}

export class TrackOrderResponseDto {
  @ApiProperty({ example: false })
  found!: boolean;

  @ApiPropertyOptional({ type: TrackOrderOrderDto })
  order?: TrackOrderOrderDto;
}
