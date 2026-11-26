export interface AdminProductListItemDto {
  id: string;
  name: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  basePrice: number;
  promoPrice: number | null;
  image: { url: string; alt: string | null } | null;
  category: { id: string; name: string };
  brand: { id: string; name: string };
  totalStock: number;
  availableStock: number;
  sku: string | null;
  updatedAt: string;
}
