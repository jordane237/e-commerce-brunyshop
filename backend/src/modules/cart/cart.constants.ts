// Shared limits for POST /cart/validate (CRT-01).
// MAX_CART_ITEMS bounds the request size, MAX_LINE_QUANTITY bounds a single
// cart line (also applied after merging duplicated variant ids).

export const MAX_CART_ITEMS = 50;

export const MIN_LINE_QUANTITY = 1;

export const MAX_LINE_QUANTITY = 100;
