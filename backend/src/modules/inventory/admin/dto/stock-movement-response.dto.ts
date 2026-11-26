import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { StockAdjustmentMotif } from '../../../../generated/prisma/client';

export class AdjustStockResponseDto {
  @ApiProperty({ format: 'uuid' })
  variantId!: string;

  @ApiProperty()
  before!: number;

  @ApiProperty()
  after!: number;

  @ApiProperty()
  delta!: number;

  @ApiProperty({ enum: StockAdjustmentMotif })
  motif!: StockAdjustmentMotif;

  @ApiProperty({ format: 'uuid' })
  movementId!: string;

  @ApiProperty()
  adjustedAt!: Date;
}

export class StockMovementItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  variantId!: string;

  @ApiProperty()
  variantSku!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  size!: string;

  @ApiProperty()
  color!: string;

  @ApiProperty()
  delta!: number;

  @ApiProperty()
  reason!: string;

  @ApiPropertyOptional({ enum: StockAdjustmentMotif, nullable: true })
  motif!: StockAdjustmentMotif | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  before!: number;

  @ApiProperty()
  after!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userName!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  orderId!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedStockMovementsDto {
  @ApiProperty({ type: [StockMovementItemDto] })
  data!: StockMovementItemDto[];

  @ApiProperty()
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
