const EMPTY_AMOUNT = '—';
const NO_BREAK_SPACE = '\u00a0';

/**
 * Formate un montant en FCFA selon le glossaire DSG-07 :
 * nombre entier, séparateurs de milliers et espace avant l’unité en U+00A0.
 *
 * `null`, `undefined`, `NaN` et l’infini ne représentent pas un prix affichable
 * et sont remplacés par un tiret cadratin.
 */
export function formatFcfa(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return EMPTY_AMOUNT;

  const formatted = new Intl.NumberFormat('fr-CM', {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(Math.round(amount));

  // Selon l’ICU du navigateur ou du serveur, le séparateur de milliers peut
  // être U+202F ou U+00A0. Le glossaire impose U+00A0 partout.
  const grouped = formatted.replace(/[\s\u00a0\u202f]/g, NO_BREAK_SPACE);
  return `${grouped}${NO_BREAK_SPACE}FCFA`;
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
