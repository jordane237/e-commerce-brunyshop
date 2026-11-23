import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { OrderStatus } from '../../../generated/prisma/client';

/** Entrée de l'historique des transitions (ORD-02). */
export class OrderStatusHistoryItemDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ enum: OrderStatus, nullable: true, description: 'Null pour la création' })
  fromStatus!: OrderStatus | null;

  @ApiProperty({ enum: OrderStatus })
  toStatus!: OrderStatus;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  note!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Nom complet de l’acteur' })
  userName!: string | null;

  @ApiProperty({ example: '2026-11-23T15:00:00.000Z' })
  createdAt!: string;
}

/** Réponse de `PATCH /admin/orders/:id/status`. */
export class OrderStatusChangeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'BRN-2611-7K3F' })
  reference!: string;

  @ApiProperty({ enum: OrderStatus })
  previousStatus!: OrderStatus;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ example: '2026-11-23T15:00:00.000Z' })
  changedAt!: string;

  @ApiProperty({
    type: [OrderStatusHistoryItemDto],
    description: 'Historique complet, du plus récent au plus ancien',
  })
  history!: OrderStatusHistoryItemDto[];
}
