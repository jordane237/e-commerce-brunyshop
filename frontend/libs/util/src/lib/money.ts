export function formatFcfa(amount: number | null | undefined): string {
  return `${new Intl.NumberFormat('fr-CM', { maximumFractionDigits: 0 }).format(amount ?? 0)} FCFA`;
}

export function effectiveProductPrice(
  product: {
    basePrice: number;
    promoPrice: number | null;
    promoStart: string | Date | null;
    promoEnd: string | Date | null;
  },
  now = new Date(),
): number {
  const starts = product.promoStart
    ? new Date(product.promoStart).getTime()
    : Number.NEGATIVE_INFINITY;
  const ends = product.promoEnd ? new Date(product.promoEnd).getTime() : Number.POSITIVE_INFINITY;
  return product.promoPrice !== null && now.getTime() >= starts && now.getTime() <= ends
    ? product.promoPrice
    : product.basePrice;
}
