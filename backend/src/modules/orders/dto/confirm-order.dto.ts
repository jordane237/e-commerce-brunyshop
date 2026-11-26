import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { OrderConfirmationMethod } from '../../../generated/prisma/client';

export class ConfirmOrderDto {
  @ApiProperty({
    enum: OrderConfirmationMethod,
    description: 'Méthode de confirmation (appel ou WhatsApp)',
  })
  @IsEnum(OrderConfirmationMethod)
  method!: OrderConfirmationMethod;

  @ApiPropertyOptional({ description: 'Notes libres de confirmation', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
