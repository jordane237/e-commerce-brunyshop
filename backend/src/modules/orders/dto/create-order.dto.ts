import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { PaymentMethod } from '../../../generated/prisma/client';
import { AddressSnapshotDto } from './address-snapshot.dto';
import { CreateOrderItemDto } from './create-order-item.dto';

const CAMEROON_PHONE = /^\+237[0-9]{9}$/;

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto], description: 'Lignes de la commande (1 à 50)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Code promo à appliquer', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Nom du client invité', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  guestName?: string;

  @ApiPropertyOptional({ description: 'Téléphone du client invité (+237XXXXXXXXX)' })
  @IsOptional()
  @IsString()
  @Matches(CAMEROON_PHONE, { message: 'Le téléphone doit être au format +237XXXXXXXXX.' })
  guestPhone?: string;

  @ApiProperty({ type: AddressSnapshotDto })
  @ValidateNested()
  @Type(() => AddressSnapshotDto)
  address!: AddressSnapshotDto;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Moyen de paiement. Seul COD est disponible dans le MVP.',
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Clé d’idempotence contre les doubles soumissions' })
  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}
