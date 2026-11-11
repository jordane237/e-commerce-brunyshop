import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { TurnstileGuard } from '../../security/turnstile/turnstile.guard';
import { ContactService, type ContactResponse } from './contact.service';
import { ContactDto } from './dto/contact.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Public()
  @UseGuards(TurnstileGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Envoyer un message au support',
    description:
      'Formulaire public protégé par Cloudflare Turnstile. Le message est persisté pour traitement par le support.',
  })
  @ApiCreatedResponse({ description: 'Message reçu' })
  @ApiBadRequestResponse({ description: 'CAPTCHA requis/invalide ou body invalide' })
  @ApiResponse({ status: 503, description: 'CAPTCHA_UNAVAILABLE (service indisponible)' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes (5/min/IP)' })
  submit(@Body() dto: ContactDto, @Req() request: Request): Promise<ContactResponse> {
    return this.contact.submit(dto, {
      ...(request.ip !== undefined ? { ipAddress: request.ip } : {}),
      ...(request.headers['user-agent'] !== undefined
        ? { userAgent: request.headers['user-agent'] }
        : {}),
    });
  }
}
