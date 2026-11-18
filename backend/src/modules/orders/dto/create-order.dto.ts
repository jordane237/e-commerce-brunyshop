import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
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

/** Contexte d'acquisition marketing, stocké dans `Order.source` (Json). */
export class CreateOrderSourceDto {
  @ApiPropertyOptional({ description: 'utm_source', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional({ description: 'utm_medium', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  medium?: string;

  @ApiPropertyOptional({ description: 'utm_campaign', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  campaign?: string;

  @ApiPropertyOptional({ description: 'utm_term', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  term?: string;

  @ApiPropertyOptional({ description: 'utm_content', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  content?: string;

  @ApiPropertyOptional({ description: 'Identifiant Google Ads', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  gclid?: string;

  @ApiPropertyOptional({ description: 'Identifiant Facebook Ads', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fbclid?: string;

  @ApiPropertyOptional({ description: 'Date de capture (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  capturedAt?: string;
}

/**
 * Corps de `POST /orders`.
 *
 * Aucun montant n'est accepté : `forbidNonWhitelisted` rejette `unitPrice`,
 * `total`, `subtotal`, `shippingFee`, etc. (CA #2). La clé d'idempotence vit
 * dans l'en-tête `Idempotency-Key`, pas dans le corps (CA #1).
 */
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

  @ApiPropertyOptional({
    description: 'Zone de livraison choisie en P10. Si absente, la zone est résolue par la ville.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deliveryZoneId?: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Moyen de paiement. Seul COD est disponible dans le MVP.',
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Note du client pour la préparation', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    type: CreateOrderSourceDto,
    description: 'Contexte d’acquisition (UTM, clics publicitaires) capturé côté boutique',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderSourceDto)
  source?: CreateOrderSourceDto;

  // Optional so TurnstileGuard can return CAPTCHA_REQUIRED before validation.
  @ApiPropertyOptional({ description: 'Jeton Cloudflare Turnstile' })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;

  // Honeypot: a real browser leaves it empty. Any value fails validation.
  @ApiPropertyOptional({ description: 'Champ piège anti-bot (doit rester vide)' })
  @IsOptional()
  @IsString()
  @MaxLength(0)
  _honey?: string;
}
