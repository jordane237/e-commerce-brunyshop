import type {
  CartIssueDto,
  CartItemValidationDto,
  CartValidationResponseDto,
} from '@bruny/data-access';

/** Ligne de panier conservée côté navigateur. Aucune donnée personnelle. */
export interface CartLine {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  size: string;
  color: string;
  quantity: number;
  /** Prix au moment de l'ajout : sert uniquement à détecter un écart. */
  unitPriceAtAdd: number;
  imageUrl: string | null;
  imageAlt: string | null;
  addedAt: string;
}

/** Format persisté, versionné pour permettre les migrations futures. */
export interface CartSnapshot {
  version: 1;
  lines: CartLine[];
  updatedAt: string;
}

export type CartValidationIssue = CartIssueDto;

export type ValidatedCartLine = CartItemValidationDto;

export interface CartValidationResult {
  valid: boolean;
  lines: ValidatedCartLine[];
  subtotal: number;
  discount: number;
  total: number;
  issues: CartValidationIssue[];
  validatedAt: string;
}

export const CART_SNAPSHOT_VERSION = 1 as const;
export const CART_STORAGE_KEY = 'brunyshop.cart.v1';
export const LEGACY_CART_STORAGE_KEY = 'bruny-cart-v1';
export const CART_MAX_LINES = 50;
export const CART_MAX_LINE_QUANTITY = 100;

export function toCartValidationResult(response: CartValidationResponseDto): CartValidationResult {
  // Les issues agrégées perdent parfois le détail de quantité. On privilégie
  // donc les issues par ligne, puis on ajoute celles qui ne visent aucune
  // variante (coupon notamment).
  const lineIssues = response.items.flatMap((item) => item.issues);
  const globalIssues = response.issues.filter((issue) => issue.variantId === undefined);

  return {
    valid: response.valid,
    lines: response.items,
    subtotal: response.subtotal,
    discount: response.discount,
    total: response.total,
    issues: [...lineIssues, ...globalIssues],
    validatedAt: response.meta.validatedAt,
  };
}
