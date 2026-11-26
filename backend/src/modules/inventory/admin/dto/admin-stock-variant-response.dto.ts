import { ApiProperty } from '@nestjs/swagger';

export class AdminStockVariantDto {
  @ApiProperty() variantId!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() productSlug!: string;
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() size!: string;
  @ApiProperty() color!: string;
  @ApiProperty() stock!: number;
  @ApiProperty() reservedStock!: number;
  @ApiProperty() availableStock!: number;
  @ApiProperty() lowStockThreshold!: number;
  @ApiProperty({ enum: ['OUT', 'LOW', 'IN_STOCK'] }) stockStatus!: 'OUT' | 'LOW' | 'IN_STOCK';
}

export class PaginatedAdminStockVariantsDto {
  @ApiProperty({ type: [AdminStockVariantDto] }) data!: AdminStockVariantDto[];
  @ApiProperty() meta!: { total: number; page: number; limit: number; totalPages: number };
}
