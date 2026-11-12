import { ApiProperty } from '@nestjs/swagger';

import { PaymentMethod } from '../../../generated/prisma/client';

export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'BRN-2611-7K3F' })
  reference!: string;

  @ApiProperty({ enum: ['PENDING_CONFIRMATION'] })
  status!: string;

  @ApiProperty({ enum: ['PENDING'] })
  paymentStatus!: string;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @ApiProperty({ description: 'Sous-total (XAF)' })
  subtotal!: number;

  @ApiProperty({ description: 'Remise (XAF)' })
  discount!: number;

  @ApiProperty({ description: 'Frais de livraison (XAF)' })
  shippingFee!: number;

  @ApiProperty({ description: 'Total à payer (XAF)' })
  total!: number;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  createdAt!: string;
}
