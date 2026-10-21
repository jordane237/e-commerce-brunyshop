import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { CatalogService } from './catalog.service';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import type { Request } from 'express';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'Liste paginée du catalogue public' })
  listProducts(@Query() query: ListProductsDto) {
    return this.catalog.listProducts(query);
  }

  @Public()
  @Get('products/:slug')
  @ApiOperation({ summary: 'Détail public d’un produit publié' })
  getProduct(@Param('slug') slug: string) {
    return this.catalog.getProduct(slug);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Catégories ayant des produits publiés' })
  listCategories() {
    return this.catalog.listCategories();
  }

  @Post('admin/products')
  @Roles('ADMIN', 'STOCK_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Création d’un produit en brouillon avec variantes' })
  createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.catalog.createProduct(dto, user.id, request.ip);
  }
}
