import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';

import { TurnstileService } from './turnstile.service';

type RequestWithBody = Request & {
  body?: { turnstileToken?: unknown };
};

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstile: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithBody>();
    const token = this.readToken(request);

    if (token === null) {
      if (!this.turnstile.isEnabled()) {
        return true;
      }
      throw new BadRequestException({
        code: 'CAPTCHA_REQUIRED',
        message: 'Vérification CAPTCHA requise.',
      });
    }

    const result = await this.turnstile.verifyToken(token, request.ip);
    if (result.success) {
      return true;
    }
    if (result.unavailable === true) {
      throw new ServiceUnavailableException({
        code: 'CAPTCHA_UNAVAILABLE',
        message:
          'La vérification de sécurité est temporairement indisponible. Réessayez dans quelques instants.',
      });
    }
    throw new BadRequestException({
      code: 'CAPTCHA_INVALID',
      message: 'Vérification CAPTCHA échouée. Réessayez.',
    });
  }

  private readToken(request: RequestWithBody): string | null {
    const bodyToken = request.body?.turnstileToken;
    if (typeof bodyToken === 'string' && bodyToken.trim() !== '') {
      return bodyToken.trim();
    }

    const header = request.headers['cf-turnstile-response'];
    const headerToken = Array.isArray(header) ? header[0] : header;
    return typeof headerToken === 'string' && headerToken.trim() !== '' ? headerToken.trim() : null;
  }
}
