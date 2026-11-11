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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import {
  MediaImageResponseDto,
  PresignResponseDto,
  ReorderResponseDto,
} from './dto/media-response.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { MediaService, type MediaActor } from './media.service';

@ApiTags('admin-media')
@ApiBearerAuth('access-token')
@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Obtenir une URL signée pour téléverser une image',
    description:
      "Approche presign + confirm : le client PUT directement le fichier sur MinIO/S3 via l'URL signée, puis appelle /admin/media/confirm. Le Content-Type et la taille déclarés ici ne sont jamais considérés comme une validation : le confirm re-télécharge le fichier et vérifie les magic bytes et la taille réelles. Le fichier est renommé (UUID) et stocké hors de tout dossier exécutable.",
  })
  @ApiOkResponse({ description: 'URL signée générée.', type: PresignResponseDto })
  @ApiBadRequestResponse({
    description:
      'Type MIME, taille, quota d’images ou clé invalides (INVALID_IMAGE_TYPE, FILE_TOO_LARGE, MAX_IMAGES_REACHED).',
  })
  @ApiNotFoundResponse({ description: 'Produit introuvable (PRODUCT_NOT_FOUND).' })
  @ApiUnauthorizedResponse({
    description: 'Jeton absent, invalide ou expiré (UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED).',
  })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant (FORBIDDEN).' })
  @ApiTooManyRequestsResponse({
    description: 'Plus de 30 presigns en 60 secondes (RATE_LIMIT_EXCEEDED).',
  })
  async presign(
    @Body() dto: PresignUploadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<PresignResponseDto> {
    return this.media.presignUpload(dto, this.actor(user, ip, userAgent));
  }

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Valider et traiter une image téléversée',
    description:
      'Télécharge le fichier brut depuis le stockage, valide son type réel via file-type (JPEG/PNG/WebP uniquement), sa taille et son décodage sharp, puis génère un JPEG optimisé, un WebP et une vignette 400×400. Le fichier brut est supprimé et un ProductImage est créé. Un fichier non image est refusé avec INVALID_IMAGE_TYPE.',
  })
  @ApiCreatedResponse({ description: 'Image traitée et enregistrée.', type: MediaImageResponseDto })
  @ApiBadRequestResponse({
    description:
      'Fichier refusé (INVALID_IMAGE_TYPE, FILE_TOO_LARGE, INVALID_IMAGE, MAX_IMAGES_REACHED, INVALID_MEDIA_KEY).',
  })
  @ApiNotFoundResponse({
    description: 'Produit ou fichier téléversé introuvable (PRODUCT_NOT_FOUND, MEDIA_NOT_FOUND).',
  })
  @ApiUnauthorizedResponse({
    description: 'Jeton absent, invalide ou expiré (UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED).',
  })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant (FORBIDDEN).' })
  async confirm(
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<MediaImageResponseDto> {
    return this.media.confirmUpload(dto, this.actor(user, ip, userAgent));
  }

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une image produit',
    description:
      'Supprime les trois versions stockées (JPEG optimisé, WebP, vignette), la ligne ProductImage, écrit un audit et invalide le cache public.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Image supprimée.' })
  @ApiNotFoundResponse({ description: 'Image introuvable (IMAGE_NOT_FOUND).' })
  @ApiUnauthorizedResponse({
    description: 'Jeton absent, invalide ou expiré (UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED).',
  })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant (FORBIDDEN).' })
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<void> {
    await this.media.deleteImage(id, this.actor(user, ip, userAgent));
  }

  @Patch('images/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réorganiser les images d’un produit',
    description:
      'Met à jour les positions dans une transaction après vérification que toutes les images appartiennent au produit. Audit MEDIA_REORDERED et invalidation du cache.',
  })
  @ApiOkResponse({ description: 'Positions mises à jour.', type: ReorderResponseDto })
  @ApiBadRequestResponse({
    description: 'Ordre invalide ou image étrangère au produit (INVALID_IMAGE_ORDER).',
  })
  @ApiNotFoundResponse({ description: 'Produit introuvable (PRODUCT_NOT_FOUND).' })
  @ApiUnauthorizedResponse({
    description: 'Jeton absent, invalide ou expiré (UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED).',
  })
  @ApiForbiddenResponse({ description: 'Rôle insuffisant (FORBIDDEN).' })
  async reorder(
    @Body() dto: ReorderImagesDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<ReorderResponseDto> {
    return this.media.reorderImages(dto, this.actor(user, ip, userAgent));
  }

  private actor(user: AuthenticatedUser, ip?: string, userAgent?: string): MediaActor {
    return { userId: user.id, ip, userAgent };
  }
}
