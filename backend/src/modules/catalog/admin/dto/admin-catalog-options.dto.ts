import { ApiProperty } from '@nestjs/swagger';

export class AdminCategoryOptionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  parentId!: string | null;
}

export class AdminBrandOptionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class AdminCatalogOptionsDto {
  @ApiProperty({ type: [AdminCategoryOptionDto] })
  categories!: AdminCategoryOptionDto[];

  @ApiProperty({ type: [AdminBrandOptionDto] })
  brands!: AdminBrandOptionDto[];
}
