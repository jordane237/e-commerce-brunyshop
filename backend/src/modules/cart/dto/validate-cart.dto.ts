import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { MAX_CART_ITEMS } from '../cart.constants';
import { CartItemInputDto } from './cart-item-input.dto';

// Request body of POST /api/v1/cart/validate (CRT-01).
// `whitelist` + `forbidNonWhitelisted` reject any undeclared field
// (`unitPrice`, `price`, `total`, `subtotal`, ...) with 400 VALIDATION_ERROR.
export class ValidateCartDto {
  @ApiProperty({ type: [CartItemInputDto], description: 'Lignes du panier (1 à 50)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_CART_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => CartItemInputDto)
  items!: CartItemInputDto[];

  @ApiPropertyOptional({ description: 'Code promo à appliquer (optionnel)', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;
}
