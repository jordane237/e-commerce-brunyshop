import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { OrderStatus } from '../../../generated/prisma/client';

/** Corps de `PATCH /admin/orders/:id/status` (ORD-02). */
export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'Statut cible ; la transition doit être autorisée par la machine à états.',
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Motif de la transition (annulation, échec de livraison, retour…)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ description: 'Note libre pour l’historique', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
