import { ApiProperty } from '@nestjs/swagger';
import type { AdminProductListItemDto } from './admin-product-list-item.dto';

export class PaginatedAdminProductsDto {
  @ApiProperty({ type: [Object] })
  items!: AdminProductListItemDto[];

  @ApiProperty()
  meta!: { total: number; page: number; limit: number; totalPages: number };
}
