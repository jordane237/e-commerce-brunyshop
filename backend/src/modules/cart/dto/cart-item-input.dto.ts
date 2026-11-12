import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { MAX_LINE_QUANTITY, MIN_LINE_QUANTITY } from '../cart.constants';

// One requested cart line (CRT-01).
// The body only carries the variant identity and the wanted quantity: no
// price field is ever read from the client and every amount is recomputed on
// the server. `previousUnitPrice` is an optional display hint used solely to
// report PRICE_CHANGED / PROMO_* issues.
export class CartItemInputDto {
  @ApiProperty({ format: 'uuid', description: 'Identifiant de la variante' })
  @IsUUID()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({
    minimum: MIN_LINE_QUANTITY,
    maximum: MAX_LINE_QUANTITY,
    description: 'Quantité souhaitée (1 à 100 par ligne)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_LINE_QUANTITY)
  @Max(MAX_LINE_QUANTITY)
  quantity!: number;

  @ApiPropertyOptional({
    minimum: 0,
    description:
      'Prix unitaire mémorisé côté client. Information seule : jamais utilisé dans un calcul, uniquement pour signaler un écart de prix.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  previousUnitPrice?: number;
}
