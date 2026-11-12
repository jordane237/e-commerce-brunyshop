import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { LocalStorageProvider } from '../../infrastructure/storage/providers/local-storage.provider';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../infrastructure/storage/providers/storage-provider.interface';
import { isAllowedImageMime } from '../../infrastructure/storage/storage.settings';

// Local development only (STORAGE_PROVIDER=local): the raw file is received
// through a short-lived HMAC capability token instead of a JWT, mirroring an
// S3 presigned URL. Production uses MinIO/S3 presigns and never hits this route.
@ApiExcludeController()
@Controller('media')
export class MediaLocalController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  @Public()
  @Get('files')
  async read(@Query('key') key: string | undefined, @Res() response: Response): Promise<void> {
    if (!(this.storage instanceof LocalStorageProvider) || !key) {
      throw new NotFoundException({ code: 'MEDIA_NOT_FOUND', message: 'Média introuvable.' });
    }
    const object = await this.storage.download(key).catch(() => null);
    if (!object) {
      throw new NotFoundException({ code: 'MEDIA_NOT_FOUND', message: 'Média introuvable.' });
    }
    response.setHeader('Content-Type', object.contentType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.send(object.buffer);
  }

  @Public()
  @Put('local-upload')
  @HttpCode(HttpStatus.NO_CONTENT)
  async upload(
    @Query('token') token: string | undefined,
    @Headers('content-type') contentType: string | undefined,
    @Req() request: Request & { body?: unknown },
  ): Promise<void> {
    if (!(this.storage instanceof LocalStorageProvider) || !token) {
      throw new NotFoundException({ code: 'MEDIA_NOT_FOUND', message: 'Média introuvable.' });
    }
    const payload = this.storage.verifyUploadToken(token);
    if (!payload) {
      throw new UnauthorizedException({
        code: 'INVALID_UPLOAD_TOKEN',
        message: 'URL de téléversement expirée ou invalide.',
      });
    }
    const header = contentType?.split(';')[0]?.trim().toLowerCase();
    if (!isAllowedImageMime(payload.contentType) || header !== payload.contentType) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE_TYPE',
        message: 'Format non autorisé. Formats acceptés : JPEG, PNG, WebP.',
      });
    }
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Le fichier est vide ou illisible.',
      });
    }
    await this.storage.upload({
      buffer: request.body,
      key: payload.key,
      contentType: payload.contentType,
    });
  }
}
