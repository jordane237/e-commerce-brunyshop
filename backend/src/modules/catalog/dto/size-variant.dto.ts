import { ApiProperty } from '@nestjs/swagger';

// Size aggregate across every colour, for the global size selector on the
// product page (P04).
export class SizeVariantDto {
  @ApiProperty({ example: '42', description: 'Pointure' })
  size!: string;

  @ApiProperty({
    description:
      'Stock disponible (stock - reservedStock) maximal parmi les variantes de cette pointure. Le stock brut interne n’est jamais exposé.',
  })
  availableStock!: number;

  @ApiProperty({ description: 'true si availableStock > 0' })
  isAvailable!: boolean;

  @ApiProperty({
    description:
      'true si 0 < availableStock <= lowStockThreshold (seuil le plus bas de la pointure)',
  })
  isLowStock!: boolean;
}
