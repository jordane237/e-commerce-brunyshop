// Formatting helpers for cart validation messages (CRT-01).
// Amounts are integer XAF (RG-PRX-01); French grouping keeps messages readable
// for the storefront while never being used in any calculation.

const xafFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatXaf(amount: number): string {
  return `${xafFormatter.format(amount)} FCFA`;
}
