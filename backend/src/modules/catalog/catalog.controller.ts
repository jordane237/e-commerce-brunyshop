import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { ProductSlugParamDto } from './dto/product-slug-param.dto';
import { CatalogService } from './catalog.service';
import { ProductDetailService } from './products/product-detail.service';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import type { Request } from 'express';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly productDetail: ProductDetailService,
  ) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'Liste paginée du catalogue public' })
  listProducts(@Query() query: ListProductsDto) {
    return this.catalog.listProducts(query);
  }

  // Declared after @Get('products') on purpose: the literal list route must
  // keep winning over the :slug wildcard. An e2e test covers the non-regression.
  @Public()
  @Get('products/:slug')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Détail d’un produit publié avec variantes, images par couleur et produits similaires',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug kebab-case du produit publié (minuscules, chiffres et tirets)',
    example: 'sneakers-urbanstep-air',
  })
  @ApiOkResponse({
    type: ProductDetailDto,
    description:
      'availableStock = stock - reservedStock. Le stock brut interne n’est jamais exposé.',
  })
  @ApiNotFoundResponse({
    description:
      'Produit introuvable, en brouillon, archivé ou supprimé : même code PRODUCT_NOT_FOUND, même message.',
  })
  @ApiTooManyRequestsResponse({ description: 'Limite de 100 requêtes par minute et par IP' })
  getProductDetail(@Param() params: ProductSlugParamDto): Promise<ProductDetailDto> {
    return this.productDetail.getProductDetail(params.slug);
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
