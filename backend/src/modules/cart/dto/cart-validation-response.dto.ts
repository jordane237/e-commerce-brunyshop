import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Every discrepancy reported by POST /api/v1/cart/validate (CRT-01).
// Blocking codes make `valid` false; informative codes are listed for the
// client but never invalidate the whole cart.
export enum CartIssueCode {
  PRICE_CHANGED = 'PRICE_CHANGED',
  PROMO_APPLIED = 'PROMO_APPLIED',
  PROMO_EXPIRED = 'PROMO_EXPIRED',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PRODUCT_ARCHIVED = 'PRODUCT_ARCHIVED',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  VARIANT_NOT_FOUND = 'VARIANT_NOT_FOUND',
  QUANTITY_EXCEEDED = 'QUANTITY_EXCEEDED',
  COUPON_INVALID = 'COUPON_INVALID',
  COUPON_MIN_AMOUNT_NOT_REACHED = 'COUPON_MIN_AMOUNT_NOT_REACHED',
}

// Blocking issues: at least one of them makes the cart non-orderable as-is.
// COUPON_MIN_AMOUNT_NOT_REACHED stays informative (the discount is simply 0).
const BLOCKING_ISSUE_CODES: ReadonlySet<CartIssueCode> = new Set([
  CartIssueCode.INSUFFICIENT_STOCK,
  CartIssueCode.OUT_OF_STOCK,
  CartIssueCode.PRODUCT_ARCHIVED,
  CartIssueCode.PRODUCT_NOT_FOUND,
  CartIssueCode.VARIANT_NOT_FOUND,
  CartIssueCode.QUANTITY_EXCEEDED,
  CartIssueCode.COUPON_INVALID,
]);

export function isBlockingIssue(code: CartIssueCode): boolean {
  return BLOCKING_ISSUE_CODES.has(code);
}

export class CartIssueDto {
  @ApiProperty({ enum: CartIssueCode, description: "Code de l'écart" })
  code!: CartIssueCode;

  @ApiProperty({ description: 'Message en français prêt à afficher' })
  message!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Variante concernée' })
  variantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Produit concerné' })
  productId?: string;

  @ApiPropertyOptional({ description: 'Code promo concerné' })
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Quantité demandée par le client' })
  requestedQuantity?: number;

  @ApiPropertyOptional({ description: 'Stock disponible réellement' })
  availableQuantity?: number;

  @ApiPropertyOptional({ description: 'Quantité maximale autorisée par ligne' })
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Prix unitaire mémorisé côté client' })
  previousPrice?: number;

  @ApiPropertyOptional({ description: 'Prix unitaire recalculé côté serveur' })
  currentPrice?: number;

  @ApiPropertyOptional({ description: 'Montant minimum requis par le coupon' })
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Sous-total utilisé pour évaluer le coupon' })
  subtotal?: number;
}

export class CartItemValidationDto {
  @ApiProperty({ format: 'uuid' })
  variantId!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  variantSku!: string;

  @ApiProperty()
  size!: string;

  @ApiProperty()
  color!: string;

  @ApiProperty({ description: 'Quantité retenue (limitée au stock disponible)' })
  quantity!: number;

  @ApiProperty({ description: 'Stock disponible = stock - stock réservé' })
  availableStock!: number;

  @ApiProperty({ description: 'Prix unitaire recalculé côté serveur (XAF)' })
  unitPrice!: number;

  @ApiProperty({ description: 'unitPrice × quantity (XAF)' })
  lineTotal!: number;

  @ApiProperty({ type: [CartIssueDto] })
  issues!: CartIssueDto[];
}

export class CartValidationMetaDto {
  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  validatedAt!: string;

  @ApiProperty({ description: 'Nombre de lignes retournées' })
  itemCount!: number;

  @ApiProperty({ description: 'Somme des quantités retenues' })
  totalQuantity!: number;
}

export class CartValidationResponseDto {
  @ApiProperty({ description: 'false dès qu’au moins une issue bloquante est présente' })
  valid!: boolean;

  @ApiProperty({ type: [CartItemValidationDto] })
  items!: CartItemValidationDto[];

  @ApiProperty({ description: 'Sous-total recalculé (XAF)' })
  subtotal!: number;

  @ApiProperty({ description: 'Remise coupon (XAF)' })
  discount!: number;

  @ApiProperty({ description: 'Total à payer hors livraison (XAF), jamais négatif' })
  total!: number;

  @ApiProperty({ type: [CartIssueDto] })
  issues!: CartIssueDto[];

  @ApiProperty({ type: CartValidationMetaDto })
  meta!: CartValidationMetaDto;
}
