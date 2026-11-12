import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export const MAX_ORDER_LINE_QUANTITY = 100;

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Identifiant de la variante choisie' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  variantId!: string;

  @ApiProperty({ minimum: 1, maximum: 100, description: 'Quantité commandée' })
  @IsInt()
  @Min(1)
  @Max(MAX_ORDER_LINE_QUANTITY)
  quantity!: number;

  // No price field is declared: `forbidNonWhitelisted` rejects any attempt to
  // send unitPrice, total, previousUnitPrice or another client-side amount.
}
