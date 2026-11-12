// Actions d'audit du catalogue (CAT-04).
// `AuditLog.action` est une colonne texte libre (AUT-08) : cette union typée
// évite les fautes de frappe sans imposer de migration d'enum Prisma.
export const CATALOG_AUDIT_ACTIONS = {
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_PRICE_UPDATED: 'PRODUCT_PRICE_UPDATED',
  PRODUCT_STOCK_UPDATED: 'PRODUCT_STOCK_UPDATED',
  PRODUCT_STATUS_UPDATED: 'PRODUCT_STATUS_UPDATED',
  PRODUCT_ARCHIVED: 'PRODUCT_ARCHIVED',
  PRODUCT_DUPLICATED: 'PRODUCT_DUPLICATED',
  PRODUCT_VARIANTS_UPDATED: 'PRODUCT_VARIANTS_UPDATED',
} as const;

export type CatalogAuditAction = (typeof CATALOG_AUDIT_ACTIONS)[keyof typeof CATALOG_AUDIT_ACTIONS];
