// admin-products.controller.ts
// Routes d'administration du catalogue (CAT-04) : création, mise à jour,
// archivage, remplacement des variantes et duplication.
//
// RBAC : seul STOCK_MANAGER, ADMIN et SUPER_ADMIN peuvent atteindre ces routes
// (cachier §2). L'authentification et le rate limiting sont gérés globalement ;
// le décorateur @Roles suffit ici.
//
// Audit : l'IP et le user-agent sont transmis au service par le contrôleur pour
// chaque mutation (AUT-08). Le service écrit l'audit dans la même transaction
// que la mutation.

import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import type { DuplicateProductDto } from './dto/duplicate-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { UpdateVariantsDto } from './dto/update-variants.dto';
import { AdminProductsService } from './admin-products.service';
import type { CatalogActor } from './admin-products.service';

@ApiTags('admin-products')
@ApiBearerAuth('access-token')
@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('admin/products')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminProductsController {
  constructor(private readonly admin: AdminProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un produit avec variantes',
    description:
      'Crée un produit en brouillon avec ses variantes. Accepte un tableau explicite `variants[]` ou la génération automatique `colors[]+sizes[]` (produit cartésien, stock initial à 0, SKU générés automatiquement). Chaque création est auditée et invalide le cache public immédiatement.',
  })
  @ApiConflictResponse({
    description:
      'Slug ou SKU déjà utilisé (SLUG_ALREADY_EXISTS, SKU_ALREADY_EXISTS, DUPLICATE_VARIANT).',
  })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant (FORBIDDEN).' })
  @ApiUnauthorizedResponse({ description: 'Token invalide ou absent (UNAUTHENTICATED).' })
  @ApiTooManyRequestsResponse({
    description: 'Plus de 60 requêtes en 60 secondes (RATE_LIMIT_EXCEEDED).',
  })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.admin.create(dto, this.actor(user, ip, userAgent));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un produit',
    description:
      'Met à jour les champs métadonnées, prix, promotion et statut d’un produit. Les variantes ne sont PAS modifiées via cette route (réservé à PUT /:id/variants). Chaque modification de prix est auditée.',
  })
  @ApiNotFoundResponse({ description: 'Produit introuvable (PRODUCT_NOT_FOUND).' })
  @ApiConflictResponse({ description: 'Slug déjà utilisé (SLUG_ALREADY_EXISTS).' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.admin.update(id, dto, this.actor(user, ip, userAgent));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Archiver un produit',
    description:
      'Archive un produit (status = ARCHIVED). Pas de suppression physique : le produit reste en base, il est simplement retiré du catalogue public et des réponses d’administration. Archivé = 204, introuvable = 404.',
  })
  @ApiNotFoundResponse({ description: 'Produit introuvable (PRODUCT_NOT_FOUND).' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<void> {
    await this.admin.archive(id, this.actor(user, ip, userAgent));
  }

  @Put(':id/variants')
  @ApiOperation({
    summary: "Remplacer les variantes d'un produit",
    description:
      "Remplace l'ensemble des variantes d'un produit (upsert différentiel). Une variante existante identifiée par `id` est mise à jour ; une variante sans `id` est créée avec un SKU généré automatiquement. Les variantes existantes non présentes dans le payload sont supprimées, sauf si elles sont liées à une commande (409 VARIANT_HAS_ORDERS). Chaque changement de stock ou de prix est audité.",
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du produit.',
    example: 'a1b2c3d4-0000-4000-8000-000000000001',
  })
  @ApiNotFoundResponse({ description: 'Produit introuvable (PRODUCT_NOT_FOUND).' })
  @ApiConflictResponse({
    description:
      'Variante liée à une commande (VARIANT_HAS_ORDERS) ou doublon de couleur/pointure (DUPLICATE_VARIANT).',
  })
  async updateVariants(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVariantsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.admin.replaceVariants(id, dto, this.actor(user, ip, userAgent));
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Dupliquer un produit',
    description:
      'Crée une copie en brouillon (DRAFT) du produit source : mêmes catégorie, marque, description, prix, promotions et variantes, avec de nouveaux slugs et SKU générés automatiquement. Les images sont réutilisées (mêmes URLs, pas de duplication physique). Le statut fourni est ignoré et la copie est toujours en DRAFT.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant UUID du produit source.',
    example: 'a1b2c3d4-0000-4000-8000-000000000001',
  })
  @ApiNotFoundResponse({ description: 'Produit source introuvable (PRODUCT_NOT_FOUND).' })
  @ApiConflictResponse({
    description: 'Slug déjà utilisé (SLUG_ALREADY_EXISTS).',
  })
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateProductDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.admin.duplicate(id, dto, this.actor(user, ip, userAgent));
  }

  // ----------------------------------------------------------------------- privé

  private actor(user: AuthenticatedUser, ip?: string, userAgent?: string): CatalogActor {
    return { userId: user.id, ip, userAgent };
  }
}
