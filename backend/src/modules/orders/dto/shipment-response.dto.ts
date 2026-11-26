import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ShipmentStatus } from '../../../generated/prisma/client';

export class ShipmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty({ enum: ShipmentStatus })
  status!: ShipmentStatus;

  @ApiPropertyOptional({ nullable: true })
  deliveredAt?: string | null;

  @ApiProperty()
  codCollected!: boolean;

  @ApiPropertyOptional({ nullable: true })
  codCollectedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  codCollectedBy?: string | null;

  @ApiPropertyOptional({ nullable: true })
  codAmount?: number | null;
}
